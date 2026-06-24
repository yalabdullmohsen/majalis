import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { getLibrary, getSupabaseErrorMessage } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { PageHeader, Loading, Empty, Chip, ErrorMessage } from "@/components/ui-common";

const TYPES = ["الكل", "كتاب", "متن", "تفريغ", "ملخص", "مقال", "صوت", "مرئي"];

const TYPE_ICON: Record<string, string> = {
  "كتاب": "📕", "متن": "📜", "تفريغ": "📝", "ملخص": "🗂",
  "مقال": "📰", "صوت": "🎧", "مرئي": "🎬",
};

export default function LibraryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("الكل");
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("search") || "");
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getLibrary({ type: type === "الكل" ? undefined : type }).then(({ data, error }) => {
      if (error) setError(getSupabaseErrorMessage(error, "تعذّر تحميل مواد المكتبة."));
      setItems(data);
      setLoading(false);
    }).catch((err) => {
      setError(getSupabaseErrorMessage(err, "تعذّر تحميل مواد المكتبة."));
      setLoading(false);
    });
  }, [type]);

  const filtered = useMemo(() => {
    const s = search.trim();
    if (!s) return items;
    return items.filter(
      (it) => it.title?.includes(s) || it.description?.includes(s) || it.category?.includes(s)
    );
  }, [items, search]);

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <PageHeader
        eyebrow="الأرشيف العلمي"
        title="المكتبة العلمية"
        subtitle="كتب ومتون وتفريغات وملخصات ومقالات وصوتيات ومرئيات شرعية معتمدة."
      />

      {error && <ErrorMessage text={error} />}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في المكتبة..."
        style={{ width: "100%", boxSizing: "border-box", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, fontSize: "0.9rem", fontFamily: "inherit", outline: "none", background: C.panel, color: C.ink, marginBottom: "1rem" }}
      />

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
        {TYPES.map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(t)}>{t}</Chip>
        ))}
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <Empty text={items.length === 0 ? "لا توجد مواد بعد." : "لا توجد نتائج مطابقة."} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {filtered.map((item: any) => (
            <div id={`library-${item.id}`} key={item.id} style={{ padding: "1.25rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel, display: "flex", flexDirection: "column", borderRight: `3px solid ${C.brass}` }}>
              {item.cover_url && <img src={item.cover_url} alt="" style={{ width: "100%", maxHeight: "13rem", objectFit: "cover", borderRadius: "0.5rem", marginBottom: "0.85rem", background: C.parchmentDeep }} />}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Link href={`/library/${item.id}`} style={{ fontWeight: 700, color: C.ink, fontSize: "1rem", margin: 0, lineHeight: 1.5 }}>{item.title}</Link>
                <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.55rem", borderRadius: "999px", background: C.sage, color: C.emeraldDeep, flexShrink: 0, whiteSpace: "nowrap" }}>
                  {TYPE_ICON[item.type] ? `${TYPE_ICON[item.type]} ` : ""}{item.type}
                </span>
              </div>
              {(item.author_name || item.sheikhs?.name) && <p style={{ fontSize: "0.78rem", color: C.emeraldDeep, margin: "0 0 0.3rem", fontWeight: 700 }}>{item.author_name || item.sheikhs?.name}</p>}
              {item.category && <p style={{ fontSize: "0.75rem", color: C.brassDeep, margin: "0 0 0.4rem" }}>{item.category}</p>}
              {item.description && <p style={{ fontSize: "0.8125rem", color: C.inkSoft, lineHeight: 1.7, margin: "0 0 0.875rem", flex: 1 }}>{item.description}</p>}
              {(item.file_url || item.external_url) && (
                <a
                  href={item.file_url || item.external_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: "0.8125rem", color: C.emeraldDeep, textDecoration: "none", fontWeight: 700, marginTop: "auto" }}
                >
                  فتح المادة ←
                </a>
              )}
              <Link href={`/library/${item.id}`} style={{ fontSize: "0.8125rem", color: C.brassDeep, textDecoration: "none", fontWeight: 700, marginTop: item.file_url || item.external_url ? "0.5rem" : "auto" }}>
                تفاصيل المادة ←
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
