import { Fragment, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMushafPageFont, mushafPageFontFamily } from "@/hooks/useMushafPageFont";
import { quranFontStack } from "@/lib/quran-font-options";
import type { MushafPageLayout, QpcWord } from "@/lib/mushaf-v2-data";
import { DRAWN_BASMALA_TEXT, drawnSurahTitleText } from "@/lib/mushaf-sizing-lines";
import { MushafAyahMarkerSvg } from "@/components/quran/MushafOrnaments";
import { SurahBanner } from "@/components/quran/SurahBanner";
import { toArabicDigits } from "@/lib/utils";
import { wordKeyFromQpc } from "@/features/mushaf/ayah-word-keys";

/** يُجمِّع كلمات سطر متتالية بنفس verseKey في عنقود واحد — للوضع التفاعلي بلا طبقة إحداثيات. */
export function groupWordsByAyah(words: QpcWord[]): QpcWord[][] {
  const groups: QpcWord[][] = [];
  for (const w of words) {
    const last = groups[groups.length - 1];
    if (last && last[0].verseKey === w.verseKey) last.push(w);
    else groups.push([w]);
  }
  return groups;
}

type Props = {
  layout: MushafPageLayout | null;
  activeAyahKey?: string | null;
  onAyahPress?: (verseKey: string) => void;
  sharedFontFamily?: string;
  renderWord?: (w: QpcWord) => ReactNode;
  bare?: boolean;
  showAyahNumbers?: boolean;
  /**
   * وضع بصري فقط: بلا أزرار/ضغط على مجموعات الآيات —
   * التفاعل ينتقل لطبقة الإحداثيات (MushafHitLayer).
   */
  visualOnly?: boolean;
};

const ROW_COUNT_STANDARD = 15;

/**
 * دقة QPC: كل محرف من خط الصفحة — بما فيه علامة الآية (code_v2).
 * لا دائرة CSS ولا مسافات مُقحَمة؛ مواضع الكلمات من هندسة الخط.
 */
/**
 * دقة QPC: مجسم نهاية الآية من الخط كما هو (زخرفة + رقم في مجسم واحد).
 * الفارق الوحيد: لون ذهبي عبر .mf2-word--ayah-end — لا استبدال بـ SVG.
 */
function defaultRenderWord(w: QpcWord, showAyahNumbers: boolean) {
  const wordKey = wordKeyFromQpc(w);
  if (w.charType === "end") {
    if (!showAyahNumbers) return null;
    return (
      <Fragment key={w.id}>
        <span
          className="mf2-word mf2-word--ayah-end"
          data-word-key={wordKey}
          data-char-type="end"
          data-ayah-numeral="qpc"
        >
          {w.glyphText}
        </span>
        {w.sajdahNumber !== null && <span className="mf2-sajda-badge">سجدة</span>}
      </Fragment>
    );
  }
  return (
    <Fragment key={w.id}>
      <span className="mf2-word" data-word-key={wordKey}>{w.glyphText}</span>
    </Fragment>
  );
}

/**
 * نص Unicode (textQpcHafs) — المسار الآمن مع Amiri Quran.
 * يمنع عرض code_v2/Presentation Forms بخط عام → تكسّر الحروف.
 */
function renderUnicodeWord(w: QpcWord, showAyahNumbers: boolean) {
  if (w.charType === "end") {
    const n = Number(w.textUthmani.replace(/\D/g, "")) || 0;
    return (
      <Fragment key={w.id}>
        {showAyahNumbers ? (
          <span className="mf2-ayah-marker" aria-label={`آية ${toArabicDigits(n)}`}>
            <MushafAyahMarkerSvg className="mf2-ayah-marker__ring" />
            <span className="mf2-ayah-marker__num">{toArabicDigits(n)}</span>
          </span>
        ) : null}
        {w.sajdahNumber !== null && <span className="mf2-sajda-badge">سجدة</span>}
      </Fragment>
    );
  }
  return <span key={w.id} className="mf2-word">{w.textQpcHafs}</span>;
}

function collectSizingEls(map: Map<string | number, HTMLElement>): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const el of map.values()) {
    if (el) out.push(el);
  }
  return out;
}

