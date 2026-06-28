import type { PrayerStats } from "@/lib/prayer-tracker";
import { PRAYER_LABELS } from "@/lib/prayer-tracker";

type Props = { stats: PrayerStats };

const CARDS: { key: keyof PrayerStats | "best"; label: string; fmt?: (s: PrayerStats) => string }[] = [
  { key: "todayDone", label: "صلوات اليوم" },
  { key: "weekDone", label: "هذا الأسبوع" },
  { key: "monthDone", label: "هذا الشهر" },
  { key: "fajrCount", label: "صلوات الفجر" },
  { key: "totalCongregation", label: "الجماعات" },
  { key: "totalMosque", label: "في المسجد" },
  { key: "totalHome", label: "في البيت" },
  {
    key: "best",
    label: "أفضل صلاة",
    fmt: (s) => (s.bestPrayerKey ? PRAYER_LABELS[s.bestPrayerKey] : "—"),
  },
  { key: "longestStreak", label: "أطول سلسلة" },
  { key: "totalPoints", label: "إجمالي النقاط" },
];

export function PrayerStatsGrid({ stats }: Props) {
  return (
    <section className="prayer-stats-grid" aria-label="إحصائيات الصلاة">
      {CARDS.map(({ key, label, fmt }) => {
        const raw = fmt ? fmt(stats) : stats[key as keyof PrayerStats];
        const value = typeof raw === "number" ? raw.toLocaleString("ar-KW") : String(raw ?? 0);
        return (
          <article key={label} className="ui-card prayer-stat-card">
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        );
      })}
    </section>
  );
}
