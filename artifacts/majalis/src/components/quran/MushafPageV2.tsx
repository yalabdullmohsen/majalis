import { Fragment, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useMushafPageFont, mushafPageFontFamily } from "@/hooks/useMushafPageFont";
import { quranFontStack } from "@/lib/quran-font-options";
import type { MushafPageLayout, QpcWord } from "@/lib/mushaf-v2-data";
import { DRAWN_BASMALA_TEXT, drawnSurahTitleText } from "@/lib/mushaf-sizing-lines";
import { MushafAyahMarkerSvg } from "@/components/quran/MushafOrnaments";
import { SurahBanner } from "@/components/quran/SurahBanner";
import { OpeningPageFrame } from "@/components/quran/OpeningPageFrame";
import { toArabicDigits } from "@/lib/utils";
import { wordKeyFromQpc } from "@/features/mushaf/ayah-word-keys";
import {
  MUSHAF_FONT_DEV_MAX,
  MUSHAF_GRID,
  MUSHAF_LAYOUT_BASELINE,
} from "@/features/mushaf/config";

/**
 * إطار صفحتي الافتتاح — النسب من ارتفاع **كتلة الصفحة** (`.mpv-body--ayah`)،
 * لا من `.mf2-lines` وحدها. القياس السابق على `.mf2-lines` أعطى ٩٪ بينما
 * الكتلة المرئية كانت ≈١٠٫٥٪ أعلى / ≈٨٩٪ أسفل؛ البوابة تتحقق من الجسم.
 */
const OPENING_FRAME_TOP_OF_BODY = 0.09; /* ٨–١٠٪ من .mpv-body--ayah */
const OPENING_FRAME_BOT_OF_BODY = 0.91; /* ٩٠–٩٢٪ من .mpv-body--ayah */
/** ارتفاع خانة الشارة (٪ من .mf2-lines) — يُحدَّث مركزها بعد قياس الإطار */
const OPENING_BANNER_H_PCT = 6.2;
/** فاصل أدنى بين أسفل الشارة وأعلى حبر البسملة (px) */
const OPENING_BASMALA_GAP_PX = 22;
/** هامش سفلي داخل الإطار قبل الضلع السفلي (٪ من الخطوط) */
const OPENING_INNER_BOT_PAD_PCT = 5.0;
const OPENING_SIDE_PAD_PX = 20;
const OPENING_BODY_SLOT_H_PCT = 7.0;
const OPENING_REF_BLOCK_H = 780;
const OPENING_GAP_PCT = (OPENING_BASMALA_GAP_PX / OPENING_REF_BLOCK_H) * 100;
const OPENING_ASCENT_PAD_PCT = (14 / OPENING_REF_BLOCK_H) * 100;
/** قيم CSS أولية قبل قياس الجسم — تُستبدل بالبكسل في measure() */
const OPENING_FRAME_TOP_PCT = OPENING_FRAME_TOP_OF_BODY * 100;
const OPENING_FRAME_BOT_PCT = OPENING_FRAME_BOT_OF_BODY * 100;
const OPENING_BODY_TOP_PCT =
  OPENING_FRAME_TOP_PCT +
  OPENING_BANNER_H_PCT / 2 +
  OPENING_GAP_PCT +
  OPENING_ASCENT_PAD_PCT;
