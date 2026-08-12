import { Link } from "wouter";
import type { FiqhResearchCitation } from "@/lib/fiqh-citation";

type Props = {
  citations: FiqhResearchCitation[];
};

export function FiqhResearchCitations({ citations }: Props) {
  if (!citations.length) return null;

  return (
    <div className="fiqh-research-citations">
      <h3 className="fiqh-research-citations-title">المراجع والمصادر</h3>
      <ul className="fiqh-research-citations-list">
        {citations.map((c) => (
          <li key={c.slug} className="fiqh-research-citation-card">
            <Link href={c.href} className="fiqh-research-citation-link">
              <strong>{c.title}</strong>
            </Link>
            <p className="fiqh-research-citation-meta">
              {[c.type, c.category, c.source_name, c.session_date].filter(Boolean).join(" · ")}
            </p>
            <p className="fiqh-research-citation-excerpt">{c.excerpt}</p>
            <div className="fiqh-research-citation-actions">
              <Link href={c.href} className="fiqh-council-section-link">فتح القرار</Link>
              {c.source_url && (
                <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="fiqh-council-section-link">
                  المصدر الأصلي
                </a>
              )}
              <button
                type="button"
                className="content-detail-action-btn"
                onClick={() => navigator.clipboard.writeText(c.citation).catch(() => {})}
              >
                نسخ الاستشهاد
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
