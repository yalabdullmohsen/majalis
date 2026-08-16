/**
 * أداة تحويل الأرقام المركزية الوحيدة — عربي (٠١٢٣) ⇄ إنجليزي (0123).
 *
 * لا تلمس هذه الأداة أي نص مخزَّن أو محتوى ديني إطلاقًا — للعرض فقط،
 * تُستدعى وقت العرض على أرقام حقيقية (عدّادات، تواريخ، إحصاءات...)، لا
 * على نصوص القرآن أو الحديث أو أي محتوى شرعي مخزَّن.
 */

const ARABIC_INDIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const PERSIAN_INDIC_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export type NumeralSystem = "عربي" | "إنجليزي";

/** يحوّل أي أرقام إنجليزية داخل نص إلى عربية-هندية. */
export function toArabicIndicDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => ARABIC_INDIC_DIGITS[Number(d)]);
}

/** مُنسّق موحّد لأرقام واجهة «القرآن في أرقام» — عربي-هندي فقط. */
export const formatArabicNumber = toArabicIndicDigits;

/**
 * رقم صفحة المصحف للعرض — تحويل محارف مباشِر بلا toLocaleString
 * (تجنب فواصل التجميع/العشري العربية مثل «١٫١» بدل «١١»).
 */
export function toArabicPageDigits(page: number): string {
  const n = Math.max(0, Math.trunc(Number(page)) || 0);
  let out = "";
  for (const ch of String(n)) {
    const d = ch.charCodeAt(0) - 48;
    out += d >= 0 && d <= 9 ? ARABIC_INDIC_DIGITS[d] : "";
  }
  return out || ARABIC_INDIC_DIGITS[0];
}

/** يحوّل أي أرقام عربية-هندية (وممتدّة فارسية) داخل نص إلى إنجليزية (لاتينية). */
export function toLatinDigits(input: string | number): string {
  return String(input ?? "")
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_INDIC_DIGITS.indexOf(d)));
}

/**
 * ينسّق رقمًا أو نصًا يحتوي أرقامًا وفق نظام العرض المفضَّل للمستخدم.
 * الاستخدام المعتاد: formatNumerals(value, preferences.numeralSystem).
 */
export function formatNumerals(input: string | number, system: NumeralSystem): string {
  return system === "عربي" ? toArabicIndicDigits(input) : toLatinDigits(input);
}
