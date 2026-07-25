/**
 * أداة تحويل الأرقام المركزية الوحيدة — عربي (٠١٢٣) ⇄ إنجليزي (0123).
 *
 * لا تلمس هذه الأداة أي نص مخزَّن أو محتوى ديني إطلاقًا — للعرض فقط،
 * تُستدعى وقت العرض على أرقام حقيقية (عدّادات، تواريخ، إحصاءات...)، لا
 * على نصوص القرآن أو الحديث أو أي محتوى شرعي مخزَّن.
 */

const ARABIC_INDIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export type NumeralSystem = "عربي" | "إنجليزي";

/** يحوّل أي أرقام إنجليزية داخل نص إلى عربية-هندية. */
export function toArabicIndicDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => ARABIC_INDIC_DIGITS[Number(d)]);
}

/** يحوّل أي أرقام عربية-هندية داخل نص إلى إنجليزية (لاتينية). */
export function toLatinDigits(input: string | number): string {
  return String(input).replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)));
}

/**
 * ينسّق رقمًا أو نصًا يحتوي أرقامًا وفق نظام العرض المفضَّل للمستخدم.
 * الاستخدام المعتاد: formatNumerals(value, preferences.numeralSystem).
 */
export function formatNumerals(input: string | number, system: NumeralSystem): string {
  return system === "عربي" ? toArabicIndicDigits(input) : toLatinDigits(input);
}
