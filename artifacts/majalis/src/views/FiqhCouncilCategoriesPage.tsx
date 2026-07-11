import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { PageHeader, SkeletonCardGrid, Empty } from "@/components/ui-common";
import { ShareButtons } from "@/components/ContentActions";
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
import { FiqhCouncilSubnav } from "./FiqhCouncilPage";
import { applyPageSeo } from "@/lib/seo";
import { FIQH_CATEGORY_TREE } from "@/lib/fiqh-council-categories";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

export default function FiqhCouncilCategoriesPage() {
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const selectedCat = params.get("cat") || "الكل";
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  usePageView("fiqh-council-categories", selectedCat);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-council/index",
      title: "الفهرس الموضوعي للمجمع الفقهي | المجلس العلمي",
      description: "تصفح قرارات وفتاوى المجمع الفقهي حسب الموضوع والتصنيف، العبادات والمعاملات والأسرة والمعاصر.",
      keywords: ["فهرس فقهي", "تصنيف فقهي", "أبواب الفقه", "مجمع فقهي", "قرارات فقهية"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "الفهرس الموضوعي للمجمع الفقهي", url: "https://majlisilm.com/fiqh-council/index", about: { "@type": "Thing", name: "تصنيف الفقه الإسلامي المعاصر" } }],
    });
  }, []);

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

      <FiqhCouncilSubnav />

      <section className="fiqh-council-section">
        <h2 className="fiqh-council-section-title">التصنيف الهرمي</h2>
        <div className="fiqh-category-tree">
          {FIQH_CATEGORY_TREE.map((main) => (
            <div key={main.slug} className="fiqh-category-tree-main">
              <strong>{main.name}</strong>
              <div className="content-hub-chips">
                {main.children?.map((sub) => (
                  <span key={sub.slug} className="content-hub-chip">{sub.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="fiqh-council-category-grid">
        <Link
          href="/fiqh-council/categories"
          className={selectedCat === "الكل" ? "fiqh-council-category-card fiqh-council-category-card--active" : "fiqh-council-category-card"}
          aria-current={selectedCat === "الكل" ? "true" : undefined}
        >
          <span className="fiqh-council-category-name">الكل</span>
          <span className="fiqh-council-category-count">{Object.values(counts).reduce((a, b) => a + b, 0)} عنصر</span>
        </Link>
        {FIQH_COUNCIL_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/fiqh-council/categories?cat=${encodeURIComponent(cat)}`}
            className={selectedCat === cat ? "fiqh-council-category-card fiqh-council-category-card--active" : "fiqh-council-category-card"}
            aria-current={selectedCat === cat ? "true" : undefined}
          >
            <span className="fiqh-council-category-name">{cat}</span>
            <span className="fiqh-council-category-count">{counts[cat] || 0} عنصر</span>
          </Link>
        ))}
      </div>

      {loading ? (
        <SkeletonCardGrid />
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

      <div className="twh-share">
        <ShareButtons title="تصنيفات مجلس الفقه — المجلس العلمي" url="https://majlisilm.com/fiqh-council/categories" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="fiqh" title="اختبر معلوماتك في أبواب الفقه" count={4} />
      </div>
    </div>
  );
}
