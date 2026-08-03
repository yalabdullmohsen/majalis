import { Fragment, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMushafPageFont, mushafPageFontFamily } from "@/hooks/useMushafPageFont";
import { quranFontStack } from "@/lib/quran-font-options";
import { toArabicDigits } from "@/lib/utils";
import type { MushafPageLayout, QpcWord } from "@/lib/mushaf-v2-data";

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
};

const ROW_COUNT_APPROX = 15;

/** عرض glyph بخط الصفحة فقط — لا يُستخدم أبدًا مع Amiri/Noto. */
const defaultRenderWord = (w: QpcWord) => (
  <Fragment key={w.id}>
    <span className="mf2-word">{w.glyphText}</span>
    {w.charType === "end" && w.sajdahNumber !== null && (
      <span className="mf2-sajda-badge">سجدة</span>
    )}
  </Fragment>
);

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

export function MushafPageV2({
  layout,
  activeAyahKey,
  onAyahPress,
  sharedFontFamily,
  renderWord,
  bare,
  showAyahNumbers = true,
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
    return defaultRenderWord;
  }, [renderWord, pageFont.failed, useUnicodeSafe, showAyahNumbers]);

  const lineRefs = useRef(new Map<number, HTMLDivElement>());
  const [lineFontSizes, setLineFontSizes] = useState<Map<number, number>>(new Map());
  const [centeredLines, setCenteredLines] = useState<Set<number>>(new Set());
  const [fitted, setFitted] = useState(false);

  // خطوط QPC V2 مصمَّمة أصلًا ليمتد كل سطر حرفيًا حتى يملأ عرض الصفحة
  // تمامًا (كما في المطبوع) — حجم خط عام واحد للصفحة كلها لا يحقق هذا أبدًا.
  // الحل: بحث ثنائي (binary search) مباشر على حجم الخط لكل سطر.
  // في الوضع Unicode الآمن نتخطّى القياس الضيق ونعتمد CSS (justify + lh).
  useLayoutEffect(() => {
    if (!fontReady || !layout) {
      setFitted(false);
      return;
    }

    if (useUnicodeSafe) {
      setLineFontSizes(new Map());
      setCenteredLines(new Set());
      setFitted(true);
      return;
    }

    const sizes = new Map<number, number>();
    const centered = new Set<number>();
    const ITERATIONS = 14;

    for (const [lineNumber, el] of lineRefs.current.entries()) {
      if (!el) continue;
      const containerWidth = el.parentElement?.clientWidth ?? 0;
      if (containerWidth <= 0) continue;

      const lineHeightAvailable = el.clientHeight || 999;
      const MAX_FONT_PX = Math.min(45, lineHeightAvailable * 0.52);

      let lo = 1;
      let hi = MAX_FONT_PX;
      el.style.fontSize = `${hi}px`;
      if (el.scrollWidth <= containerWidth) {
        sizes.set(lineNumber, hi);
        centered.add(lineNumber);
        continue;
      }
      for (let i = 0; i < ITERATIONS; i++) {
        const mid = (lo + hi) / 2;
        el.style.fontSize = `${mid}px`;
        if (el.scrollWidth <= containerWidth) lo = mid;
        else hi = mid;
      }
      el.style.fontSize = `${lo}px`;
      sizes.set(lineNumber, lo);
    }

    setLineFontSizes(sizes);
    setCenteredLines(centered);
    setFitted(true);
  }, [fontReady, layout, useUnicodeSafe]);

  if (!layout) {
    return bare
      ? <div dir="rtl" style={{ height: "100%" }}><MushafPageSkeleton /></div>
      : <MushafPageSkeleton />;
  }

  const linesClass = useUnicodeSafe ? "mf2-lines mf2-lines--unicode" : "mf2-lines";

  const lines = (
    <>
      <div className={linesClass} style={{ opacity: fitted ? 1 : 0 }}>
        {layout.rows.map((row, idx) => {
          if (row.kind === "surah-header") {
            return <SurahHeaderBanner key={`h-${row.surah.id}-${idx}`} chapter={row.surah} spanRows={row.spanRows} />;
          }
          const fittedSize = lineFontSizes.get(row.lineNumber);
          return (
            <div
              key={`l-${row.lineNumber}`}
              ref={(el) => { if (el) lineRefs.current.set(row.lineNumber, el); else lineRefs.current.delete(row.lineNumber); }}
              className={`mf2-line${centeredLines.has(row.lineNumber) ? " mf2-line--short" : ""}${useUnicodeSafe ? " mf2-line--unicode" : ""}`}
              style={{
                // precision: اسم خط الصفحة وحده بلا Amiri/Noto في المكدس
                // (تلك الخطوط تعيد تفسير Presentation Forms فتحرّف الرسم).
                fontFamily: useUnicodeSafe
                  ? fontFamily
                  : fontFamily
                    ? `"${fontFamily}"`
                    : undefined,
                fontSize: !useUnicodeSafe && fittedSize ? `${fittedSize}px` : undefined,
                unicodeBidi: "isolate",
              }}
            >
              {groupWordsByAyah(row.words).map((group) => {
                const verseKey = group[0].verseKey;
                return (
                  <span
                    key={verseKey}
                    className={`mf2-ayah-group${verseKey === activeAyahKey ? " mf2-ayah-group--active" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`آية ${verseKey}`}
                    onClick={(e) => { e.stopPropagation(); onAyahPress?.(verseKey); }}
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

  if (bare) return <div dir="rtl" style={{ height: "100%" }}>{lines}</div>;

  return (
    <div className="mf2-page" dir="rtl">
      <div className="mf2-frame">{lines}</div>
    </div>
  );
}

export function SurahHeaderBanner({ chapter, spanRows }: { chapter: MushafPageLayout["surahsOnPage"][number]; spanRows: number }) {
  return (
    <div className="mf2-surah-header" style={{ flex: spanRows }}>
      <div className="mf2-surah-header__frame">
        <span className="mf2-surah-header__name">سُورَةُ {chapter.nameArabic}</span>
      </div>
      {chapter.bismillahPre && (
        <div className="mf2-bismillah" lang="ar" dir="rtl">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
      )}
    </div>
  );
}

function MushafPageSkeleton({ overlay }: { overlay?: boolean }) {
  return (
    <div className={`mf2-skeleton${overlay ? " mf2-skeleton--overlay" : ""}`} aria-hidden="true">
      {Array.from({ length: ROW_COUNT_APPROX }, (_, i) => (
        <div key={i} className="mf2-skeleton__line" />
      ))}
    </div>
  );
}
