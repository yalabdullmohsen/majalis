import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading, Empty } from "@/components/ui-common";
import { ContentDetailLayout, RelatedLinks } from "@/components/platform/ContentDetailLayout";
import { getAnnualCourseById, getRelatedCourses } from "@/lib/platform-content-service";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";

function buildMapsEmbed(mapUrl?: string, venue?: string, city?: string) {
  if (mapUrl?.includes("google.com/maps") || mapUrl?.includes("maps.app")) {
    const query = encodeURIComponent(`${venue || ""} ${city || ""}`.trim());
    return `https://www.google.com/maps?q=${query}&output=embed`;
  }
  if (venue || city) {
    const query = encodeURIComponent(`${venue || ""} ${city || ""}`.trim());
    return `https://www.google.com/maps?q=${query}&output=embed`;
  }
  return null;
}

export default function AnnualCourseDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAnnualCourseById(params.id)
      .then(({ data }) => {
        setItem(data);
        if (data) return getRelatedCourses(data.id).then(setRelated);
        return undefined;
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  usePageView("annual-courses", params.id);

  useEffect(() => {
    if (!item) return;
    const path = `/annual-courses/${item.id}`;
    applyPageSeo({
      path,
      title: `${item.title} | الدورات العلمية — المجلس العلمي`,
      description: item.summary || item.title,
      keywords: [...(item.keywords || []), item.course_type, "دورات شرعية", "طلب العلم"],
      ogType: "website",
      canonicalPath: path,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Course",
          name: item.title,
          description: item.summary,
          provider: { "@type": "Organization", name: "المجلس العلمي" },
          inLanguage: "ar",
        },
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "الدورات العلمية", path: "/annual-courses" },
          { name: item.title, path },
        ]),
      ],
    });
  }, [item]);

  if (loading) return <Loading />;
  if (!item) return <Empty text="الدورة غير موجودة." />;

  const mapEmbed = buildMapsEmbed(item.map_url, item.venue_name, item.venue_city);
  const copyText = [item.title, item.summary, item.body].filter(Boolean).join("\n\n");

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "الدورات العلمية", href: "/annual-courses" },
        { label: item.title },
      ]}
      title={item.title}
      subtitle={item.summary}
      meta={[item.course_type, item.season, item.year].filter(Boolean).join(" · ")}
      tags={item.keywords}
      body={item.body}
      copyText={copyText}
      related={
        <RelatedLinks
          items={related.map((r) => ({
            href: `/annual-courses/${r.id}`,
            title: r.title,
            meta: r.course_type,
          }))}
        />
      }
    >
      {item.sheikh_names && item.sheikh_names.length > 0 && (
        <section className="ui-card content-detail-section">
          <h2>المشايخ</h2>
          <ul>{item.sheikh_names.map((n: string) => <li key={n}>{n}</li>)}</ul>
        </section>
      )}

      {item.mutoon && item.mutoon.length > 0 && (
        <section className="ui-card content-detail-section">
          <h2>المتون</h2>
          <ul>{item.mutoon.map((m: string) => <li key={m}>{m}</li>)}</ul>
        </section>
      )}

      {item.schedule && item.schedule.length > 0 && (
        <section className="ui-card content-detail-section">
          <h2>الجدول</h2>
          <table className="content-detail-table">
            <thead>
              <tr><th>اليوم</th><th>الوقت</th><th>الموضوع</th><th>الشيخ</th></tr>
            </thead>
            <tbody>
              {item.schedule.map((s: any, i: number) => (
                <tr key={i}>
                  <td>{s.day}</td>
                  <td>{s.time}</td>
                  <td>{s.topic}</td>
                  <td>{s.sheikh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {(item.venue_name || item.venue_city) && (
        <section className="ui-card content-detail-section">
          <h2>مكان الإقامة</h2>
          <p>{[item.venue_name, item.venue_address, item.venue_city].filter(Boolean).join(" — ")}</p>
          {mapEmbed && (
            <iframe
              title="خريطة مكان الدورة"
              src={mapEmbed}
              loading="lazy"
              style={{ width: "100%", height: "280px", border: 0, borderRadius: "0.5rem", marginTop: "1rem" }}
              allowFullScreen
            />
          )}
        </section>
      )}

      {item.registration_open && item.registration_url && (
        <section className="ui-card content-detail-section">
          <Link
            href={item.registration_url}
            style={{ display: "inline-block", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", background: "var(--emerald, #164E3C)", color: "#fff", fontWeight: 700, textDecoration: "none" }}
          >
            التسجيل في الدورة
          </Link>
        </section>
      )}
    </ContentDetailLayout>
  );
}
