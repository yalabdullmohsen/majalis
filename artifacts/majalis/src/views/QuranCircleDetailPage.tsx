import { useEffect, useState } from "react";
import { Loading, Empty } from "@/components/ui-common";
import { ContentDetailLayout, RelatedLinks } from "@/components/platform/ContentDetailLayout";
import { getQuranCircleById, getRelatedQuranCircles } from "@/lib/quran-circles-mutoon-service";
import { enrollInQuranCircle, getUserQuranCircleEnrollment, rateQuranCircle } from "@/lib/progress-tracking-service";
import { useAuth } from "@/components/AuthProvider";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";

export default function QuranCircleDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    getQuranCircleById(params.id)
      .then(({ data }) => {
        setItem(data);
        if (data) return Promise.all([getRelatedQuranCircles(data.id), getUserQuranCircleEnrollment(data.id)]);
        return undefined;
      })
      .then((result) => {
        if (result) {
          setRelated(result[0]);
          setEnrollment(result[1].data);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  usePageView("quran-circles", params.id);

  useEffect(() => {
    if (!item) return;
    const path = `/quran-circles/${item.slug || item.id}`;
    applyPageSeo({
      path,
      title: `${item.title} | حلقات القرآن — المجلس العلمي`,
      description: item.summary || item.title,
      keywords: [...(item.keywords || []), item.circle_type, "حلقات قرآن", "تجويد", "حفظ"],
      ogType: "website",
      canonicalPath: path,
      jsonLd: [
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "حلقات القرآن", path: "/quran-circles" },
          { name: item.title, path },
        ]),
      ],
    });
  }, [item]);

  const handleEnroll = async () => {
    if (!item) return;
    setEnrolling(true);
    const { data } = await enrollInQuranCircle(item.id);
    if (data) setEnrollment(data);
    setEnrolling(false);
  };

  if (loading) return <Loading />;
  if (!item) return <Empty text="الحلقة غير موجودة." />;

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "حلقات القرآن", href: "/quran-circles" },
        { label: item.title },
      ]}
      title={item.title}
      subtitle={item.summary}
      meta={[item.sheikh_name, item.mosque, item.city, item.day_of_week, item.circle_time].filter(Boolean).join(" · ")}
      tags={[item.circle_type]}
      body={item.body}
      copyText={[item.title, item.summary, item.body].filter(Boolean).join("\n\n")}
      related={
        related.length > 0 ? (
          <RelatedLinks items={related.map((r) => ({ href: `/quran-circles/${r.slug || r.id}`, title: r.title, meta: r.circle_type }))} />
        ) : undefined
      }
    >
      <div className="content-detail-actions">
        {item.registration_url && (
          <a href={item.registration_url} className="btn-primary" target="_blank" rel="noopener noreferrer">
            التسجيل
          </a>
        )}
        {user && !enrollment && (
          <button type="button" className="btn-secondary" onClick={handleEnroll} disabled={enrolling}>
            {enrolling ? "جاري التسجيل..." : "سجّل في الحلقة"}
          </button>
        )}
        {enrollment && (
          <span className="content-detail-badge">مسجّل — {enrollment.status}</span>
        )}
      </div>

      {enrollment && (
        <section className="content-detail-section">
          <h3>تقييم الحلقة</h3>
          <div className="rating-row">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={enrollment.rating === n ? "rating-star rating-star--active" : "rating-star"}
                onClick={() => void rateQuranCircle(item.id, n).then(() => setEnrollment({ ...enrollment, rating: n }))}
                aria-label={`${n} نجوم`}
              >
                ★
              </button>
            ))}
          </div>
        </section>
      )}
    </ContentDetailLayout>
  );
}
