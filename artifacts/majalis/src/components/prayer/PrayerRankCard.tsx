import type { PrayerRank } from "@/lib/prayer-tracker";
import type { RankMetrics30 } from "@/lib/prayer-tracker";

type Props = {
  rank: PrayerRank;
  metrics: RankMetrics30;
};

export function PrayerRankCard({ rank, metrics }: Props) {
  return (
    <section className="ui-card prayer-rank-hero" aria-label="مرتبتي في الصلاة">
      <p className="prayer-status-card__label">مرتبتي في الصلاة</p>
      <div className="prayer-rank-hero__main">
        <span className="prayer-rank-hero__emoji" aria-hidden>{rank.emoji}</span>
        <div>
          <h2>{rank.label}</h2>
          <p className="prayer-rank-hero__desc">{rank.description}</p>
        </div>
        <strong className="prayer-rank-hero__score">{rank.score}%</strong>
      </div>
      <div className="prayer-rank-hero__metrics">
        <span>{metrics.prayersDone} صلاة (30 يوم)</span>
        <span>{metrics.mosqueCount} في المسجد</span>
        <span>{metrics.firstTimeCount} أول وقت</span>
        <span>{metrics.fullDays} يوم 5/5</span>
        <span>{metrics.currentStreak} يوم متتالي</span>
      </div>
    </section>
  );
}
