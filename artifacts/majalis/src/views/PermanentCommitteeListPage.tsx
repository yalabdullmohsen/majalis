"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { PC_BASE_PATH, PC_CATEGORIES, getPermanentCommitteeFatwas } from "@/lib/permanent-committee";
import { usePageView } from "@/hooks/usePageView";

export default function PermanentCommitteeListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("الكل");
  const [search, setSearch] = useState("");

  usePageView("permanent-committee", "list");

  useEffect(() => {
    setLoading(true);
    getPermanentCommitteeFatwas({ category, q: search, limit: 50 })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [category, search]);

  const categories = useMemo(() => ["الكل", ...PC_CATEGORIES.map((c) => c.name)], []);

  return (
    <div className="page-shell narrow content-hub-page permanent-committee-page">
      <PageHeader
        eyebrow="اللجنة الدائمة"
        title="جميع الفتاوى"
        subtitle="فتاوى اللجنة الدائمة للبحوث العلمية والإفتاء — نصوص رسمية."
      />

      <div className="pc-toolbar">
        <Link href={PC_BASE_PATH}>← العودة للرئيسية</Link>
        <Link href={`${PC_BASE_PATH}/search`}>بحث متقدم</Link>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="بحث..."
        className="pc-search-input"
      />

      <div className="content-hub-chips">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={category === c ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty text="لا توجد نتائج." />
      ) : (
        <div className="content-card-grid">
          {items.map((item) => (
            <PlatformContentCard
              key={item.id}
              href={`${PC_BASE_PATH}/${item.id}`}
              title={item.title || item.question}
              summary={item.summary || item.answer?.slice(0, 140)}
              meta={[item.category, item.fatwa_number ? `#${item.fatwa_number}` : null].filter(Boolean).join(" · ")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
