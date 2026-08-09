import { Fragment, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMushafPageFont, mushafPageFontFamily } from "@/hooks/useMushafPageFont";
import { quranFontStack } from "@/lib/quran-font-options";
import { toArabicDigits } from "@/lib/utils";
import type { MushafPageLayout, QpcWord } from "@/lib/mushaf-v2-data";
import { DRAWN_BASMALA_TEXT } from "@/lib/mushaf-sizing-lines";
import { wordKeyFromQpc } from "@/features/mushaf/ayah-word-keys";

/** يُجمِّع كلمات سطر متتالية بنفس verseKey في عنقود واحد — الوحدة
 * التفاعلية الحقيقية هي "الآية" لا الكلمة المفردة (مطابقًا لـMushafPage.tsx
 * القائم: role="button" واحد لكل آية، لا لكل حرف/كلمة). هذا ليس تجميلًا:
 * وضع role="button" على كل glyph مفرد فعليًا فعّل قاعدة إتاحة عامة موقعية
 * حقيقية (WCAG 2.5.5 — elite-2026.css:30100) تفرض min-width:44px!important
 * على أي [role="button"]، فكسرت تحجيم الأسطر تمامًا على الموبايل (رُصد
 * ودُقِّق فعليًا: تطابق حسابي تام بين عدد الكلمات×44px والفيضان المُقاس). */
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
  /** خط موحّد بديل (الوضع الخفيف) — يتخطى تحميل خط QPC الخاص بالصفحة
   * كليًا (لا طلب شبكة إضافي)، يفترض أن الخط مُحمَّل أصلًا في التطبيق.
   * افتراضيًا: خط QPC الرقمي الخاص بكل صفحة (وضع الدقة المطبعية). */
  sharedFontFamily?: string;
  /** عرض كلمة مخصَّص — الوضع الخفيف يستبدل شارة رقم الآية الافتراضية
   * (glyph من خط الصفحة) بشارة زخرفية موحّدة ونص Unicode عادي. المُعِدّ
   * مسؤول عن وضع key={w.id} على العقدة المُعادة. افتراضيًا: نفس عرض
   * وضع الدقة المطبعية (glyph الصفحة + شارة سجدة نصية). */
  renderWord?: (w: QpcWord) => ReactNode;
  /** true: يُصدَّر .mf2-lines وحدها بلا .mf2-page/.mf2-frame الخاصين بها
   * (بلا إطار/outline/خلفية/aspect-ratio مستقلة) — لاستخدام هذا المكوّن
   * متداخلاً داخل إطار صفحة قائم أصلًا (مثل .qs-mushaf-frame في
   * MushafPageView) بلا إطارين متداخلين بصريًا. المُستدعي عندها مسؤول
   * عن توفير حاوية بنسبة عرض/ارتفاع صفحة ثابتة (aspect-ratio) لتعمل
   * flex:1 الخاصة بكل سطر بشكل صحيح. */
  bare?: boolean;
  /** إظهار أرقام الآيات في مسار التراجع Unicode (فشل خط QPC أو وضع خفيف). */
  showAyahNumbers?: boolean;
  /**
   * وضع بصري فقط: بلا أزرار/ضغط على مجموعات الآيات —
   * التفاعل ينتقل لطبقة الإحداثيات (MushafHitLayer).
   */
  visualOnly?: boolean;
};

const ROW_COUNT_STANDARD = 15;

/** عرض glyph بخط الصفحة فقط — لا يُستخدم أبدًا مع Amiri/Noto.
 * نهاية الآية = محرف الزخرفة من نفس خط الصفحة بلون ذهبي (لا دائرة CSS). */