/** عرض المحتوى الجوهري للسطر (بلا scaleX وبلا عرض الحاوية 100%). */
function measureLineContentWidth(el: HTMLElement): number {
  el.style.setProperty("--mf2-line-sx", "1");
  const run = el.querySelector(".mf2-line__run");
  if (run instanceof HTMLElement) {
    const prevDisplay = run.style.display;
    const prevWidth = run.style.width;
    run.style.display = "inline-block";
    run.style.width = "max-content";
    const w = run.getBoundingClientRect().width;
    run.style.display = prevDisplay;
    run.style.width = prevWidth;
    return w;
  }
  const words = el.querySelectorAll(".mf2-word");
  if (words.length === 0) return el.scrollWidth;
  let minL = Infinity;
  let maxR = -Infinity;
  for (const node of words) {
    const r = (node as HTMLElement).getBoundingClientRect();
    minL = Math.min(minL, r.left);
    maxR = Math.max(maxR, r.right);
  }
  return Number.isFinite(minL) ? Math.max(0, maxR - minL) : 0;
}

function measureWidest(els: HTMLElement[], fontSizePx: number): number {
  let widest = 0;
  for (const el of els) {
    const prevOverflow = el.style.overflowX;
    const prevSize = el.style.fontSize;
    const prevSx = el.style.getPropertyValue("--mf2-line-sx");
    el.style.overflowX = "visible";
    el.style.fontSize = `${fontSizePx}px`;
    el.style.setProperty("--mf2-line-sx", "1");
    widest = Math.max(widest, measureLineContentWidth(el));
    el.style.fontSize = prevSize;
    el.style.overflowX = prevOverflow;
    if (prevSx) el.style.setProperty("--mf2-line-sx", prevSx);
    else el.style.removeProperty("--mf2-line-sx");
  }
  return widest;
}

function applyTempFontSize(els: HTMLElement[], fontSizePx: number | ""): void {
  for (const el of els) {
    el.style.fontSize = fontSizePx === "" ? "" : `${fontSizePx}px`;
  }
}

/**
 * أسطر لا تُمدَّد عرضيًا: آخر سطر لسورة تنتهي في الصفحة
 * (يبقى قصيرًا كما في المصحف المطبوع؛ خارج بوابة الانحراف ≤2%).
 */
function lastSurahEndLineNumbers(layout: MushafPageLayout): Set<number> {
  const lastLineBySurah = new Map<number, number>();
  for (const row of layout.rows) {
    if (row.kind !== "line") continue;
    for (const w of row.words) {
      const surah = Number(String(w.verseKey).split(":")[0]);
      if (!Number.isFinite(surah)) continue;
      lastLineBySurah.set(surah, Math.max(lastLineBySurah.get(surah) ?? 0, row.lineNumber));
    }
  }
  const excluded = new Set<number>();
  for (const ch of layout.surahsOnPage) {
    const lastLn = lastLineBySurah.get(ch.id);
    if (lastLn == null) continue;
    for (const row of layout.rows) {
      if (row.kind !== "line" || row.lineNumber !== lastLn) continue;
      for (const w of row.words) {
        const [s, a] = String(w.verseKey).split(":").map(Number);
        if (s === ch.id && a === ch.versesCount) excluded.add(lastLn);
      }
    }
  }
  return excluded;
}

