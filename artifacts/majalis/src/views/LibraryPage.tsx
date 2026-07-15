import { Link } from "wouter";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { useAuth } from "@/components/AuthProvider";
import { arabicMatchAny } from "@/lib/arabic-search";
import { ShareButtons } from "@/components/ContentActions";
import { useEffect, useMemo, useState } from "react";
import { getLibrary } from "@/lib/supabase";
import { RequestManager } from "@/lib/request-manager";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { LIBRARY_CATEGORIES } from "@/lib/library-catalog";
import { Chip } from "@/components/ui-common";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { ContentHubLayout } from "@/components/layout/ContentHubLayout";
import { applyPageSeo } from "@/lib/seo";
import { BookOpen, SortAsc, SortDesc, LayoutGrid, List } from "lucide-react";

type SortKey = "title" | "author" | "newest";
type ViewMode = "grid" | "list";

function BookCoverPlaceholder({ title, category }: { title: string; category?: string }) {
  return (
    <div className="lib-card-cover lib-card-cover--placeholder" aria-hidden="true">
      <BookOpen size={18} strokeWidth={1.6} className="lib-card-cover__icon" />
      <span className="lib-card-cover__title">{title}</span>
      {category && <span className="lib-card-cover__cat">{category}</span>}
    </div>
  );
}

function BookCard({ item, view }: { item: any; view: ViewMode }) {
  const hasCover = !!item.cover_url;
  return (
    <Link
      href={`/library/${item.id}`}
      className={`lib-card lib-card--${view} ui-card ui-card--clickable`}
      aria-label={`${item.title}${item.author || item.author_name ? ` — ${item.author || item.author_name}` : ""}`}
    >
      {/* غلاف الكتاب */}
      <div className="lib-card-cover-wrap">
        {hasCover ? (
          <img
            src={item.cover_url}
            alt={`غلاف ${item.title}`}
            className="lib-card-cover lib-card-cover--img"
            loading="lazy"
            decoding="async"
            width="200"
            height="280"
          />
        ) : (
          <BookCoverPlaceholder title={item.title} category={item.category} />
        )}
        {item.parts_label && (
          <span className="lib-card-parts-badge">{item.parts_label}</span>
        )}
      </div>

      {/* محتوى البطاقة */}
      <div className="lib-card-body">
        {item.category && (
          <span className="lib-card-category page-tag">{item.category}</span>
        )}
        <h3 className="lib-card-title">{item.title}</h3>
        {(item.author || item.author_name) && (
          <p className="lib-card-author">{item.author || item.author_name}</p>
        )}
        {view === "list" && item.description && (
          <p className="lib-card-desc">{item.description}</p>
        )}
        <span className="lib-card-cta">
          <BookOpen size={13} aria-hidden="true" />
          عرض الكتاب
        </span>
      </div>
    </Link>
  );
}

