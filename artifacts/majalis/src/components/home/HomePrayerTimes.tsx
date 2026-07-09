import { Link } from "wouter";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";

export function HomePrayerTimes() {
  const { data, countdown, loading } = usePrayerCountdown();
  const obligatory = data?.prayers.filter((p) => p.obligatory) || [];
  const sunrise = data?.prayers.find((p) => p.key === "Sunrise") || null;

  return (
    <section className="home-section" aria-labelledby="home-prayer-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">العبادة</p>
          <h2 id="home-prayer-heading">مواقيت الصلاة</h2>
          <p>مواقيت الصلاة في الكويت مع عدّاد تنازلي حيّ.</p>
        </div>
        <Link href="/prayer-times" className="home-section-link">التفاصيل</Link>
      </div>

      {loading ? (
        <div className="home-prayer-skeleton" aria-hidden="true">
          <div className="ds-skeleton home-prayer-skel-banner" />
          <div className="home-prayer-skel-grid">
            {[1,2,3,4,5].map(i => <div key={i} className="ds-skeleton home-prayer-skel-cell" />)}
          </div>
        </div>
      ) : data && countdown ? (
        <div className="home-prayer-widget">
          <div className="prayer-status-card ui-card">
            <p className="prayer-status-card__label">الصلاة القادمة</p>
            <h3>{countdown.next?.name || "غير محدد"}</h3>
            <p className="prayer-status-card__countdown prayer-countdown-hms" aria-live="polite">
              {countdown.remainingHms}
            </p>
            {countdown.current && (
              <p className="prayer-status-card__current">الوقت الحالي: {countdown.current.name}</p>
            )}
            <p className="prayer-status-card__date">{data.date.readable || data.date.gregorian}</p>
          </div>
          <div className="home-prayer-grid">
            {obligatory.map((p) => (
              <div
                key={p.key}
                className={`prayer-time-cell ui-card${countdown.next?.key === p.key ? " is-next" : ""}`}
              >
                <span>{p.name}</span>
                <strong>{p.time}</strong>
              </div>
            ))}
            {sunrise && (
              <div className="prayer-time-cell ui-card prayer-time-cell--sunrise">
                <span>{sunrise.name}</span>
                <strong>{sunrise.time}</strong>
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="lessons-empty-state">تعذر تحميل المواقيت حالياً.</p>
      )}
    </section>
  );
}

export default HomePrayerTimes;
