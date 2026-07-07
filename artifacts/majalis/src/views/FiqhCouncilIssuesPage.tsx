import { useEffect, useState } from "react";
import { Link } from "wouter";
import { FiqhCouncilSubnav } from "./FiqhCouncilPage";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { getFiqhIssues } from "@/lib/fiqh-council-issues-service";
import { FIQH_COUNCIL_CATEGORIES, fiqhIssueHref, type FiqhCouncilIssue } from "@/lib/fiqh-council-types";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";

export default function FiqhCouncilIssuesPage() {
  const [issues, setIssues] = useState<FiqhCouncilIssue[]>([]);
  const [category, setCategory] = useState("الكل");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-council/issues",
      title: "المسائل الفقهية | المجمع الفقهي — المجلس العلمي",
      description: "موسوعة المسائل الفقهية — ملفات جامعة تربط القرارات والفتاوى والبحوث والتوصيات والأدلة.",
      keywords: ["المسائل الفقهية", "المجمع الفقهي", "قرارات فقهية", "فتاوى جماعية"],
      jsonLd: [
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "المجمع الفقهي", path: "/fiqh-council" },
          { name: "المسائل الفقهية", path: "/fiqh-council/issues" },
        ]),
      ],
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    getFiqhIssues({ category: category !== "الكل" ? category : undefined })
      .then(({ data }) => setIssues(data))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="page-shell narrow content-hub-page fiqh-council-page">
      <PageHeader
        eyebrow="موسوعة علمية"
        title="المسائل الفقهية"
        subtitle="كل مسألة ملف جامع يربط القرارات والفتاوى والبحوث والتوصيات والأدلة، لا فتوى منفردة."
      />

      <FiqhCouncilSubnav />

      <div className="content-hub-chips fci-chips-row">
        {["الكل", ...FIQH_COUNCIL_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={category === cat ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : issues.length === 0 ? (
        <Empty text="لا توجد مسائل فقهية منشورة في هذا التصنيف." />
      ) : (
        <div className="fiqh-issues-grid">
          {issues.map((issue) => (
            <Link key={issue.id} href={fiqhIssueHref(issue.slug)} className="fiqh-issue-card ui-card">
              <span className="fiqh-issue-category">{issue.category}</span>
              <h2>{issue.title}</h2>
              {issue.summary && <p>{issue.summary}</p>}
              {issue.ruling_summary && (
                <p className="fiqh-issue-ruling"><strong>خلاصة الحكم:</strong> {issue.ruling_summary}</p>
              )}
              {issue.updated_at && (
                <time className="fiqh-issue-date" dateTime={issue.updated_at}>
                  آخر تحديث: {issue.updated_at.slice(0, 10)}
                </time>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
