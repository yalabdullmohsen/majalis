import { Link } from "wouter";
import { RANKS } from "@/views/PrayerRanksPage";

export function HomePrayerRanks() {
  return (
    <section className="home-section" aria-labelledby="home-prayer-ranks-heading">
      <div className="home-section-head">
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
          <svg aria-hidden="true" width="17" height="17" viewBox="0 0 17 17" style={{ marginTop: "0.1rem", flexShrink: 0 }}>
            <polygon points="8.5,1 10.5,6.5 16.5,6.5 12,10 14,16 8.5,12.5 3,16 5,10 0.5,6.5 6.5,6.5" fill="#2d7a5a" opacity="0.8"/>
          </svg>
          <div>
            <p className="home-eyebrow">الصلاة</p>
            <h2 id="home-prayer-ranks-heading">مراتب الناس في الصلاة</h2>
            <p>المراتب الخمس لحضور القلب وإقامة الصلاة.</p>
          </div>
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
