"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { PC_BASE_PATH, getPermanentCommitteeFatwas } from "@/lib/permanent-committee";
import { PC_CATEGORIES } from "@/lib/permanent-committee/categories";
import { usePageView } from "@/hooks/usePageView";

export default function PermanentCommitteeSearchPage() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "الكل");
  const [fatwaNumber, setFatwaNumber] = useState(params.get("number") || "");
  const [keyword, setKeyword] = useState(params.get("keyword") || "");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  usePageView("permanent-committee", "search");

  const runSearch = () => {
    setLoading(true);
    getPermanentCommitteeFatwas({ q, category, fatwaNumber, keyword, limit: 50 })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (params.get("q") || params.get("category")) runSearch();
  }, []);

  const categories = useMemo(() => ["الكل", ...PC_CATEGORIES.map((c) => c.name)], []);

  return (
    <div className="page-shell narrow content-hub-page permanent-committee-page">
      <PageHeader
        eyebrow="اللجنة الدائمة"
        title="البحث المتقدم"
        subtitle="ابحث برقم الفتوى أو الموضوع أو الكلمات المفتاحية أو جزء من السؤال والجواب."
      />

      <Link href={PC_BASE_PATH} className="pc-back-link">← العودة للرئيسية</Link>

      <form
        className="pc-advanced-search ui-card"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <label>
          <span>نص البحث</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="كلمة في السؤال أو الجواب..." />
        </label>
        <label>
          <span>رقم الفتوى</span>
          <input value={fatwaNumber} onChange={(e) => setFatwaNumber(e.target.value)} placeholder="مثال: 13789" />
        </label>
        <label>
          <span>التصنيف / الباب</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <span>كلمة مفتاحية</span>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="زكاة، صلاة..." />
        </label>
        <button type="submit" className="page-action-btn">بحث</button>
      </form>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty text="لا توجد نتائج — جرّب معايير أخرى." />
      ) : (
        <>
          <p className="pc-results-count">{items.length} نتيجة</p>
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
        </>
      )}
    </div>
  );
}
