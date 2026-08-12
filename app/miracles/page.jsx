"use client";
// =====================================================================
//  app/miracles/page.jsx — الإعجاز العلمي (من القاعدة)
// =====================================================================

import { useEffect, useState } from "react";
import { getMiracles } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { PageHeader, Loading, Empty, Chip } from "@/components/ui";

export default function MiraclesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("الكل");

  useEffect(() => {
    setLoading(true);
    getMiracles({ sourceType: source === "الكل" ? null : source }).then(({ data }) => {
      setItems(data);
      setLoading(false);
    });
  }, [source]);

  return (
    <div className="max-w-3xl mx-auto px-5 pb-16 pt-10">
      <PageHeader
        eyebrow="بضوابط شرعية وعلمية"
        title="الإعجاز العلمي"
        subtitle="مقالات موثّقة في الإعجاز العلمي في القرآن والسنة، مربوطة بالآيات والأحاديث ومراجعها، مع تجنّب النظريات غير الثابتة."
      />

      <div className="flex gap-2 mb-5">
        {["الكل", "قرآن", "سنة"].map((s) => (
          <Chip key={s} active={source === s} onClick={() => setSource(s)}>{s}</Chip>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty text="لا توجد مقالات بعد — تُضاف من لوحة التحكم بمحتوى موثّق." />
      ) : (
        <div className="space-y-4">
          {items.map((m) => (
            <div key={m.id} className="rounded-md border p-5" style={{ borderColor: C.line, background: C.panel }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold" style={{ color: C.emeraldDeep }}>{m.title}</h2>
                <div className="flex gap-2">
                  {m.source_type && <span className="text-xs px-2 py-0.5 rounded" style={{ background: C.sage, color: C.emeraldDeep }}>{m.source_type}</span>}
                  {m.category && <span className="text-xs px-2 py-0.5 rounded" style={{ background: C.parchmentDeep, color: C.brassDeep }}>{m.category}</span>}
                </div>
              </div>
              {m.reference && <p className="text-sm mb-2" style={{ color: C.brassDeep, fontFamily: "Amiri, serif" }}>{m.reference}</p>}
              {m.body && <p className="text-sm leading-relaxed mb-2" style={{ color: C.ink }}>{m.body}</p>}
              {m.scholarly_source && <p className="text-xs" style={{ color: C.inkSoft }}>المرجع: {m.scholarly_source}</p>}
              {m.media_url && (
                <a href={m.media_url} target="_blank" rel="noopener noreferrer" className="text-xs underline inline-block mt-2" style={{ color: C.emerald }}>
                  مشاهدة الوسيط
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