export default function LibraryPage({
  initialItems,
}: {
  initialItems?: any[];
} = {}) {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<any[]>(initialItems ?? []);
  const [loading, setLoading] = useState(!initialItems);
  const [category, setCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [sortAsc, setSortAsc] = useState(true);
  const [view, setView] = useState<ViewMode>("grid");

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const { data } = await RequestManager.run("library:list", () =>
        getLibrary({ category: category === "الكل" ? undefined : category }),
      );
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyPageSeo({
      path: "/library",
      title: "المكتبة الشرعية الإسلامية | المجلس العلمي",
      description: "مكتبة رقمية شاملة من الكتب والمراجع الشرعية، في الفقه والعقيدة والتفسير والحديث والسيرة والتزكية.",
      keywords: ["مكتبة إسلامية", "كتب شرعية", "مراجع دينية", "مكتبة دينية", "كتب فقه"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "تصنيفات المكتبة الشرعية",
          description: "تصنيفات كتب المكتبة الإسلامية في المجلس العلمي",
          numberOfItems: LIBRARY_CATEGORIES.filter((c) => c !== "الكل").length,
          itemListElement: LIBRARY_CATEGORIES.filter((c) => c !== "الكل").map((cat, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: cat,
            url: `https://www.majlisilm.com/library?cat=${encodeURIComponent(cat)}`,
          })),
        },
      ],
    });
  }, []);

  useEffect(() => {
    if (initialItems && category === "الكل") return;
    loadLibrary();
  }, [category, initialItems]);

  const filtered = useMemo(() => {
    let list = items;
    const s = search.trim();
    if (s) {
      list = list.filter((it) =>
        arabicMatchAny(
          [it.title, it.author, it.author_name, it.description, it.category, it.type, ...(it.keywords || [])],
          s,
        ),
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title")  cmp = (a.title ?? "").localeCompare(b.title ?? "", "ar");
      if (sortKey === "author") cmp = ((a.author || a.author_name) ?? "").localeCompare((b.author || b.author_name) ?? "", "ar");
      if (sortKey === "newest") cmp = new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [items, search, sortKey, sortAsc]);

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "newest", label: "الأحدث" },
    { key: "title",  label: "العنوان" },
    { key: "author", label: "المؤلف" },
  ];

  const filtersPanel = (
    <>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في المكتبة..."
        className="page-search-input full ds-input"
        aria-label="بحث في المكتبة"
      />
      <div className="page-chip-row library-category-chips">
        {LIBRARY_CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {c}
          </Chip>
        ))}
      </div>
    </>
  );

  return (
    <ContentHubLayout
      className="content-hub library-hub"
      eyebrow="الأرشيف العلمي"
      title="المكتبة العلمية"
      subtitle="كتب أساسية في الحديث والتفسير والعقيدة والفقه، مرتبة وموثقة."
      stats={isAdmin ? [{ label: "كتاب", value: filtered.length }] : []}
      filters={filtersPanel}
      filtersOpen={filtersOpen}
      onFiltersOpenChange={setFiltersOpen}
    >
      {/* شريط الترتيب والعرض */}
      <div className="lib-toolbar" role="toolbar" aria-label="ترتيب وعرض الكتب">
        <div className="lib-toolbar__sort">
          <span className="lib-toolbar__label">ترتيب:</span>
          {SORT_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`lib-sort-btn${sortKey === key ? " lib-sort-btn--active" : ""}`}
              onClick={() => {
                if (sortKey === key) setSortAsc((v) => !v);
                else { setSortKey(key); setSortAsc(true); }
              }}
              aria-pressed={sortKey === key}
            >
              {label}
              {sortKey === key && (
                sortAsc
                  ? <SortAsc size={13} aria-label="تصاعدي" />
                  : <SortDesc size={13} aria-label="تنازلي" />
              )}
            </button>
          ))}
        </div>
        <div className="lib-toolbar__view">
          <button
            type="button"
            className={`lib-view-btn${view === "grid" ? " lib-view-btn--active" : ""}`}
            onClick={() => setView("grid")}
            aria-label="عرض شبكي"
            aria-pressed={view === "grid"}
          >
            <LayoutGrid size={17} />
          </button>
          <button
            type="button"
            className={`lib-view-btn${view === "list" ? " lib-view-btn--active" : ""}`}
            onClick={() => setView("list")}
            aria-label="عرض قائمة"
            aria-pressed={view === "list"}
          >
            <List size={17} />
          </button>
        </div>
      </div>

      <PageLoadingGuard
        loading={loading}
        empty={!loading && filtered.length === 0}
        emptyText={items.length === 0 ? "لا توجد كتب حالياً" : "لا توجد نتائج مطابقة."}
        onRetry={loadLibrary}
      >
        <div className={`lib-grid lib-grid--${view}`}>
          {filtered.map((item: any) => (
            <BookCard key={item.id} item={item} view={view} />
          ))}
          <AdminQuickEdit section="library" />
        </div>
      </PageLoadingGuard>

      <div className="twh-share">
        <ShareButtons title="المكتبة الإسلامية — المجلس العلمي" url="https://www.majlisilm.com/library" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["quran", "hadith"]} title="اختبر معلوماتك في علوم الكتاب والسنة" count={4} />
      </div>
    </ContentHubLayout>
  );
}
