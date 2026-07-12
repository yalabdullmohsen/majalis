import { useEffect, useState } from "react";
import { SkeletonPage, Empty } from "@/components/ui-common";
import { ContentDetailLayout, RelatedLinks } from "@/components/platform/ContentDetailLayout";
import { getFatwaById, getRelatedFatwas } from "@/lib/platform-content-service";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";
import { KnowledgeRelatedItems } from "@/components/knowledge/KnowledgeRelatedItems";
import { ScholarlyTrustBadge, type TrustData } from "@/components/ScholarlyTrustBadge";
import { SensitiveContentWarning } from "@/components/SensitiveContentWarning";

export default function FatwaDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFatwaById(params.id)
      .then(({ data }) => {
        setItem(data);
        if (data) return getRelatedFatwas(data.id, data.category).then(setRelated);
        return undefined;
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  usePageView("fatwa", params.id);

  useEffect(() => {
    if (!item) return;
    const path = `/fatwa/${item.id}`;
    applyPageSeo({
      path,
      title: `${item.question} | الفتاوى، المجلس العلمي`,
      description: item.summary || item.answer?.slice(0, 160) || item.question,
      keywords: [...(item.keywords || []), item.category, "فتوى", "فقه"],
      ogType: "article",
      canonicalPath: path,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "QAPage",
          mainEntity: {
            "@type": "Question",
            name: item.question,
            text: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
              upvoteCount: item.view_count || 1,
            },
          },
        },
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "الفتاوى", path: "/fatwa" },
          { name: item.question.slice(0, 60), path },
        ]),
      ],
    });
  }, [item]);

  if (loading) return <SkeletonPage />;
  if (!item) return <Empty text="الفتوى غير موجودة." />;

  const copyText = `السؤال: ${item.question}\n\nالجواب: ${item.answer}`;

  const trustData: TrustData = {
    mufti:             item.mufti_name     || null,
    author:            item.author         || null,
    source:            item.source_name    || null,
    book:              item.book_name      || null,
    volume:            item.volume         || null,
    page:              item.page_ref       || null,
    verifiedBy:        item.verified_by    || null,
    isApproved:        item.is_approved    ?? null,
    publishedAt:       item.published_at   || item.created_at || null,
    updatedAt:         item.updated_at     || null,
    contentType:       "فتوى",
    madhab:            item.madhab         || null,
    hasKhilaf:         item.has_khilaf     ?? null,
    sourceUrl:         item.source_url     || (item.source_urls?.[0]) || null,
    reportContentType: "fatwa",
    reportContentId:   item.id,
  };

  const questionText = item.question || "";

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "الفتاوى", href: "/fatwa" },
        { label: questionText.slice(0, 50) + (questionText.length > 50 ? "…" : "") },
      ]}
      title={item.question}
      subtitle={item.summary}
      meta={[item.category, item.mufti_name].filter(Boolean).join(" · ")}
      tags={item.keywords}
      body={item.answer}
      sourceUrls={item.source_urls}
      copyText={copyText}
      adminEdit={{ contentType: "fatwa", contentId: item.id, initialData: { title: item.question, question: item.question, answer: item.answer, category: item.category } }}
      related={
        <RelatedLinks
          items={related.map((r) => ({
            href: `/fatwa/${r.id}`,
            title: r.question,
            meta: r.category,
          }))}
        />
      }
    >
      {/* تنبيه المسائل الحساسة */}
      <SensitiveContentWarning
        topic={questionText}
        referralUrl="https://www.dar-alifta.org/ar/ViewFatawa"
      />

      {/* الفتوى الصوتية */}
      {item.audio_url && (item.format === "audio" || item.format === "both") && (
        <section className="content-detail-audio ui-card">
          <h2>الفتوى الصوتية</h2>
          <audio controls src={item.audio_url} className="ftd-audio">
            متصفحك لا يدعم تشغيل الصوت.
          </audio>
        </section>
      )}

      {/* بطاقة التوثيق العلمي */}
      <ScholarlyTrustBadge data={trustData} />

      <KnowledgeRelatedItems sourceType="fatwa" sourceId={String(item.id)} />
    </ContentDetailLayout>
  );
}
