import { Link } from "wouter";
import { RANKS } from "@/views/PrayerRanksPage";

export function HomePrayerRanks() {
  return (
    <section className="home-section" aria-labelledby="home-prayer-ranks-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">الصلاة</p>
          <h2 id="home-prayer-ranks-heading">مراتب الناس في الصلاة</h2>
          <p>المراتب الخمس لحضور القلب وإقامة الصلاة.</p>
        </div>
        <Link href="/prayer-ranks" className="home-section-link">التفاصيل</Link>
      </div>

      <div className="home-prayer-ranks-list">
        {RANKS.map((rank, index) => (
          <div key={rank.title} className="home-prayer-rank-row ui-card">
            <span className="home-prayer-rank-num">{index + 1}</span>
            <div className="home-prayer-rank-body">
              <p className="home-prayer-rank-label">{rank.label}</p>
              <p className="home-prayer-rank-ruling">{rank.ruling}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HomePrayerRanks;
