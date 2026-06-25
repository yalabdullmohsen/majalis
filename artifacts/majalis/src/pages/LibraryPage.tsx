import { arabicMatchAny } from "@/lib/arabic-search";
import { useEffect, useMemo, useState } from "react";
import { getLibrary } from "@/lib/supabase";
import { DEMO_LIBRARY } from "@/lib/demo-content";
import { PageHeader, Loading, Empty, Chip } from "@/components/ui-common";
import ContentActions from "@/components/ContentActions";
import { isDemoId } from "@/lib/demo-content";

const TYPES = ["الكل", "كتاب", "متن", "تفريغ", "ملخص", "مقال", "صوت", "مرئي"];

export default function LibraryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("الكل");
  const [search, setSearch] = useState("");

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const { data } = await getLibrary({ type: type === "الكل" ? undefined : type });
      setItems(data);
    } catch {
      setItems(DEMO_LIBRARY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, [type]);

  const source = items;

  const filtered = useMemo(() => {
    const s = search.trim();
    if (!s) return source;
    return source.filter((it) =>
      arabicMatchAny([it.title, it.description, it.category, it.type], s)
    );
  }, [source, search]);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="الأرشيف العلمي"
        title="المكتبة العلمية"
        subtitle="كتب ومتون وتفريغات وملخصات ومقالات وصوتيات ومرئيات شرعية معتمدة."
      />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في المكتبة..."
        className="page-search-input full"
      />

      <div className="page-chip-row">
        {TYPES.map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(t)}>{t}</Chip>
        ))}
      </div>


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
                <span className="page-tag">
                  {item.type}
                </span>
              </div>
              {item.category && <p className="page-meta">{item.category}</p>}
              {item.description && <p className="page-desc">{item.description}</p>}
              {(item.file_url || item.external_url) && (
                <a href={item.file_url || item.external_url} target="_blank" rel="noreferrer" className="page-link">
                  فتح المادة ←
                </a>
              )}
              {!isDemoId(item.id) && (
                <ContentActions contentType="book" contentId={item.id} />
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
