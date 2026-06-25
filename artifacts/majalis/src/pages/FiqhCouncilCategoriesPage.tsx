import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { PageHeader, Loading, Empty } from "@/components/ui-common";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { getFiqhCouncilItems, getFiqhCouncilCategoryCounts } from "@/lib/fiqh-council-service";
import {
  FIQH_COUNCIL_CATEGORIES,
  FIQH_ITEM_TYPE_LABELS,
  fiqhItemHref,
  formatFiqhItemMeta,
  type FiqhCouncilCategory,
  type FiqhItemType,
} from "@/lib/fiqh-council-types";
import { usePageView } from "@/hooks/usePageView";

export default function FiqhCouncilCategoriesPage() {
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const selectedCat = params.get("cat") || "الكل";
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  usePageView("fiqh-council-categories", selectedCat);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getFiqhCouncilItems({
        category: selectedCat === "الكل" ? "الكل" : (selectedCat as FiqhCouncilCategory),
      }),
      getFiqhCouncilCategoryCounts(),
    ])
      .then(([list, categoryCounts]) => {
        setItems(list.data);
        setCounts(categoryCounts);
      })
      .finally(() => setLoading(false));
  }, [selectedCat]);

  return (
    <div className="page-shell narrow content-hub-page fiqh-council-page">
      <PageHeader
        eyebrow="الفقه المعاصر"
        title="التصنيفات الفقهية"
        subtitle="تصفّح محتوى المجمع الفقهي حسب التصنيفات الفقهية."
      />

      <nav className="fiqh-council-subnav" aria-label="أقسام المجمع الفقهي">
        <Link href="/fiqh-council" className="fiqh-council-subnav-link">الرئيسية</Link>
        <Link href="/fiqh-council/resolutions" className="fiqh-council-subnav-link">القرارات</Link>
        <Link href="/fiqh-council/fatwas" className="fiqh-council-subnav-link">الفتاوى الجماعية</Link>
        <Link href="/fiqh-council/research" className="fiqh-council-subnav-link">البحوث</Link>
      </nav>

      <div className="fiqh-council-category-grid">
        <Link
          href="/fiqh-council/categories"
          className={selectedCat === "الكل" ? "fiqh-council-category-card fiqh-council-category-card--active" : "fiqh-council-category-card"}
        >
          <span className="fiqh-council-category-name">الكل</span>
          <span className="fiqh-council-category-count">{Object.values(counts).reduce((a, b) => a + b, 0)} عنصر</span>
        </Link>
        {FIQH_COUNCIL_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/fiqh-council/categories?cat=${encodeURIComponent(cat)}`}
            className={selectedCat === cat ? "fiqh-council-category-card fiqh-council-category-card--active" : "fiqh-council-category-card"}
          >
            <span className="fiqh-council-category-name">{cat}</span>
            <span className="fiqh-council-category-count">{counts[cat] || 0} عنصر</span>
          </Link>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty text="لا توجد عناصر في هذا التصنيف." />
      ) : (
        <div className="page-card-grid">
          {items.map((item) => (
            <PlatformContentCard
              key={item.slug}
              href={fiqhItemHref(item.slug)}
              title={item.title}
              tag={FIQH_ITEM_TYPE_LABELS[item.type as FiqhItemType]}
              meta={formatFiqhItemMeta(item)}
              summary={item.summary}
            />
          ))}
        </div>
      )}
    </div>
  );
}
