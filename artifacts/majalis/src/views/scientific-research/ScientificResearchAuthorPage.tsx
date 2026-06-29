import { Link, useRoute } from "wouter";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader, Loading } from "@/components/ui-common";
import { ResearchCard } from "@/components/scientific-research/ResearchCard";
import { getAuthorPapers } from "@/lib/scientific-research/service";
import type { ResearchAuthor, ResearchPaper } from "@/lib/scientific-research/types";
import { RESEARCH_BASE_PATH } from "@/lib/scientific-research/constants";
import "@/styles/scientific-research.css";

export default function ScientificResearchAuthorPage() {
  const [, params] = useRoute(`${RESEARCH_BASE_PATH}/author/:slug`);
  const slug = params?.slug || "";
  const [author, setAuthor] = useState<ResearchAuthor | null>(null);
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getAuthorPapers(slug).then(({ author: a, data }) => {
      setAuthor(a);
      setPapers(data);
    }).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <PageShell><Loading /></PageShell>;
  if (!author) {
    return (
      <PageShell>
        <PageHeader title="الباحث غير موجود" />
        <Link href={RESEARCH_BASE_PATH}>← العودة</Link>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Link href={RESEARCH_BASE_PATH}>← الأبحاث العلمية</Link>
      <PageHeader
        title={author.full_name}
        subtitle={[author.university, author.specialization, author.degree].filter(Boolean).join(" · ")}
      />
      {author.bio && <p style={{ marginBottom: "1rem" }}>{author.bio}</p>}
      <div className="ds-stats-row" style={{ marginBottom: "2rem" }}>
        <div className="ds-stat"><strong>{author.papers_count}</strong><span>بحث</span></div>
        <div className="ds-stat"><strong>{author.views_count}</strong><span>مشاهدة</span></div>
        <div className="ds-stat"><strong>{author.downloads_count}</strong><span>تحميل</span></div>
      </div>
      <h2 style={{ fontSize: "1.1rem" }}>أبحاث الباحث</h2>
      <div className="research-grid" style={{ marginTop: "1rem" }}>
        {papers.map((p) => (
          <ResearchCard key={p.id} paper={p} />
        ))}
      </div>
    </PageShell>
  );
}
