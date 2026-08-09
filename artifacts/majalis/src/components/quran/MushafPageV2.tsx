import { Fragment, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMushafPageFont, mushafPageFontFamily } from "@/hooks/useMushafPageFont";
import { quranFontStack } from "@/lib/quran-font-options";
import { toArabicDigits } from "@/lib/utils";
import type { MushafPageLayout, QpcWord } from "@/lib/mushaf-v2-data";
import { DRAWN_BASMALA_TEXT, drawnSurahTitleText } from "@/lib/mushaf-sizing-lines";
import { MushafSurahBadgeFrame } from "@/components/quran/MushafOrnaments";
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
function defaultRenderWord(w: QpcWord, showAyahNumbers: boolean) {
  const wordKey = wordKeyFromQpc(w);
  if (w.charType === "end") {
    if (!showAyahNumbers) return null;
    return (
      <Fragment key={w.id}>
        <span className="mf2-word" data-word-key={wordKey} data-char-type="end">
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
    return (
      <Fragment key={w.id}>
        {showAyahNumbers ? (
          <span className="qs-ayah-num">{toArabicDigits(Number(w.textUthmani.replace(/\D/g, "")) || 0)}</span>
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

function measureWidest(els: HTMLElement[], fontSizePx: number): number {
  let widest = 0;
  for (const el of els) {
    const prevOverflow = el.style.overflowX;
    const prevSize = el.style.fontSize;
    el.style.overflowX = "visible";
    el.style.fontSize = `${fontSizePx}px`;
    widest = Math.max(widest, el.scrollWidth);
    el.style.fontSize = prevSize;
    el.style.overflowX = prevOverflow;
  }
  return widest;
}

function applyTempFontSize(els: HTMLElement[], fontSizePx: number | ""): void {
  for (const el of els) {
    el.style.fontSize = fontSizePx === "" ? "" : `${fontSizePx}px`;
  }
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
   * حجم موحّد من أعرض سطر آيات فقط.
   * الصفحتان 1–2: بلا هدف امتلاء رأسي — فراغ علوي/سفلي كما المرجع؛ lh ≤ 1.6.
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

    const LINE_HEIGHT_EM = 1.1;
    const REF_PX = 100;
    /** امتلاء رأسي لصفحات عادية فقط — مُعطَّل للصفحتين الافتتاحيتين */
    const TARGET_BLOCK_FILL = 0.9;
    const LH_CAP = 1.58;
    const opening = layout.layoutMode === "opening-centered";
    const ayahCount = Math.max(1, layout.ayahLineCount);

    const measure = () => {
      const slotEl =
        container.closest(".qs-mushaf-body") ||
        container.closest(".mpv-body") ||
        container.parentElement;
      const availableWidth = container.clientWidth;
      const slotHeight = slotEl instanceof HTMLElement
        ? slotEl.clientHeight
        : container.clientHeight;
      if (availableWidth <= 0 || slotHeight <= 0) return false;

      /* التحجيم العرضي من أسطر الآيات فقط — بلا بسملة/عنوان */
      const sizingEls = collectSizingEls(ayahLineRefs.current);
      if (sizingEls.length === 0) return false;

      const widestAtRef = measureWidest(sizingEls, REF_PX);
      if (widestAtRef <= 0) return false;

      const sizeByWidth = (availableWidth * REF_PX) / widestAtRef;

      let size = sizeByWidth;
      let bound: "width" | "height" = "width";

      if (!opening) {
        for (let iter = 0; iter < 3; iter++) {
          applyTempFontSize(sizingEls, size);
          container.style.fontSize = `${size}px`;
          let headersH = 0;
          for (const el of headerBlockRefs.current.values()) {
            if (el) headersH += el.getBoundingClientRect().height;
          }
          const ayahBudget = Math.max(0, slotHeight - headersH);
          const sizeByHeight = (ayahBudget / ayahCount) / LINE_HEIGHT_EM;
          if (sizeByHeight < sizeByWidth) bound = "height";
          else bound = "width";
          const next = Math.min(sizeByWidth, sizeByHeight);
          if (Math.abs(next - size) < 0.05) {
            size = next;
            break;
          }
          size = next;
        }
      }

      for (let guard = 0; guard < 10; guard++) {
        applyTempFontSize(sizingEls, size);
        container.style.fontSize = `${size}px`;
        let widestAtSize = 0;
        for (const el of sizingEls) {
          el.style.overflowX = "visible";
          widestAtSize = Math.max(widestAtSize, el.scrollWidth);
        }
        if (widestAtSize <= availableWidth) break;
        size *= (availableWidth / widestAtSize) * 0.992;
        bound = "width";
      }

      applyTempFontSize(sizingEls, "");
      for (const el of sizingEls) el.style.overflowX = "";
      container.style.fontSize = `${size}px`;

      let lhCapped = false;
      let fillRatio = 0;
      let lh: number;

      if (opening) {
        /* ص1–2: تباعد ثابت ≤1.6؛ بلا احتضان ارتفاع لفرض امتلاء */
        lh = LINE_HEIGHT_EM;
        container.style.setProperty("--mf2-lh", String(lh));
        container.style.height = "";
        container.style.flexGrow = "";
        container.style.flexShrink = "";
        container.style.flexBasis = "";
      } else {
        let headersH = 0;
        for (const el of headerBlockRefs.current.values()) {
          if (el) headersH += el.getBoundingClientRect().height;
        }
        const targetContentH = slotHeight * TARGET_BLOCK_FILL;
        const lhForTarget = size > 0
          ? Math.max(0, targetContentH - headersH) / (ayahCount * size)
          : LINE_HEIGHT_EM;
        const lhRaw = Math.max(LINE_HEIGHT_EM, lhForTarget);
        lh = Math.min(LH_CAP, lhRaw);
        lhCapped = lhRaw > LH_CAP;
        container.style.setProperty("--mf2-lh", String(lh));

        let contentTop = Infinity;
        let contentBot = -Infinity;
        for (const child of container.children) {
          if (!(child instanceof HTMLElement)) continue;
          const r = child.getBoundingClientRect();
          if (r.height <= 0 && r.width <= 0) continue;
          contentTop = Math.min(contentTop, r.top);
          contentBot = Math.max(contentBot, r.bottom);
        }
        if (Number.isFinite(contentTop) && Number.isFinite(contentBot)) {
          const contentH = Math.max(0, contentBot - contentTop);
          fillRatio = slotHeight > 0 ? contentH / slotHeight : 0;
          const boxH = Math.min(
            slotHeight,
            Math.max(contentH, contentH / TARGET_BLOCK_FILL),
          );
          container.style.height = `${boxH}px`;
          container.style.flexGrow = "0";
          container.style.flexShrink = "0";
          container.style.flexBasis = "auto";
        }
      }

      const bindLabel = lhCapped && bound === "width"
        ? "width+lh-cap"
        : lhCapped
          ? "lh-cap"
          : bound;
      container.dataset.mf2Size = size.toFixed(2);
      container.dataset.mf2Lh = lh.toFixed(3);
      container.dataset.mf2Bind = bindLabel;
      container.dataset.mf2Fill = fillRatio.toFixed(3);
      container.dataset.mf2Target = opening ? "none" : String(TARGET_BLOCK_FILL);
      if (opening) {
        console.info(
          `[mushaf-fit] page=${layout.pageNumber} size=${size.toFixed(2)}px ` +
            `lh=${lh.toFixed(3)} bind=${bindLabel} fill=n/a (opening) ` +
            `ayahLines=${ayahCount} slot=${slotHeight.toFixed(0)}×${availableWidth.toFixed(0)}`,
        );
      }

      setPageFontSize(size);
      setPageLineHeightEm(lh);
      setFitted(true);
      return true;
    };

    const cleanupInline = () => {
      container.style.height = "";
      container.style.flexGrow = "";
      container.style.flexShrink = "";
      container.style.flexBasis = "";
      container.style.removeProperty("--mf2-lh");
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

  const openingCentered = layout.layoutMode === "opening-centered";
  const linesClass = [
    "mf2-lines",
    useUnicodeSafe ? "mf2-lines--unicode" : "",
    openingCentered ? "mf2-lines--opening-centered" : "",
    !useUnicodeSafe ? "mf2-lines--qpc-contiguous" : "",
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
          height: "auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight: 0,
          flex: "0 0 auto",
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

/** شارة سورة عريضة — زخرفة أصلية قابلة للتمدد */
function SurahNameCartouche({
  label,
  titleRef,
}: {
  label: string;
  titleRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <div className="mf2-surah-header__frame">
      <MushafSurahBadgeFrame className="mf2-surah-header__cartouche" />
      <span
        className="mf2-surah-header__name"
        data-sizing-line="surah_title"
        ref={titleRef}
      >
        {label}
      </span>
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
      <SurahNameCartouche
        label={drawnSurahTitleText(chapter.nameArabic, chapter.id)}
        titleRef={titleRef}
      />
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
