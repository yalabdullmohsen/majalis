import { arabicMatchAny } from "@/lib/arabic-search";
import { useEffect, useMemo, useState } from "react";
import { getLibrary } from "@/lib/supabase";
import { RequestManager } from "@/lib/request-manager";
import { DEMO_LIBRARY } from "@/lib/demo-content";
import { Loading, Empty, Chip } from "@/components/ui-common";
import { ContentHubLayout } from "@/components/layout/ContentHubLayout";
import ContentActions from "@/components/ContentActions";
import { isDemoId } from "@/lib/demo-content";

const TYPES = ["الكل", "كتاب", "متن", "تفريغ", "ملخص", "مقال", "صوت", "مرئي"];

export default function LibraryPage({
  initialItems,
}: {
  initialItems?: any[];
} = {}) {
  const [items, setItems] = useState<any[]>(initialItems ?? []);
  const [loading, setLoading] = useState(!initialItems);
  const [type, setType] = useState("الكل");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const { data } = await RequestManager.run("library:list", () =>
        getLibrary({ type: type === "الكل" ? undefined : type }),
      );
      setItems(data);
    } catch {
      setItems(DEMO_LIBRARY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialItems && type === "الكل") return;
    loadLibrary();
  }, [type, initialItems]);

  const filtered = useMemo(() => {
    const s = search.trim();
    if (!s) return items;
    return items.filter((it) =>
      arabicMatchAny([it.title, it.description, it.category, it.type], s),
    );
  }, [items, search]);

  const filtersPanel = (
    <>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في المكتبة..."
        className="page-search-input full ds-input"
      />
      <div className="page-chip-row">
        {TYPES.map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(t)}>{t}</Chip>
        ))}
      </div>
    </>
  );

  return (
    <ContentHubLayout
      className="content-hub"
      eyebrow="الأرشيف العلمي"
      title="المكتبة العلمية"
      subtitle="كتب ومتون وتفريغات وملخصات ومقالات وصوتيات ومرئيات."
      stats={[{ label: "مادة", value: filtered.length }]}
      filters={filtersPanel}
      filtersOpen={filtersOpen}
      onFiltersOpenChange={setFiltersOpen}
    >
      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty text={items.length === 0 ? "لا توجد مواد بعد." : "لا توجد نتائج مطابقة."} />
      ) : (
        <div className="page-card-grid">
          {filtered.map((item: any) => (
            <article key={item.id} className="page-card library-card">
              <div className="page-card-header">
                <p>{item.title}</p>
                <span className="ds-badge">{item.type}</span>
              </div>
              {item.category && <p className="page-meta">{item.category}</p>}
              {item.description && <p className="page-desc">{item.description}</p>}
              {(item.file_url || item.external_url) && (
                <a href={item.file_url || item.external_url} target="_blank" rel="noreferrer" className="page-link">
                  فتح المادة
                </a>
              )}
              {!isDemoId(item.id) && (
                <ContentActions contentType="book" contentId={item.id} />
              )}
            </article>
          ))}
        </div>
      )}
    </ContentHubLayout>
  );
}
