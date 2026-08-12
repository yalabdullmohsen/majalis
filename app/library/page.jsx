"use client";
// =====================================================================
//  app/library/page.jsx — المكتبة العلمية (من القاعدة)
// =====================================================================

import { useEffect, useState } from "react";
import { getLibrary } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { PageHeader, Loading, Empty, Chip } from "@/components/ui";

const TYPES = ["الكل", "كتاب", "متن", "تفريغ", "ملخص", "مقال", "صوت", "مرئي"];

export default function LibraryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("الكل");

  useEffect(() => {
    setLoading(true);
    getLibrary({ type: type === "الكل" ? null : type }).then(({ data }) => {
      setItems(data);
      setLoading(false);
    });
  }, [type]);

  return (
    <div className="max-w-4xl mx-auto px-5 pb-16 pt-10">
      <PageHeader
        eyebrow="أرشيف علمي"
        title="المكتبة العلمية"
        subtitle="كتب ومتون وتفريغات وملخصات ومقالات وتسجيلات صوتية ومرئية."
      />

      <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
        {TYPES.map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(t)}>{t}</Chip>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty text="المكتبة فارغة حاليًا — أضف عناصر من لوحة التحكم." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((it) => (
            <div key={it.id} className="rounded-md border p-4" style={{ borderColor: C.line, background: C.panel }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold" style={{ color: C.emeraldDeep }}>{it.title}</p>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: C.parchmentDeep, color: C.brassDeep }}>{it.type}</span>
              </div>
              {it.category && <p className="text-xs mb-2" style={{ color: C.inkSoft }}>{it.category}</p>}
              {it.description && <p className="text-sm leading-relaxed" style={{ color: C.ink }}>{it.description}</p>}
              {(it.file_url || it.external_url) && (
                <a href={it.file_url || it.external_url} target="_blank" rel="noopener noreferrer"
                   className="text-xs underline inline-block mt-2" style={{ color: C.emerald }}>
                  فتح / تحميل
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
