import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { SkeletonCardGrid, PageHeader } from "@/components/ui-common";
import { ShareButtons } from "@/components/ContentActions";
import {
  loadIslamicOccasions,
  sortOccasionsByUpcoming,
  type IslamicOccasionView,
} from "@/lib/islamic-occasions";
import { HijriMonthSelect } from "@/components/HijriMonthSelect";
import { getHijriMonthName, isSacredMonth } from "@/lib/hijri-utils";
import { applyPageSeo } from "@/lib/seo";

function CountdownBadge({ days }: { days: number | null | undefined }) {
  if (days == null) return <span className="occasion-detail__countdown">موسمية</span>;
  if (days === 0) return <span className="occasion-detail__countdown occasion-detail__countdown--soon">قريب</span>;
  return (
    <span className="occasion-detail__countdown">
      بعد {days.toLocaleString("ar-EG")} يوم
    </span>
  );
}

export default function OccasionsPage() {
  const [occasions, setOccasions] = useState<IslamicOccasionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState<number | "">("");

  useEffect(() => {
    applyPageSeo({
      path: "/occasions",
      title: "المناسبات الإسلامية والمواسم | المجلس العلمي",
      description: "تقويم المناسبات الإسلامية والأعياد والمواسم الدينية، رمضان وعيد الفطر وعيد الأضحى والمواسم الهجرية.",
      keywords: ["مناسبات إسلامية", "أعياد إسلامية", "رمضان", "عيد الأضحى", "المواسم الدينية"],
    });
  }, []);

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
        <div className="occasions-filter">
          <label htmlFor="occasion-month" className="occasions-filter__label">
            الشهر الهجري:
          </label>
          <HijriMonthSelect
            id="occasion-month"
            value={monthFilter}
            onChange={setMonthFilter}
            includeAll
            className="ds-input ocp-month-filter"
          />
          <span className="occasions-filter__count">
            ({filtered.length.toLocaleString("ar-EG")})
          </span>
          <span className="occasions-filter__sacred-note"><Star size={13} strokeWidth={2} aria-hidden="true" /> شهر حرام</span>
        </div>
      )}

      {loading ? (
        <SkeletonCardGrid count={6} />
      ) : filtered.length === 0 ? (
        <p className="occasions-filter__count occasions-filter__count--empty">
          لا توجد مناسبات في هذا الشهر.
        </p>
      ) : (
        <div className="occasions-list">
          {filtered.map((occasion) => (
            <article key={occasion.id} className="occasion-detail ui-card">
              <div className="occasion-detail__head">
                <h2>
                  {occasion.name}
                  <span className="occasion-detail__month-badge">
                    {getHijriMonthName(occasion.hijriMonth)}
                    {isSacredMonth(occasion.hijriMonth) ? <Star size={12} strokeWidth={2} className="occasion-detail__sacred-star" aria-label="شهر حرام" /> : null}
                  </span>
                </h2>
                <CountdownBadge days={occasion.daysRemaining} />
              </div>

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

      <div className="twh-share">
        <ShareButtons title="المناسبات الإسلامية — المجلس العلمي" url="https://majlisilm.com/occasions" />
      </div>
    </div>
  );
}
