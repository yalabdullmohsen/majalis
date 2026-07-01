/**
 * بيانات موسّعة للسور — قيد الإعداد.
 *
 * سيتم ملء الحقول من مصادر تفسير موثّقة ومعتمدة مثل:
 *   - تفسير السعدي المختصر (تيسير الكريم الرحمن)
 *   - التفسير الميسّر (مجمع الملك فهد)
 *
 * الحقول الفارغة تُعرض بـ "قيد الإعداد" في الواجهة.
 * لا يُنشر أي محتوى دون توثيق المصدر في حقل `source`.
 */

export type SurahExtendedMeta = {
  /** رقم السورة (1–114) */
  number: number;
  /** سبب التسمية */
  namingReason: string;
  /** المواضيع الرئيسية */
  mainThemes: string[];
  /** الدروس المستفادة */
  lessons: string[];
  /** المصدر المستخدم */
  source: string;
};

const PENDING = "قيد الإعداد";
const NO_SOURCE = "";

function pending(number: number): SurahExtendedMeta {
  return {
    number,
    namingReason: PENDING,
    mainThemes: [],
    lessons: [],
    source: NO_SOURCE,
  };
}

/**
 * بيانات السور الـ114.
 * السور التي تحمل بيانات حقيقية يجب أن تُسند لمصدر واضح.
 * السور الباقية تحمل قيمة pending() ريثما يُوثَّق محتواها.
 */
export const SURAH_EXTENDED_META: SurahExtendedMeta[] = [
  // ─── أمثلة للهيكل (لم يُملأ بعد بمحتوى من مصدر موثَّق) ───
  ...Array.from({ length: 114 }, (_, i) => pending(i + 1)),
];

/** الحصول على بيانات سورة بعينها. */
export function getSurahExtendedMeta(number: number): SurahExtendedMeta {
  return (
    SURAH_EXTENDED_META.find((s) => s.number === number) ?? pending(number)
  );
}

/** هل البيانات جاهزة (غير فارغة)؟ */
export function isSurahMetaReady(meta: SurahExtendedMeta): boolean {
  return (
    meta.namingReason !== PENDING &&
    meta.namingReason.length > 0 &&
    meta.source.length > 0
  );
}
