import type { PrayerStats } from "@/lib/prayer-tracker";

type Props = { stats: PrayerStats };

export function PrayerLevelBar({ stats }: Props) {
  const pct = Math.min(100, Math.round((stats.pointsInLevel / stats.levelTarget) * 100));
  return (
    <section className="ui-card prayer-level-card">
      <div className="prayer-level-card__head">
        <span>المستوى {stats.level}</span>
        <strong>{stats.pointsInLevel} / {stats.levelTarget} نقطة</strong>
      </div>
      <div className="prayer-level-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="prayer-level-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="prayer-level-card__total">إجمالي النقاط: {stats.totalPoints.toLocaleString("ar-KW")}</p>
    </section>
  );
}
