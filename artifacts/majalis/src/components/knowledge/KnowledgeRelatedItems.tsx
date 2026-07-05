import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  getRelatedItems,
  type KnowledgeRelationship,
  type KnowledgeSourceType,
} from "@/lib/supabase";

const TYPE_LABEL: Record<KnowledgeSourceType, string> = {
  scholar:  "عالم",
  lesson:   "درس",
  book:     "كتاب",
  fatwa:    "فتوى",
  fawaid:   "فائدة",
  question: "سؤال",
};

const TYPE_HREF: Record<KnowledgeSourceType, (id: string) => string> = {
  scholar:  (id) => `/lessons?sheikh=${encodeURIComponent(id)}`,
  lesson:   (id) => `/lessons/${id}`,
  book:     (id) => `/library/${id}`,
  fatwa:    (id) => `/fatwa/${id}`,
  fawaid:   ()   => `/fawaid`,
  question: ()   => `/qa`,
};

const REL_LABEL: Record<string, string> = {
  "شيخ_تلميذ":   "شيخ → تلميذ",
  "مؤلف_كتاب":   "مؤلف",
  "شرح_لكتاب":   "شرح",
  "فتوى_في_باب": "فتوى في باب",
  "درس_عن_كتاب": "درس عن كتاب",
  "مرتبط":       "مرتبط",
};

type Props = {
  sourceType: KnowledgeSourceType;
  sourceId: string;
  title?: string;
};

export function KnowledgeRelatedItems({ sourceType, sourceId, title = "مواد مرتبطة في الرسم البياني المعرفي" }: Props) {
  const [items, setItems] = useState<KnowledgeRelationship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRelatedItems(sourceType, sourceId).then((data) => {
      if (!cancelled) {
        setItems(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [sourceType, sourceId]);

  if (loading || items.length === 0) return null;

  return (
    <aside style={{ marginTop: "2rem", direction: "rtl" }}>
      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--majalis-emerald, #2E8B67)" }}>
        {title}
      </h3>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {items.map((rel) => {
          const isSource = rel.source_type === sourceType && rel.source_id === sourceId;
          const linkedType = isSource ? rel.target_type : rel.source_type;
          const linkedId   = isSource ? rel.target_id   : rel.source_id;
          const href = TYPE_HREF[linkedType]?.(linkedId) ?? "#";

          return (
            <Link key={rel.id} href={href} style={{ textDecoration: "none" }}>
              <div style={{
                padding: "0.75rem 1rem",
                borderRadius: "0.375rem",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.75rem",
                transition: "border-color 0.15s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(46,139,103,0.40)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)")}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--majalis-ink, #EDE9DD)" }}>
                    {rel.label ?? linkedId}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--majalis-ink-muted, #9BA3B5)" }}>
                    {TYPE_LABEL[linkedType]} · {REL_LABEL[rel.relationship_type] ?? rel.relationship_type}
                  </span>
                </div>
                <span style={{
                  fontSize: "0.7rem", background: "rgba(46,139,103,0.15)", color: "var(--majalis-emerald, #2E8B67)",
                  borderRadius: "999px", padding: "2px 8px", flexShrink: 0,
                }}>
                  {TYPE_LABEL[linkedType]}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
