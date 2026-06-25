import { useEffect, useState } from "react";
import { PageHeader, Loading } from "@/components/ui-common";
import {
  computePrayerStatus,
  fetchPrayerTimes,
  type PrayerSlot,
  type PrayerTimesPayload,
} from "@/lib/prayer-times";

export default function PrayerTimesPage() {
  const [data, setData] = useState<PrayerTimesPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrayerTimes()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const status = data ? computePrayerStatus(data.prayers) : null;
  const obligatory = data?.prayers.filter((p) => p.obligatory) || [];

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="العبادة"
        title="مواقيت الصلاة"
        subtitle="مواقيت الصلاة في الكويت مع العد التنازلي للصلاة القادمة."
      />

      {loading ? (
        <Loading />
      ) : data && status ? (
        <>
          <div className="prayer-status-card ui-card">
            <p className="prayer-status-card__label">الصلاة القادمة</p>
            <h2>{status.next?.name || "غير محدد"}</h2>
            <p className="prayer-status-card__countdown">{status.remainingLabel}</p>
            {status.current && (
              <p className="prayer-status-card__current">الوقت الحالي: {status.current.name}</p>
            )}
            <p className="prayer-status-card__date">{data.date.readable || data.date.gregorian}</p>
          </div>

          <div className="prayer-times-grid">
            {obligatory.map((p: PrayerSlot) => (
              <div
                key={p.key}
                className={`prayer-time-cell ui-card${status.next?.key === p.key ? " is-next" : ""}`}
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
