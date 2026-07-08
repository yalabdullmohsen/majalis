import { useEffect, useState } from "react";
import { Link } from "wouter";
import { SkeletonCardGrid, Empty } from "@/components/ui-common";
import { ContentDetailLayout } from "@/components/platform/ContentDetailLayout";
import { fetchLiveAutoContentBySlug, getPublishedAutoContentBySlug } from "@/lib/auto-content-service";
import { mapContentTypeToUpdateType } from "@/lib/auto-content/auto-content-utils";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";
import type { AutoImportedContent } from "@/lib/auto-content/auto-content-utils";

export default function AutoContentDetailPage({ params }: { params: { slug: string } }) {
  const [item, setItem] = useState<AutoImportedContent | null>(null);
  const [loading, setLoading] = useState(true);

  usePageView("auto-content", params.slug);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const live = await fetchLiveAutoContentBySlug(params.slug);
      if (live) {
        setItem(live);
        return;
      }
      const { data } = await getPublishedAutoContentBySlug(params.slug);
      setItem(data);
    })().finally(() => setLoading(false));
  }, [params.slug]);

  useEffect(() => {
    if (!item) return;
    const path = `/updates/auto/${item.slug}`;
    applyPageSeo({
      path,
      title: item.seo_title || `${item.title} | المستجدات — المجلس العلمي`,
      description: item.seo_description || item.summary || item.title,
      keywords: [...(item.tags || []), item.category || "", "مستجدات", "علوم شرعية"].filter(Boolean),
      ogType: "article",
      canonicalPath: path,
      jsonLd: [
        item.structured_data || {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: item.title,
          description: item.summary,
        },
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "آخر المستجدات", path: "/updates" },
          { name: item.title.slice(0, 60), path },
        ]),
      ],
    });
  }, [item]);

  if (loading) return <SkeletonCardGrid />;
  if (!item) return <Empty text="المادة غير موجودة أو لم تُعتمد بعد." />;

  const updateType = mapContentTypeToUpdateType(item.content_type);

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "آخر المستجدات", href: "/updates" },
        { label: item.title.slice(0, 50) + (item.title.length > 50 ? "…" : "") },
      ]}
      title={item.title}
      subtitle={item.summary}
      meta={[updateType, item.category, item.source_name].filter(Boolean).join(" · ")}
      tags={item.tags}
      body={item.content || item.summary || ""}
      sourceUrls={item.original_url ? [item.original_url] : undefined}
      copyText={`${item.title}\n\n${item.summary || ""}\n\n${item.content || ""}`}
      related={
        <p className="acd-detail-hint">
          <Link href="/updates">← العودة للمستجدات</Link>
        </p>
      }
    />
  );
}
