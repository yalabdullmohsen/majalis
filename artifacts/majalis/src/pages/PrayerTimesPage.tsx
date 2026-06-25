import { PageHeader, Loading } from "@/components/ui-common";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";

export default function PrayerTimesPage() {
  const { data, countdown, loading } = usePrayerCountdown();
  const obligatory = data?.prayers.filter((p) => p.obligatory) || [];

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="العبادة"
        title="مواقيت الصلاة"
        subtitle="مواقيت الصلاة في الكويت مع عدّاد تنازلي يتحدّث كل ثانية."
      />

      {loading ? (
        <Loading />
      ) : data && countdown ? (
        <>
          <div className="prayer-status-card ui-card">
            <p className="prayer-status-card__label">الصلاة القادمة</p>
            <h2>{countdown.next?.name || "غير محدد"}</h2>
            <p className="prayer-status-card__countdown prayer-countdown-hms" aria-live="polite">
              {countdown.remainingHms}
            </p>
            {countdown.current && (
              <p className="prayer-status-card__current">الوقت الحالي: {countdown.current.name}</p>
            )}
            <p className="prayer-status-card__date">{data.date.readable || data.date.gregorian}</p>
          </div>

          <div className="prayer-times-grid">
            {obligatory.map((p) => (
              <div
                key={p.key}
                className={`prayer-time-cell ui-card${countdown.next?.key === p.key ? " is-next" : ""}`}
              >
                <span>{p.name}</span>
                <strong>{p.time}</strong>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="lessons-empty-state">تعذر تحميل المواقيت حالياً.</p>
      )}
    </div>
  );
}
