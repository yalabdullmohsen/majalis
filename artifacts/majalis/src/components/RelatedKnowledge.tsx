import { useEffect, useState } from "react";
import { Link } from "wouter";
import { fetchKnowledgeRecommendations, type KnowledgeRecommendation } from "@/lib/knowledge-engine-service";

type Props = {
  kind?: string;
  recordId?: string;
  title?: string;
  limit?: number;
};

export function RelatedKnowledge({ kind, recordId, title = "مواد ذات صلة", limit = 6 }: Props) {
  const [items, setItems] = useState<KnowledgeRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchKnowledgeRecommendations({ kind, recordId, limit })
      .then((res) => {
        if (!cancelled) setItems(res.items || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, recordId, limit]);

  if (loading || items.length === 0) return null;

  return (
    <aside className="related-knowledge" style={{ marginTop: "2rem" }}>
      <h2 className="related-knowledge__title" style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
        {title}
      </h2>
      <div className="related-knowledge__list" style={{ display: "grid", gap: "0.5rem" }}>
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.url || `/search/${encodeURIComponent(item.title || "")}`}
            style={{ textDecoration: "none" }}
          >
            <div
              className="related-knowledge__item"
              style={{
                padding: "0.75rem 1rem",
                borderRadius: "0.375rem",
                border: "1px solid var(--line, #e5e7eb)",
                background: "var(--panel, #fff)",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--emerald-deep, #065f46)" }}>
                {item.title}
              </span>
              {item.category && (
                <span style={{ display: "block", fontSize: "0.75rem", color: "var(--ink-soft, #6b7280)", marginTop: "0.125rem" }}>
                  {item.category}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
