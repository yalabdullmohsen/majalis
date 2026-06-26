import { useEffect, useState } from "react";
import { Loading, PageHeader } from "@/components/ui-common";
import {
  loadIslamicOccasions,
  sortOccasionsByUpcoming,
  type IslamicOccasionView,
} from "@/lib/islamic-occasions";

export default function OccasionsPage() {
  const [occasions, setOccasions] = useState<IslamicOccasionView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadIslamicOccasions()
      .then((rows) => {
        if (active) setOccasions(sortOccasionsByUpcoming(rows));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="التذكير"
        title="المناسبات الإسلامية"
        subtitle="مناسبات معتمدة مع الأعمال المستحبة والأدلة الصحيحة."
      />

      {loading ? (
        <Loading />
      ) : (
        <div className="occasions-list">
          {occasions.map((occasion) => (
            <article key={occasion.id} className="occasion-detail ui-card">
              <header className="occasion-detail__head">
                <h2>{occasion.name}</h2>
                <span>
                  {occasion.daysRemaining != null
                    ? occasion.daysRemaining === 0
                      ? "قريب"
                      : `بعد ${occasion.daysRemaining} يوم تقريباً`
                    : "موسمية"}
                </span>
              </header>
              {occasion.nextGregorian && (
                <p className="occasion-detail__date">
                  التاريخ الميلادي التقريبي: {occasion.nextGregorian}
                </p>
              )}
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
          ))}
        </div>
      )}
    </div>
  );
}
