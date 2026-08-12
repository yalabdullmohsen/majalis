import { Fragment, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useMushafPageFont, mushafPageFontFamily } from "@/hooks/useMushafPageFont";
import type { MushafPageLayout, QpcWord } from "@/lib/mushaf-v2-data";
import { DRAWN_BASMALA_TEXT, drawnSurahTitleText } from "@/lib/mushaf-sizing-lines";
import { MushafAyahMarkerSvg } from "@/components/quran/MushafOrnaments";
import { SurahBanner } from "@/components/quran/SurahBanner";
import { toArabicDigits } from "@/lib/utils";
import { wordKeyFromQpc } from "@/features/mushaf/ayah-word-keys";
import {
  MUSHAF_GRID,
  MUSHAF_LAYOUT_BASELINE,
} from "@/features/mushaf/config";
import {
  applyMushafLayoutBandCssVars,
  mushafBottomReservePx,
  scaleMushafLayoutBands,
} from "@/features/mushaf/layout-bands";
import { mushafTypescaleCssVars } from "@/features/mushaf/typescale";

/** صفحتا الافتتاح تُرسمان عبر تدفق الخانات نفسها — بلا إطار وبلا تموضع absolute. */

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

  /* ممنوع fallback لخط نظام في صفحات المصحف — ننتظر الخط أو نعرض الهيكل فقط */
  const useUnicodeSafe = Boolean(sharedFontFamily);
  const fontReady = useUnicodeSafe ? true : pageFont.ready && !pageFont.failed;

  const fontFamily = useMemo(() => {
    if (sharedFontFamily) return sharedFontFamily;
    if (layout) return mushafPageFontFamily(layout.pageNumber);
    return undefined;
  }, [sharedFontFamily, layout]);

  const wordRenderer = useMemo(() => {
    if (renderWord) return renderWord;
    if (useUnicodeSafe) return (w: QpcWord) => renderUnicodeWord(w, showAyahNumbers);
    return (w: QpcWord) => defaultRenderWord(w, showAyahNumbers);
  }, [renderWord, useUnicodeSafe, showAyahNumbers]);

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
   * تحجيم عرضي فقط — التموضع الرأسي مطلق على MUSHAF_GRID.baselinesPct.
   * ممنوع: flex توزيعي أو حشو ديناميكي بعد التموضع.
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

    const LINE_HEIGHT_EM = MUSHAF_LAYOUT_BASELINE.lineHeightEm;
    const BASE_FONT = MUSHAF_LAYOUT_BASELINE.fontSizePx;
    const isOpening = layout.pageNumber === 1 || layout.pageNumber === 2;
    const noStretchLines = lastSurahEndLineNumbers(layout);
    /* صفحتا الافتتاح والأسطر المركزية: بلا تمدد مسافات */
    if (isOpening) {
      for (const row of layout.rows) {
        if (row.kind === "line") noStretchLines.add(row.lineNumber);
      }
    }
    const slotHPct = MUSHAF_GRID.slotHeightPct;

    const measure = () => {
      const padCs = getComputedStyle(container);
      const padInline =
        (Number.parseFloat(padCs.paddingInlineStart) || Number.parseFloat(padCs.paddingLeft) || 0) +
        (Number.parseFloat(padCs.paddingInlineEnd) || Number.parseFloat(padCs.paddingRight) || 0);
      const availableWidth = Math.max(8, container.clientWidth - padInline);
      if (availableWidth <= 0) return false;

      const sizingEls = collectSizingEls(ayahLineRefs.current);
      if (sizingEls.length === 0) return false;

      for (const el of sizingEls) el.style.removeProperty("--mf2-line-sx");
      container.style.gap = "0";
      container.style.paddingTop = "0";
      container.style.paddingBottom = "0";
      container.style.marginTop = "0";
      container.style.marginBottom = "0";
      container.style.justifyContent = "";
      container.style.transform = "";

      /* contentBand = ما تبقّى بعد الرأس/الذيل/الشريط (حجوزات CSS + قياس) */
      const viewportH = window.innerHeight || 844;
      const viewportW = window.innerWidth || 390;
      const shortViewport = viewportH < 750;
      /* مقاسات غير المرجع فقط — الإبقاء على مسار 390×844 مطابقًا لبوابة اللقطات */
      const offRefViewport =
        shortViewport || Math.abs(viewportW - 390) > 12 || Math.abs(viewportH - 844) > 20;
      const bands = scaleMushafLayoutBands(viewportH);
      if (offRefViewport) {
        applyMushafLayoutBandCssVars(document.documentElement, bands);
        const shellForBands = document.querySelector(".quran-shell--ayah");
        if (shellForBands instanceof HTMLElement) {
          applyMushafLayoutBandCssVars(shellForBands, bands);
        }
      }
      const bodyEl =
        (container.closest(".mpv-body--ayah") as HTMLElement | null) ||
        (container.closest(".qs-mushaf-body--ayah") as HTMLElement | null) ||
        (container.parentElement instanceof HTMLElement ? container.parentElement : null);
      const headerEl = document.querySelector(".mpv-ayah-header");
      const footerEl = document.querySelector(".mpv-ayah-footer");
      const shellEl = document.querySelector(".quran-shell--ayah");
      const hr = headerEl?.getBoundingClientRect();
      const fr = footerEl?.getBoundingClientRect();
      const shellR = shellEl?.getBoundingClientRect();
      const insetBottom =
        Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--inset-bottom"),
        ) || 0;
      /* نهاية contentBand = أعلى الذيل − فاصل مشتق من ارتفاع الشاشة */
      const footerTop =
        fr?.top ??
        (shellR
          ? shellR.bottom - insetBottom - bands.toolbarBandPx - bands.footerBandPx
          : 0);
      const contentBot = footerTop - bands.contentFooterGapPx;
      const contentTop = hr?.bottom ?? container.getBoundingClientRect().top;
      let blockH =
        contentBot > contentTop
          ? contentBot - contentTop
          : Math.max(
              120,
              (bodyEl?.clientHeight || container.clientHeight) - mushafBottomReservePx(bands),
            );
      blockH = Math.max(120, blockH);
      if (blockH > 0) {
        container.style.height = `${blockH.toFixed(2)}px`;
        container.style.maxHeight = `${blockH.toFixed(2)}px`;
        container.style.flexGrow = "0";
        container.style.flexShrink = "0";
        container.style.flexBasis = "auto";
        container.dataset.mf2ContentBand = blockH.toFixed(1);
        container.dataset.mf2FooterBand = String(bands.footerBandPx);
        container.dataset.mf2ToolbarBand = String(bands.toolbarBandPx);
        container.dataset.mf2BandScale = (bands.toolbarBandPx / 52).toFixed(3);
      } else {
        container.style.height = "100%";
        container.style.maxHeight = "";
      }

      /* ص١–٢: بلا إطار — العرض الكامل للحاوية؛ لا مطّ لاحقاً */
      if (isOpening) {
        container.style.removeProperty("--mf2-opening-line-w");
      } else {
        container.style.removeProperty("--mf2-opening-line-w");
      }

      /* هامش جانبي: مطلق على المرجع؛ نسبي من عرض الحاوية خارج 390×844 */
      const sideClear = offRefViewport
        ? Math.max(
            2,
            Math.round(
              (MUSHAF_GRID.sideMarginPx || 2) *
                Math.min(1.25, Math.max(0.85, availableWidth / 358)),
            ),
          )
        : Math.max(2, MUSHAF_GRID.sideMarginPx || 2);
      void availableWidth;
      void sideClear;
      void sizingEls;

      const size = BASE_FONT;
      /* حجم خط موحّد لكل الصفحات — مخزّن في MUSHAF_SPEC / mushaf-baseline — بلا تحجيم لكل صفحة */
      const bound = "flow-grid-fixed-S" as const;
      applyTempFontSize(sizingEls, "");
      for (const el of sizingEls) el.style.overflowX = "";
      container.style.fontSize = `${size}px`;
      container.style.setProperty("--mf2-lh", String(LINE_HEIGHT_EM));
      container.style.setProperty("--mf2-slot-h-pct", String(slotHPct));
      container.style.setProperty(
        "--mf2-banner-h",
        `${(container.clientHeight * (1 / MUSHAF_GRID.slotCount)).toFixed(2)}px`,
      );

      /* توزيع مسافات بين الكلمات دون تغيير S — أسطر غير مركزية */
      for (const [ln, el] of ayahLineRefs.current) {
        el.style.removeProperty("--mf2-line-sx");
        el.style.width = "100%";
        if (noStretchLines.has(ln) || isOpening) {
          el.style.justifyContent = "center";
          el.dataset.centered = "1";
          continue;
        }
        el.style.justifyContent = "space-between";
        el.dataset.centered = "0";
      }

      container.dataset.mf2Size = size.toFixed(2);
      container.dataset.mf2Lh = LINE_HEIGHT_EM.toFixed(3);
      container.dataset.mf2Gap = "0";
      container.dataset.mf2Bind = bound;
      container.dataset.mf2Grid = "flow";
      container.dataset.mf2Opening = isOpening ? "1" : "0";
      container.dataset.mf2OpeningNoFrame = "1";

      setPageFontSize(size);
      setPageLineHeightEm(LINE_HEIGHT_EM);
      Object.entries(mushafTypescaleCssVars(size)).forEach(([k, v]) => {
        container.style.setProperty(k, v);
      });
      setFitted(true);
      return true;

    };

    const cleanupInline = () => {
      container.style.height = "";
      container.style.maxHeight = "";
      container.style.flexGrow = "";
      container.style.flexShrink = "";
      container.style.flexBasis = "";
      container.style.marginTop = "";
      container.style.marginBottom = "";
      container.style.paddingTop = "";
      container.style.paddingBottom = "";
      container.style.gap = "";
      container.style.justifyContent = "";
      container.style.transform = "";
      container.style.removeProperty("--mf2-lh");
      container.style.removeProperty("--mf2-banner-h");
      container.style.removeProperty("--mf2-slot-h-pct");
      for (const el of ayahLineRefs.current.values()) {
        el?.style.removeProperty("--mf2-line-sx");
      }
    };

    let cancelled = false;
    const runMeasure = () => {
      if (cancelled) return;
      measure();
    };

    if (!measure()) {
      const raf = requestAnimationFrame(runMeasure);
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
        cleanupInline();
      };
    }

    /* إعادة ملاءمة بعد استقرار الخطوط والتخطيط الأول — يمنع قياسًا سابقًا للخطوط */
    let raf1 = 0;
    let raf2 = 0;
    const afterFonts = () => {
      if (cancelled) return;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(runMeasure);
      });
    };
    void (document.fonts?.ready ?? Promise.resolve()).then(afterFonts);

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => { runMeasure(); })
      : null;
    const slotObserve =
      container.closest(".qs-mushaf-body") ||
      container.closest(".mpv-body") ||
      container.parentElement;
    if (slotObserve) ro?.observe(slotObserve);
    else ro?.observe(container);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
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

  /**
   * تدفق خانات متساوية — كل سطر/شارة/بسملة في grid-row = رقم الخانة.
   * ممنوع absolute / translateY على الأسطر (يقتل تراكب الشارة على الحبر).
   */
  const slotStyle = (gridSlot: number): CSSProperties => {
    const slot = Math.max(1, Math.min(MUSHAF_GRID.slotCount, gridSlot));
    return {
      gridRow: slot,
      gridColumn: 1,
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: isOpeningPage ? "center" : undefined,
      width: "100%",
      minHeight: 0,
      height: "100%",
      boxSizing: "border-box",
      margin: 0,
      padding: 0,
      overflow: "visible",
      transform: "none",
      zIndex: "auto",
    };
  };

  const renderAyahLine = (row: Extract<MushafPageLayout["rows"][number], { kind: "line" }>) => {
    const lineWords = showAyahNumbers
      ? row.words
      : row.words.filter((w) => w.charType !== "end");
    const wrap = (inner: ReactNode) => (
      <div
        key={`l-${row.lineNumber}`}
        data-grid-slot={row.gridSlot}
        style={slotStyle(row.gridSlot)}
        className="mf2-grid-slot mf2-grid-slot--line"
      >
        {inner}
      </div>
    );

    /** دقة QPC + visualOnly: سطر متصل واحد بلا عزل bidi بين الكلمات */
    if (!useUnicodeSafe && visualOnly) {
      return wrap(
        <div
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
        </div>,
      );
    }

    return wrap(
      <div
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
      </div>,
    );
  };

  const lines = (
    <>
      <div
        ref={linesContainerRef}
        className={linesClass}
        data-sizing-lines="ayah"
        data-measurement-exclusions="metric-only"
        data-mushaf-grid="flow"
        data-board="1000x1618"
        style={{
          opacity: fitted && fontReady ? 1 : 0,
          fontSize: !useUnicodeSafe && pageFontSize ? `${pageFontSize}px` : undefined,
          ["--mf2-lh" as string]: !useUnicodeSafe ? String(pageLineHeightEm) : undefined,
          fontFamily: useUnicodeSafe
            ? fontFamily
            : fontFamily
              ? `"${fontFamily}"`
              : undefined,
          overflow: "visible",
        }}
      >
        {layout.rows.map((row, idx) => {
          if (row.kind === "surah-header") {
            const key = `h-${row.surah.id}-${idx}`;
            return (
              <Fragment key={key}>
                <div
                  data-grid-slot={row.bannerSlot}
                  className="mf2-grid-slot mf2-grid-slot--banner"
                  style={slotStyle(row.bannerSlot)}
                  ref={(el) => {
                    if (el) headerBlockRefs.current.set(key, el);
                    else headerBlockRefs.current.delete(key);
                  }}
                >
                  <div className="mf2-surah-header" data-drawn-block="surah-header">
                    <div className="mf2-surah-header__frame">
                      <SurahBanner
                        label={drawnSurahTitleText(row.surah.nameArabic, row.surah.id)}
                        titleRef={(el) => {
                          if (el) surahTitleRefs.current.set(key, el);
                          else surahTitleRefs.current.delete(key);
                        }}
                        className="mf2-surah-header__cartouche"
                      />
                    </div>
                  </div>
                </div>
                {row.basmalaSlot != null && row.surah.bismillahPre && (
                  <div
                    data-grid-slot={row.basmalaSlot}
                    className="mf2-grid-slot mf2-grid-slot--basmala"
                    style={slotStyle(row.basmalaSlot)}
                  >
                    <div
                      className="mf2-bismillah"
                      lang="ar"
                      dir="rtl"
                      data-sizing-line="basmala"
                      ref={(el) => {
                        if (el) basmalaRefs.current.set(key, el);
                        else basmalaRefs.current.delete(key);
                      }}
                    >
                      {DRAWN_BASMALA_TEXT}
                    </div>
                  </div>
                )}
                {/* gap=1: المصحف يحتفظ بخانة واحدة فقط للشارة — البسملة غير مرسومة
                    كخانة مستقلة لتفادي التراكب مع أول آية (١٨ صفحة). */}
              </Fragment>
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
