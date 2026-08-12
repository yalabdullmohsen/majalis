/**
 * precision-level.ts
 * يقرّر إن كان مستوى "إتقان التجويد" (القسم 3) متاحًا فعليًا في الواجهة.
 * قاعدة صارمة: **لا يُفعَّل إلا إذا أثبت مزوّد متصل فعليًا (isAvailable())
 * قدرة `supportsTajweed`** — لا افتراض، لا محاكاة. إن لم يتوفر، تُعرض
 * رسالة صادقة بدل تعطيل صامت أو نتائج ملفَّقة (القسم 3 و14).
 *
 * التجويد الحالي = ملاحظات زمنية لمدود الكلمات من طوابع Whisper، لا تحليل
 * فونيمي. المزوّد الخادمي هو المصدر الوحيد لذلك اليوم.
 */
import type { QuranASRProvider } from "./asr-provider";
import { ServerQuranASRProvider } from "./providers/server-provider";

export type TajweedAvailability =
  | { available: true }
  | { available: false; reason: string };

export async function checkTajweedAvailability(
  provider: QuranASRProvider | null,
): Promise<TajweedAvailability> {
  if (provider?.supportsTajweed) {
    const ok = await provider.isAvailable();
    if (ok) return { available: true };
  }

  // حتى لو اختير مزوّد محلي/متصفح (حفظ فقط)، قد يكون الخادم متاحًا للتجويد.
  const server = new ServerQuranASRProvider();
  if (server.supportsTajweed && (await server.isAvailable())) {
    return { available: true };
  }

  return {
    available: false,
    reason: "إتقان التجويد يتطلب اتصالًا بالمزوّد الخادمي (طوابع زمنية لمدة المد — ليس تحليلًا فونيميًا)",
  };
}
