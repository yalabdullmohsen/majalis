import { RANKS } from "@/views/PrayerRanksPage";
import { Widget } from "@/components/widgets/Widget";

const RankIcon = () => (
  <svg aria-hidden="true" width="17" height="17" viewBox="0 0 17 17" style={{ marginTop: "0.1rem", flexShrink: 0 }}>
    <polygon points="8.5,1 10.5,6.5 16.5,6.5 12,10 14,16 8.5,12.5 3,16 5,10 0.5,6.5 6.5,6.5" fill="#173D35" opacity="0.8"/>
  </svg>
);

export function HomePrayerRanks() {
  return (
    <Widget
      id="prayer-ranks"
      icon={<RankIcon />}
      eyebrow="الصلاة"
      title="مراتب الناس في الصلاة"
      description="المراتب الخمس لحضور القلب وإقامة الصلاة."
      moreHref="/prayer-ranks"
      moreLabel="التفاصيل"
      state="ready"
    >
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
    </Widget>
  );
}

export default HomePrayerRanks;
