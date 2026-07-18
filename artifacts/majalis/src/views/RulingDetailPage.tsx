import { useEffect, useState } from "react";
import { SkeletonPage, Empty } from "@/components/ui-common";
import { ContentDetailLayout, RelatedLinks } from "@/components/platform/ContentDetailLayout";
import { RulingDetailSections } from "@/components/rulings/RulingDetailSections";
import { getRulingById, getRelatedRulingsEncyclopedia } from "@/lib/rulings-service";
import { buildRulingRelations } from "@/lib/rulings-relations";
import type { ShariaRulingExtended } from "@/lib/rulings-types";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";
import { ScholarlyTrustBadge, type TrustData } from "@/components/ScholarlyTrustBadge";

export default function RulingDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<ShariaRulingExtended | null>(null);
  const [related, setRelated] = useState<ShariaRulingExtended[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRulingById(params.id)
      .then(({ data }) => {
        setItem(data);
        if (data) {
          return getRelatedRulingsEncyclopedia(data.id, data.category, data.subcategory).then(setRelated);
        }
        return undefined;
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  usePageView("rulings", params.id);

  useEffect(() => {
    if (loading) return;
    if (!item) {
      applyPageSeo({
        path: `/rulings/${params.id}`,
        title: "الحكم غير موجود | المجلس العلمي",
        description: "لم يُعثر على هذا الحكم الشرعي.",
        robots: "noindex, follow",
        jsonLd: [],
      });
      return;
    }
    const path = `/rulings/${item.id}`;
    applyPageSeo({
      path,
      title: `${item.title} | موسوعة الأحكام، المجلس العلمي`,
      description: item.summary || item.body?.slice(0, 160) || item.title,
      keywords: [...(item.keywords || []), item.category, item.subcategory || "", "أحكام شرعية", "فقه"],
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
  }, [item, loading, params.id]);

  if (loading) return <SkeletonPage />;
  if (!item) return <Empty text="الحكم غير موجود." />;

  const copyText = [item.title, item.summary, item.body].filter(Boolean).join("\n\n");
  const relations = buildRulingRelations(item);

  // حقول الحوكمة قد لا تكون في النوع بعد — تُقرأ من البيانات كما هي، ولا تُخترع.
  const meta = item as typeof item & {
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    content_type?: string | null;
    provenance?: string | null;
    source_url?: string | null;
  };

  const trustData: TrustData = {
    source:      item.source_origin || null,
    sourceUrl:   meta.source_url    || null,
    hadithGrade: item.hadith_grade  || null,
    verifiedBy:  meta.reviewed_by   || null,
    reviewedAt:  meta.reviewed_at   || null,
    isApproved:  item.verification_status === "approved" ? true : false,
    provenance:  meta.provenance    || null,
    publishedAt: item.published_at  || item.created_at || null,
    updatedAt:   item.updated_at    || null,
    // لا نوع مخترع: يأتي من البيانات أو لا يُعرض.
    contentType: meta.content_type  || null,
    hasKhilaf:   !!(item.scholar_opinions && item.scholar_opinions.length > 1),
  };

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "الأحكام الشرعية", href: "/rulings" },
        { label: item.category, href: `/rulings?category=${encodeURIComponent(item.category)}` },
        { label: item.title },
      ]}
      title={item.title}
      subtitle={item.summary}
      meta={[item.category, item.subcategory].filter(Boolean).join(" · ")}
      tags={item.keywords}
      body={item.body}
      copyText={copyText}
      adminEdit={{ contentType: "ruling", contentId: item.id, initialData: { title: item.title, category: item.category, subcategory: item.subcategory, content: item.body, evidence: item.evidence } }}
      related={
        <RelatedLinks
          items={related.map((r) => ({
            href: `/rulings/${r.id}`,
            title: r.title,
            meta: [r.category, r.subcategory].filter(Boolean).join(" · "),
          }))}
        />
      }
    >
      <RulingDetailSections ruling={item} relations={relations} />
      <ScholarlyTrustBadge data={trustData} />
    </ContentDetailLayout>
  );
}
