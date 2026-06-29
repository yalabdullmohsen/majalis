import { Link, useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { ContentHubLayout } from "@/components/layout/ContentHubLayout";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { Chip } from "@/components/ui-common";
import { ResearchCard } from "@/components/scientific-research/ResearchCard";
import { getResearchPapers, getCategoryCards } from "@/lib/scientific-research/service";
import type { ResearchPaper, ResearchSortBy } from "@/lib/scientific-research/types";
import {
  RESEARCH_BASE_PATH,
  SORT_OPTIONS,
  DEGREE_FILTERS,
} from "@/lib/scientific-research/constants";
import "@/styles/scientific-research.css";

export default function ScientificResearchPage() {
  const [location] = useLocation();
  const params = useMemo(() => new URLSearchParams(location.split("?")[1] || ""), [location]);
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(params.get("cat") || "latest");
  const [sort, setSort] = useState<ResearchSortBy>((params.get("sort") as ResearchSortBy) || "newest");
  const [search, setSearch] = useState(params.get("q") || "");
  const [degree, setDegree] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categories = getCategoryCards();

  useEffect(() => {
    setLoading(true);
    getResearchPapers({ category, sort, search: search || undefined, degree: degree as any, limit: 48 })
      .then(({ data }) => setPapers(data))
      .finally(() => setLoading(false));
  }, [category, sort, search, degree]);

  const filtersPanel = (
    <>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في العنوان، الباحث، الجامعة، الكلمات المفتاحية..."
        className="page-search-input full ds-input"
        aria-label="بحث في الأبحاث"
      />
      <div className="page-chip-row">
        {SORT_OPTIONS.map((s) => (
          <Chip key={s.value} active={sort === s.value} onClick={() => setSort(s.value)}>
            {s.label}
          </Chip>
        ))}
      </div>
      <div className="page-chip-row">
        <Chip active={degree === "all"} onClick={() => setDegree("all")}>كل الدرجات</Chip>
        {DEGREE_FILTERS.map((d) => (
          <Chip key={d.value} active={degree === d.value} onClick={() => setDegree(d.value)}>
            {d.label}
          </Chip>
        ))}
      </div>
    </>
  );

  return (
    <ContentHubLayout
      className="content-hub research-hub"
      eyebrow="مستودع علمي وطني"
      title="الأبحاث العلمية"
      subtitle="أكبر مكتبة عربية مجانية للرسائل الجامعية والأبحاث المحكمة — رسائل الدكتوراه والماجستير والبحوث الشرعية."
      stats={[
        { label: "بحث", value: papers.length },
        { label: "تخصص", value: categories.length },
      ]}
      filters={filtersPanel}
      filtersOpen={filtersOpen}
      onFiltersOpenChange={setFiltersOpen}
      toolbar={
        <Link href={`${RESEARCH_BASE_PATH}/upload`} className="page-action-btn">
          + رفع بحث
        </Link>
      }
    >
      <div className="research-category-grid">
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            className={`research-category-card${category === c.slug ? " active" : ""}`}
            onClick={() => setCategory(c.slug)}
          >
            <span className="research-category-card__icon">{c.icon}</span>
            <span className="research-category-card__label">{c.label}</span>
          </button>
        ))}
      </div>

      <PageLoadingGuard loading={loading} empty={papers.length === 0} emptyText="لا توجد أبحاث في هذا التصنيف بعد.">
        <div className="research-grid">
          {papers.map((p) => (
            <ResearchCard key={p.id} paper={p} />
          ))}
        </div>
      </PageLoadingGuard>
    </ContentHubLayout>
  );
}
