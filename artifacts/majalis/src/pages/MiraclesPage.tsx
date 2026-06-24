import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getMiracles, getSupabaseErrorMessage } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { PageHeader, Loading, Empty, Chip, ErrorMessage } from "@/components/ui-common";

const CATEGORIES = ["الكل", "فلك", "طب", "جيولوجيا", "بيولوجيا", "فيزياء", "أخرى"];
const SOURCE_TYPES = ["الكل", "قرآن", "سنة"];

export default function MiraclesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("الكل");
  const [sourceType, setSourceType] = useState("الكل");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("search") || "");
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getMiracles({
      category: category === "الكل" ? undefined : category,
      sourceType: sourceType === "الكل" ? undefined : sourceType,
    }).then(({ data, error }) => {
      if (error) setError(getSupabaseErrorMessage(error, "تعذّر تحميل مقالات الإعجاز العلمي."));
      setItems(data);
      setLoading(false);
    }).catch((err) => {
      setError(getSupabaseErrorMessage(err, "تعذّر تحميل مقالات الإعجاز العلمي."));
      setLoading(false);
    });
  }, [category, sourceType]);

  const filtered = search.trim()
    ? items.filter((item) => item.title?.includes(search.trim()) || item.body?.includes(search.trim()) || item.reference?.includes(search.trim()))
    : items;

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <PageHeader
        eyebrow="علم وإيمان"
        title="الإعجاز العلمي"
        subtitle="مقالات موثّقة تربط الاكتشافات العلمية بالآيات القرآنية والأحاديث النبوية."
      />

      {error && <ErrorMessage text={error} />}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في مقالات الإعجاز..."
        style={{ width: "100%", boxSizing: "border-box", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, fontSize: "0.9rem", fontFamily: "inherit", outline: "none", background: C.panel, color: C.ink, marginBottom: "1rem" }}
      />

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        {CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {SOURCE_TYPES.map((s) => (
          <Chip key={s} active={sourceType === s} onClick={() => setSourceType(s)}>{s}</Chip>
        ))}
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? <Empty text={items.length === 0 ? "لا توجد مقالات بعد." : "لا توجد نتائج مطابقة."} /> : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {filtered.map((item: any) => (
            <div id={`miracle-${item.id}`} key={item.id} style={{ padding: "1.25rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <Link href={`/miracles/${item.id}`} style={{ fontWeight: 700, color: C.emeraldDeep, fontSize: "1rem" }}>{item.title}</Link>
                <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0, marginRight: "0.5rem" }}>
                  {item.category && <span style={{ fontSize: "0.75rem", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: C.sage, color: C.emeraldDeep }}>{item.category}</span>}
                  {item.source_type && <span style={{ fontSize: "0.75rem", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: C.parchmentDeep, color: C.brassDeep }}>{item.source_type}</span>}
                </div>
              </div>
              {item.reference && (
                <p style={{ fontSize: "0.75rem", color: C.brassDeep, fontStyle: "italic", marginBottom: "0.5rem" }}>{item.reference}</p>
              )}
              {item.body && (
                <>
                  <p style={{ fontSize: "0.875rem", color: C.ink, lineHeight: "1.75" }}>
                    {expanded === item.id ? item.body : `${item.body.slice(0, 200)}${item.body.length > 200 ? "..." : ""}`}
                  </p>
                  {item.body.length > 200 && (
                    <button
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                      style={{ fontSize: "0.75rem", color: C.emeraldDeep, background: "none", border: "none", cursor: "pointer", padding: "0.25rem 0", fontFamily: "inherit" }}
                    >
                      {expanded === item.id ? "عرض أقل" : "اقرأ المزيد"}
                    </button>
                  )}
                </>
              )}
              {item.scholarly_source && (
                <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.5rem" }}>المرجع: {item.scholarly_source}</p>
              )}
              <Link href={`/miracles/${item.id}`} style={{ display: "inline-block", marginTop: "0.5rem", fontSize: "0.8rem", color: C.brassDeep, fontWeight: 700 }}>
                فتح صفحة المقال
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
