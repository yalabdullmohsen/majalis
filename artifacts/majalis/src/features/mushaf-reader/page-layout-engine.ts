/**
 * Page Layout Engine — تخطيط قائم على المحتوى (Content Driven).
 * صفحات الافتتاح/المقدمة تُعبَّأ بخاناتها المملوءة فقط؛ الصفحات العادية تبقى ١٥ خانة ثابتة.
 * لا يغيّر تقسيم المصحف ولا نص الآيات — ترتيب العرض داخل الصفحة فقط.
 */

export const MUSHAF_GRID_SLOTS = 15;

export type MushafPageLayoutKind = "opening" | "lead" | "surah-start" | "normal";

/** هل الصفحة تُعبَّأ بالمحتوى بدل شبكة ١٥ الكاملة؟ */
export function isContentPackedPage(kind: MushafPageLayoutKind): boolean {
  return kind === "opening" || kind === "lead";
}

/**
 * ترتيب الخانات المعروضة:
 * - opening/lead: المملوءة فقط (تصاعديًا) — بلا خانات فارغة تسرق الارتفاع.
 * - غيرها: ١…١٥ كاملة لمنع اهتزاز التقليب.
 */
export function resolveSlotOrder(
  kind: MushafPageLayoutKind,
  filledSlotNumbers: Iterable<number>,
): number[] {
  if (!isContentPackedPage(kind)) {
    return Array.from({ length: MUSHAF_GRID_SLOTS }, (_, i) => i + 1);
  }
  const sorted = [...new Set(filledSlotNumbers)]
    .filter((n) => n >= 1 && n <= MUSHAF_GRID_SLOTS)
    .sort((a, b) => a - b);
  return sorted.length > 0 ? sorted : [1];
}

/** عدد صفوف الشبكة المعروضة — يُمرَّر إلى --nm-content-rows */
export function resolveContentRowCount(slotOrder: readonly number[]): number {
  return Math.min(MUSHAF_GRID_SLOTS, Math.max(slotOrder.length, 1));
}

/**
 * خطة خانات ص١–ص٢ بعد إزالة الزخارف:
 * الشارة من الخانة ١، البسملة ٢ إن وُجدت، ثم الأسطر تباعًا — بلا فراغ علوي محجوز للقوس.
 */
export function resolveOpeningHeaderSlots(hasVisualBasmala: boolean): {
  bannerSlot: number;
  basmalaSlot: number | null;
  lineStartSlot: number;
} {
  const bannerSlot = 1;
  const basmalaSlot = hasVisualBasmala ? 2 : null;
  const lineStartSlot = hasVisualBasmala ? 3 : 2;
  return { bannerSlot, basmalaSlot, lineStartSlot };
}
