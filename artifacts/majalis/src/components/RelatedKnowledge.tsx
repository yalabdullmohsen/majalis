import { useEffect, useState } from "react";
import { fetchContentRelations, type IntelligentSearchResult } from "@/lib/scholarly-intelligence-service";
import { UnifiedContentCard } from "@/components/platform/UnifiedContentCard";

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
    <aside className="related-knowledge" aria-label={title}>
      <h2 className="related-knowledge__title home-section-title">{title}</h2>
      <div className="related-knowledge__grid page-card-grid">
        {items.map((item) => (
          <UnifiedContentCard key={item.id || item.href} item={item} compact />
        ))}
      </div>
      {algorithm !== "none" && (
        <p className="related-knowledge__hint search-result-meta">اقتراحات ذكية من محرك المعرفة</p>
      )}
    </aside>
  );
}
