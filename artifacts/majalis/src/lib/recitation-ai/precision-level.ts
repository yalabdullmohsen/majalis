/**
 * precision-level.ts
 * يقرّر إن كان مستوى "إتقان التجويد" (القسم 3) متاحًا فعليًا في الواجهة.
 * قاعدة صارمة: **لا يُفعَّل إلا إذا أثبت مزوّد متصل فعليًا (isAvailable())
 * قدرة `supportsTajweed`** — لا افتراض، لا محاكاة. إن لم يتوفر، تُعرض
 * رسالة صادقة بدل تعطيل صامت أو نتائج ملفَّقة (القسم 3 و14).
 */
import type { QuranASRProvider } from "./asr-provider";

export type TajweedAvailability =
  | { available: true }
  | { available: false; reason: string };

export async function checkTajweedAvailability(provider: QuranASRProvider): Promise<TajweedAvailability> {
  if (!provider.supportsTajweed) {
    return { available: false, reason: "إتقان التجويد يتطلب اتصالًا بالمحرك المتخصص" };
  }
  const ok = await provider.isAvailable();
  if (!ok) {
    return { available: false, reason: "إتقان التجويد يتطلب اتصالًا بالمحرك المتخصص" };
  }
  return { available: true };
}
