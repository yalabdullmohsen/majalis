/** أحداث الأذان — ملف خفيف بلا كتالوج صوت (حتى لا يثقل حزمة الدخول). */

export const ADHAN_EVENT_NAME = "majalis:adhan";

export type AdhanEvent = {
  type: "adhan" | "advance" | "iqamah";
  prayerKey: string;
  prayerName: string;
  minutesBefore?: number;
  /** دقائق بعد الأذان لتنبيه الإقامة */
  minutesAfterAdhan?: number;
  /** مدينة/موقع العرض في الإشعار — اختياري */
  cityName?: string;
  /** وقت الصلاة المعروض في النص (١٢ ساعة) — لكشف أي انحراف */
  prayerTimeLabel?: string;
};
