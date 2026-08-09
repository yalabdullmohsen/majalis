/** أحداث الأذان — ملف خفيف بلا كتالوج صوت (حتى لا يثقل حزمة الدخول). */

export const ADHAN_EVENT_NAME = "majalis:adhan";

export type AdhanEvent = {
  type: "adhan" | "advance";
  prayerKey: string;
  prayerName: string;
  minutesBefore?: number;
};
