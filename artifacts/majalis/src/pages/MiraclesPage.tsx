import { useEffect, useState } from "react";
import { getMiracles } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { PageHeader, Loading, Empty, Chip } from "@/components/ui-common";

const CATEGORIES = ["الكل", "فلك", "طب", "جيولوجيا", "بيولوجيا", "فيزياء", "أخرى"];
const SOURCE_TYPES = ["الكل", "قرآن", "سنة"];

export default function MiraclesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("الكل");
  const [sourceType, setSourceType] = useState("الكل");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getMiracles({
      category: category === "الكل" ? undefined : category,
      sourceType: sourceType === "الكل" ? undefined : sourceType,
    }).then(({ data }) => {
      setItems(data);
      setLoading(false);
    });
  }, [category, sourceType]);

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <PageHeader
        eyebrow="علم وإيمان"
        title="الإعجاز العلمي"
        subtitle="مقالات موثّقة تربط الاكتشافات العلمية بالآيات القرآنية والأحاديث النبوية."
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

      {loading ? <Loading /> : items.length === 0 ? <Empty text="لا توجد مقالات بعد." /> : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {items.map((item: any) => (
            <div key={item.id} style={{ padding: "1.25rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <p style={{ fontWeight: 700, color: C.emeraldDeep, fontSize: "1rem" }}>{item.title}</p>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
