import { useEffect, useState } from "react";
import { Link } from "wouter";
import { FiqhCouncilSubnav } from "./FiqhCouncilPage";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { getIssuesForTopicSection } from "@/lib/fiqh-council-issues-service";
import {
  FIQH_TOPIC_INDEX_SECTIONS,
  fiqhIssueHref,
  fiqhItemHref,
  FIQH_ITEM_TYPE_LABELS,
  type FiqhCouncilIssue,
  type FiqhCouncilItem,
} from "@/lib/fiqh-council-types";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";

type SectionData = {
  label: string;
  issues: FiqhCouncilIssue[];
  items: FiqhCouncilItem[];
};

export default function FiqhCouncilTopicIndexPage() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-council/index",
      title: "الفهرس الموضوعي | المجمع الفقهي — المجلس العلمي",
      description: "فهرس موضوعي للمسائل والقرارات الفقهية — العبادات، المعاملات، النوازل، الاقتصاد، الطب، التقنية.",
      keywords: ["فهرس فقهي", "المجمع الفقهي", "مسائل فقهية", "تصنيفات"],
      jsonLd: [
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "المجمع الفقهي", path: "/fiqh-council" },
          { name: "الفهرس الموضوعي", path: "/fiqh-council/index" },
        ]),
      ],
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all(
      FIQH_TOPIC_INDEX_SECTIONS.map(async (sec) => {
        const categories = "categories" in sec ? [...sec.categories] : [];
        const nawazilTopics = "nawazilTopics" in sec ? [...sec.nawazilTopics] : undefined;
        const { issues, items } = await getIssuesForTopicSection(categories, nawazilTopics);
        return { label: sec.label, issues, items };
      }),
    )
      .then(setSections)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell narrow content-hub-page fiqh-council-page">
      <PageHeader
        eyebrow="مرجع موضوعي"
        title="الفهرس الموضوعي"
        subtitle="تصفّح المسائل والقرارات حسب الموضوعات الفقهية الرئيسية."
      />

      <FiqhCouncilSubnav />

      {loading ? (
        <SkeletonCardGrid />
      ) : (
        <div className="fiqh-topic-index">
          {sections.map((sec) => {
            if (!sec.issues.length && !sec.items.length) return null;
            return (
              <section key={sec.label} className="fiqh-topic-section ui-card" id={`topic-${sec.label}`}>
                <h2>{sec.label}</h2>

                {sec.issues.length > 0 && (
                  <>
                    <h3 className="fiqh-topic-subheading">المسائل الفقهية</h3>
                    <ul className="fiqh-topic-list">
                      {sec.issues.map((issue) => (
                        <li key={issue.id}>
                          <Link href={fiqhIssueHref(issue.slug)}>{issue.title}</Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {sec.items.length > 0 && (
                  <>
                    <h3 className="fiqh-topic-subheading">القرارات والمواد</h3>
                    <ul className="fiqh-topic-list">
                      {sec.items.slice(0, 12).map((item) => (
                        <li key={item.id}>
                          <Link href={fiqhItemHref(item.slug)}>{item.title}</Link>
                          <span className="fiqh-issue-item-meta">
                            {FIQH_ITEM_TYPE_LABELS[item.type]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
