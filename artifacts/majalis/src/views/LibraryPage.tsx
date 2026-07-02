import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { arabicMatchAny } from "@/lib/arabic-search";
import { useEffect, useMemo, useState } from "react";
import { getLibrary } from "@/lib/supabase";
import { RequestManager } from "@/lib/request-manager";
import { LIBRARY_CATEGORIES } from "@/lib/library-catalog";
import { Chip } from "@/components/ui-common";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { ContentHubLayout } from "@/components/layout/ContentHubLayout";

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
    if (initialItems && category === "الكل") return;
    loadLibrary();
  }, [category, initialItems]);

  const filtered = useMemo(() => {
    const s = search.trim();
    if (!s) return items;
    return items.filter((it) =>
      arabicMatchAny(
        [it.title, it.author, it.author_name, it.description, it.category, it.type, ...(it.keywords || [])],
        s,
      ),
    );
  }, [items, search]);

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
      subtitle="كتب أساسية في الحديث والتفسير والعقيدة والفقه — مرتبة وموثقة."
      stats={isAdmin ? [{ label: "كتاب", value: filtered.length }] : []}
      filters={filtersPanel}
      filtersOpen={filtersOpen}
      onFiltersOpenChange={setFiltersOpen}
    >
      <PageLoadingGuard
        loading={loading}
        empty={!loading && filtered.length === 0}
        emptyText={items.length === 0 ? "لا توجد كتب حالياً" : "لا توجد نتائج مطابقة."}
        onRetry={loadLibrary}
      >
        <div className="page-card-grid library-grid">
          {filtered.map((item: any) => (
            <Link key={item.id} href={`/library/${item.id}`} className="page-card library-card library-card-link">
              <div className="page-card-header">
                <p>{item.title}</p>
                <span className="ds-badge">{item.category}</span>
              </div>
              {(item.author || item.author_name) && (
                <p className="page-meta">{item.author || item.author_name}</p>
              )}
              {item.parts_label && <p className="page-meta library-parts">{item.parts_label}</p>}
              {item.description && <p className="page-desc">{item.description}</p>}
              <span className="library-card-cta">عرض التفاصيل</span>
            </Link>
          ))}
        </div>
      </PageLoadingGuard>
    </ContentHubLayout>
  );
}
