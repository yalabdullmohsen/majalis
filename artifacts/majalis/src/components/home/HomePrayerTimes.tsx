import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import {
  computePrayerStatus,
  fetchPrayerTimes,
  type PrayerTimesPayload,
} from "@/lib/prayer-times";

export function HomePrayerTimes() {
  const [data, setData] = useState<PrayerTimesPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrayerTimes()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const status = data ? computePrayerStatus(data.prayers) : null;
  const obligatory = data?.prayers.filter((p) => p.obligatory) || [];

  return (
    <section className="home-section" aria-labelledby="home-prayer-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">العبادة</p>
          <h2 id="home-prayer-heading">مواقيت الصلاة</h2>
          <p>مواقيت الصلاة في الكويت مع العد التنازلي للصلاة القادمة.</p>
        </div>
        <Link href="/prayer-times" className="home-section-link">التفاصيل</Link>
      </div>

      {loading ? (
        <Loading />
      ) : data && status ? (
        <div className="home-prayer-widget">
          <div className="prayer-status-card ui-card">
            <p className="prayer-status-card__label">الصلاة القادمة</p>
            <h3>{status.next?.name || "غير محدد"}</h3>
            <p className="prayer-status-card__countdown">{status.remainingLabel}</p>
            <p className="prayer-status-card__date">{data.date.readable || data.date.gregorian}</p>
          </div>
          <div className="home-prayer-grid">
            {obligatory.map((p) => (
              <div
                key={p.key}
                className={`prayer-time-cell ui-card${status.next?.key === p.key ? " is-next" : ""}`}
              >
                <span>{p.name}</span>
                <strong>{p.time}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="lessons-empty-state">تعذر تحميل المواقيت حالياً.</p>
      )}
    </section>
  );
}

export default HomePrayerTimes;
