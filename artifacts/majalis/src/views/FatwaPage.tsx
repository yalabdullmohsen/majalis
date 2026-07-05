import { useEffect, useMemo, useState } from "react";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { getFatwas } from "@/lib/platform-content-service";
import { getLatestFatwas, getMostReadFatwas, getMostSearchedFatwas } from "@/lib/fatwa-seed";
import { FATWA_CATEGORIES } from "@/lib/platform-types";
import { usePageView } from "@/hooks/usePageView";

function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function FatwaPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("الكل");
  const [format, setFormat] = useState("الكل");
  const [tab, setTab] = useState<"all" | "latest" | "popular" | "searched">("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  usePageView("fatwa", null);

  useEffect(() => {
    if (tab !== "all") {
      setLoading(false);
      return;
    }
    setLoading(true);
    getFatwas({ category, format, search: debouncedSearch })
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  }, [category, format, debouncedSearch, tab]);

  const displayItems = useMemo(() => {
    if (tab === "latest") return getLatestFatwas(20);
    if (tab === "popular") return getMostReadFatwas(20);
    if (tab === "searched") return getMostSearchedFatwas(20);
    return items;
  }, [tab, items]);

  const formatLabel = (f: string) =>
    f === "written" ? "مكتوبة" : f === "audio" ? "صوتية" : "مكتوبة وصوتية";

  return (
    <div className="page-shell narrow content-hub-page">
      <PageHeader
        eyebrow="مركز الفتاوى"
        title="الفتاوى الشرعية"
        subtitle="أحدث الفتاوى والأكثر قراءة والأكثر بحثاً — مكتوبة وصوتية مع تصنيف وبحث ذكي."
      />

      <div className="content-hub-chips">
        {[
          ["all", "جميع الفتاوى"],
          ["latest", "أحدث الفتاوى"],
          ["popular", "الأكثر قراءة"],
          ["searched", "الأكثر بحثاً"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key as typeof tab)}
            className={tab === key ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الفتاوى..."
            className="page-search-input full content-hub-search"
            aria-label="بحث في الفتاوى"
          />

          <div className="content-hub-chips">
            {["الكل", ...FATWA_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={category === cat ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="content-hub-chips" style={{ marginTop: "0.5rem" }}>
            {[["الكل", "الكل"], ["written", "مكتوبة"], ["audio", "صوتية"]].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFormat(val)}
                className={format === val ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}

      {loading && tab === "all" ? (
        <Loading />
      ) : displayItems.length === 0 ? (
        <Empty text="لا توجد فتاوى مطابقة." />
      ) : (
        <div className="page-card-grid">
          {displayItems.map((item) => (
            <PlatformContentCard
              key={item.id}
              href={`/fatwa/${item.id}`}
              title={item.question}
              tag={formatLabel(item.format)}
              meta={[item.category, item.mufti_name].filter(Boolean).join(" · ")}
              summary={item.summary || item.answer?.slice(0, 120)}
            />
          ))}
        </div>
      )}
      <AdminQuickEdit section="fatwa" />
    </div>
  );
}
