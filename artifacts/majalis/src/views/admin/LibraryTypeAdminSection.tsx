import { useEffect, useState } from "react";
import { adminGetLibrary, adminUpsertLibraryItem, adminDeleteLibraryItem } from "@/lib/supabase";
import { sanitizeText } from "@/lib/sanitize";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { BulkImport } from "./BulkImport";
import type { ContentType } from "@/lib/library/content-types";
import { validateContentTypeForSection } from "@/lib/library/content-types";

const BOOK_TYPES = ["كتاب", "متن", "شروح", "موسوعة"];
const ARTICLE_TYPES = ["مقال", "تفريغ", "ملخص"];

type Props = {
  contentType: ContentType;
};

export function LibraryTypeAdminSection({ contentType }: Props) {
  const isBook = contentType === "book";
  const label = isBook ? "الكتب" : "المقالات";
  const types = isBook ? BOOK_TYPES : ARTICLE_TYPES;

  const EMPTY: any = {
    title: "",
    author: "",
    category: "",
    item_type: types[0],
    type: types[0],
    content_type: contentType,
    description: "",
    status: "approved",
  };

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetLibrary()
      .then(({ data }) => {
        setItems(
          (data || []).filter((item: any) => {
            const ct = item.content_type || (item.type === "مقال" || item.item_type === "مقال" ? "article" : "book");
            return ct === contentType;
          }),
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [contentType]);

  const filtered = items.filter((item) => {
    const q = search.trim();
    if (!q) return true;
    return `${item.title} ${item.author ?? ""} ${item.category ?? ""}`.includes(q);
  });

  const handleSave = async () => {
    if (!form.title.trim()) return alert("العنوان مطلوب");
    const check = validateContentTypeForSection(contentType, contentType);
    if (!check.ok) return alert(check.error);

    setSaving(true);
    const payload = {
      ...form,
      content_type: contentType,
      type: form.item_type || form.type,
      item_type: form.item_type || form.type,
      title: sanitizeText(form.title, 300),
      author: sanitizeText(form.author, 200),
      description: sanitizeText(form.description, 4000),
      category: sanitizeText(form.category, 120),
    };
    await adminUpsertLibraryItem(payload);
    setSaving(false);
    setOpen(false);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>
          إدارة {label} ({items.length})
        </h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <BulkImport
            title={`استيراد ${label}`}
            template={[{
              title: isBook ? "كتاب العلم" : "مقال علمي",
              author: "المؤلف",
              category: "عقيدة",
              item_type: types[0],
              content_type: contentType,
              status: "approved",
            }]}
            importRow={(row) =>
              adminUpsertLibraryItem({
                status: "approved",
                content_type: contentType,
                type: row.item_type || types[0],
                ...row,
              })
            }
            onDone={load}
          />
          <button
            type="button"
            onClick={() => { setForm({ ...EMPTY }); setOpen(true); }}
            style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            + إضافة
          </button>
        </div>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." style={{ ...inputSt, maxWidth: "20rem", marginBottom: "1rem" }} />

      {loading ? <Loading /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["العنوان", isBook ? "المؤلف" : "الكاتب", "التصنيف", "النوع", "الحالة", "إجراءات"].map((h) => (
                  <th key={h} style={{ padding: "0.625rem", textAlign: "right", color: C.emeraldDeep }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.625rem" }}>{item.title}</td>
                  <td style={{ padding: "0.625rem", color: C.inkSoft }}>{item.author || "—"}</td>
                  <td style={{ padding: "0.625rem", color: C.inkSoft }}>{item.category || "—"}</td>
                  <td style={{ padding: "0.625rem", color: C.inkSoft }}>{item.item_type || item.type || "—"}</td>
                  <td style={{ padding: "0.625rem", color: C.inkSoft }}>{item.status || "—"}</td>
                  <td style={{ padding: "0.625rem" }}>
                    <button type="button" onClick={() => { setForm({ ...EMPTY, ...item, content_type: contentType }); setOpen(true); }} style={{ marginInlineEnd: "0.5rem" }}>تعديل</button>
                    <button type="button" onClick={() => { if (confirm("حذف؟")) adminDeleteLibraryItem(item.id).then(load); }}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal open={open} title={form.id ? `تعديل ${label.slice(0, -1)}` : `إضافة ${label.slice(0, -1)}`} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="العنوان"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputSt} /></Field>
        <Field label={isBook ? "المؤلف" : "الكاتب"}><input value={form.author || ""} onChange={(e) => setForm({ ...form, author: e.target.value })} style={inputSt} /></Field>
        <Field label="التصنيف"><input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputSt} /></Field>
        <Field label="النوع">
          <select value={form.item_type || types[0]} onChange={(e) => setForm({ ...form, item_type: e.target.value, type: e.target.value })} style={selectSt}>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <input type="hidden" value={contentType} readOnly />
        <Field label="الوصف"><textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} style={textareaSt} rows={4} /></Field>
      </AdminModal>
    </div>
  );
}

export function LibraryBooksAdminSection() {
  return <LibraryTypeAdminSection contentType="book" />;
}

export function LibraryArticlesAdminSection() {
  return <LibraryTypeAdminSection contentType="article" />;
}
