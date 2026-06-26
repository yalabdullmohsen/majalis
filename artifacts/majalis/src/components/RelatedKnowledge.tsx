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
    <aside className="related-knowledge" style={{ marginTop: "2rem" }}>
      <h2 className="related-knowledge__title" style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
        {title}
      </h2>
      <div className="related-knowledge__list" style={{ display: "grid", gap: "0.5rem" }}>
        {items.map((item) => (
          <Link
            key={item.id || item.href}
            href={item.href || `/search/${encodeURIComponent(item.title || "")}`}
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
              <span style={{ display: "block", fontSize: "0.75rem", color: "var(--ink-soft, #6b7280)", marginTop: "0.125rem" }}>
                {[item.kind_label, item.source_name, item.verification_status === "verified" ? "موثق" : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          </Link>
        ))}
      </div>
      {algorithm !== "none" && (
        <p style={{ fontSize: "0.7rem", color: "var(--ink-soft)", marginTop: "0.5rem" }}>
          اقتراحات ذكية
        </p>
      )}
    </aside>
  );
}