function defaultRenderWord(w: QpcWord, showAyahNumbers: boolean) {
  const wordKey = wordKeyFromQpc(w);
  if (w.charType === "end") {
    return (
      <Fragment key={w.id}>
        {showAyahNumbers ? (
          <span className="mf2-word mf2-ayah-marker" data-word-key={wordKey} aria-hidden="true">{w.glyphText}</span>
        ) : null}
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

  /**
   * تراجع تلقائي: فشل خط QPC → Unicode + Amiri بدل glyph محرَّف.
   * الوضع الخفيف الصريح (sharedFontFamily) يبقى كما هو.
   */
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

  /** أسطر الآيات المرسومة — جزء من sizingLines */
  const ayahLineRefs = useRef(new Map<number, HTMLDivElement>());
  /** عناوين السور المرسومة — جزء من sizingLines (ليست measurementExclusions) */
  const surahTitleRefs = useRef(new Map<string, HTMLElement>());
  /** البسملات المرسومة — جزء من sizingLines */
  const basmalaRefs = useRef(new Map<string, HTMLElement>());
  /** كتل الرأس (عنوان±بسملة) لقياس الارتفاع الطبيعي */
  const headerBlockRefs = useRef(new Map<string, HTMLElement>());
  const linesContainerRef = useRef<HTMLDivElement | null>(null);
  /** حجم خط موحّد للصفحة كلها (لا fit-to-width لكل سطر). */
  const [pageFontSize, setPageFontSize] = useState<number | null>(null);
  const [fitted, setFitted] = useState(false);

  /**
   * حجم واحد من أعرض sizingLine (آية / بسملة / عنوان)، لا من measurementExclusions.
   * رأسيًا: يُحسب من الارتفاع ÷ عدد الأسطر مع line-height ثابت؛ الفراغ المتبقي
   * يتمركز فوق/تحت الكتلة (CSS) ولا يُمدَّد بين الأسطر.
   */
  useLayoutEffect(() => {
    if (!fontReady || !layout) {
      setFitted(false);
      setPageFontSize(null);
      return;
    }

    if (useUnicodeSafe) {
      setPageFontSize(null);
      setFitted(true);
      return;
    }

    const container = linesContainerRef.current;
    if (!container) return;

    /** يجب أن يطابق --mf2-lh / line-height في .mf2-line (1.0–1.15). */
    const LINE_HEIGHT_EM = 1.1;
    const REF_PX = 100;
    const opening = layout.layoutMode === "opening-centered";
    const ayahCount = Math.max(1, layout.ayahLineCount);

    const measure = () => {
      const availableWidth = container.clientWidth;
      const availableHeight = container.clientHeight;
      if (availableWidth <= 0 || availableHeight <= 0) return false;

      const sizingEls = [
        ...collectSizingEls(ayahLineRefs.current),
        ...collectSizingEls(surahTitleRefs.current),
        ...collectSizingEls(basmalaRefs.current),
      ];
      if (sizingEls.length === 0) return false;

      const widestAtRef = measureWidest(sizingEls, REF_PX);
      if (widestAtRef <= 0) return false;

      const sizeByWidth = (availableWidth * REF_PX) / widestAtRef;

      // ارتفاع: طبّق حجمًا مؤقتًا ثم اطرح ارتفاعات الرؤوس الطبيعية
      let size = sizeByWidth;
      for (let iter = 0; iter < 3; iter++) {
        applyTempFontSize(sizingEls, size);
        container.style.fontSize = `${size}px`;
        let headersH = 0;
        for (const el of headerBlockRefs.current.values()) {
          if (el) headersH += el.getBoundingClientRect().height;
        }
        const ayahBudget = Math.max(0, availableHeight - headersH);
        const sizeByHeight = (ayahBudget / ayahCount) / LINE_HEIGHT_EM;
        const next = Math.min(sizeByWidth, sizeByHeight);
        if (Math.abs(next - size) < 0.05) {
          size = next;
          break;
        }
        size = next;
      }

      // تصغير متكرر حتى لا يتجاوز أي سطر مرسوم الحاوية ولو ببكسل
      // (اختلاف تلميح الخط بين المنصات قد يُبقي فائضًا بعد تمريرة واحدة)
      for (let guard = 0; guard < 10; guard++) {
        applyTempFontSize(sizingEls, size);
        container.style.fontSize = `${size}px`;
        let widestAtSize = 0;
        for (const el of sizingEls) {
          el.style.overflowX = "visible";
          widestAtSize = Math.max(widestAtSize, el.scrollWidth);
        }
        if (widestAtSize <= availableWidth) break;
        size *= (availableWidth / widestAtSize) * (opening ? 0.98 : 0.992);
      }

      applyTempFontSize(sizingEls, "");
      for (const el of sizingEls) el.style.overflowX = "";
      /* أبقِ الحجم على الحاوية — مسحه بـ"" بعد commit React يزيل font-size
         من الـDOM دون إعادة تطبيق (ResizeObserver يعيد measure كثيرًا). */
      container.style.fontSize = `${size}px`;

      setPageFontSize(size);
      setFitted(true);
      return true;
    };

    if (!measure()) {
      const raf = requestAnimationFrame(() => { measure(); });
      return () => cancelAnimationFrame(raf);
    }

    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => { measure(); })
      : null;
    ro?.observe(container);
    return () => ro?.disconnect();
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
  ].filter(Boolean).join(" ");

  const lines = (
    <>
      <div
        ref={linesContainerRef}
        className={linesClass}
        data-sizing-lines="ayah,basmala,surah_title"
        data-measurement-exclusions="metric-only"
        style={{
          opacity: fitted ? 1 : 0,
          // حجم موحّد يورثه كل سطر مرسوم — لا تحجيم فردي ولا clamp مستقل
          fontSize: !useUnicodeSafe && pageFontSize ? `${pageFontSize}px` : undefined,
          ["--mf2-lh" as string]: !useUnicodeSafe ? "1.1" : undefined,
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
          return (
            <div
              key={`l-${row.lineNumber}`}
              ref={(el) => {
                if (el) ayahLineRefs.current.set(row.lineNumber, el);
                else ayahLineRefs.current.delete(row.lineNumber);
              }}
              className={`mf2-line${useUnicodeSafe ? " mf2-line--unicode" : ""}`}
              data-sizing-line="ayah"
              style={{ unicodeBidi: "isolate" }}
            >
              {groupWordsByAyah(row.words).map((group) => {
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
        })}
      </div>
      {!fitted && <MushafPageSkeleton overlay />}
    </>
  );

  if (bare) {
    return (
      <div dir="rtl" style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
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

/** إطار مزخرف لعنوان السورة — نفس لغة خرطوش رقم الصفحة الذهبي */
function SurahNameCartouche({
  label,
  titleRef,
}: {
  label: string;
  titleRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <div className="mf2-surah-header__frame">
      <svg
        className="mf2-surah-header__cartouche"
        viewBox="0 0 280 40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect x="36" y="4" width="208" height="32" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <rect x="40" y="8" width="200" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
        <path
          d="M36 20 C26 8, 16 10, 10 20 C16 30, 26 32, 36 20 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.05"
        />
        <path
          d="M36 20 C28 14, 20 15, 16 20 C20 25, 28 26, 36 20 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.65"
          opacity="0.7"
        />
        <circle cx="14" cy="20" r="1.4" fill="currentColor" opacity="0.9" />
        <path d="M28 12.5 L29.3 14.8 L28 17.1 L26.7 14.8 Z" fill="currentColor" opacity="0.7" />
        <path d="M28 22.9 L29.3 25.2 L28 27.5 L26.7 25.2 Z" fill="currentColor" opacity="0.7" />
        <path
          d="M244 20 C254 8, 264 10, 270 20 C264 30, 254 32, 244 20 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.05"
        />
        <path
          d="M244 20 C252 14, 260 15, 264 20 C260 25, 252 26, 244 20 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.65"
          opacity="0.7"
        />
        <circle cx="266" cy="20" r="1.4" fill="currentColor" opacity="0.9" />
        <path d="M252 12.5 L253.3 14.8 L252 17.1 L250.7 14.8 Z" fill="currentColor" opacity="0.7" />
        <path d="M252 22.9 L253.3 25.2 L252 27.5 L250.7 25.2 Z" fill="currentColor" opacity="0.7" />
        <path d="M140 1 L141.4 2.9 L140 4.8 L138.6 2.9 Z" fill="currentColor" opacity="0.75" />
        <path d="M140 35.2 L141.4 37.1 L140 39 L138.6 37.1 Z" fill="currentColor" opacity="0.75" />
      </svg>
      <span
        className="mf2-surah-header__name"
        data-sizing-line="surah_title"
        ref={titleRef}
      >
        سُورَةُ {label}
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
  /** @deprecated لم يعد يُستخدم للـflex — الرأس بارتفاع طبيعي */
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
      <SurahNameCartouche label={chapter.nameArabic} titleRef={titleRef} />
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
