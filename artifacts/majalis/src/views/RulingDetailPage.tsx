import { useEffect, useState } from "react";
import { SkeletonPage, Empty, ErrorState } from "@/components/ui-common";
import { ContentDetailLayout, RelatedLinks } from "@/components/platform/ContentDetailLayout";
import { RulingDetailSections } from "@/components/rulings/RulingDetailSections";
import { getRulingById, getRelatedRulingsEncyclopedia } from "@/lib/rulings-service";
import { buildRulingRelations } from "@/lib/rulings-relations";
import type { RulingRelationLink, ShariaRulingExtended } from "@/lib/rulings-types";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";
import { ScholarlyTrustBadge, type TrustData } from "@/components/ScholarlyTrustBadge";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";

export default function RulingDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<ShariaRulingExtended | null>(null);
  const [related, setRelated] = useState<ShariaRulingExtended[]>([]);
  const [relations, setRelations] = useState<RulingRelationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    getRulingById(params.id)
      .then(({ data, dbError }) => {
        if (dbError && !data) {
          setItem(null);
          setLoadError(dbError);
          return undefined;
        }
        setItem(data);
        if (data) {
          return getRelatedRulingsEncyclopedia(data.id, data.category, data.subcategory).then(setRelated);
        }
        return undefined;
      })
      .catch((err) => {
        setItem(null);
        setLoadError(String((err as Error)?.message || err));
      })
      .finally(() => setLoading(false));
  }, [params.id, retryTick]);

  usePageView("rulings", params.id);

  useEffect(() => {
    if (!item) {
      setRelations([]);
      return;
    }
    let cancelled = false;
    void buildRulingRelations(item).then((links) => {
      if (!cancelled) setRelations(links);
    });
    return () => {
      cancelled = true;
    };
  }, [item]);

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
    // params.id لا item.id: القسم الأول من هذه الدالة يقبل UUID أو slug
    // (getRulingById تجرّب كليهما)، لكن canonical يجب أن يطابق الرابط
    // الفعلي في شريط العنوان — item.id هو UUID قاعدة البيانات دومًا، فكان
    // يُحوِّل روابط slug القابلة للقراءة (?rulings/ruling-wudu-nullifiers)
    // إلى canonical بصيغة UUID مختلفة تمامًا عن الرابط المزار فعليًا —
    // ثغرة SEO حقيقية (اكتُشفت 2026-07-25 عبر فحص حي لموقع الإنتاج).
    const path = `/rulings/${params.id}`;
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
  if (loadError) {
    return (
      <ErrorState
        text="تعذّر تحميل الحكم الشرعي. يرجى المحاولة مرة أخرى."
        onRetry={() => setRetryTick((n) => n + 1)}
      />
    );
  }
  if (!item) return <Empty text="الحكم غير موجود." />;

  const copyText = [item.title, item.summary, item.body].filter(Boolean).join("\n\n");

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
      <RelatedKnowledge kind="fatwa" recordId={item.id} query={item.title} title="معرفة ذات صلة بالحكم" limit={6} />
    </ContentDetailLayout>
  );
}
