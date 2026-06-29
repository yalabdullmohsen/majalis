import { useEffect, useState } from "react";
import { Link } from "wouter";
import { FileText } from "lucide-react";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { IslamicHeadingOrnament } from "@/components/islamic/IslamicOrnament";
import { getResearchPapers } from "@/lib/scientific-research/service";
import { RESEARCH_BASE_PATH } from "@/lib/scientific-research/constants";
import type { ResearchPaper } from "@/lib/scientific-research/types";
import { displayText } from "@/lib/display-text";

export function HomeResearchSection() {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResearchPapers({ limit: 6, sort: "newest" })
      .then(({ data }) => setPapers((data || []).slice(0, 6)))
      .catch(() => setPapers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="home-section" aria-labelledby="home-research-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">مشاركة المعرفة</p>
          <h2 id="home-research-heading">الأبحاث العلمية</h2>
          <IslamicHeadingOrnament />
        </div>
        <Link href={RESEARCH_BASE_PATH} className="home-section-link">
          جميع الأبحاث
        </Link>
      </div>
      <PageLoadingGuard loading={loading} empty={!loading && papers.length === 0} emptyText="لا أبحاث حالياً">
        <div className="home-research-grid">
          {papers.map((paper) => (
            <Link
              key={paper.id}
              href={`${RESEARCH_BASE_PATH}/${paper.slug}`}
              className="home-mini-card ui-card--ornate"
            >
              <FileText size={18} strokeWidth={1.75} aria-hidden="true" color="var(--ds-emerald)" />
              <h3>{displayText(paper.title)}</h3>
              <p>{paper.author_name || paper.university || "بحث علمي"}</p>
            </Link>
          ))}
        </div>
      </PageLoadingGuard>
    </section>
  );
}

export default HomeResearchSection;
