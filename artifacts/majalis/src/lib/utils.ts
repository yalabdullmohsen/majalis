import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * يقصّ نصاً عند أقرب حد كلمة قبل الحد الأقصى بدل تقطيع الحرف الأخير من كلمة،
 * ويضيف علامة قطع "…" عند التقصير فقط.
 */
export function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(" ")
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`
}

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]

/** يحوّل رقمًا إلى أرقام هندية عربية (١٢٣...) — تُستخدَم في السياقات
 * القرآنية/الدينية (أرقام الآيات، الصفحات) حيث الأرقام اللاتينية الغربية
 * تكسر أصالة العرض وتُشعر المستخدم بأنه في موقع ويب عام لا تطبيق مصحف. */
export function toArabicDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)])
}
