import { useEffect, useState } from "react";
import { Link } from "wouter";
import { fetchContentRelations, type IntelligentSearchResult } from "@/lib/scholarly-intelligence-service";

type Props = {
  kind?: string;
  recordId?: string;
  topicSlug?: string;
  query?: string;
  title?: string;
  limit?: number;
};

export function RelatedKnowledge({ kind, recordId, topicSlug, query, title = "مواد ذات صلة", limit = 6 }: Props) {
  const [items, setItems] = useState<IntelligentSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [algorithm, setAlgorithm] = useState("none");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchContentRelations({ kind, recordId, topicSlug, query, limit })
      .then((res) => {
        if (!cancelled) {
          setItems(res.items || []);
          setAlgorithm(res.algorithm);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, recordId, topicSlug, query, limit]);

  if (loading || items.length === 0) return null;

  return (
    <aside className="related-knowledge">
      <h2 className="related-knowledge__title">{title}</h2>
      <div className="related-knowledge__list">
        {items.map((item) => (
          <Link
            key={item.id || item.href}
            href={item.href || `/search/${encodeURIComponent(item.title || "")}`}
            className="related-knowledge__link"
          >
            <div className="related-knowledge__item">
              <span className="related-knowledge__item-title">{item.title}</span>
              <span className="related-knowledge__item-meta">
                {[item.kind_label, item.source_name, item.verification_status === "verified" ? "موثق" : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {algorithm !== "none" && (
        <p className="related-knowledge__algo-note">اقتراحات ذكية</p>
      )}
    </aside>
  );
}
