import { KUWAIT_PRAYER_TIMES } from "@/lib/home-content";

export function HomePrayerTimes() {
  return (
    <section className="home-section" aria-labelledby="prayer-times-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">الكويت</p>
          <h2 id="prayer-times-heading">مواقيت الصلاة في الكويت</h2>
          <p>{KUWAIT_PRAYER_TIMES.dateLabel}</p>
        </div>
      </div>
      <div className="home-prayer-grid ui-card">
        {KUWAIT_PRAYER_TIMES.times.map((item) => (
          <div key={item.name} className="home-prayer-cell">
            <span className="home-prayer-name">{item.name}</span>
            <strong className="home-prayer-time">{item.time}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
