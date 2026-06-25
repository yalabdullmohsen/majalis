import { PageHeader } from "@/components/ui-common";
import {
  daysUntilOccasion,
  estimateHijriDate,
  ISLAMIC_OCCASIONS,
} from "@/lib/islamic-occasions-seed";

export default function OccasionsPage() {
  const today = estimateHijriDate();

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="التذكير"
        title="المناسبات الإسلامية"
        subtitle="مناسبات معتمدة مع الأعمال المستحبة والأدلة الصحيحة."
      />

      <div className="occasions-list">
        {ISLAMIC_OCCASIONS.map((occasion) => {
          const remaining = daysUntilOccasion(occasion, today);
          return (
            <article key={occasion.id} className="occasion-detail ui-card">
              <header className="occasion-detail__head">
                <h2>{occasion.name}</h2>
                <span>
                  {remaining != null
                    ? remaining === 0
                      ? "قريب"
                      : `بعد ${remaining} يوم تقريباً`
                    : "موسمية"}
                </span>
              </header>
              <p>{occasion.summary}</p>
              <h3>الأعمال المستحبة</h3>
              <ul>
                {occasion.deeds.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <p className="occasion-evidence">
                <strong>الدليل:</strong> {occasion.evidence}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
