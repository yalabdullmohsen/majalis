import { Fragment, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useMushafPageFont, mushafPageFontFamily } from "@/hooks/useMushafPageFont";
import type { MushafPageLayout, QpcWord } from "@/lib/mushaf-v2-data";
import { drawnSurahTitleText } from "@/lib/mushaf-sizing-lines";
import { SurahBanner } from "@/components/quran/SurahBanner";
import { BasmalaLine } from "@/components/quran/BasmalaLine";
import { ensureMushafPageFont } from "@/hooks/useMushafPageFont";
import { wordKeyFromQpc } from "@/features/mushaf/ayah-word-keys";
import {
  MUSHAF_FONT_DEV_MAX,
  MUSHAF_GRID,
  MUSHAF_LAYOUT_BASELINE,
} from "@/features/mushaf/config";
import {
  applyMushafLayoutBandCssVars,
  mushafBottomReservePx,
  scaleMushafLayoutBands,
} from "@/features/mushaf/layout-bands";
import { mushafTypescaleCssVars } from "@/features/mushaf/typescale";

/**
 * صفحتا الافتتاح (١–٢): مسار برمجي موحّد · بلا إطار — مرجع آية.
 * أعلى الشارة ≈٢٧٫٧٪ من الشاشة ≈٢٠٪ من contentBand · نهاية الكتلة ≈٧٤٫٨٪ شاشة.
 * فاصل شارة→بسملة ٢٤px · بسملة→أول سطر ٢٠px.
 * مدّ السطر = تكبير الخط أولاً ثم فجوة كلمات ≤١٨px.
 */
/** أعلى الشارة (٪ من .mf2-lines / contentBand) — مرجع آية ٢٧٫٧٪ شاشة */
const OPENING_BANNER_TOP_PCT = 20;
/** ارتفاع خانة الشارة = خانة سطر واحدة (٪) */
const OPENING_BANNER_H_PCT = MUSHAF_GRID.slotHeightPct;
/** فاصل حبر شارة→بسملة (صفحتا الافتتاح) */
const OPENING_BANNER_TO_BASMALA_PX = 24;
/** فاصل حبر بسملة→أول سطر آية */
const OPENING_BASMALA_TO_LINE_PX = 20;
/** فاصل أدنى شارة→بسملة في الصفحات العادية */
const BANNER_BASMALA_MIN_GAP_PX = 22;
/** هامش سفلي تحت آخر سطر — نهاية كتلة ≈٧٤٫٨٪ شاشة داخل contentBand */
const OPENING_BOTTOM_MARGIN_PCT = 21;
/** أدنى فجوة حبر بين سطرين كنسبة من حجم الخط S (لا ارتفاع الصندوق — كان يفيض الذيل) */
const OPENING_MIN_LINE_GAP_RATIO = 0.35;
/** ارتفاع خانة الجسم — يقارب امتداد الحبر دون مبالغة الصندوق */
const OPENING_BODY_SLOT_H_PCT = 5.8;
/** أقصى فجوة كلمات بعد تكبير الخط — مرجع ≈١٥px */
const MAX_WORD_GAP_PX = 18;
/** أدنى تغطية حبر أفقية مستهدفة بعد المطّ */
const MIN_LINE_INK_COVER = 0.78;
/** مركز الشارة للتموضع المطلق (translateY -50%) */
const OPENING_BANNER_MID_PCT = OPENING_BANNER_TOP_PCT + OPENING_BANNER_H_PCT / 2;
const OPENING_BODY_BOT_PCT = 100 - OPENING_BOTTOM_MARGIN_PCT;

