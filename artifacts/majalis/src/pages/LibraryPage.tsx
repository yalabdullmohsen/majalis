import { arabicMatchAny } from "@/lib/arabic-search";
import { useEffect, useMemo, useState } from "react";
import { getLibrary } from "@/lib/supabase";
import { DEMO_LIBRARY, demoNoticeText } from "@/lib/demo-content";
import { PageHeader, Loading, Empty, Chip, ErrorState, DemoNotice } from "@/components/ui-common";
import ContentActions from "@/components/ContentActions";
import { isDemoId } from "@/lib/demo-content";

const TYPES = ["الكل", "كتاب", "متن", "تفريغ", "ملخص", "مقال", "صوت", "مرئي"];

const TYPE_ICON: Record<string, string> = {
  "كتاب": "📕", "متن": "📜", "تفريغ": "📝", "ملخص": "🗂",
  "مقال": "📰", "صوت": "🎧", "مرئي": "🎬",
};

export default function LibraryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [type, setType] = useState("الكل");
  const [search, setSearch] = useState("");

  const loadLibrary = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await getLibrary({ type: type === "الكل" ? undefined : type });
      if (fetchError) throw fetchError;
      setItems(data);
    } catch {
      setError("تعذر تحميل المكتبة العلمية.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, [type]);

  const usingDemo = items.length === 0 && !loading && !error;
  const source = usingDemo ? DEMO_LIBRARY : items;

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

      {usingDemo && <DemoNotice text={demoNoticeText("المكتبة")} />}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState text={error} onRetry={loadLibrary} />
      ) : filtered.length === 0 ? (
        <Empty text={items.length === 0 ? "لا توجد مواد بعد." : "لا توجد نتائج مطابقة."} />
      ) : (
        <div className="page-card-grid">
          {filtered.map((item: any) => (
            <article key={item.id} className="page-card library-card">
              <div className="page-card-header">
                <p>{item.title}</p>
                <span className="page-tag">
                  {TYPE_ICON[item.type] ? `${TYPE_ICON[item.type]} ` : ""}{item.type}
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
