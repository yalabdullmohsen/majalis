import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading, Empty } from "@/components/ui-common";
import { ContentDetailLayout, RelatedLinks } from "@/components/platform/ContentDetailLayout";
import {
  getFiqhCouncilItemBySlug,
  getRelatedFiqhCouncilItems,
  getFiqhMaterialRelations,
  incrementFiqhCouncilViews,
} from "@/lib/fiqh-council-service";
import { FiqhCitationMenu } from "@/components/fiqh-council/FiqhCitationButton";
import { FiqhExportButton } from "@/components/fiqh-council/FiqhExportButton";
import { FiqhVerifiedBadge } from "@/components/fiqh-council/FiqhVerifiedBadge";
import { FiqhTrustBox } from "@/components/fiqh-council/FiqhTrustBox";
import { isPublicDisplayableItem } from "@/lib/fiqh-council-trust";
import { FIQH_SESSION_NUMBER_MAP } from "@/lib/fiqh-sessions-seed";
import { fiqhSessionHref } from "@/lib/fiqh-council-types";
import { FiqhItemRelations } from "@/components/fiqh-council/FiqhItemRelations";
import { FIQH_RESEARCH_DISCLAIMER } from "@/lib/fiqh-citation";
import type { FiqhMaterialRelations } from "@/lib/fiqh-council-service";
import {
  fiqhItemHref,
  fiqhCompareHref,
  formatFiqhItemMeta,
  FIQH_CONFIDENCE_LABELS,
  FIQH_SUMMARY_SOURCE_LABELS,
  FIQH_ITEM_TYPE_LABELS,
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
  const [relations, setRelations] = useState<FiqhMaterialRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFiqhCouncilItemBySlug(params.slug)
      .then(({ data }) => {
        setItem(data);
        if (data) {
          incrementFiqhCouncilViews(data.slug);
          return Promise.all([
            getRelatedFiqhCouncilItems(data.slug, data.category).then(setRelated),
            getFiqhMaterialRelations(data).then(setRelations),
          ]);
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
          "@type": item.type === "research" ? "ScholarlyArticle" : "Legislation",
          headline: item.title,
          description,
          datePublished: item.published_at || item.session_date || item.created_at,
          author: item.council_name
            ? { "@type": "Organization", name: item.council_name }
            : item.source_name
              ? { "@type": "Organization", name: item.source_name }
              : undefined,
          inLanguage: "ar",
          url: `https://majlisilm.com${path}`,
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

      <FiqhVerifiedBadge item={item} />

      {isPublicDisplayableItem(item) && <FiqhTrustBox item={item} publicMode />}

      <section className="content-detail-evidence ui-card fiqh-detail-info-table">
        <h2>بيانات القرار</h2>
        <table className="fiqh-info-table">
          <tbody>
            <tr><th>النوع</th><td>{FIQH_ITEM_TYPE_LABELS[item.type]}</td></tr>
            <tr><th>التصنيف</th><td>{item.category}{item.subcategory ? ` / ${item.subcategory}` : ""}</td></tr>
            {item.decision_number && <tr><th>رقم القرار</th><td>{item.decision_number}</td></tr>}
            {item.session_number && (
              <tr>
                <th>الجلسة</th>
                <td>
                  {item.session_number}
                  {FIQH_SESSION_NUMBER_MAP[item.session_number] && (
                    <> — <Link href={fiqhSessionHref(FIQH_SESSION_NUMBER_MAP[item.session_number])}>صفحة الجلسة</Link></>
                  )}
                </td>
              </tr>
            )}
            {item.session_date && <tr><th>التاريخ</th><td>{item.session_date}</td></tr>}
            {item.source_name && <tr><th>المصدر</th><td>{item.source_name}</td></tr>}
            {item.council_name && <tr><th>الجهة</th><td>{item.council_name}</td></tr>}
          </tbody>
        </table>
      </section>

      {item.summary && (
        <DetailSection title="ملخص تنفيذي">
          <p>{item.summary}</p>
        </DetailSection>
      )}

      <p className="fiqh-research-disclaimer-inline">{FIQH_RESEARCH_DISCLAIMER}</p>

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
        <FiqhCitationMenu item={item} />
        <FiqhExportButton item={item} />
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

      {relations && <FiqhItemRelations relations={relations} />}
    </ContentDetailLayout>
  );
}