export function MushafPageV2({
  layout,
  activeAyahKey,
  onAyahPress,
  sharedFontFamily,
  renderWord,
  bare,
  showAyahNumbers = true,
  visualOnly = false,
}: Props) {
  const wantPrecision = !sharedFontFamily;
  const pageFont = useMushafPageFont(wantPrecision ? (layout?.pageNumber ?? null) : null);

  const useUnicodeSafe = Boolean(sharedFontFamily) || pageFont.failed;
  const fontReady = useUnicodeSafe ? true : pageFont.ready;

  const fontFamily = useMemo(() => {
    if (sharedFontFamily) return sharedFontFamily;
    if (pageFont.failed) return quranFontStack("amiri");
    if (layout) return mushafPageFontFamily(layout.pageNumber);
    return undefined;
  }, [sharedFontFamily, pageFont.failed, layout]);

  const wordRenderer = useMemo(() => {
    if (renderWord && !pageFont.failed) return renderWord;
    if (useUnicodeSafe) return (w: QpcWord) => renderUnicodeWord(w, showAyahNumbers);
    return (w: QpcWord) => defaultRenderWord(w, showAyahNumbers);
  }, [renderWord, pageFont.failed, useUnicodeSafe, showAyahNumbers]);

  /** أسطر الآيات المرسومة — وحدها تدخل في sizeByWidth */
  const ayahLineRefs = useRef(new Map<number, HTMLDivElement>());
  /** عناوين السور — خارج التحجيم العرضي */
  const surahTitleRefs = useRef(new Map<string, HTMLElement>());
  /** البسملات الافتتاحية — خارج التحجيم العرضي */
  const basmalaRefs = useRef(new Map<string, HTMLElement>());
  const headerBlockRefs = useRef(new Map<string, HTMLElement>());
  const linesContainerRef = useRef<HTMLDivElement | null>(null);
  const [pageFontSize, setPageFontSize] = useState<number | null>(null);
  const [pageLineHeightEm, setPageLineHeightEm] = useState(1.1);
  const [fitted, setFitted] = useState(false);

  /**
   * ملاءمة عرض → خط موحّد بلا سقف ارتفاع.
   * العادية: فجوات بين الأسطر أولًا؛ الحشو العلوي ≤ ٢٪ من ارتفاع الصفحة.
   * ص1–2: نفس سقف الفجوة، تمركز رأسي بلا تبعثر لبلوغ بوابة الامتلاء.
   */
  useLayoutEffect(() => {
    if (!fontReady || !layout) {
      setFitted(false);
      setPageFontSize(null);
      setPageLineHeightEm(1.1);
      return;
    }

    if (useUnicodeSafe) {
      setPageFontSize(null);
      setPageLineHeightEm(1.1);
      setFitted(true);
      return;
    }

    const container = linesContainerRef.current;
    if (!container) return;

    const LINE_HEIGHT_EM = 1.05;
    const REF_PX = 100;
    const TARGET_FILL_NORMAL = 0.9;
    const TARGET_FILL_OPENING = 0.78;
    const GAP_CAP_RATIO = 0.55;
    const EDGE_GAP_PX = 2;
    const MAX_TOP_PAD_RATIO = 0.02;
    const MIN_LINE_FILL = 0.98;
    const isOpening = layout.pageNumber === 1 || layout.pageNumber === 2;
    const targetFill = isOpening ? TARGET_FILL_OPENING : TARGET_FILL_NORMAL;
    const noStretchLines = lastSurahEndLineNumbers(layout);

    const measure = () => {
      const slotEl =
        container.closest(".qs-mushaf-body") ||
        container.closest(".mpv-body") ||
        container.parentElement;
      const availableWidth = container.clientWidth;
      const headerEl = document.querySelector(".mpv-ayah-header");
      const footerEl = document.querySelector(".mpv-ayah-footer");
      const hr = headerEl?.getBoundingClientRect();
      const fr = footerEl?.getBoundingClientRect();
      let slotHeight = slotEl instanceof HTMLElement
        ? slotEl.clientHeight
        : container.clientHeight;
      if (hr && fr && fr.top > hr.bottom) {
        slotHeight = fr.top - hr.bottom;
      }
      const usableH = Math.max(0, slotHeight - EDGE_GAP_PX * 2);
      if (availableWidth <= 0 || usableH <= 0) return false;

      const sizingEls = collectSizingEls(ayahLineRefs.current);
      if (sizingEls.length === 0) return false;

      for (const el of sizingEls) el.style.removeProperty("--mf2-line-sx");
      container.style.gap = "0px";
      container.style.paddingTop = "0";
      container.style.paddingBottom = "0";
      container.style.transform = "";

      const widestAtRef = measureWidest(sizingEls, REF_PX);
      if (widestAtRef <= 0) return false;

      let size = (availableWidth * REF_PX) / widestAtRef;
      const bound = "width" as const;

      for (let guard = 0; guard < 10; guard++) {
        applyTempFontSize(sizingEls, size);
        container.style.fontSize = `${size}px`;
        container.style.setProperty("--mf2-lh", String(LINE_HEIGHT_EM));
        let widestAtSize = 0;
        for (const el of sizingEls) {
          el.style.overflowX = "visible";
          el.style.setProperty("--mf2-line-sx", "1");
          widestAtSize = Math.max(widestAtSize, measureLineContentWidth(el));
        }
        if (widestAtSize <= availableWidth) break;
        size *= (availableWidth / widestAtSize) * 0.992;
      }

      applyTempFontSize(sizingEls, "");
      for (const el of sizingEls) el.style.overflowX = "";
      container.style.fontSize = `${size}px`;
      container.style.setProperty("--mf2-lh", String(LINE_HEIGHT_EM));

      if (!isOpening) {
        for (const [ln, el] of ayahLineRefs.current) {
          if (!el) continue;
          if (noStretchLines.has(ln)) {
            el.style.removeProperty("--mf2-line-sx");
            continue;
          }
          const contentW = measureLineContentWidth(el);
          if (contentW <= 0) {
            el.style.removeProperty("--mf2-line-sx");
            continue;
          }
          const fill = contentW / availableWidth;
          if (fill < MIN_LINE_FILL) {
            el.style.setProperty("--mf2-line-sx", String(1 / fill));
          } else {
            el.style.removeProperty("--mf2-line-sx");
          }
        }
      }

      let contentTop = Infinity;
      let contentBot = -Infinity;
      let childCount = 0;
      for (const child of container.children) {
        if (!(child instanceof HTMLElement)) continue;
        const r = child.getBoundingClientRect();
        if (r.height <= 0 && r.width <= 0) continue;
        childCount += 1;
        contentTop = Math.min(contentTop, r.top);
        contentBot = Math.max(contentBot, r.bottom);
      }
      const naturalH = Number.isFinite(contentTop) && Number.isFinite(contentBot)
        ? Math.max(0, contentBot - contentTop)
        : 0;
      const lineH = size * LINE_HEIGHT_EM;
      const gaps = Math.max(0, childCount - 1);
      const remaining = Math.max(0, usableH - naturalH);
      const gapCap = GAP_CAP_RATIO * lineH;
      /* ص1–2: نفس سقف الفجوة — بلا تمديد إضافي لبلوغ بوابة الامتلاء */
      const gap = gaps > 0 ? Math.min(remaining / gaps, gapCap) : 0;
      const usedByGaps = gap * gaps;
      const leftover = Math.max(0, remaining - usedByGaps);
      const maxTopPad = slotHeight * MAX_TOP_PAD_RATIO;

      let padTop: number;
      let padBot: number;
      if (isOpening) {
        /* تمركز: وزّع المتبقي بالتساوي مع سقف علوي ٢٪ */
        padTop = Math.min(leftover / 2, maxTopPad);
        padBot = Math.max(0, leftover - padTop);
        container.style.justifyContent = "center";
        container.style.transform = "";
      } else {
        /* العادية: المتبقي بين الأسطر أولًا؛ العلوي ≤٢٪ والباقي أسفل */
        padTop = Math.min(leftover * 0.15, maxTopPad);
        padBot = Math.max(0, leftover - padTop);
        container.style.justifyContent = "flex-start";
        container.style.transform = "";
      }

      container.style.height = `${usableH}px`;
      container.style.marginTop = `${EDGE_GAP_PX}px`;
      container.style.marginBottom = `${EDGE_GAP_PX}px`;
      container.style.gap = `${gap.toFixed(2)}px`;
      container.style.paddingTop = `${padTop.toFixed(2)}px`;
      container.style.paddingBottom = `${padBot.toFixed(2)}px`;
      container.style.flexGrow = "0";
      container.style.flexShrink = "0";
      container.style.flexBasis = "auto";

      let fillTop = Infinity;
      let fillBot = -Infinity;
      for (const child of container.children) {
        if (!(child instanceof HTMLElement)) continue;
        const r = child.getBoundingClientRect();
        if (r.height <= 0 && r.width <= 0) continue;
        fillTop = Math.min(fillTop, r.top);
        fillBot = Math.max(fillBot, r.bottom);
      }
      const spanH = Number.isFinite(fillTop) && Number.isFinite(fillBot)
        ? Math.max(0, fillBot - fillTop)
        : 0;
      const fillRatio = slotHeight > 0 ? spanH / slotHeight : 0;
      const topGapRatio = slotHeight > 0 && Number.isFinite(fillTop) && hr
        ? Math.max(0, fillTop - hr.bottom) / slotHeight
        : padTop / Math.max(1, slotHeight);
      const pitchEm = size > 0 ? (lineH + gap) / size : 0;

      container.dataset.mf2Size = size.toFixed(2);
      container.dataset.mf2Lh = LINE_HEIGHT_EM.toFixed(3);
      container.dataset.mf2Gap = gap.toFixed(2);
      container.dataset.mf2Bind = bound;
      container.dataset.mf2Fill = fillRatio.toFixed(3);
      container.dataset.mf2Target = String(targetFill);
      container.dataset.mf2MaxFill = fillRatio.toFixed(3);
      container.dataset.mf2PitchEm = pitchEm.toFixed(3);
      container.dataset.mf2TopGap = topGapRatio.toFixed(3);
      container.dataset.mf2Opening = isOpening ? "1" : "0";

      setPageFontSize(size);
      setPageLineHeightEm(LINE_HEIGHT_EM);
      setFitted(true);
      return true;
    };

    const cleanupInline = () => {
      container.style.height = "";
      container.style.marginTop = "";
      container.style.marginBottom = "";
      container.style.paddingTop = "";
      container.style.paddingBottom = "";
      container.style.gap = "";
      container.style.justifyContent = "";
      container.style.transform = "";
      container.style.flexGrow = "";
      container.style.flexShrink = "";
      container.style.flexBasis = "";
      container.style.removeProperty("--mf2-lh");
      for (const el of ayahLineRefs.current.values()) {
        el?.style.removeProperty("--mf2-line-sx");
      }
    };

    if (!measure()) {
      const raf = requestAnimationFrame(() => { measure(); });
      return () => {
        cancelAnimationFrame(raf);
        cleanupInline();
      };
    }

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => { measure(); })
      : null;
    const slotObserve =
      container.closest(".qs-mushaf-body") ||
      container.closest(".mpv-body") ||
      container.parentElement;
    if (slotObserve) ro?.observe(slotObserve);
    else ro?.observe(container);
    return () => {
      ro?.disconnect();
      cleanupInline();
    };
  }, [fontReady, layout, useUnicodeSafe]);

  if (!layout) {
    return bare
      ? <div dir="rtl" style={{ height: "100%" }}><MushafPageSkeleton /></div>
      : <MushafPageSkeleton />;
  }

  const isOpeningPage = layout.pageNumber === 1 || layout.pageNumber === 2;
  const linesClass = [
    "mf2-lines",
    useUnicodeSafe ? "mf2-lines--unicode" : "",
    !useUnicodeSafe ? "mf2-lines--qpc-contiguous" : "",
    isOpeningPage ? "mf2-lines--opening" : "",
  ].filter(Boolean).join(" ");

  const renderAyahLine = (row: Extract<MushafPageLayout["rows"][number], { kind: "line" }>) => {
    const lineWords = showAyahNumbers
      ? row.words
      : row.words.filter((w) => w.charType !== "end");

    /** دقة QPC + visualOnly: سطر متصل واحد بلا عزل bidi بين الكلمات */
    if (!useUnicodeSafe && visualOnly) {
      return (
        <div
          key={`l-${row.lineNumber}`}
          ref={(el) => {
            if (el) ayahLineRefs.current.set(row.lineNumber, el);
            else ayahLineRefs.current.delete(row.lineNumber);
          }}
          className="mf2-line"
          data-sizing-line="ayah"
          data-line={row.lineNumber}
        >
          <span className="mf2-line__run">
            {lineWords.map((w) => wordRenderer(w))}
          </span>
        </div>
      );
    }

    return (
      <div
        key={`l-${row.lineNumber}`}
        ref={(el) => {
          if (el) ayahLineRefs.current.set(row.lineNumber, el);
          else ayahLineRefs.current.delete(row.lineNumber);
        }}
        className={`mf2-line${useUnicodeSafe ? " mf2-line--unicode" : ""}`}
        data-sizing-line="ayah"
        data-line={row.lineNumber}
        style={useUnicodeSafe ? { unicodeBidi: "isolate" } : undefined}
      >
        {groupWordsByAyah(lineWords).map((group) => {
          const verseKey = group[0].verseKey;
          const active = verseKey === activeAyahKey;
          if (visualOnly) {
            return (
              <span
                key={verseKey}
                className={`mf2-ayah-group${active ? " mf2-ayah-group--active" : ""}`}
                data-verse={verseKey}
                aria-hidden="true"
              >
                {group.map((w) => wordRenderer(w))}
              </span>
            );
          }
          return (
            <span
              key={verseKey}
              className={`mf2-ayah-group${active ? " mf2-ayah-group--active" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`آية ${verseKey}`}
              onPointerDown={(e) => {
                if (e.button !== 0 && e.pointerType === "mouse") return;
                const target = e.currentTarget;
                const timer = window.setTimeout(() => {
                  onAyahPress?.(verseKey);
                }, 350);
                target.dataset.ayahTimer = String(timer);
              }}
              onPointerUp={(e) => {
                const t = e.currentTarget.dataset.ayahTimer;
                if (t) window.clearTimeout(Number(t));
                delete e.currentTarget.dataset.ayahTimer;
              }}
              onPointerCancel={(e) => {
                const t = e.currentTarget.dataset.ayahTimer;
                if (t) window.clearTimeout(Number(t));
                delete e.currentTarget.dataset.ayahTimer;
              }}
              onPointerLeave={(e) => {
                const t = e.currentTarget.dataset.ayahTimer;
                if (t) window.clearTimeout(Number(t));
                delete e.currentTarget.dataset.ayahTimer;
              }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onAyahPress?.(verseKey); } }}
            >
              {group.map((w) => wordRenderer(w))}
            </span>
          );
        })}
      </div>
    );
  };

  const lines = (
    <>
      <div
        ref={linesContainerRef}
        className={linesClass}
        data-sizing-lines="ayah"
        data-measurement-exclusions="metric-only"
        style={{
          opacity: fitted ? 1 : 0,
          fontSize: !useUnicodeSafe && pageFontSize ? `${pageFontSize}px` : undefined,
          ["--mf2-lh" as string]: !useUnicodeSafe ? String(pageLineHeightEm) : undefined,
          fontFamily: useUnicodeSafe
            ? fontFamily
            : fontFamily
              ? `"${fontFamily}"`
              : undefined,
        }}
      >
        {layout.rows.map((row, idx) => {
          if (row.kind === "surah-header") {
            const key = `h-${row.surah.id}-${idx}`;
            return (
              <SurahHeaderBanner
                key={key}
                chapter={row.surah}
                blockRef={(el) => {
                  if (el) headerBlockRefs.current.set(key, el);
                  else headerBlockRefs.current.delete(key);
                }}
                titleRef={(el) => {
                  if (el) surahTitleRefs.current.set(key, el);
                  else surahTitleRefs.current.delete(key);
                }}
                basmalaRef={(el) => {
                  if (el) basmalaRefs.current.set(key, el);
                  else basmalaRefs.current.delete(key);
                }}
              />
            );
          }
          return renderAyahLine(row);
        })}
      </div>
      {!fitted && <MushafPageSkeleton overlay />}
    </>
  );

  if (bare) {
    return (
      <div
        dir="rtl"
        className="mf2-bare-root"
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          minHeight: 0,
          flex: "1 1 auto",
        }}
      >
        {lines}
      </div>
    );
  }

  return (
    <div className="mf2-page" dir="rtl">
      <div className="mf2-frame">{lines}</div>
    </div>
  );
}

export function SurahHeaderBanner({
  chapter,
  blockRef,
  titleRef,
  basmalaRef,
}: {
  chapter: MushafPageLayout["surahsOnPage"][number];
  spanRows?: number;
  blockRef?: (el: HTMLElement | null) => void;
  titleRef?: (el: HTMLElement | null) => void;
  basmalaRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <div
      className="mf2-surah-header"
      ref={blockRef}
      data-drawn-block="surah-header"
    >
      <div className="mf2-surah-header__frame">
        <SurahBanner
          label={drawnSurahTitleText(chapter.nameArabic, chapter.id)}
          titleRef={titleRef}
          className="mf2-surah-header__cartouche"
        />
      </div>
      {chapter.bismillahPre && (
        <div
          className="mf2-bismillah"
          lang="ar"
          dir="rtl"
          data-sizing-line="basmala"
          ref={basmalaRef}
        >
          {DRAWN_BASMALA_TEXT}
        </div>
      )}
    </div>
  );
}

function MushafPageSkeleton({ overlay }: { overlay?: boolean }) {
  return (
    <div className={`mf2-skeleton${overlay ? " mf2-skeleton--overlay" : ""}`} aria-hidden="true">
      {Array.from({ length: ROW_COUNT_STANDARD }, (_, i) => (
        <div key={i} className="mf2-skeleton__line" />
      ))}
    </div>
  );
}