const OPENING_BODY_BOT_PCT = OPENING_FRAME_BOT_PCT - OPENING_INNER_BOT_PAD_PCT;

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

    if (useUnicodeSafe) {
      setPageFontSize(null);
      setPageLineHeightEm(1.1);
      setFitted(true);
      return;
    }

    const container = linesContainerRef.current;
    if (!container) return;

    const LINE_HEIGHT_EM = MUSHAF_LAYOUT_BASELINE.lineHeightEm;
    const REF_PX = 100;
    const MIN_LINE_FILL = 0.98;
    const BASE_FONT = MUSHAF_LAYOUT_BASELINE.fontSizePx;
    const isOpening = layout.pageNumber === 1 || layout.pageNumber === 2;
    const noStretchLines = lastSurahEndLineNumbers(layout);
    /* صفحتا الافتتاح: آخر سطر آية في الصفحة لا يُمطّ إن قصر (مثل «المفلحون» ص٢) */
    if (isOpening) {
      let maxLn = 0;
      for (const row of layout.rows) {
        if (row.kind === "line") maxLn = Math.max(maxLn, row.lineNumber);
      }
      if (maxLn > 0) noStretchLines.add(maxLn);
    }
    const slotHPct = MUSHAF_GRID.slotHeightPct;

    const measure = () => {
      let availableWidth = container.clientWidth;
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

      /* ارتفاع الكتلة = فجوة الرأس→الذيل − حجز شريط أدوات سفلي دائم (لا يزيح عند الإظهار) */
      const headerEl = document.querySelector(".mpv-ayah-header");
      const footerEl = document.querySelector(".mpv-ayah-footer");
      const hr = headerEl?.getBoundingClientRect();
      const fr = footerEl?.getBoundingClientRect();
      /** حجز أسفل لشريط الأدوات — صفحات عادية فقط (ص١–٢ الإطار يحتاج امتداد الجسم) */
      const TOOLBAR_RESERVE_PX = isOpening ? 0 : 46;
      let blockH = container.parentElement instanceof HTMLElement
        ? container.parentElement.clientHeight
        : container.clientHeight;
      if (hr && fr && fr.top > hr.bottom) {
        blockH = Math.max(120, fr.top - hr.bottom - TOOLBAR_RESERVE_PX);
      } else if (TOOLBAR_RESERVE_PX > 0 && blockH > TOOLBAR_RESERVE_PX + 120) {
        blockH -= TOOLBAR_RESERVE_PX;
      }
      if (blockH > 0) {
        container.style.height = `${blockH.toFixed(2)}px`;
        container.style.maxHeight = `${blockH.toFixed(2)}px`;
        container.style.flexGrow = "0";
        container.style.flexShrink = "0";
        container.style.flexBasis = "auto";
      } else {
        container.style.height = "100%";
        container.style.maxHeight = "";
      }

      /* ص١–٢: عرض الملاءمة = داخل الإطار − ٢٠px من كل جهة */
      if (isOpening) {
        const frameEl = container.querySelector<HTMLElement>("[data-opening-frame]");
        const frameW = frameEl?.getBoundingClientRect().width ?? availableWidth;
        availableWidth = Math.max(80, frameW - OPENING_SIDE_PAD_PX * 2 - 14);
        container.style.setProperty("--mf2-opening-line-w", `${availableWidth.toFixed(1)}px`);
      } else {
        container.style.removeProperty("--mf2-opening-line-w");
      }

      const widestAtRef = measureWidest(sizingEls, REF_PX);
      if (widestAtRef <= 0) return false;

      let size = BASE_FONT;
      const bound = "grid-311" as const;
      const maxFont = BASE_FONT * (1 + MUSHAF_FONT_DEV_MAX);

      for (let guard = 0; guard < 12; guard++) {
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
      if (size > maxFont) size = maxFont;

      applyTempFontSize(sizingEls, "");
      for (const el of sizingEls) el.style.overflowX = "";
      container.style.fontSize = `${size}px`;
      container.style.setProperty("--mf2-lh", String(LINE_HEIGHT_EM));
      container.style.setProperty("--mf2-slot-h-pct", String(slotHPct));
      container.style.setProperty(
        "--mf2-banner-h",
        `${(container.clientHeight * (slotHPct / 100)).toFixed(2)}px`,
      );

      /* ملاءمة عرض الأسطر — يُستثنى آخر سطر سورة + البسملة (ليست ayah) في كل المصحف */
      for (const [ln, el] of ayahLineRefs.current) {
        if (!el) continue;
        if (noStretchLines.has(ln)) {
          el.style.removeProperty("--mf2-line-sx");
          el.classList.add("mf2-line--surah-end");
          el.classList.remove("mf2-line--natural");
          el.dataset.noStretch = "1";
          continue;
        }
        el.classList.remove("mf2-line--surah-end");
        el.classList.remove("mf2-line--natural");
        el.removeAttribute("data-no-stretch");
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

      blockH = container.clientHeight || blockH || 1;
      let contentTop = Infinity;
      let contentBot = -Infinity;
      for (const child of container.querySelectorAll<HTMLElement>("[data-grid-slot]")) {
        const r = child.getBoundingClientRect();
        if (r.height <= 0 && r.width <= 0) continue;
        contentTop = Math.min(contentTop, r.top);
        contentBot = Math.max(contentBot, r.bottom);
      }
      const cr = container.getBoundingClientRect();
      const spanH = Number.isFinite(contentTop) && Number.isFinite(contentBot)
        ? Math.max(0, contentBot - contentTop)
        : 0;
      const topGapRatio = Number.isFinite(contentTop)
        ? Math.max(0, contentTop - cr.top) / blockH
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

      /* ص١–٢: ثبّت الإطار على ٩٪/٩١٪ من .mpv-body--ayah ثم أعد توزيع الشارة/الجسم */
      if (isOpening) {
        const bodyEl =
          (container.closest(".mpv-body--ayah") as HTMLElement | null) ||
          (container.closest(".qs-mushaf-body--ayah") as HTMLElement | null) ||
          (container.parentElement instanceof HTMLElement ? container.parentElement : null);
        const frameEl = container.querySelector<HTMLElement>("[data-opening-frame]");
        const br = bodyEl?.getBoundingClientRect();
        const crNow = container.getBoundingClientRect();
        if (frameEl && br && br.height > 40 && crNow.height > 40) {
          const targetTop = br.top + br.height * OPENING_FRAME_TOP_OF_BODY;
          const targetBot = br.top + br.height * OPENING_FRAME_BOT_OF_BODY;
          const topPx = Math.max(0, targetTop - crNow.top);
          const botPx = Math.max(0, crNow.bottom - targetBot);
          frameEl.style.top = `${topPx.toFixed(2)}px`;
          frameEl.style.bottom = `${botPx.toFixed(2)}px`;
          const frameTopPct = (topPx / crNow.height) * 100;
          const frameBotPct = ((crNow.height - botPx) / crNow.height) * 100;
          const bodyTop =
            frameTopPct +
            OPENING_BANNER_H_PCT / 2 +
            OPENING_GAP_PCT +
            OPENING_ASCENT_PAD_PCT;
          const bodyBot = frameBotPct - OPENING_INNER_BOT_PAD_PCT;
          const bodyBand = Math.max(8, bodyBot - bodyTop);
          container.dataset.mf2FrameTopBody = (
            ((targetTop - br.top) / br.height) *
            100
          ).toFixed(2);
          container.dataset.mf2FrameBotBody = (
            ((targetBot - br.top) / br.height) *
            100
          ).toFixed(2);

          const banners = [
            ...container.querySelectorAll<HTMLElement>(".mf2-grid-slot--banner"),
          ];
          for (const ban of banners) {
            ban.style.top = `${frameTopPct.toFixed(3)}%`;
            ban.style.height = `${OPENING_BANNER_H_PCT}%`;
          }
          const bodySlots = [
            ...container.querySelectorAll<HTMLElement>(
              ".mf2-grid-slot--basmala, .mf2-grid-slot--line",
            ),
          ].sort(
            (a, b) =>
              Number(a.getAttribute("data-grid-slot") || 0) -
              Number(b.getAttribute("data-grid-slot") || 0),
          );
          const nBody = bodySlots.length;
          bodySlots.forEach((slot, idx) => {
            const baseline =
              nBody <= 1
                ? (bodyTop + bodyBot) / 2
                : bodyTop + (idx / (nBody - 1)) * bodyBand;
            const h = Math.min(
              9.5,
              Math.max(
                6.2,
                Math.min(
                  OPENING_BODY_SLOT_H_PCT,
                  (bodyBand / Math.max(1, nBody - 1)) * 0.85,
                ),
              ),
            );
            slot.style.top = `${baseline.toFixed(3)}%`;
            slot.style.height = `${h.toFixed(3)}%`;
          });
        }
      }

      /* فاصل حبر البسملة عن أسفل الشارة ≥20px — في كل مواضع بداية السورة */
      {
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
          /* ص١: البسملة آية — أول سطر بعد الشارة */
          const inkEl =
            basEl ||
            (isOpening
              ? container.querySelector<HTMLElement>(".mf2-grid-slot--line .mf2-line")
              : null);
          if (!inkEl) continue;
          const banR = bannerEl.getBoundingClientRect();
          const cs = getComputedStyle(inkEl);
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          let inkTop = inkEl.getBoundingClientRect().top;
          if (ctx) {
            ctx.font = cs.font;
            const m = ctx.measureText((inkEl.textContent || "").trim());
            const ascent =
              m.actualBoundingBoxAscent ||
              m.fontBoundingBoxAscent ||
              parseFloat(cs.fontSize) * 0.95;
            const descent =
              m.actualBoundingBoxDescent ||
              m.fontBoundingBoxDescent ||
              parseFloat(cs.fontSize) * 0.35;
            const box = inkEl.getBoundingClientRect();
            const baselineY = box.top + box.height / 2 + (ascent - descent) / 2;
            inkTop = baselineY - ascent;
          }
          const gap = inkTop - banR.bottom;
          minGap = Math.min(minGap, gap);
          if (gap < OPENING_BASMALA_GAP_PX - 0.5) {
            const nudgePx = OPENING_BASMALA_GAP_PX - gap;
            const nudgePct = (nudgePx / Math.max(1, cr.height)) * 100;
            const slot =
              inkEl.closest<HTMLElement>(".mf2-grid-slot--basmala") ||
              inkEl.closest<HTMLElement>(".mf2-grid-slot--line");
            if (slot) {
              const topPct = parseFloat(slot.style.top);
              if (Number.isFinite(topPct)) {
                slot.style.top = `${(topPct + nudgePct).toFixed(3)}%`;
              }
            }
            /* ص١–٢: إن نُقلت البسملة/أول سطر، أزح بقية أسطر الجسم بنفس المقدار */
            if (isOpening && slot?.classList.contains("mf2-grid-slot--line")) {
              let passed = false;
              for (const lineSlot of container.querySelectorAll<HTMLElement>(
                ".mf2-grid-slot--line",
              )) {
                if (lineSlot === slot) {
                  passed = true;
                  continue;
                }
                if (!passed) continue;
                const t = parseFloat(lineSlot.style.top);
                if (Number.isFinite(t)) {
                  lineSlot.style.top = `${(t + nudgePct).toFixed(3)}%`;
                }
              }
            }
          }
        }
        if (Number.isFinite(minGap) && minGap < Infinity) {
          container.dataset.mf2BasmalaGap = minGap.toFixed(1);
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

  const slotStyle = (gridSlot: number): CSSProperties => {
    let baseline: number;
    let h: number;
    const isBannerSlot =
      (isOpeningPage && openingSlots.banners.includes(gridSlot)) ||
      bannerBasmalaPairs.some((p) => p.banner === gridSlot);
    const basmalaPair = bannerBasmalaPairs.find((p) => p.basmala === gridSlot);

    if (isOpeningPage && openingSlots.all.length > 0) {
      const isBanner = openingSlots.banners.includes(gridSlot);
      if (isBanner) {
        baseline = OPENING_FRAME_TOP_PCT;
        h = OPENING_BANNER_H_PCT;
      } else {
        const body = openingSlots.body;
        const idx = Math.max(0, body.indexOf(gridSlot));
        const n = body.length;
        const top = OPENING_BODY_TOP_PCT;
        const bot = OPENING_BODY_BOT_PCT;
        const band = Math.max(8, bot - top);
        baseline =
          n <= 1 ? (top + bot) / 2 : top + (idx / (n - 1)) * band;
        h = Math.min(
          9.5,
          Math.max(6.2, Math.min(OPENING_BODY_SLOT_H_PCT, (band / Math.max(1, n - 1)) * 0.85)),
        );
      }
    } else if (basmalaPair) {
      /* بسملة تحت الشارة بفاصل حبر ≥20px دون إزاحة أسطر الآيات */
      const banBase =
        MUSHAF_GRID.baselinesPct[basmalaPair.banner - 1] ??
        ((basmalaPair.banner - 0.5) / MUSHAF_GRID.slotCount) * 100;
      const banH = 5.2;
      const basH = 5.4;
      baseline =
        banBase + banH / 2 + OPENING_GAP_PCT + OPENING_ASCENT_PAD_PCT + basH / 2;
      h = basH;
    } else if (isBannerSlot) {
      const idx = Math.max(0, Math.min(MUSHAF_GRID.slotCount - 1, gridSlot - 1));
      baseline = MUSHAF_GRID.baselinesPct[idx] ?? ((idx + 0.5) / MUSHAF_GRID.slotCount) * 100;
      h = 5.2;
    } else {
      const idx = Math.max(0, Math.min(MUSHAF_GRID.slotCount - 1, gridSlot - 1));
      baseline = MUSHAF_GRID.baselinesPct[idx] ?? ((idx + 0.5) / MUSHAF_GRID.slotCount) * 100;
      h = MUSHAF_GRID.slotHeightPct;
    }
    return {
      position: "absolute",
      left: 0,
      right: 0,
      top: `${baseline}%`,
      height: `${h}%`,
      transform: "translateY(-50%)",
      display: "flex",
      alignItems: "center",
      justifyContent: isOpeningPage ? "center" : undefined,
      width: "100%",
      boxSizing: "border-box",
      margin: 0,
      padding: 0,
      overflow: "visible",
      zIndex: isBannerSlot ? 1 : 2,
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
        {isOpeningPage ? <OpeningPageFrame /> : null}
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
