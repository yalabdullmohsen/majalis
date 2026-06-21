import { useEffect, useState } from "react";
import { getLibrary } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { PageHeader, Loading, Empty, Chip } from "@/components/ui-common";

const TYPES = ["الكل", "كتاب", "متن", "تفريغ", "ملخص", "مقال", "صوت", "مرئي"];

export default function LibraryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("الكل");

  useEffect(() => {
    setLoading(true);
    getLibrary({ type: type === "الكل" ? undefined : type }).then(({ data }) => {
      setItems(data);
      setLoading(false);
    });
  }, [type]);

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <PageHeader
        eyebrow="الأرشيف العلمي"
        title="المكتبة العلمية"
        subtitle="كتب ومتون وتفريغات وملخصات ومقالات وصوتيات ومرئيات شرعية معتمدة."
      />

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {TYPES.map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(t)}>{t}</Chip>
        ))}
      </div>

      {loading ? <Loading /> : items.length === 0 ? <Empty text="لا توجد مواد بعد." /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.75rem" }}>
          {items.map((item: any) => (
            <div key={item.id} style={{ padding: "1rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <p style={{ fontWeight: 700, color: C.ink, fontSize: "0.9375rem" }}>{item.title}</p>
                <span style={{ fontSize: "0.75rem", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: C.sage, color: C.emeraldDeep, flexShrink: 0, marginRight: "0.5rem" }}>{item.type}</span>
              </div>
              {item.category && <p style={{ fontSize: "0.75rem", color: C.brassDeep, marginBottom: "0.25rem" }}>{item.category}</p>}
              {item.description && <p style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: "1.6", marginBottom: "0.75rem" }}>{item.description}</p>}
              {(item.file_url || item.external_url) && (
                <a
                  href={item.file_url || item.external_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: "0.75rem", color: C.emeraldDeep, textDecoration: "underline" }}
                >
                  فتح المادة ←
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
