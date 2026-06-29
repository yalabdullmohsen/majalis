import { Link } from "wouter";
import type { ResearchPaper } from "@/lib/scientific-research/types";
import { DEGREE_LABELS } from "@/lib/scientific-research/constants";
import { RESEARCH_BASE_PATH } from "@/lib/scientific-research/constants";

type Props = { paper: ResearchPaper };

export function ResearchCard({ paper }: Props) {
  const cover = paper.cover_url || "/images/research/default-cover.svg";

  return (
    <Link href={`${RESEARCH_BASE_PATH}/${paper.slug}`} className="research-card">
      <img src={cover} alt="" className="research-card__cover" loading="lazy" />
      <div className="research-card__body">
        <span className="research-card__degree">{DEGREE_LABELS[paper.degree_type]}</span>
        <h3 className="research-card__title">{paper.title}</h3>
        <p className="research-card__meta">{paper.author_name}</p>
        <p className="research-card__meta">{paper.university}</p>
        <div className="research-card__stats">
          <span>👁 {paper.views_count}</span>
          <span>⬇ {paper.downloads_count}</span>
          {paper.publication_year && <span>{paper.publication_year}</span>}
        </div>
      </div>
    </Link>
  );
}
