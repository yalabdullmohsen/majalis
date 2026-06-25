import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading, Empty } from "@/components/ui-common";
import { ContentDetailLayout, RelatedLinks } from "@/components/platform/ContentDetailLayout";
import {
  getFiqhCouncilItemBySlug,
  getRelatedFiqhCouncilItems,
  incrementFiqhCouncilViews,
} from "@/lib/fiqh-council-service";
import {
  fiqhItemHref,
  fiqhCompareHref,
  formatFiqhItemMeta,
  FIQH_CONFIDENCE_LABELS,
  FIQH_SUMMARY_SOURCE_LABELS,
  type FiqhCouncilItem,
} from "@/lib/fiqh-council-types";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <section className="content-detail-evidence ui-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function FiqhCouncilItemDetailPage({ params }: { params: { slug: string } }) {
  const [item, setItem] = useState<FiqhCouncilItem | null>(null);
  const [related, setRelated] = useState<FiqhCouncilItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFiqhCouncilItemBySlug(params.slug)
      .then(({ data }) => {
        setItem(data);
        if (data) {
          incrementFiqhCouncilViews(data.slug);
          return getRelatedFiqhCouncilItems(data.slug, data.category).then(setRelated);
        }
        return undefined;
      })
      .finally(() => setLoading(false));
  }, [params.slug]);

  usePageView("fiqh-council", params.slug);

  useEffect(() => {
    if (!item) return;
    const path = fiqhItemHref(item.slug);
    const description = item.summary || item.title;
    applyPageSeo({
      path,
      title: `${item.title} | المجمع الفقهي — المجلس العلمي`,
      description,
      keywords: [...(item.tags || []), item.category, "المجمع الفقهي", "قرارات فقهية"],
      ogType: "article",
      canonicalPath: path,
      robots: item.status === "published" ? "index, follow" : "noindex, nofollow",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: item.title,
          description,
          datePublished: item.published_at || item.session_date || item.created_at,
          author: item.council_name
            ? { "@type": "Organization", name: item.council_name }
            : undefined,
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
  if (!item) return <Empty text="المحتوى غير موجود." />;

  const bodyText = item.content || item.ruling_text || "";
  const copyText = [item.title, item.summary, item.ruling_text, item.content]
    .filter(Boolean)
    .join("\n\n");
  const sourceUrls = item.source_url ? [item.source_url] : [];

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "المجمع الفقهي", href: "/fiqh-council" },
        { label: item.title },
      ]}
      title={item.title}
      subtitle={item.summary}
      meta={formatFiqhItemMeta(item)}
      tags={item.tags}
      body={bodyText}
      sourceUrls={sourceUrls.length ? sourceUrls : undefined}
      copyText={copyText}
      shareUrl={typeof window !== "undefined" ? window.location.href : undefined}
      related={
        <RelatedLinks
          items={related.map((r) => ({
            href: fiqhItemHref(r.slug),
            title: r.title,
            meta: r.category,
          }))}
        />
      }
    >
      {item.views_count != null && item.views_count > 0 && (
        <p className="fiqh-council-views">{item.views_count.toLocaleString("ar")} مشاهدة</p>
      )}

      {(item.confidence_level || item.summary_source) && (
        <p className="fiqh-detail-trust">
          {item.confidence_level && <span>{FIQH_CONFIDENCE_LABELS[item.confidence_level]}</span>}
          {item.summary_source && <span> · {FIQH_SUMMARY_SOURCE_LABELS[item.summary_source]}</span>}
        </p>
      )}

      {item.key_points && item.key_points.length > 0 && (
        <DetailSection title="النقاط الرئيسية">
          <ul className="fiqh-key-points">
            {item.key_points.map((point, i) => <li key={i}>{point}</li>)}
          </ul>
        </DetailSection>
      )}

      {item.ruling_text && (
        <DetailSection title="الحكم / التوصية">
          <p>{item.ruling_text}</p>
        </DetailSection>
      )}

      <div className="fiqh-detail-actions">
        <Link href={fiqhCompareHref([item.slug])} className="fiqh-council-section-link">
          إضافة للمقارنة
        </Link>
      </div>

      {item.evidence && item.evidence.length > 0 && (
        <DetailSection title="الأدلة">
          <ul>
            {item.evidence.map((ref, i) => (
              <li key={i}>
                {ref.type && <strong>{ref.type}: </strong>}
                {ref.text}
                {ref.source && <> — <em>{ref.source}</em></>}
                {ref.url && (
                  <> — <a href={ref.url} target="_blank" rel="noopener noreferrer">رابط</a></>
                )}
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      {item.source_name && (
        <DetailSection title="المصدر">
          <p>
            {item.source_name}
            {item.source_url && (
              <> — <a href={item.source_url} target="_blank" rel="noopener noreferrer">الرابط الأصلي</a></>
            )}
          </p>
        </DetailSection>
      )}

      {item.council_name && item.session_number && (
        <DetailSection title="المجلس">
          <p>{item.council_name} — الجلسة {item.session_number}</p>
        </DetailSection>
      )}
    </ContentDetailLayout>
  );
}
