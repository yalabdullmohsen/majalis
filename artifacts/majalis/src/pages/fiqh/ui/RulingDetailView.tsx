import { useEffect, useState } from "react";
import { SkeletonPage, ErrorState } from "@/components/ui-common";
import { ContentDetailLayout, RelatedLinks } from "@/components/platform/ContentDetailLayout";
import { RulingDetailSections } from "@/components/rulings/RulingDetailSections";
import { resolveRulingByIdentifier, getRelatedRulingsEncyclopedia } from "@/lib/rulings-service";
import { buildRulingRelations } from "@/lib/rulings-relations";
import type { RulingRelationLink, ShariaRulingExtended } from "@/lib/rulings-types";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";
import { ScholarlyTrustBadge, type TrustData } from "@/components/ScholarlyTrustBadge";
import { ContentTrustBox } from "@/components/content-trust/ContentTrustBox";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { GraphRelatedRail } from "@/widgets/RelatedRail";
import NotFound from "@/views/not-found";
import type { RulingResolveStatus } from "@/lib/rulings-resolver";

export default function RulingDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<ShariaRulingExtended | null>(null);
  const [resolveStatus, setResolveStatus] = useState<RulingResolveStatus | null>(null);
  const [related, setRelated] = useState<ShariaRulingExtended[]>([]);
  const [relations, setRelations] = useState<RulingRelationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    setResolveStatus(null);
    resolveRulingByIdentifier(params.id)
      .then((resolved) => {
        setResolveStatus(resolved.status);
        if (resolved.dbError && resolved.status === "notFound" && !resolved.data) {
          // خطأ شبكة مع عدم وجود بذرة محلية
          if (resolved.dbError !== "supabase_not_configured") {
            setLoadError(resolved.dbError);
            setItem(null);
            return undefined;
          }
        }
        if (resolved.status === "found" && resolved.data) {
          setItem(resolved.data);
          return getRelatedRulingsEncyclopedia(
            resolved.data.id,
            resolved.data.category,
            resolved.data.subcategory,
          ).then(setRelated);
        }
        setItem(null);
        return undefined;
      })
      .catch((err) => {
        setItem(null);
        setResolveStatus("notFound");
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
      const gone = resolveStatus === "removed";
      applyPageSeo({
        path: `/rulings/${params.id}`,
        title: gone ? "الحكم محذوف | سُنّة" : "الحكم غير موجود | سُنّة",
        description: gone ? "أُزيل هذا الحكم من الموسوعة." : "لم يُعثر على هذا الحكم الشرعي.",
        robots: "noindex, follow",
        jsonLd: [],
      });
      return;
    }
    const path = `/rulings/${params.id}`;
    const description =
      item.summary ||
      item.body?.replace(/\*\*/g, "").slice(0, 160) ||
      item.title;
    applyPageSeo({
      path,
      title: `${item.title} | موسوعة الأحكام، سُنّة`,
      description,
      keywords: [...(item.keywords || []), item.category, item.subcategory || "", "أحكام شرعية", "فقه"],
      ogType: "article",
      canonicalPath: path,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: item.title,
          description: item.summary || description,
          articleBody: item.body,
          inLanguage: "ar",
        },
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "الأحكام الشرعية", path: "/rulings" },
          { name: item.title, path },
        ]),
      ],
    });
  }, [item, loading, params.id, resolveStatus]);

  if (loading) return <SkeletonPage />;
  if (loadError) {
    return (
      <ErrorState
        text="تعذّر تحميل الحكم الشرعي. يرجى المحاولة مرة أخرى."
        onRetry={() => setRetryTick((n) => n + 1)}
      />
    );
  }
  if (!item || resolveStatus === "notFound" || resolveStatus === "invalidType" || resolveStatus === "wrongContentType") {
    return <NotFound />;
  }
  if (resolveStatus === "removed") {
    return <NotFound />;
  }

  const copyText = [item.title, item.summary, item.body].filter(Boolean).join("\n\n");

  const meta = item as typeof item & {
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    content_type?: string | null;
    provenance?: string | null;
    source_url?: string | null;
  };

  const trustData: TrustData = {
    source: item.source_origin || null,
    sourceUrl: meta.source_url || null,
    hadithGrade: item.hadith_grade || null,
    verifiedBy: meta.reviewed_by || null,
    reviewedAt: meta.reviewed_at || null,
    isApproved: item.verification_status === "approved" ? true : false,
    provenance: meta.provenance || null,
    publishedAt: item.published_at || item.created_at || null,
    updatedAt: item.updated_at || null,
    contentType: meta.content_type || null,
    hasKhilaf: !!(item.scholar_opinions && item.scholar_opinions.length > 1),
  };

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "الأحكام الشرعية", href: "/fiqh" },
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
            href: `/rulings/${r.external_key || r.id}`,
            title: r.title,
            meta: [r.category, r.subcategory].filter(Boolean).join(" · "),
          }))}
        />
      }
    >
      <RulingDetailSections ruling={item} relations={relations} />
      <ScholarlyTrustBadge data={trustData} />
      <ContentTrustBox
        contentType="فتوى / حكم"
        source={item.source_origin || undefined}
        authorOrScholar={undefined}
        disclaimer="الفتوى العامة لا تنطبق بالضرورة على كل حالة خاصة. هذه المادة للتعلم والاطلاع، ولا تغني عن سؤال أهل العلم في النوازل الخاصة."
      />
      <RelatedKnowledge kind="fatwa" recordId={item.id} query={item.title} title="معرفة ذات صلة بالحكم" limit={6} />
      <GraphRelatedRail
        kind="ruling"
        slug={String(item.external_key || item.id)}
        titleAr="من الرسم البياني"
      />
    </ContentDetailLayout>
  );
}
