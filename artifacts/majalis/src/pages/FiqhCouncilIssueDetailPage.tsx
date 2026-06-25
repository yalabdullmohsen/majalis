import { useEffect, useState } from "react";
import { Link } from "wouter";
import { FiqhCouncilSubnav } from "./FiqhCouncilPage";
import { Loading, Empty } from "@/components/ui-common";
import { ContentDetailLayout } from "@/components/platform/ContentDetailLayout";
import { FiqhTimeline } from "@/components/fiqh-council/FiqhTimeline";
import { getFiqhIssueBySlug } from "@/lib/fiqh-council-issues-service";
import {
  FIQH_ITEM_TYPE_LABELS,
  fiqhItemHref,
  fiqhIssueHref,
  type FiqhCouncilIssue,
} from "@/lib/fiqh-council-types";
import { FIQH_DOCUMENTATION_LABELS } from "@/lib/fiqh-council-trust";
import { FIQH_RESEARCH_DISCLAIMER } from "@/lib/fiqh-citation";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";

function groupItemsByType(issue: FiqhCouncilIssue) {
  const items = issue.items || [];
  return {
    resolutions: items.filter((i) => i.type === "resolution"),
    fatwas: items.filter((i) => i.type === "fatwa"),
    research: items.filter((i) => i.type === "research"),
    recommendations: items.filter((i) => i.type === "recommendation"),
    other: items.filter((i) => !["resolution", "fatwa", "research", "recommendation"].includes(i.type)),
  };
}

export default function FiqhCouncilIssueDetailPage({ params }: { params: { slug: string } }) {
  const [issue, setIssue] = useState<FiqhCouncilIssue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFiqhIssueBySlug(params.slug)
      .then(({ data }) => setIssue(data))
      .finally(() => setLoading(false));
  }, [params.slug]);

  useEffect(() => {
    if (!issue) return;
    const path = fiqhIssueHref(issue.slug);
    applyPageSeo({
      path,
      title: `${issue.title} | المسائل الفقهية — المجلس العلمي`,
      description: issue.summary || issue.title,
      keywords: [issue.category, "مسألة فقهية", "المجمع الفقهي"],
      ogType: "article",
      canonicalPath: path,
      robots: issue.status === "published" ? "index, follow" : "noindex, nofollow",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: issue.title,
          description: issue.summary,
          dateModified: issue.updated_at,
          datePublished: issue.published_at,
          inLanguage: "ar",
          url: `https://majlisilm.com${path}`,
        },
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "المجمع الفقهي", path: "/fiqh-council" },
          { name: "المسائل الفقهية", path: "/fiqh-council/issues" },
          { name: issue.title, path },
        ]),
      ],
    });
  }, [issue]);

  if (loading) return <Loading />;
  if (!issue) return <Empty text="المسألة غير موجودة أو غير منشورة." />;

  const grouped = groupItemsByType(issue);

  const renderItemList = (title: string, list: typeof issue.items) => {
    if (!list?.length) return null;
    return (
      <section className="content-detail-evidence ui-card">
        <h2>{title}</h2>
        <ul className="fiqh-issue-linked-list">
          {list.map((item) => (
            <li key={item.id}>
              <Link href={fiqhItemHref(item.slug)}>{item.title}</Link>
              <span className="fiqh-issue-item-meta">
                {FIQH_ITEM_TYPE_LABELS[item.type]} · {item.category}
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div className="page-shell narrow fiqh-council-page">
      <FiqhCouncilSubnav />

      <ContentDetailLayout
        breadcrumbs={[
          { label: "الرئيسية", href: "/" },
          { label: "المجمع الفقهي", href: "/fiqh-council" },
          { label: "المسائل الفقهية", href: "/fiqh-council/issues" },
          { label: issue.title },
        ]}
        title={issue.title}
        subtitle={issue.summary}
        meta={`${issue.category}${issue.subcategory ? ` · ${issue.subcategory}` : ""}`}
        body={issue.description || ""}
        shareUrl={typeof window !== "undefined" ? window.location.href : undefined}
      >
        <section className="content-detail-evidence ui-card fiqh-detail-info-table">
          <h2>بيانات المسألة</h2>
          <table className="fiqh-info-table">
            <tbody>
              <tr><th>التصنيف</th><td>{issue.category}{issue.subcategory ? ` / ${issue.subcategory}` : ""}</td></tr>
              {issue.documentation_level && (
                <tr><th>مستوى التوثيق</th><td>{FIQH_DOCUMENTATION_LABELS[issue.documentation_level]}</td></tr>
              )}
              {issue.updated_at && <tr><th>آخر تحديث</th><td>{issue.updated_at.slice(0, 10)}</td></tr>}
            </tbody>
          </table>
        </section>

        {issue.ruling_summary && (
          <section className="content-detail-evidence ui-card">
            <h2>خلاصة الحكم</h2>
            <p>{issue.ruling_summary}</p>
          </section>
        )}

        {issue.evidence_summary && (
          <section className="content-detail-evidence ui-card">
            <h2>الأدلة المختصرة</h2>
            <p>{issue.evidence_summary}</p>
          </section>
        )}

        <p className="fiqh-research-disclaimer-inline">{FIQH_RESEARCH_DISCLAIMER}</p>

        {issue.timeline && issue.timeline.length > 0 && (
          <section className="content-detail-evidence">
            <h2>الخط الزمني</h2>
            <FiqhTimeline events={issue.timeline} />
          </section>
        )}

        {renderItemList("القرارات المرتبطة", grouped.resolutions)}
        {renderItemList("الفتاوى المرتبطة", grouped.fatwas)}
        {renderItemList("البحوث المرتبطة", grouped.research)}
        {renderItemList("التوصيات المرتبطة", grouped.recommendations)}
        {renderItemList("مواد أخرى", grouped.other)}
      </ContentDetailLayout>
    </div>
  );
}