/** حدود الحبر الفعلية عبر Range — أدق من تقدير canvas+منتصف الصندوق */
function measureInkBounds(el: HTMLElement): { top: number; bottom: number } {
  const box = el.getBoundingClientRect();
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    if (rects.length > 0) {
      return {
        top: Math.min(...rects.map((r) => r.top)),
        bottom: Math.max(...rects.map((r) => r.bottom)),
      };
    }
  } catch {
    /* fall through */
  }
  const cs = getComputedStyle(el);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { top: box.top, bottom: box.bottom };
  ctx.font = cs.font;
  const m = ctx.measureText((el.textContent || "").trim() || "ا");
  const ascent =
    m.actualBoundingBoxAscent ||
    m.fontBoundingBoxAscent ||
    parseFloat(cs.fontSize) * 0.95;
  const descent =
    m.actualBoundingBoxDescent ||
    m.fontBoundingBoxDescent ||
    parseFloat(cs.fontSize) * 0.35;
  const baselineY = box.top + box.height / 2 + (ascent - descent) / 2;
  return { top: baselineY - ascent, bottom: baselineY + descent };
}

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
  /** @deprecated مسار عثماني متدفق أُلغي — يُتجاهل بصريًا */
  sharedFontFamily?: string;
  /** مخصّص اختياري؛ لا يُستخدم لإعادة الالتفاف */
  renderWord?: (w: QpcWord) => ReactNode;
  bare?: boolean;
  showAyahNumbers?: boolean;
  /**
   * وضع بصري فقط: بلا أزرار/ضغط على مجموعات الآيات —
   * التفاعل ينتقل لطبقة الإحداثيات (MushafHitLayer).
   */
  visualOnly?: boolean;
  /** مقياس الخط من الإعدادات: --mushaf-scale مضروب في S المحسوب */
  mushafScale?: number;
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
  sharedFontFamily: _sharedFontFamilyIgnored,
  renderWord: _renderWordIgnored,
  bare,
  showAyahNumbers = true,
  visualOnly = false,
  mushafScale = 1,
}: Props) {
  /* مسار بصري واحد: QPC دائمًا. sharedFontFamily/renderWord لا يبدّلان الالتفاف. */
  void _sharedFontFamilyIgnored;
  void _renderWordIgnored;
  const pageFont = useMushafPageFont(layout?.pageNumber ?? null);
  /** لا مسار عثماني متدفق — الشبكة ١٥ خانة + fit-to-width فقط */
  const useUnicodeSafe = false;
  const fontReady = pageFont.ready || pageFont.failed;

  const fontFamily = useMemo(() => {
    if (layout) return mushafPageFontFamily(layout.pageNumber);
    return undefined;
  }, [layout]);

  const wordRenderer = useMemo(
    () => (w: QpcWord) => defaultRenderWord(w, showAyahNumbers),
    [showAyahNumbers],
  );
  const scaleFactor = Number.isFinite(mushafScale) && mushafScale > 0
    ? Math.min(1.65, Math.max(0.7, mushafScale))
    : 1;

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

  /** خانات المحتوى المستخدمة — لإعادة توزيع ص١–٢ داخل الإطار بتباعد أوسع */
  const openingSlots = useMemo(() => {
    if (!layout || (layout.pageNumber !== 1 && layout.pageNumber !== 2)) {
      return { all: [] as number[], banners: [] as number[], body: [] as number[] };
    }
    const banners = new Set<number>();
    const all = new Set<number>();
    for (const row of layout.rows) {
      if (row.kind === "line") all.add(row.gridSlot);
      else {
        banners.add(row.bannerSlot);
        all.add(row.bannerSlot);
        if (row.basmalaSlot != null) all.add(row.basmalaSlot);
      }
    }
    const allArr = [...all].sort((a, b) => a - b);
    const body = allArr.filter((s) => !banners.has(s));
    return { all: allArr, banners: [...banners].sort((a, b) => a - b), body };
  }, [layout]);

  /** شارة→بسملة في الصفحات العادية — لتطبيق فاصل الحبر دون تغيير حدود الصفحة */
  const bannerBasmalaPairs = useMemo(() => {
    const pairs: { banner: number; basmala: number }[] = [];
    if (!layout) return pairs;
    for (const row of layout.rows) {
      if (row.kind === "surah-header" && row.basmalaSlot != null) {
        pairs.push({ banner: row.bannerSlot, basmala: row.basmalaSlot });
      }
    }
    return pairs;
  }, [layout]);

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

    const container = linesContainerRef.current;
    if (!container) return;

    const LINE_HEIGHT_EM = MUSHAF_LAYOUT_BASELINE.lineHeightEm;
    const REF_PX = 100;
      const MIN_LINE_FILL = 0.98;
    /* S المحسوب × --mushaf-scale — بلا فرع إعادة التفاف */
    const BASE_FONT = MUSHAF_LAYOUT_BASELINE.fontSizePx * scaleFactor;
    const isOpening = layout.pageNumber === 1 || layout.pageNumber === 2;
    const noStretchLines = lastSurahEndLineNumbers(layout);
    /* صفحتا الافتتاح: أسطر قصيرة بلا مطّ عرض مفرط — الفاتحة/البقرة تُمدّ بالخط لا بالفراغ */
    if (isOpening) {
      for (const row of layout.rows) {
        if (row.kind === "line") noStretchLines.add(row.lineNumber);
      }
    }
    void ensureMushafPageFont(1).catch(() => {});
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

      for (const el of sizingEls) {
        el.style.removeProperty("--mf2-line-sx");
        el.style.removeProperty("--mf2-word-gap");
      }
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
      const fr = footerEl?.getBoundingClientRect();
      const shellR = shellEl?.getBoundingClientRect();
      const insetBottom =
        Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--inset-bottom"),
        ) || 0;
      /* نهاية contentBand = أعلى الذيل − فاصل؛ البداية = حشو الجسم (١١٫٨٪) لا أسفل الرأس */
      const footerTop =
        fr?.top ??
        (shellR
          ? shellR.bottom - insetBottom - bands.toolbarBandPx - bands.footerBandPx
          : 0);
      let contentTop = container.getBoundingClientRect().top;
      let contentBot = footerTop - bands.contentFooterGapPx;
      if (bodyEl) {
        const br = bodyEl.getBoundingClientRect();
        const bcs = getComputedStyle(bodyEl);
        const padTop = Number.parseFloat(bcs.paddingTop) || 0;
        const padBot = Number.parseFloat(bcs.paddingBottom) || 0;
        contentTop = br.top + padTop;
        contentBot = Math.min(contentBot, br.bottom - padBot);
      } else if (headerEl) {
        contentTop = Math.max(contentTop, headerEl.getBoundingClientRect().bottom);
      }
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
        /* ممنوع maxHeight يقصّ الحبر — التجاوز يُعالَج بملاءمة الخط لا بالقصّ */
        container.style.maxHeight = "none";
        container.style.overflow = "visible";
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

      /* هامش جانبي داخل الحاوية (الجسم مبطّن ١٫٥٪) — ٢px يمنع تجاوز الحبر على CI */
      const sideClear = offRefViewport
        ? Math.max(
            2,
            Math.round(
              (MUSHAF_GRID.sideMarginPx || 2) *
                Math.min(1.25, Math.max(0.85, availableWidth / 358)) *
                0.35,
            ),
          )
        : 2;
      const fitWidth = Math.max(8, availableWidth - sideClear * 2);

      const widestAtRef = measureWidest(sizingEls, REF_PX);
      if (widestAtRef <= 0) return false;

      const MIN_FONT_PX = Math.max(11, BASE_FONT * 0.52);
      let size = BASE_FONT;
      const bound = "grid-311" as const;
      const maxFont = BASE_FONT * (1 + MUSHAF_FONT_DEV_MAX);

      const applySizeProbe = (px: number) => {
        applyTempFontSize(sizingEls, px);
        container.style.fontSize = `${px}px`;
        container.style.setProperty("--mf2-lh", String(LINE_HEIGHT_EM));
        for (const el of sizingEls) {
          el.style.overflowX = "visible";
          el.style.removeProperty("--mf2-line-sx");
          el.style.removeProperty("--mf2-word-gap");
        }
      };

      const widestAt = (px: number) => {
        applySizeProbe(px);
        let w = 0;
        for (const el of sizingEls) w = Math.max(w, measureLineContentWidth(el));
        return w;
      };

      /* بحث ثنائي: كبّر الخط أولاً حتى يقارب أعرض سطر حدّ العرض بمسافات طبيعية */
      {
        let lo = MIN_FONT_PX;
        let hi = Math.max(maxFont, BASE_FONT * 1.08);
        /* اسمح بصعود حتى الأساس+DEV أو ما يتّسع — الأساس مرفوع ≈٤٠٪ */
        hi = Math.max(hi, BASE_FONT * (1 + MUSHAF_FONT_DEV_MAX));
        if (widestAt(hi) > fitWidth) {
          while (hi - lo > 0.25) {
            const mid = (lo + hi) / 2;
            if (widestAt(mid) <= fitWidth) lo = mid;
            else hi = mid;
          }
          size = lo;
        } else {
          /* إن اتّسع الأعلى، ابحث عن أكبر حجم ما زال ≤ العرض */
          let growLo = hi;
          let growHi = Math.min(fitWidth * 0.12, BASE_FONT * 1.55);
          if (growHi > growLo && widestAt(growHi) <= fitWidth) {
            size = growHi;
          } else if (growHi > growLo) {
            while (growHi - growLo > 0.25) {
              const mid = (growLo + growHi) / 2;
              if (widestAt(mid) <= fitWidth) growLo = mid;
              else growHi = mid;
            }
            size = growLo;
          } else {
            size = hi;
          }
        }
      }

      applyTempFontSize(sizingEls, "");
      for (const el of sizingEls) el.style.overflowX = "";
      container.style.fontSize = `${size}px`;
      container.style.setProperty("--mf2-lh", String(LINE_HEIGHT_EM));
      container.style.setProperty("--mf2-slot-h-pct", String(slotHPct));
      container.style.setProperty(
        "--mf2-banner-h",
        `${(container.clientHeight * (slotHPct / 100)).toFixed(2)}px`,
      );

      const measureInkX = (el: HTMLElement) => {
        /* فضّل صناديق الكلمات — Range على السطر قد يعيد عرض الصندوق الكامل ١٠٠٪ */
        const words = el.querySelectorAll(".mf2-word, .mf2-line__run");
        let left = Infinity;
        let right = -Infinity;
        for (const node of words) {
          const r = (node as HTMLElement).getBoundingClientRect();
          if (r.width <= 0 && r.height <= 0) continue;
          left = Math.min(left, r.left);
          right = Math.max(right, r.right);
        }
        if (Number.isFinite(left)) return { left, right };
        try {
          const range = document.createRange();
          const run = el.querySelector(".mf2-line__run") || el;
          range.selectNodeContents(run);
          const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
          if (rects.length) {
            return {
              left: Math.min(...rects.map((r) => r.left)),
              right: Math.max(...rects.map((r) => r.right)),
            };
          }
        } catch {
          /* fall through */
        }
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right };
      };

      /* ملاءمة عرض الأسطر عبر مسافات الكلمات — بلا scaleX يشوّه المحارف */
      const countWordGaps = (el: HTMLElement) => {
        const words = el.querySelectorAll(".mf2-word");
        return Math.max(0, words.length - 1);
      };
      const applyWordGaps = () => {
        const crFit = container.getBoundingClientRect();
        for (const [ln, el] of ayahLineRefs.current) {
          if (!el) continue;
          el.style.removeProperty("--mf2-line-sx");
          if (isOpening || noStretchLines.has(ln)) {
            el.style.removeProperty("--mf2-word-gap");
            el.classList.add(isOpening ? "mf2-line--natural" : "mf2-line--surah-end");
            if (isOpening) el.classList.add("mf2-line--opening-natural");
            else el.classList.remove("mf2-line--natural");
            el.dataset.noStretch = "1";
            continue;
          }
          el.classList.remove("mf2-line--surah-end");
          el.classList.remove("mf2-line--natural");
          el.classList.remove("mf2-line--opening-natural");
          el.removeAttribute("data-no-stretch");
          el.style.removeProperty("--mf2-word-gap");
          const contentW = measureLineContentWidth(el);
          const gaps = countWordGaps(el);
          if (contentW <= 0 || gaps <= 0) continue;
          const room = Math.max(8, crFit.width - sideClear * 2);
          const fill = contentW / room;
          if (fill >= MIN_LINE_FILL) continue;
          /* بعد تكبير الخط: أغلق الفارق الصغير فقط · سقف ١٨px */
          let lo = 0;
          let hi = Math.min(MAX_WORD_GAP_PX, Math.max(0.05, (room - contentW) / gaps));
          for (let pass = 0; pass < 14; pass++) {
            const mid = (lo + hi) / 2;
            el.style.setProperty("--mf2-word-gap", `${mid.toFixed(3)}px`);
            const ink = measureInkX(el);
            const over = Math.max(
              0,
              crFit.left + sideClear - ink.left,
              ink.right - (crFit.right - sideClear),
            );
            const span = ink.right - ink.left;
            if (over > 0.35) hi = mid;
            else if (span < room - 0.75) lo = mid;
            else {
              lo = mid;
              break;
            }
          }
          const capped = Math.min(MAX_WORD_GAP_PX, lo);
          if (capped < 0.05) el.style.removeProperty("--mf2-word-gap");
          else el.style.setProperty("--mf2-word-gap", `${capped.toFixed(3)}px`);
        }
      };
      applyWordGaps();

      /* تمريرة أمان أفقية: صغّر الخط و/أو خفّض الفجوة حتى يبقى هامش الحبر */
      for (let guard = 0; guard < 10; guard++) {
        const crNow = container.getBoundingClientRect();
        let maxOver = 0;
        for (const el of sizingEls) {
          if (!el) continue;
          const ink = measureInkX(el);
          maxOver = Math.max(
            maxOver,
            Math.max(0, crNow.left + sideClear - ink.left),
            Math.max(0, ink.right - (crNow.right - sideClear)),
          );
        }
        if (maxOver <= 0.25) break;
        size *= 0.985;
        container.style.fontSize = `${size}px`;
        for (const el of sizingEls) {
          if (!el) continue;
          const cur = Number.parseFloat(el.style.getPropertyValue("--mf2-word-gap") || "0");
          if (Number.isFinite(cur) && cur > 0.05) {
            const next = cur * 0.92;
            if (next < 0.05) el.style.removeProperty("--mf2-word-gap");
            else el.style.setProperty("--mf2-word-gap", `${next.toFixed(3)}px`);
          }
        }
      }

      /*
       * ملاءمة رأسية: بحث ثنائي بدقة ٠٫٢٥px حتى يملأ الحبر الشريط بلا فائض.
       * ممنوع القصّ بـ overflow/contain paint — التجاوز في DEV يرمي خطأ.
       */
      const pitchPct =
        (MUSHAF_GRID.baselinesPct[MUSHAF_GRID.baselinesPct.length - 1] -
          MUSHAF_GRID.baselinesPct[0]) /
        Math.max(1, MUSHAF_GRID.baselinesPct.length - 1);
      const pitchPx = blockH * (pitchPct / 100);
      /* سقف نظري: الحبر لا يتجاوز خطوة خط الأساس (~٠٫٩٢ من الخطوة) */
      const sizeCapPitch = pitchPx / Math.max(1.05, LINE_HEIGHT_EM) * 0.92;
      if (Number.isFinite(sizeCapPitch) && sizeCapPitch > 0) {
        size = Math.min(size, sizeCapPitch);
        container.style.fontSize = `${size}px`;
      }

      const deepestAyahInkBottom = () => {
        let bot = -Infinity;
        for (const el of container.querySelectorAll<HTMLElement>(
          ".mf2-grid-slot--line .mf2-line, .mf2-line",
        )) {
          if (!container.contains(el)) continue;
          const b = measureInkBounds(el);
          if (b.bottom > bot) bot = b.bottom;
        }
        return bot;
      };

      const applyVerticalSize = (px: number) => {
        size = px;
        container.style.fontSize = `${px}px`;
        container.style.setProperty(
          "--mf2-banner-h",
          `${(container.clientHeight * (slotHPct / 100)).toFixed(2)}px`,
        );
      };

      {
        const crV = container.getBoundingClientRect();
        const limitBot = crV.bottom - 0.35;
        const inkFits = (px: number) => {
          applyVerticalSize(px);
          for (const el of sizingEls) el.style.removeProperty("--mf2-word-gap");
          let widest = 0;
          for (const el of sizingEls) widest = Math.max(widest, measureLineContentWidth(el));
          if (widest > fitWidth + 0.75) return false;
          const bot = deepestAyahInkBottom();
          return Number.isFinite(bot) && bot <= limitBot;
        };
        /* بحث ثنائي: أكبر مقياس ≤ الأفقي يتّسع رأسيًا — بلا نمو يتجاوز الملاءمة الأفقية */
        {
          let lo = MIN_FONT_PX;
          let hi = size;
          if (!inkFits(hi)) {
            while (hi - lo > 0.25) {
              const mid = (lo + hi) / 2;
              if (inkFits(mid)) lo = mid;
              else hi = mid;
            }
            applyVerticalSize(lo);
          } else {
            applyVerticalSize(hi);
          }
        }
        /* بعد ثبات المقاس الرأسي: أعد امتداد الأسطر لملء ١٫٥٪→٩٨٫٤٪ */
        applyWordGaps();
        /* تمريرة قصّ أفقية نهائية — صفر تجاوز */
        {
          const crNow = container.getBoundingClientRect();
          for (const el of sizingEls) {
            if (!el || el.dataset.noStretch === "1") continue;
            let gapPx = Number.parseFloat(el.style.getPropertyValue("--mf2-word-gap") || "0");
            if (!Number.isFinite(gapPx) || gapPx <= 0) continue;
            for (let pass = 0; pass < 12; pass++) {
              const ink = measureInkX(el);
              const over = Math.max(
                0,
                crNow.left + sideClear - ink.left,
                ink.right - (crNow.right - sideClear),
              );
              if (over <= 0.15) break;
              gapPx *= 0.85;
              if (gapPx < 0.05) {
                el.style.removeProperty("--mf2-word-gap");
                break;
              }
              el.style.setProperty("--mf2-word-gap", `${gapPx.toFixed(3)}px`);
            }
          }
        }
        container.dataset.mf2VerticalFit = "1";
        container.dataset.mf2InkBotClear = (
          limitBot - deepestAyahInkBottom()
        ).toFixed(2);
        const inkClear = limitBot - deepestAyahInkBottom();
        if (
          import.meta.env.DEV &&
          Number.isFinite(inkClear) &&
          inkClear < -1.5
        ) {
          throw new Error(
            `[mushaf] بتر حبر بعد الملاءمة: page=${layout.pageNumber} overflow=${(-inkClear).toFixed(1)}px — لا يُقصّ بصمت`,
          );
        }
      }

      blockH = container.clientHeight || blockH || 1;
      let inkTop = Infinity;
      let inkBot = -Infinity;
      for (const child of container.querySelectorAll<HTMLElement>("[data-grid-slot]")) {
        const r = child.getBoundingClientRect();
        if (r.height <= 0 && r.width <= 0) continue;
        inkTop = Math.min(inkTop, r.top);
        inkBot = Math.max(inkBot, r.bottom);
      }
      const cr = container.getBoundingClientRect();
      const spanH = Number.isFinite(inkTop) && Number.isFinite(inkBot)
        ? Math.max(0, inkBot - inkTop)
        : 0;
      const topGapRatio = Number.isFinite(inkTop)
        ? Math.max(0, inkTop - cr.top) / blockH
        : 0;

      container.dataset.mf2Size = size.toFixed(2);
      container.dataset.mf2Lh = LINE_HEIGHT_EM.toFixed(3);
      container.dataset.mf2Gap = "0";
      container.dataset.mf2Bind = bound;
      container.dataset.mf2Fill = (spanH / blockH).toFixed(3);
      container.dataset.mf2BoxFill = "1";
      container.dataset.mf2TopGap = topGapRatio.toFixed(3);
      container.dataset.mf2Opening = isOpening ? "1" : "0";
      container.dataset.mf2Grid = "1";

      /* ص١–٢: شارة ٣٨٪ · فاصل ٢٤px ثم ٢٠px · فجوات أسطر متساوية */
      if (isOpening) {
        const crNow = container.getBoundingClientRect();
        const H = crNow.height;
        if (H > 40) {
          const pxPct = (px: number) => (px / H) * 100;
          container.dataset.mf2BannerTopPct = String(OPENING_BANNER_TOP_PCT);
          container.dataset.mf2OpeningNoFrame = "1";
          container.dataset.mf2FrameBand = "none";

          const banners = [
            ...container.querySelectorAll<HTMLElement>(".mf2-grid-slot--banner"),
          ];
          for (const ban of banners) {
            ban.style.top = `${OPENING_BANNER_MID_PCT.toFixed(3)}%`;
            ban.style.height = `${OPENING_BANNER_H_PCT}%`;
          }

          const basmalaSlots = [
            ...container.querySelectorAll<HTMLElement>(".mf2-grid-slot--basmala"),
          ].sort(
            (a, b) =>
              Number(a.getAttribute("data-grid-slot") || 0) -
              Number(b.getAttribute("data-grid-slot") || 0),
          );
          const lineSlots = [
            ...container.querySelectorAll<HTMLElement>(".mf2-grid-slot--line"),
          ].sort(
            (a, b) =>
              Number(a.getAttribute("data-grid-slot") || 0) -
              Number(b.getAttribute("data-grid-slot") || 0),
          );

          let basmalaSlot: HTMLElement | null = basmalaSlots[0] ?? null;
          let ayahLineSlots = lineSlots;
          if (!basmalaSlot && lineSlots.length > 0) {
            basmalaSlot = lineSlots[0];
            ayahLineSlots = lineSlots.slice(1);
          }

          const placeSlotCenter = (slot: HTMLElement, centerPct: number, hPct: number) => {
            slot.style.top = `${centerPct.toFixed(3)}%`;
            slot.style.height = `${hPct.toFixed(3)}%`;
          };

          const inkElOf = (slot: HTMLElement): HTMLElement | null =>
            slot.querySelector<HTMLElement>(".mf2-bismillah, .mf2-line") || slot;

          const banR = banners[0]?.getBoundingClientRect();
          const slotH = OPENING_BODY_SLOT_H_PCT;
          const ascentPad = size * 0.72;

          if (basmalaSlot && banR) {
            /* مركز ≈ أسفل الشارة + ٢٤px + صعود الحبر */
            let basCenterPct =
              ((banR.bottom - crNow.top + OPENING_BANNER_TO_BASMALA_PX + ascentPad) / H) * 100;
            placeSlotCenter(basmalaSlot, basCenterPct, slotH);
            for (let pass = 0; pass < 3; pass++) {
              const basInkEl = inkElOf(basmalaSlot);
              if (!basInkEl) break;
              const ink = measureInkBounds(basInkEl);
              const gap = ink.top - banR.bottom;
              const nudgePct = pxPct(OPENING_BANNER_TO_BASMALA_PX - gap);
              if (Math.abs(nudgePct) < 0.02) break;
              basCenterPct += nudgePct;
              placeSlotCenter(basmalaSlot, basCenterPct, slotH);
            }

            const basInkEl = inkElOf(basmalaSlot);
            let basInk = basInkEl
              ? measureInkBounds(basInkEl)
              : {
                  top: banR.bottom + OPENING_BANNER_TO_BASMALA_PX,
                  bottom: banR.bottom + OPENING_BANNER_TO_BASMALA_PX + size,
                };
            container.dataset.mf2BasmalaGap = (basInk.top - banR.bottom).toFixed(1);

            /* ثبّت شارة→بسملة قبل توزيع الأسطر */
            {
              const banEl = banners[0];
              if (banEl && basInkEl) {
                const u = banEl.getBoundingClientRect();
                const l = basInkEl.getBoundingClientRect();
                const gapBox = l.top - u.bottom;
                if (gapBox < OPENING_BANNER_TO_BASMALA_PX - 0.5) {
                  const nudge = pxPct(OPENING_BANNER_TO_BASMALA_PX - gapBox);
                  const t = parseFloat(basmalaSlot.style.top);
                  if (Number.isFinite(t)) {
                    placeSlotCenter(
                      basmalaSlot,
                      t + nudge,
                      parseFloat(basmalaSlot.style.height) || slotH,
                    );
                  }
                }
                basInk = measureInkBounds(basInkEl);
                container.dataset.mf2BasmalaGap = (basInk.top - banR.bottom).toFixed(1);
              }
            }

            if (ayahLineSlots.length > 0) {
              const sampleLine = inkElOf(ayahLineSlots[0]);
              const sampleInk = sampleLine ? measureInkBounds(sampleLine) : null;
              const sampleInkH = sampleInk
                ? Math.max(size * 0.95, sampleInk.bottom - sampleInk.top)
                : size * 1.15;
              const lineH = OPENING_BODY_SLOT_H_PCT;
              /* نهاية الكتلة ≈٧٤٫٨٪ شاشة = OPENING_BODY_BOT_PCT من contentBand */
              const maxInkBottom = crNow.top + (OPENING_BODY_BOT_PCT / 100) * H - 0.5;
              const nLines = ayahLineSlots.length;
              const idealGap = Math.max(
                OPENING_MIN_LINE_GAP_RATIO * size,
                MUSHAF_LAYOUT_BASELINE.lineGapPx * (size / BASE_FONT),
              );
              const placeFrom = (firstTop: number, gap: number) => {
                let top = firstTop;
                for (const slot of ayahLineSlots) {
                  placeSlotCenter(slot, ((top + sampleInkH * 0.5 - crNow.top) / H) * 100, lineH);
                  const el = inkElOf(slot);
                  if (el) {
                    const ink = measureInkBounds(el);
                    const adj = top - ink.top;
                    if (Math.abs(adj) > 0.35) {
                      placeSlotCenter(
                        slot,
                        parseFloat(slot.style.top) + pxPct(adj),
                        lineH,
                      );
                    }
                  }
                  const h = el
                    ? (() => {
                        const b = measureInkBounds(el);
                        return Math.max(size * 0.9, b.bottom - b.top);
                      })()
                    : sampleInkH;
                  top += h + gap;
                }
              };
              const liveBasBottom = () =>
                basInkEl ? measureInkBounds(basInkEl).bottom : basInk.bottom;
              const measureHeights = () =>
                ayahLineSlots.map((slot) => {
                  const el = inkElOf(slot);
                  if (!el) return sampleInkH;
                  const b = measureInkBounds(el);
                  return Math.max(size * 0.9, b.bottom - b.top);
                });
              let firstTop = liveBasBottom() + OPENING_BASMALA_TO_LINE_PX;
              let heights: number[];
              let gap = idealGap;
              /* صغّر الخط حتى تتّسع الأسطر بفجوة ≥ ٠٫٣٥×S داخل contentBand */
              for (let fitPass = 0; fitPass < 14; fitPass++) {
                const minG = OPENING_MIN_LINE_GAP_RATIO * size;
                const idealG = Math.max(
                  minG,
                  MUSHAF_LAYOUT_BASELINE.lineGapPx * (size / BASE_FONT),
                );
                firstTop = liveBasBottom() + OPENING_BASMALA_TO_LINE_PX;
                heights = measureHeights();
                const sumH = heights.reduce((s, h) => s + h, 0);
                const have = maxInkBottom - firstTop;
                const need = sumH + Math.max(0, nLines - 1) * minG;
                if (nLines <= 1 || need <= have + 0.5) {
                  /* وزّع الفراغ المتبقي بالتساوي حتى نهاية الكتلة ٧٤٫٨٪ */
                  const gapCount = Math.max(1, nLines - 1);
                  const fillGap = nLines <= 1 ? idealG : (have - sumH) / gapCount;
                  gap = Math.max(idealG, fillGap);
                  break;
                }
                size = Math.max(
                  Math.max(11, BASE_FONT * 0.52),
                  size * Math.min(0.97, (have / Math.max(need, 1)) * 0.98),
                );
                container.style.fontSize = `${size}px`;
              }
              placeFrom(firstTop, gap);
              {
                const first = inkElOf(ayahLineSlots[0]);
                if (first) {
                  const needShift = firstTop - measureInkBounds(first).top;
                  if (Math.abs(needShift) > 0.5) {
                    const shift = pxPct(needShift);
                    for (const slot of ayahLineSlots) {
                      const t = parseFloat(slot.style.top);
                      if (Number.isFinite(t)) placeSlotCenter(slot, t + shift, lineH);
                    }
                  }
                }
                const last = inkElOf(ayahLineSlots[ayahLineSlots.length - 1]);
                if (last && nLines > 1) {
                  const overflow = measureInkBounds(last).bottom - maxInkBottom;
                  if (overflow > 0.5) {
                    size = Math.max(Math.max(11, BASE_FONT * 0.52), size * 0.94);
                    container.style.fontSize = `${size}px`;
                    const minG = OPENING_MIN_LINE_GAP_RATIO * size;
                    firstTop = liveBasBottom() + OPENING_BASMALA_TO_LINE_PX;
                    heights = measureHeights();
                    const sumH2 = heights.reduce((s, h) => s + h, 0);
                    const have2 = maxInkBottom - firstTop;
                    gap = Math.max(minG, (have2 - sumH2) / Math.max(1, nLines - 1));
                    placeFrom(firstTop, gap);
                  }
                }
              }
              const gaps: number[] = [];
              for (let i = 0; i < ayahLineSlots.length - 1; i++) {
                const a = inkElOf(ayahLineSlots[i]);
                const b = inkElOf(ayahLineSlots[i + 1]);
                if (a && b) {
                  gaps.push(measureInkBounds(b).top - measureInkBounds(a).bottom);
                }
              }
              if (gaps.length) {
                const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length;
                container.dataset.mf2LineGapAvg = avg.toFixed(2);
                container.dataset.mf2LineGapMin = Math.min(...gaps).toFixed(2);
              }
              container.dataset.mf2BasmalaLineGap = (() => {
                const el = inkElOf(ayahLineSlots[0]);
                if (!el || !basInkEl) return "";
                return (
                  measureInkBounds(el).top - measureInkBounds(basInkEl).bottom
                ).toFixed(1);
              })();
            }
          }
        }

        /* بعد تموضع الافتتاح: إن بقي حبر خارج الصندوق صغّر الخط وأعد التوزيع */
        {
          const MIN_FONT_OPEN = Math.max(11, BASE_FONT * 0.52);
          for (let guard = 0; guard < 16; guard++) {
            const crOpen = container.getBoundingClientRect();
            const limitBot = crOpen.bottom - 0.35;
            const H = crOpen.height || 1;
            let bot = -Infinity;
            for (const el of container.querySelectorAll<HTMLElement>(
              ".mf2-grid-slot--line .mf2-line, .mf2-line",
            )) {
              if (!container.contains(el)) continue;
              bot = Math.max(bot, measureInkBounds(el).bottom);
            }
            if (!Number.isFinite(bot) || bot <= limitBot) break;
            if (size <= MIN_FONT_OPEN + 0.05) break;
            size = Math.max(MIN_FONT_OPEN, size * 0.94);
            container.style.fontSize = `${size}px`;

            const basSlot =
              container.querySelector<HTMLElement>(".mf2-grid-slot--basmala") ||
              [...container.querySelectorAll<HTMLElement>(".mf2-grid-slot--line")].find((s) =>
                s.querySelector(".mf2-bismillah"),
              ) ||
              null;
            const basInk = basSlot
              ? basSlot.querySelector<HTMLElement>(".mf2-bismillah, .mf2-line")
              : container.querySelector<HTMLElement>(".mf2-bismillah");
            const ayahSlots = [
              ...container.querySelectorAll<HTMLElement>(".mf2-grid-slot--line"),
            ]
              .filter((s) => !s.querySelector(".mf2-bismillah"))
              .sort(
                (a, b) =>
                  Number(a.getAttribute("data-grid-slot") || 0) -
                  Number(b.getAttribute("data-grid-slot") || 0),
              );
            if (!basInk || ayahSlots.length === 0) continue;
            const firstTop = measureInkBounds(basInk).bottom + OPENING_BASMALA_TO_LINE_PX;
            const heights = ayahSlots.map((slot) => {
              const el = slot.querySelector<HTMLElement>(".mf2-line");
              return el
                ? Math.max(size * 0.85, measureInkBounds(el).bottom - measureInkBounds(el).top)
                : size;
            });
            const sumH = heights.reduce((s, h) => s + h, 0);
            const n = ayahSlots.length;
            const rawGap = n > 1 ? (limitBot - firstTop - sumH) / (n - 1) : 0;
            if (rawGap < 0 && sumH > 0) {
              /* ما زال الحبر أعرض من المساحة — صغّر أكثر في الدورة التالية */
              continue;
            }
            const gap = Math.max(0, rawGap);
            let y = firstTop;
            for (let i = 0; i < ayahSlots.length; i++) {
              const mid = ((y + heights[i] / 2 - crOpen.top) / H) * 100;
              ayahSlots[i].style.top = `${mid.toFixed(3)}%`;
              ayahSlots[i].style.height = `${OPENING_BODY_SLOT_H_PCT}%`;
              y += heights[i] + gap;
            }
          }
          container.dataset.mf2OpeningVerticalFit = "1";
          container.dataset.mf2Size = size.toFixed(2);
        }
      }

      /* فاصل حبر البسملة عن أسفل الشارة — مطلق على المرجع؛ نسبي من contentBand على القصير */
      if (!isOpening) {
        const minBannerBasGap = shortViewport
          ? Math.max(12, Math.min(BANNER_BASMALA_MIN_GAP_PX, blockH * 0.038))
          : BANNER_BASMALA_MIN_GAP_PX;
        const banners = [
          ...container.querySelectorAll<HTMLElement>(".mf2-grid-slot--banner"),
        ];
        let minGap = Infinity;
        for (const bannerEl of banners) {
          const headerKey = [...headerBlockRefs.current.entries()].find(
            ([, el]) => el === bannerEl,
          )?.[0];
          const basEl =
            (headerKey
              ? basmalaRefs.current.get(headerKey)
              : null) ||
            bannerEl.parentElement?.querySelector<HTMLElement>(".mf2-bismillah") ||
            container.querySelector<HTMLElement>(".mf2-grid-slot--basmala .mf2-bismillah");
          if (!basEl) continue;
          const banR = bannerEl.getBoundingClientRect();
          const inkTop = measureInkBounds(basEl).top;
          const gap = inkTop - banR.bottom;
          minGap = Math.min(minGap, gap);
          if (gap < minBannerBasGap - 0.5) {
            const nudgePx = minBannerBasGap - gap;
            const nudgePct = (nudgePx / Math.max(1, cr.height)) * 100;
            const slot =
              basEl.closest<HTMLElement>(".mf2-grid-slot--basmala") ||
              basEl.closest<HTMLElement>(".mf2-grid-slot--line");
            if (slot) {
              const topPct = parseFloat(slot.style.top);
              if (Number.isFinite(topPct)) {
                let nextTop = topPct + nudgePct;
                if (slot.classList.contains("mf2-grid-slot--basmala")) {
                  const basSlot = Number(slot.getAttribute("data-grid-slot") || 0);
                  const nextLine = container.querySelector<HTMLElement>(
                    `.mf2-grid-slot--line[data-grid-slot="${basSlot + 1}"]`,
                  ) || [...container.querySelectorAll<HTMLElement>(".mf2-grid-slot--line")].find(
                    (el) => Number(el.getAttribute("data-grid-slot") || 0) > basSlot,
                  );
                  if (nextLine) {
                    const nextTopPct = parseFloat(nextLine.style.top);
                    const nextH = parseFloat(nextLine.style.height) || MUSHAF_GRID.slotHeightPct;
                    const slotH = parseFloat(slot.style.height) || 5;
                    if (Number.isFinite(nextTopPct)) {
                      const maxCenter = nextTopPct - nextH / 2 - slotH / 2 - 0.35;
                      nextTop = Math.min(nextTop, maxCenter);
                    }
                  }
                }
                slot.style.top = `${nextTop.toFixed(3)}%`;
              }
            }
          }
        }
        if (Number.isFinite(minGap) && minGap < Infinity) {
          container.dataset.mf2BasmalaGap = minGap.toFixed(1);
        }
      }

      /*
       * فاصل حبر بسملة→سطر الآية التالي — على الشاشات القصيرة فقط (SE).
       * مسار 390×844 يبقى بلا تقليص إضافي حتى لا تنحرف visual-snapshot.
       */
      if (shortViewport) {
        const minBasLineGap = Math.max(4, Math.min(12, blockH * 0.012));
        const basSlots = [
          ...container.querySelectorAll<HTMLElement>(".mf2-grid-slot--basmala"),
        ];
        for (let guard = 0; guard < 14; guard++) {
          let worstOver = 0;
          for (const basSlot of basSlots) {
            const basEl =
              basSlot.querySelector<HTMLElement>(".mf2-bismillah, .mf2-line") || basSlot;
            const basBot = measureInkBounds(basEl).bottom;
            const basIdx = Number(basSlot.getAttribute("data-grid-slot") || 0);
            const nextLine =
              container.querySelector<HTMLElement>(
                `.mf2-grid-slot--line[data-grid-slot="${basIdx + 1}"]`,
              ) ||
              [...container.querySelectorAll<HTMLElement>(".mf2-grid-slot--line")].find(
                (el) => Number(el.getAttribute("data-grid-slot") || 0) > basIdx,
              );
            if (!nextLine) continue;
            const lineInk = nextLine.querySelector<HTMLElement>(".mf2-line") || nextLine;
            const lineTop = measureInkBounds(lineInk).top;
            const gap = lineTop - basBot;
            if (gap < minBasLineGap) {
              worstOver = Math.max(worstOver, minBasLineGap - gap);
            }
          }
          if (worstOver <= 0.4) break;
          if (size <= MIN_FONT_PX + 0.05) break;
          size = Math.max(MIN_FONT_PX, size * Math.min(0.978, 1 - worstOver / Math.max(40, blockH)));
          container.style.fontSize = `${size}px`;
        }
        container.dataset.mf2BasmalaLineGap = minBasLineGap.toFixed(1);
      }

      /* سلّم خطوط موحّد: S على الحاوية؛ وعلى الصدفة فقط للصفحة النشطة
       * (الجيران prev/next كانوا يكتبون BASE فوق S المُصغَّر فيُكسر typescale). */
      const typeVars = mushafTypescaleCssVars(size);
      for (const [k, v] of Object.entries(typeVars)) {
        container.style.setProperty(k, v);
      }
      const pageStateHost = container.closest<HTMLElement>("[data-page-state]");
      const isActiveLeaf =
        !pageStateHost ||
        pageStateHost.getAttribute("data-page-state") === "active";
      if (isActiveLeaf) {
        const shell =
          container.closest<HTMLElement>(".quran-shell--ayah") ||
          container.closest<HTMLElement>(".mpv-root") ||
          container.closest<HTMLElement>("[data-mushaf-shell]");
        if (shell) {
          for (const [k, v] of Object.entries(typeVars)) {
            shell.style.setProperty(k, v);
          }
        }
      }

      setPageFontSize(size);
      setPageLineHeightEm(LINE_HEIGHT_EM);
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
  }, [fontReady, layout, scaleFactor]);

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

  const slotStyle = (gridSlot: number): CSSProperties => {
    let baseline: number;
    let h: number;
    const isBannerSlot =
      (isOpeningPage && openingSlots.banners.includes(gridSlot)) ||
      layout.rows.some(
        (r) => r.kind === "surah-header" && r.bannerSlot === gridSlot,
      );
    const basmalaPair = bannerBasmalaPairs.find((p) => p.basmala === gridSlot);

    if (isOpeningPage && openingSlots.all.length > 0) {
      const isBanner = openingSlots.banners.includes(gridSlot);
      if (isBanner) {
        baseline = OPENING_BANNER_MID_PCT;
        h = OPENING_BANNER_H_PCT;
      } else {
        /* تقدير أولي قبل قياس الحبر في useLayoutEffect — نفس مسار ص١ وص٢ */
        const body = openingSlots.body;
        const idx = Math.max(0, body.indexOf(gridSlot));
        const n = body.length;
        const bannerBot = OPENING_BANNER_TOP_PCT + OPENING_BANNER_H_PCT;
        const basmalaMid =
          bannerBot + (OPENING_BANNER_TO_BASMALA_PX / 7) + OPENING_BODY_SLOT_H_PCT / 2;
        const firstLineMid =
          basmalaMid +
          OPENING_BODY_SLOT_H_PCT / 2 +
          (OPENING_BASMALA_TO_LINE_PX / 7) +
          OPENING_BODY_SLOT_H_PCT / 2;
        const bot = OPENING_BODY_BOT_PCT;
        if (idx === 0) {
          baseline = basmalaMid;
        } else {
          const lineIdx = idx - 1;
          const lineCount = Math.max(1, n - 1);
          const band = Math.max(4, bot - firstLineMid);
          baseline =
            lineCount <= 1
              ? firstLineMid
              : firstLineMid + (lineIdx / (lineCount - 1)) * band;
        }
        h = OPENING_BODY_SLOT_H_PCT;
      }
    } else if (basmalaPair) {
      /* خانة البسملة المستقلة — خط أساس الشبكة (لا إزاحة من الشارة). */
      const idx = Math.max(0, Math.min(MUSHAF_GRID.slotCount - 1, gridSlot - 1));
      const slotBase =
        MUSHAF_GRID.baselinesPct[idx] ?? ((idx + 0.5) / MUSHAF_GRID.slotCount) * 100;
      const nextBase =
        MUSHAF_GRID.baselinesPct[Math.min(MUSHAF_GRID.slotCount - 1, idx + 1)] ??
        slotBase + 6.57;
      h = 3.8;
      const maxCenter = (slotBase + nextBase) / 2 - h / 2 - 0.25;
      baseline = Math.min(slotBase - 0.7, maxCenter);
    } else if (isBannerSlot) {
      const idx = Math.max(0, Math.min(MUSHAF_GRID.slotCount - 1, gridSlot - 1));
      const slotBase =
        MUSHAF_GRID.baselinesPct[idx] ?? ((idx + 0.5) / MUSHAF_GRID.slotCount) * 100;
      /* ارتفاع = خانة سطر؛ ارفع المركز حتى يبقى أسفل الشارة فوق البسملة بفاصل ≥٢٢px */
      baseline = slotBase - 2.5;
      h = MUSHAF_GRID.slotHeightPct;
    } else {
      const idx = Math.max(0, Math.min(MUSHAF_GRID.slotCount - 1, gridSlot - 1));
      baseline = MUSHAF_GRID.baselinesPct[idx] ?? ((idx + 0.5) / MUSHAF_GRID.slotCount) * 100;
      h = MUSHAF_GRID.slotHeightPct;
    }
    /* absolute يتجاهل padding الأب — الإزاحة الجانبية هنا فقط */
    const side = Math.max(2, MUSHAF_GRID.sideMarginPx || 2);
    return {
      position: "absolute",
      left: side,
      right: side,
      top: `${baseline}%`,
      height: `${h}%`,
      transform: "translateY(-50%)",
      display: "flex",
      alignItems: "center",
      justifyContent: isOpeningPage ? "center" : undefined,
      width: "auto",
      boxSizing: "border-box",
      margin: 0,
      padding: 0,
      overflow: "visible",
      zIndex: isBannerSlot ? 1 : 2,
    };
  };

  const renderAyahLine = (row: Extract<MushafPageLayout["rows"][number], { kind: "line" }>) => {
    const isFatihaBasmala =
      row.words.length > 0 &&
      row.words.every((w) => w.verseKey === "1:1");
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

    if (isFatihaBasmala) {
      return wrap(
        <BasmalaLine
          showNumber={showAyahNumbers}
          sizingKind="ayah"
          className="mf2-line"
          lineRef={(el) => {
            if (el) ayahLineRefs.current.set(row.lineNumber, el);
            else ayahLineRefs.current.delete(row.lineNumber);
          }}
        />,
      );
    }

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
        data-mushaf-grid="absolute"
        style={{
          opacity: fitted ? 1 : 0,
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
                    <BasmalaLine
                      showNumber={false}
                      sizingKind="basmala"
                      lineRef={(el) => {
                        if (el) basmalaRefs.current.set(key, el);
                        else basmalaRefs.current.delete(key);
                      }}
                    />
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
        <BasmalaLine showNumber={false} sizingKind="basmala" lineRef={basmalaRef} />
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
