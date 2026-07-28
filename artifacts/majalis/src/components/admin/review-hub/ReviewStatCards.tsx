/**
 * Glance analytics — pending, daily verifications, scholars, accuracy.
 */
import type { ReviewHubMetrics } from "@/lib/admin-review-hub";
import { Activity, CheckCircle2, Hourglass, Users } from "lucide-react";

export type ReviewStatCardsProps = {
  metrics: ReviewHubMetrics;
};

export function ReviewStatCards({ metrics }: ReviewStatCardsProps) {
  const cards = [
    {
      key: "pending",
      label: "إجمالي قيد المراجعة",
      value: String(metrics.totalPending),
      Icon: Hourglass,
      tone: "gold" as const,
    },
    {
      key: "daily",
      label: "تحققات التلاوة اليوم",
      value: String(metrics.dailyRecitationVerifications),
      Icon: Activity,
      tone: "sage" as const,
    },
    {
      key: "scholars",
      label: "علماء نشطون",
      value: String(metrics.activeScholars),
      Icon: Users,
      tone: "neutral" as const,
    },
    {
      key: "accuracy",
      label: "دقة النظام",
      value: `${Math.round(metrics.systemAccuracyRate * 1000) / 10}%`,
      Icon: CheckCircle2,
      tone: "sage" as const,
    },
  ];

  return (
    <ul className="rh-stats" aria-label="مؤشرات سريعة">
      {cards.map(({ key, label, value, Icon, tone }) => (
        <li key={key} className={`rh-stats__card rh-stats__card--${tone}`}>
          <div className="rh-stats__icon" aria-hidden="true">
            <Icon size={18} strokeWidth={1.6} />
          </div>
          <div>
            <p className="rh-stats__value">{value}</p>
            <p className="rh-stats__label">{label}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default ReviewStatCards;
