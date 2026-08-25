/**
 * اكتشاف تغيّر يوم الصلاة (حسب المنطقة الزمنية) دون setInterval إضافي —
 * يعتمد على نبضة الثانية الموحّدة ويتوقف في الخلفية.
 */
import { subscribeSecondTick } from "@/lib/second-tick";

export function calendarDayKeyInZone(
  timeZone: string,
  date = new Date(Date.now()),
): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * يستدعي `onDayChange` عند عبور منتصف الليل في المنطقة الزمنية.
 * يعيد دالة إلغاء الاشتراك.
 */
export function subscribePrayerDayRollover(
  timeZone: string,
  onDayChange: (dayKey: string) => void,
): () => void {
  let lastKey = calendarDayKeyInZone(timeZone);
  return subscribeSecondTick(() => {
    const key = calendarDayKeyInZone(timeZone);
    if (key === lastKey) return;
    lastKey = key;
    try {
      onDayChange(key);
    } catch {
      /* لا تُسقط باقي المستمعين */
    }
  });
}
