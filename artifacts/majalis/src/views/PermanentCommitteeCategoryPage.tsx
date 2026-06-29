"use client";

import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { PC_BASE_PATH, getPermanentCommitteeFatwas } from "@/lib/permanent-committee";
import { usePageView } from "@/hooks/usePageView";

export default function PermanentCommitteeCategoryPage() {
  const params = useParams<{ name: string }>();
  const categoryName = decodeURIComponent(params.name || "");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  usePageView("permanent-committee", `category:${categoryName}`);

  useEffect(() => {
    setLoading(true);
    getPermanentCommitteeFatwas({ category: categoryName, limit: 50 })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [categoryName]);

  return (
    <div className="page-shell narrow content-hub-page permanent-committee-page">
      <PageHeader
        eyebrow="اللجنة الدائمة"
        title={categoryName}
        subtitle={`فتاوى اللجنة الدائمة — تصنيف: ${categoryName}`}
      />
      <Link href={PC_BASE_PATH} className="pc-back-link">← العودة</Link>
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty text="لا توجد فتاوى في هذا التصنيف." />
      ) : (
        <div className="content-card-grid">
          {items.map((item) => (
            <PlatformContentCard
              key={item.id}
              href={`${PC_BASE_PATH}/${item.id}`}
              title={item.title || item.question}
              summary={item.summary}
              meta={item.fatwa_number ? `#${item.fatwa_number}` : item.category}
            />
          ))}
        </div>
      )}
    </div>
  );
}
