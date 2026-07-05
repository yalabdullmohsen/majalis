import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { GeometricPattern } from "@/components/design/GeometricPattern";
import type { PrayerSlot } from "@/lib/prayer-times";

const PRAYER_AR: Record<string, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

export default function PrayerCountdownPage() {
  const { data, countdown, loading } = usePrayerCountdown();

  if (loading) {
    return (
      <div className="prayer-countdown-page" dir="rtl">
        <p style={{ color: "var(--majalis-ink-soft)" }}>جارٍ تحميل المواقيت…</p>
      </div>
    );
  }

  if (!data?.prayers?.length || !countdown) {
    return (
      <div className="prayer-countdown-page" dir="rtl">
        <p style={{ color: "var(--msk-red, #C1595A)" }}>تعذّر تحميل مواقيت الصلاة — تحقق من الاتصال.</p>
      </div>
    );
  }

  const obligatory = data.prayers.filter(
    (p: PrayerSlot) => p.obligatory || p.key === "Sunrise",
  );

  return (
    <div className="prayer-countdown-page" dir="rtl">
      {/* خلفية زخرفية هادئة */}
      <div className="prayer-countdown-page__bg">
        <GeometricPattern pattern="stars" color="var(--majalis-emerald)" opacity={1} />
      </div>

      {/* الصلاة القادمة */}
      {countdown.next && (
        <>
          <p className="prayer-countdown__next-label">الصلاة القادمة</p>
          <h1 className="prayer-countdown__next-name font-display">
            {PRAYER_AR[countdown.next.key] ?? countdown.next.key}
          </h1>
          <div className="prayer-countdown__timer" dir="ltr">
            {countdown.remainingHms ?? "--:--:--"}
          </div>
        </>
      )}

      {/* الصلاة المنقضية */}
      {countdown.previous && (
        <div className="prayer-countdown__prev">
          <span>{PRAYER_AR[countdown.previous.key] ?? countdown.previous.key}</span>
          <span style={{ opacity: 0.5 }}>انقضت</span>
        </div>
      )}

      {/* شبكة المواقيت */}
      <div className="prayer-countdown__slots">
        {obligatory.map((p: PrayerSlot) => {
          const isNext = countdown.next?.key === p.key;
          const isPrev = countdown.previous?.key === p.key;
          return (
            <div key={p.key} className={`prayer-slot-chip${isNext ? " prayer-slot-chip--next" : ""}`}
              style={isPrev && !isNext ? { opacity: 0.55 } : {}}>
              <span className="prayer-slot-chip__name">{PRAYER_AR[p.key] ?? p.key}</span>
              <span className="prayer-slot-chip__time">{p.time24}</span>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: "1.5rem", fontSize: "0.72rem", color: "var(--majalis-ink-soft)", textAlign: "center" }}>
        {data.city} · {data.source}
      </p>
    </div>
  );
}
