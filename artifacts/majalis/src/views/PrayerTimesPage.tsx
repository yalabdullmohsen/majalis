"use client";

import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";

// ── ترجمة أسماء الصلوات ────────────────────────────────────────────────────
const PRAYER_AR: Record<string, string> = {
  Fajr:    "الفجر",
  Sunrise: "الشروق",
  Dhuhr:   "الظهر",
  Asr:     "العصر",
  Maghrib: "المغرب",
  Isha:    "العشاء",
};

// ── الصفحة ─────────────────────────────────────────────────────────────────
// منطق الحساب يظل في usePrayerCountdown — نعرض فقط العداد + الشريط السفلي
export default function PrayerTimesPage() {
  const { countdown, loading } = usePrayerCountdown();

  if (loading) {
    return (
      <div className="prayer-times-clean" dir="rtl">
        <p className="prayer-times-clean__hint">جارٍ تحميل المواقيت…</p>
      </div>
    );
  }

  if (!countdown?.next) {
    return (
      <div className="prayer-times-clean" dir="rtl">
        <p className="prayer-times-clean__hint" style={{ color: "#DC2626" }}>
          تعذّر تحميل مواقيت الصلاة — تحقق من الاتصال.
        </p>
      </div>
    );
  }

  const prayerName = PRAYER_AR[countdown.next.key] ?? countdown.next.name;

  return (
    <div className="prayer-times-clean" dir="rtl">
      <p className="prayer-times-clean__label">الصلاة القادمة</p>
      <h1 className="prayer-times-clean__name">{prayerName}</h1>
      <div
        className="prayer-times-clean__timer"
        dir="ltr"
        aria-live="polite"
        aria-atomic="true"
      >
        {countdown.remainingHms ?? "--:--:--"}
      </div>
    </div>
  );
}
