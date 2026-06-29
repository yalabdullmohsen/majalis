import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  PC_BASE_PATH,
  getPermanentCommitteeFatwas,
  type PermanentCommitteeFatwa,
} from "@/lib/permanent-committee";

type Props = {
  category?: string;
  query?: string;
  title?: string;
  limit?: number;
};

export function RelatedPermanentCommittee({
  category,
  query,
  title = "فتاوى ذات صلة — اللجنة الدائمة",
  limit = 4,
}: Props) {
  const [items, setItems] = useState<PermanentCommitteeFatwa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPermanentCommitteeFatwas({
      category: category || "الكل",
      q: query?.trim() || undefined,
      limit: limit + 2,
    })
      .then(({ data }) => {
        if (!cancelled) setItems(data.slice(0, limit));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, query, limit]);

  if (loading || items.length === 0) return null;

  return (
    <aside className="related-knowledge pc-related-block" aria-label={title}>
      <div className="pc-section-head">
        <h2 className="related-knowledge__title home-section-title">{title}</h2>
        <Link href={PC_BASE_PATH}>اللجنة الدائمة</Link>
      </div>
      <div className="related-knowledge__grid page-card-grid">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`${PC_BASE_PATH}/${item.id}`}
            className="ui-card pc-related-card"
          >
            <strong>{item.title || item.question}</strong>
            <span>
              {[item.category, item.fatwa_number ? `#${item.fatwa_number}` : null]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </Link>
        ))}
      </div>
      <p className="related-knowledge__hint search-result-meta">
        مرجع رسمي — النص الأصلي محفوظ دون تعديل
      </p>
    </aside>
  );
}
