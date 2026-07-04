import { useEffect, useMemo, useState } from "react";
import { Loading, PageHeader } from "@/components/ui-common";
import {
  loadIslamicOccasions,
  sortOccasionsByUpcoming,
  type IslamicOccasionView,
} from "@/lib/islamic-occasions";
import { HijriMonthSelect } from "@/components/HijriMonthSelect";
import { getHijriMonthName, isSacredMonth } from "@/lib/hijri-utils";

export default function OccasionsPage() {
  const [occasions, setOccasions] = useState<IslamicOccasionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState<number | "">("");

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

  const filtered = useMemo(
    () => (monthFilter === "" ? occasions : occasions.filter((o) => o.hijriMonth === monthFilter)),
    [occasions, monthFilter],
  );

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="التذكير"
        title="المناسبات الإسلامية"
        subtitle="مناسبات معتمدة مع الأعمال المستحبة والأدلة الصحيحة."
      />

      {!loading && (
        <div className="occasions-filter" style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <label htmlFor="occasion-month" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--majalis-ink-soft)" }}>
            الشهر الهجري:
          </label>
          <HijriMonthSelect
            id="occasion-month"
            value={monthFilter}
            onChange={setMonthFilter}
            includeAll
            className="ds-input"
            style={{ maxWidth: "16rem" }}
          />
          <span style={{ fontSize: "0.8rem", color: "var(--majalis-ink-soft)" }}>
            ({filtered.length.toLocaleString("ar-EG")})
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--majalis-brass-deep)" }}>⭐ شهر حرام</span>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <p style={{ color: "var(--majalis-ink-soft)", padding: "1rem 0" }}>لا توجد مناسبات في هذا الشهر.</p>
      ) : (
        <div className="occasions-list">
          {filtered.map((occasion) => (
            <article key={occasion.id} className="occasion-detail ui-card">
              <header className="occasion-detail__head">
                <h2>
                  {occasion.name}
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--majalis-brass-deep)", marginInlineStart: "0.5rem" }}>
                    {getHijriMonthName(occasion.hijriMonth)}
                    {isSacredMonth(occasion.hijriMonth) ? " ⭐" : ""}
                  </span>
                </h2>
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
