import { Fragment, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useMushafPageFont, mushafPageFontFamily } from "@/hooks/useMushafPageFont";
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
};

const ROW_COUNT_APPROX = 15;

const defaultRenderWord = (w: QpcWord) => (
  <Fragment key={w.id}>
    <span className="mf2-word">{w.glyphText}</span>
    {w.charType === "end" && w.sajdahNumber !== null && (
      <span className="mf2-sajda-badge">سجدة</span>
    )}
  </Fragment>
);

export function MushafPageV2({ layout, activeAyahKey, onAyahPress, sharedFontFamily, renderWord, bare }: Props) {
  const perPageFontReady = useMushafPageFont(sharedFontFamily ? null : (layout?.pageNumber ?? null));
  const fontReady = sharedFontFamily ? true : perPageFontReady;
  const fontFamily = sharedFontFamily ?? (layout ? mushafPageFontFamily(layout.pageNumber) : undefined);
  const wordRenderer = renderWord ?? defaultRenderWord;
  const lineRefs = useRef(new Map<number, HTMLDivElement>());
  const [lineFontSizes, setLineFontSizes] = useState<Map<number, number>>(new Map());
  const [centeredLines, setCenteredLines] = useState<Set<number>>(new Set());
  const [fitted, setFitted] = useState(false);

  // خطوط QPC V2 مصمَّمة أصلًا ليمتد كل سطر حرفيًا حتى يملأ عرض الصفحة
  // تمامًا (كما في المطبوع) — حجم خط عام واحد للصفحة كلها لا يحقق هذا أبدًا
  // (أثبتته لقطة حقيقية: أسطر أطول تفيض خارج الإطار، أخرى تترك فراغًا).
  //
  // ⚠️ التحجيم الخطي البسيط (قياس مرة، ثم currentSize×(container/natural))
  // فشل فعليًا: اختبار حي عبر 604 صفحة أظهر تقاربًا غير كامل على أسطر
  // كثيفة الكلمات (fonts Arabic معقَّدة لا تتوسَّع خطيًا تمامًا بين
  // الأحجام بسبب hinting/stem-darkening) — النتيجة كانت تفيضًا حقيقيًا
  // غير متقارب حتى بعد 8 تمريرات تصحيح، أي **كلمات قرآنية تُدفَع فعليًا
  // خارج حدود الإطار المرئي وتُقتَص بصمت** (رُصد بلقطة Playwright حقيقية
  // وبقياس getBoundingClientRect لكل كلمة — إحداثيات سالبة فعلية). هذا
  // غير مقبول إطلاقًا لنص قرآني.
  //
  // الحل: بحث ثنائي (binary search) مباشر على حجم الخط لكل سطر — يختبر
  // كل مرشَّح فعليًا بدل الاستقراء الخطي، فيتقارب بدقة تحت-بكسلية بصرف
  // النظر عن أي لا-خطية في hinting الخط (12 تكرارًا كافٍ رياضيًا ليتقارب
  // فرق أي مدى معقول إلى أقل من 0.02px).
  useLayoutEffect(() => {
    if (!fontReady || !layout) { setFitted(false); return; }
    const sizes = new Map<number, number>();
    const centered = new Set<number>();
    // ⚠️ سقف معقول لا تعسفي: صفحة الفاتحة (1) خاصة — أسطرها آية واحدة
    // قصيرة جدًا (كلمتان-ثلاث)، ومحاولة "تمديدها" عبر حجم خط ضخم (>45px)
    // حتى تملأ عرض السطر بالكامل عبر justify-content:space-between تُنتج
    // نصًا مشوَّهًا متراكبًا فعليًا (رُصد بلقطة حقيقية) — هذا ليس أسلوب
    // مصحف المدينة الحقيقي أصلًا (آيات قصيرة على صفحات خاصة لا تُمدَّد
    // لتملأ السطر، بل تُتوسَّط بحجم طبيعي). لأي سطر لا يصل طبيعيًا لعرض
    // الحاوية حتى عند هذا السقف المعقول، نُحوِّله لـjustify-content:center
    // بدل تمديده قسرًا (القسم 6.2: "نفّذه كحالة خاصة من بيانات QUL نفسها").
    const ITERATIONS = 14;

    for (const [lineNumber, el] of lineRefs.current.entries()) {
      if (!el) continue;
      const containerWidth = el.parentElement?.clientWidth ?? 0;
      if (containerWidth <= 0) continue;

      // ⚠️ إصلاح خلل رأسي حقيقي: تحديد سقف العرض وحده بلا سقف مرتبط
      // بارتفاع خانة هذا السطر الفعلي (el.clientHeight، من flex:1 ضمن 15
      // خانة) أنتج نصًا يتمدَّد رأسيًا فيتراكب مع الأسطر المجاورة (رُصد
      // بلقطة حقيقية: نص ضخم متراكب رغم عدم وجود أي فيضان أفقي مقيس).
      // النص العربي المُشكَّل يحتاج ~1.5× حجم الخط ارتفاعًا فعليًا (تشكيل
      // فوق/تحت خط الأساس) — 0.6 من ارتفاع الخانة هامش أمان معقول لذلك.
      const lineHeightAvailable = el.clientHeight || 999;
      const MAX_FONT_PX = Math.min(45, lineHeightAvailable * 0.6);

      let lo = 1;
      let hi = MAX_FONT_PX;
      el.style.fontSize = `${hi}px`;
      if (el.scrollWidth <= containerWidth) {
        // لا يملأ العرض حتى عند السقف المعقول — سطر قصير طبيعيًا (صفحة
        // خاصة)، يُتوسَّط بدل تمديده.
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
      // lo مضمون رياضيًا أنه لا يفيض (آخر قيمة نجحت في الاختبار) — لا
      // حاجة لأي هامش أمان إضافي يُضحّي بدقة المطابقة لحدود الصفحة.
      el.style.fontSize = `${lo}px`;
      sizes.set(lineNumber, lo);
    }

    setLineFontSizes(sizes);
    setCenteredLines(centered);
    setFitted(true);
  }, [fontReady, layout]);

  if (!layout) {
    return <MushafPageSkeleton />;
  }

  const lines = (
    <>
      <div className="mf2-lines" style={{ opacity: fitted ? 1 : 0 }}>
        {layout.rows.map((row, idx) => {
          if (row.kind === "surah-header") {
            return <SurahHeaderBanner key={`h-${row.surah.id}-${idx}`} chapter={row.surah} spanRows={row.spanRows} />;
          }
          const fittedSize = lineFontSizes.get(row.lineNumber);
          return (
            <div
              key={`l-${row.lineNumber}`}
              ref={(el) => { if (el) lineRefs.current.set(row.lineNumber, el); else lineRefs.current.delete(row.lineNumber); }}
              className={`mf2-line${centeredLines.has(row.lineNumber) ? " mf2-line--short" : ""}`}
              style={{ fontFamily, fontSize: fittedSize ? `${fittedSize}px` : undefined }}
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
                    onClick={() => onAyahPress?.(verseKey)}
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
      {chapter.bismillahPre && <div className="mf2-bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>}
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
