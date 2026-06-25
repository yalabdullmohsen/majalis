import { useEffect, useMemo, useState } from "react";
import {
  adminGetAllFiqhCouncilItems,
  adminUpsertFiqhCouncilItem,
  adminDeleteFiqhCouncilItem,
  adminSetFiqhCouncilItemStatus,
} from "@/lib/fiqh-council-supabase";
import {
  FIQH_COUNCIL_CATEGORIES,
  FIQH_ITEM_TYPES,
  FIQH_ITEM_TYPE_LABELS,
  FIQH_ITEM_STATUS_LABELS,
  fiqhItemHref,
  type FiqhItemStatus,
  type FiqhItemType,
} from "@/lib/fiqh-council-types";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { useAdminShell } from "./AdminShell";

const EMPTY = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  ruling_text: "",
  type: "resolution" as FiqhItemType,
  category: "القضايا المعاصرة",
  source_name: "",
  source_url: "",
  council_name: "المجمع الفقهي الإسلامي",
  session_number: "",
  session_date: "",
  tags: "",
  status: "draft" as FiqhItemStatus,
};

function slugify(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) || `fiqh-${Date.now()}`;
}

export function FiqhCouncilSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [filterType, setFilterType] = useState("الكل");
  const [adminSearch, setAdminSearch] = useState("");

  const load = () => {
    setLoading(true);
    adminGetAllFiqhCouncilItems()
      .then(({ data, error, usingSeed }) => {
        setItems(data);
        if (error && usingSeed) showError("تعذّر تحميل البيانات — عرض البذور المحلية.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filterStatus !== "الكل" && item.status !== filterStatus) return false;
      if (filterType !== "الكل" && item.type !== filterType) return false;
      if (adminSearch.trim()) {
        const q = adminSearch.trim();
        const hay = [item.title, item.summary, item.slug, item.category, ...(item.tags || [])].join(" ");
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, filterStatus, filterType, adminSearch]);

  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title?.trim()) return showError("العنوان مطلوب");
    const slug = form.slug?.trim() || slugify(form.title);
    setSaving(true);
    const payload = {
      ...form,
      slug,
      tags: String(form.tags || "")
        .split(/[,،]/)
        .map((t: string) => t.trim())
        .filter(Boolean),
    };
    const { error } = await adminUpsertFiqhCouncilItem(payload);
    setSaving(false);
    if (error) return showError(`تعذّر الحفظ: ${error.message}`);
    showSuccess("تم حفظ العنصر");
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا العنصر؟")) return;
    const { error } = await adminDeleteFiqhCouncilItem(id);
    if (error) showError(error.message);
    else showSuccess("تم الحذف");
    load();
  };

  const handleStatus = async (id: string, status: FiqhItemStatus) => {
    const { error } = await adminSetFiqhCouncilItemStatus(id, status);
    if (error) showError(error.message);
    else showSuccess(status === "published" ? "تم النشر" : status === "archived" ? "تمت الأرشفة" : "تم تحديث الحالة");
    load();
  };

  return (
    <div className="fiqh-council-admin">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, color: C.emeraldDeep }}>المجمع الفقهي ({filtered.length})</h2>
        <button
          onClick={() => { setForm({ ...EMPTY }); setOpen(true); }}
          style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer" }}
        >
          + إضافة
        </button>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selectSt}>
          <option value="الكل">كل الأنواع</option>
          {FIQH_ITEM_TYPES.map((t) => <option key={t} value={t}>{FIQH_ITEM_TYPE_LABELS[t]}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectSt}>
          <option value="الكل">كل الحالات</option>
          {Object.entries(FIQH_ITEM_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input
          value={adminSearch}
          onChange={(e) => setAdminSearch(e.target.value)}
          placeholder="بحث..."
          style={{ ...inputSt, flex: 1, minWidth: "140px" }}
        />
      </div>

      {loading ? <Loading /> : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {filtered.map((item) => (
            <div key={item.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem" }}>
              <strong>{item.title}</strong>
              <p style={{ margin: "0.5rem 0", fontSize: "0.875rem", color: C.inkSoft }}>
                {FIQH_ITEM_TYPE_LABELS[item.type as FiqhItemType]} · {item.category} · {FIQH_ITEM_STATUS_LABELS[item.status as FiqhItemStatus] || item.status}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button onClick={() => { setForm({ ...item, tags: (item.tags || []).join("، ") }); setOpen(true); }} style={{ fontSize: "0.75rem", cursor: "pointer" }}>تعديل</button>
                {item.status !== "published" && (
                  <button onClick={() => handleStatus(item.id, "published")} style={{ fontSize: "0.75rem", cursor: "pointer" }}>نشر</button>
                )}
                {item.status === "published" && (
                  <button onClick={() => handleStatus(item.id, "draft")} style={{ fontSize: "0.75rem", cursor: "pointer" }}>إلغاء النشر</button>
                )}
                {item.status !== "archived" && (
                  <button onClick={() => handleStatus(item.id, "archived")} style={{ fontSize: "0.75rem", cursor: "pointer" }}>أرشفة</button>
                )}
                <button onClick={() => setPreviewSlug(item.slug)} style={{ fontSize: "0.75rem", cursor: "pointer" }}>معاينة</button>
                <a href={fiqhItemHref(item.slug)} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem" }}>فتح</a>
                <button onClick={() => handleDelete(item.id)} style={{ fontSize: "0.75rem", color: "#dc2626", cursor: "pointer" }}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewSlug && (
        <AdminModal open={!!previewSlug} onClose={() => setPreviewSlug(null)} title="معاينة قبل النشر" onSave={() => setPreviewSlug(null)} saving={false}>
          <p style={{ fontSize: "0.875rem", color: C.inkSoft }}>
            المعاينة متاحة للعناصر المنشورة فقط. للمسودات، راجع النموذج أو انشر مؤقتاً للمعاينة.
          </p>
          <a href={fiqhItemHref(previewSlug)} target="_blank" rel="noopener noreferrer">فتح صفحة المعاينة</a>
        </AdminModal>
      )}

      <AdminModal open={open} onClose={() => setOpen(false)} title="عنصر المجمع الفقهي" onSave={handleSave} saving={saving}>
        <Field label="العنوان"><input style={inputSt} value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="الرابط (slug)"><input style={inputSt} value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} placeholder="يُولَّد تلقائياً من العنوان" /></Field>
        <Field label="النوع">
          <select style={selectSt} value={form.type} onChange={(e) => set("type", e.target.value)}>
            {FIQH_ITEM_TYPES.map((t) => <option key={t} value={t}>{FIQH_ITEM_TYPE_LABELS[t]}</option>)}
          </select>
        </Field>
        <Field label="التصنيف">
          <select style={selectSt} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {FIQH_COUNCIL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="الملخص"><textarea style={textareaSt} value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={2} /></Field>
        <Field label="المحتوى"><textarea style={textareaSt} value={form.content || ""} onChange={(e) => set("content", e.target.value)} rows={5} /></Field>
        <Field label="نص الحكم / الفتوى"><textarea style={textareaSt} value={form.ruling_text || ""} onChange={(e) => set("ruling_text", e.target.value)} rows={3} /></Field>
        <Field label="المصدر"><input style={inputSt} value={form.source_name || ""} onChange={(e) => set("source_name", e.target.value)} /></Field>
        <Field label="رابط المصدر"><input style={inputSt} value={form.source_url || ""} onChange={(e) => set("source_url", e.target.value)} /></Field>
        <Field label="المجلس"><input style={inputSt} value={form.council_name || ""} onChange={(e) => set("council_name", e.target.value)} /></Field>
        <Field label="رقم الجلسة"><input style={inputSt} value={form.session_number || ""} onChange={(e) => set("session_number", e.target.value)} /></Field>
        <Field label="تاريخ الجلسة"><input style={inputSt} type="date" value={form.session_date || ""} onChange={(e) => set("session_date", e.target.value)} /></Field>
        <Field label="الوسوم (مفصولة بفاصلة)"><input style={inputSt} value={form.tags || ""} onChange={(e) => set("tags", e.target.value)} /></Field>
        <Field label="الحالة">
          <select style={selectSt} value={form.status || "draft"} onChange={(e) => set("status", e.target.value)}>
            {Object.entries(FIQH_ITEM_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
      </AdminModal>
    </div>
  );
}
