import type { PrayerStats } from "@/lib/prayer-tracker";

type Props = { stats: PrayerStats };

export function PrayerGeneralStats({ stats }: Props) {
  const items = [
    { label: "إجمالي الصلوات", value: stats.totalPrayers },
    { label: "معدل الالتزام", value: `${stats.monthlyCommitmentPct}%` },
    { label: "أفضل شهر", value: stats.bestMonthPrayers },
    { label: "أفضل أسبوع", value: stats.bestWeekPrayers },
    { label: "متوسط المحافظة", value: `${stats.avgDailyPrayers}/يوم` },
    { label: "أيام 5/5", value: stats.fullDaysCount },
    { label: "متوسط يومي", value: stats.avgDailyPrayers },
  ];

  return (
    <section className="ui-card prayer-general-stats">
      <h3>الإحصائيات العامة</h3>
      <div className="prayer-general-stats__grid">
        {items.map(({ label, value }) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{typeof value === "number" ? value.toLocaleString("ar-KW") : value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
