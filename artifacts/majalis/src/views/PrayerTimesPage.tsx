import { PageHeader, Loading } from "@/components/ui-common";
import { PrayerSectionNav } from "@/components/prayer/PrayerSectionNav";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { NextPrayerCard } from "@/components/prayer/NextPrayerCard";
import { computePrayerWindowInfo } from "@/hooks/useSmartPrayerReminders";

export default function PrayerTimesPage() {
  const { data, countdown, loading } = usePrayerCountdown();
  const windowInfo = computePrayerWindowInfo(data, countdown);
  const obligatory = data?.prayers.filter((p) => p.obligatory) || [];

  return (
    <div className="page-shell prayer-times-page">
      <PageHeader
        eyebrow="الصلاة"
        title="مواقيت الصلاة"
        subtitle="مواقيت الصلاة في الكويت مع عدّاد تنازلي يتحدّث كل ثانية."
      />

      <PrayerSectionNav />

      {loading ? (
        <Loading />
      ) : data && countdown ? (
        <>
          <NextPrayerCard data={data} countdown={countdown} windowInfo={windowInfo} />

          <div className="prayer-times-grid">
            {obligatory.map((p) => (
              <div
                key={p.key}
                className={`prayer-time-cell ui-card${countdown.next?.key === p.key ? " is-next" : ""}${countdown.current?.key === p.key ? " is-current" : ""}`}
              >
                <span>{p.name}</span>
                <strong>{p.time}</strong>
              </div>
            ))}
          </div>

          {data.prayers.find((p) => p.key === "Sunrise") && (
            <p className="prayer-times-sunrise ui-card">
              الشروق: {data.prayers.find((p) => p.key === "Sunrise")?.time}
            </p>
          )}
        </>
      ) : (
        <p className="lessons-empty-state">تعذر تحميل المواقيت حالياً.</p>
      )}
    </div>
  );
}
