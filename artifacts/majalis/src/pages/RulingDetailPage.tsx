import { useEffect, useState } from "react";
import { Loading, Empty } from "@/components/ui-common";
import { ContentDetailLayout, RelatedLinks } from "@/components/platform/ContentDetailLayout";
import { getShariaRulingById, getRelatedRulings } from "@/lib/platform-content-service";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";

export default function RulingDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getShariaRulingById(params.id)
      .then(({ data }) => {
        setItem(data);
        if (data) return getRelatedRulings(data.id, data.category).then(setRelated);
        return undefined;
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  usePageView("rulings", params.id);

  useEffect(() => {
    if (!item) return;
    const path = `/rulings/${item.id}`;
    applyPageSeo({
      path,
      title: `${item.title} | الأحكام الشرعية — المجلس العلمي`,
      description: item.summary || item.body?.slice(0, 160) || item.title,
      keywords: [...(item.keywords || []), item.category, "أحكام شرعية", "فقه"],
      ogType: "article",
      canonicalPath: path,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: item.title,
          description: item.summary,
          inLanguage: "ar",
        },
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "الأحكام الشرعية", path: "/rulings" },
          { name: item.title, path },
        ]),
      ],
    });
  }, [item]);

  if (loading) return <Loading />;
  if (!item) return <Empty text="الحكم غير موجود." />;

  const copyText = [item.title, item.summary, item.body].filter(Boolean).join("\n\n");
  const allRefs = [...(item.evidence || []), ...(item.references || [])];

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "الأحكام الشرعية", href: "/rulings" },
        { label: item.title },
      ]}
      title={item.title}
      subtitle={item.summary}
      meta={item.category}
      tags={item.keywords}
      body={item.body}
      copyText={copyText}
      related={
        <RelatedLinks
          items={related.map((r) => ({
            href: `/rulings/${r.id}`,
            title: r.title,
            meta: r.category,
          }))}
        />
      }
    >
      {allRefs.length > 0 && (
        <section className="content-detail-evidence ui-card">
          <h2>الأدلة والمراجع</h2>
          <ul>
            {allRefs.map((ref: any, i: number) => (
              <li key={i}>
                {ref.type && <strong>{ref.type}: </strong>}
                {ref.text}
                {ref.source && <> — <em>{ref.source}</em></>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </ContentDetailLayout>
  );
}
