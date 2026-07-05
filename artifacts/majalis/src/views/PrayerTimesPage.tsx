"use client";

import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";

const PRAYER_AR: Record<string, string> = {
  Fajr:    "الفجر",
  Sunrise: "الشروق",
  Dhuhr:   "الظهر",
  Asr:     "العصر",
  Maghrib: "المغرب",
  Isha:    "العشاء",
};

const PRAYER_ICON: Record<string, string> = {
  Fajr:    "🌙",
  Sunrise: "🌅",
  Dhuhr:   "☀️",
  Asr:     "🌤",
  Maghrib: "🌇",
  Isha:    "🌃",
};

export default function PrayerTimesPage() {
  const { data, countdown, loading } = usePrayerCountdown();

  if (loading) {
    return (
      <div className="prayer-page-wrap" dir="rtl">
        <div className="prayer-card">
          <p className="prayer-card__hint">جارٍ تحميل المواقيت…</p>
        </div>
      </div>
    );
  }

  if (!countdown?.next) {
    return (
      <div className="prayer-page-wrap" dir="rtl">
        <div className="prayer-card">
          <p className="prayer-card__hint" style={{ color: "#DC2626" }}>
            تعذّر تحميل مواقيت الصلاة — تحقق من الاتصال.
          </p>
        </div>
      </div>
    );
  }

  const { key, name, time } = countdown.next;
  const prayerName = PRAYER_AR[key] ?? name;
  const prayerIcon = PRAYER_ICON[key] ?? "🕌";

  return (
    <div className="prayer-page-wrap" dir="rtl">
      {/* بطاقة العداد */}
      <div className="prayer-card">
        <span className="prayer-card__icon" aria-hidden="true">{prayerIcon}</span>
        <p className="prayer-card__eyebrow">الصلاة القادمة</p>
        <h1 className="prayer-card__name">{prayerName}</h1>
        <p className="prayer-card__time">{time}</p>
        <div
          className="prayer-card__timer"
          dir="ltr"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`الوقت المتبقي: ${countdown.remainingHms}`}
        >
          {countdown.remainingHms ?? "--:--:--"}
        </div>
        <p className="prayer-card__hint">الوقت المتبقي</p>
      </div>

      {/* شريط مواقيت اليوم */}
      {data?.prayers && data.prayers.length > 0 && (
        <div className="prayer-today-strip" role="list" aria-label="مواقيت صلوات اليوم">
          {data.prayers.filter(p => p.time).map((p) => {
            const isNext = p.key === key;
            return (
              <div
                key={p.key}
                className={`prayer-today-item${isNext ? " prayer-today-item--active" : ""}`}
                role="listitem"
              >
                <span className="prayer-today-item__name">{PRAYER_AR[p.key] ?? p.name}</span>
                <span className="prayer-today-item__time">{p.time}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
