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
    <aside className="kri-aside">
      <h3 className="kri-title">{title}</h3>
      <div className="kri-grid">
        {items.map((rel) => {
          const isSource = rel.source_type === sourceType && rel.source_id === sourceId;
          const linkedType = isSource ? rel.target_type : rel.source_type;
          const linkedId   = isSource ? rel.target_id   : rel.source_id;
          const href = TYPE_HREF[linkedType]?.(linkedId) ?? "#";

          return (
            <Link key={rel.id} href={href} className="kri-link">
              <div className="kri-item">
                <div className="kri-item-body">
                  <span className="kri-item-name">{rel.label ?? linkedId}</span>
                  <span className="kri-item-sub">
                    {TYPE_LABEL[linkedType]} · {REL_LABEL[rel.relationship_type] ?? rel.relationship_type}
                  </span>
                </div>
                <span className="kri-type-badge">{TYPE_LABEL[linkedType]}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
