import { useEffect, useState } from "react";
import { Link } from "wouter";
import { FiqhCouncilSubnav } from "./FiqhCouncilPage";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { getFiqhCouncilPublicStats } from "@/lib/fiqh-council-service";
import { fiqhItemHref, FIQH_ITEM_TYPE_LABELS, type FiqhPublicStats } from "@/lib/fiqh-council-types";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";

export default function FiqhCouncilStatsPage() {
  const [stats, setStats] = useState<FiqhPublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-council/stats",
      title: "إحصائيات المجمع الفقهي | المجلس العلمي",
      description: "إحصائيات المجمع الفقهي — عدد القرارات والفتاوى والبحوث وأكثر التصنيفات والمواد قراءة.",
      keywords: ["إحصائيات فقهية", "المجمع الفقهي"],
      jsonLd: [
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "المجمع الفقهي", path: "/fiqh-council" },
          { name: "الإحصائيات", path: "/fiqh-council/stats" },
        ]),
      ],
    });
  }, []);

  useEffect(() => {
    getFiqhCouncilPublicStats().then(({ data }) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <SkeletonCardGrid />;

  const s = stats || {
    resolutions: 0,
    fatwas: 0,
    recommendations: 0,
    research: 0,
    issues: 0,
    pending_review: 0,
    top_categories: [],
    top_viewed: [],
    latest: [],
    top_sources: [],
  };

  return (
    <div className="page-shell narrow content-hub-page fiqh-council-page">
      <PageHeader
        eyebrow="لوحة معلومات"
        title="إحصائيات المجمع الفقهي"
        subtitle="نظرة عامة على محتوى المجمع الفقهي المنشور والموثق."
      />

      <FiqhCouncilSubnav />

      <div className="fiqh-admin-stats fiqh-public-stats">
        {[
          ["resolutions", "القرارات"],
          ["fatwas", "الفتاوى"],
          ["recommendations", "التوصيات"],
          ["research", "البحوث"],
          ["issues", "المسائل الفقهية"],
        ].map(([key, label]) => (
          <div key={key} className="fiqh-admin-stat">
            <strong>{(s as unknown as Record<string, number>)[key] ?? 0}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {s.top_categories?.length > 0 && (
        <section className="ui-card fiqh-stats-section">
          <h2>أكثر التصنيفات</h2>
          <ul className="fiqh-stats-list">
            {s.top_categories.map((row) => (
              <li key={row.category}>{row.category} — {row.cnt}</li>
            ))}
          </ul>
        </section>
      )}

      {s.top_viewed?.length > 0 && (
        <section className="ui-card fiqh-stats-section">
          <h2>أكثر المواد قراءة</h2>
          <ul className="fiqh-stats-list">
            {s.top_viewed.map((row) => (
              <li key={row.slug}>
                <Link href={fiqhItemHref(row.slug)}>{row.title}</Link>
                <span> — {row.views_count?.toLocaleString("ar")} مشاهدة</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {s.latest?.length > 0 && (
        <section className="ui-card fiqh-stats-section">
          <h2>أحدث المواد</h2>
          <ul className="fiqh-stats-list">
            {s.latest.map((row) => (
              <li key={row.slug}>
                <Link href={fiqhItemHref(row.slug)}>{row.title}</Link>
                <span> — {FIQH_ITEM_TYPE_LABELS[row.type as keyof typeof FIQH_ITEM_TYPE_LABELS]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {s.top_sources?.length > 0 && (
        <section className="ui-card fiqh-stats-section">
          <h2>أكثر المصادر</h2>
          <ul className="fiqh-stats-list">
            {s.top_sources.map((row) => (
              <li key={row.source_name}>{row.source_name} — {row.cnt}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="fiqh-stats-note">
        <Link href="/fiqh-council/issues">المسائل الفقهية</Link>
        {" · "}
        <Link href="/fiqh-council/index">الفهرس الموضوعي</Link>
      </p>
    </div>
  );
}
