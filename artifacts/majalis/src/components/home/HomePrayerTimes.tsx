import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { PRAYER_RANKS } from "@/lib/prayer-ranks-data";

export function HomePrayerTimes() {
  const { data, countdown, loading } = usePrayerCountdown();
  const obligatory = data?.prayers.filter((p) => p.obligatory) || [];

  return (
    <section className="home-section home-prayer-unified" aria-labelledby="home-prayer-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">العبادة</p>
          <h2 id="home-prayer-heading">مواقيت الصلاة</h2>
          <p>مواقيت الصلاة في الكويت مع عدّاد تنازلي ومراتب الخشوع.</p>
        </div>
        <Link href="/prayer-times" className="home-section-link">التفاصيل</Link>
      </div>

      <div className="home-prayer-unified__card ui-card">
        {loading ? (
          <Loading />
        ) : data && countdown ? (
          <div className="home-prayer-widget">
            <div className="prayer-status-card">
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
                  className={`prayer-time-cell${countdown.next?.key === p.key ? " is-next" : ""}`}
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

        <div className="home-prayer-ranks-block">
          <div className="home-prayer-ranks-block__head">
            <h3>مراتب الصلاة</h3>
            <Link href="/prayer-ranks" className="home-section-link">عرض كامل</Link>
          </div>
          <div className="home-prayer-ranks-strip">
            {PRAYER_RANKS.map((rank, index) => (
              <article key={rank.title} className="home-prayer-rank">
                <span className="home-prayer-rank__num">{index + 1}</span>
                <div>
                  <strong>{rank.label}</strong>
                  <p>{rank.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomePrayerTimes;
