import { useEffect, useState } from "react";
import { Loading, Empty } from "@/components/ui-common";
import { ContentDetailLayout, RelatedLinks } from "@/components/platform/ContentDetailLayout";
import { getFiqhDecisionById, getRelatedFiqhDecisions } from "@/lib/platform-content-service";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";

export default function FiqhCouncilDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFiqhDecisionById(params.id)
      .then(({ data }) => {
        setItem(data);
        if (data) return getRelatedFiqhDecisions(data.id, data.category).then(setRelated);
        return undefined;
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  usePageView("fiqh-council", params.id);

  useEffect(() => {
    if (!item) return;
    const path = `/fiqh-council/${item.id}`;
    applyPageSeo({
      path,
      title: `${item.title} | المجمع الفقهي — المجلس العلمي`,
      description: item.summary || item.title,
      keywords: [...(item.keywords || []), item.category, "المجمع الفقهي", "قرارات فقهية"],
      ogType: "article",
      canonicalPath: path,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: item.title,
          description: item.summary,
          datePublished: item.decision_date || item.created_at,
          inLanguage: "ar",
        },
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "المجمع الفقهي", path: "/fiqh-council" },
          { name: item.title, path },
        ]),
      ],
    });
  }, [item]);

  if (loading) return <Loading />;
  if (!item) return <Empty text="القرار غير موجود." />;

  const copyText = [item.title, item.summary, item.body].filter(Boolean).join("\n\n");

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "المجمع الفقهي", href: "/fiqh-council" },
        { label: item.title },
      ]}
      title={item.title}
      subtitle={item.summary}
      meta={[item.decision_type, item.category, item.decision_date].filter(Boolean).join(" · ")}
      tags={item.keywords}
      body={item.body}
      sourceUrls={item.source_urls}
      copyText={copyText}
      related={
        <RelatedLinks
          items={related.map((r) => ({
            href: `/fiqh-council/${r.id}`,
            title: r.title,
            meta: r.category,
          }))}
        />
      }
    >
      {item.references && item.references.length > 0 && (
        <section className="content-detail-evidence ui-card">
          <h2>الأدلة والمراجع</h2>
          <ul>
            {item.references.map((ref: any, i: number) => (
              <li key={i}>
                <strong>{ref.type || "مرجع"}:</strong> {ref.text}
                {ref.source && <> — <em>{ref.source}</em></>}
                {ref.url && (
                  <> — <a href={ref.url} target="_blank" rel="noopener noreferrer">رابط</a></>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </ContentDetailLayout>
  );
}
