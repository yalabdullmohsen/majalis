import { useEffect, useMemo, useState } from "react";
import {
  ADHKAR_CATEGORIES,
  type AdhkarItem,
} from "@/lib/adhkar-seed";
import { arabicMatchAny } from "@/lib/arabic-search";
import {
  deleteAdhkarItem,
  getAllAdhkarForAdmin,
  isAdhkarHidden,
  newAdhkarId,
  setAdhkarHidden,
  upsertAdhkarItem,
} from "@/lib/adhkar-admin";
import { AdminModal, Field } from "./AdminModal";
import { AdminSectionToolbar } from "./AdminSectionToolbar";
import { useAdminShell } from "./AdminShell";

const EMPTY: AdhkarItem = {
  id: "",
  categoryId: ADHKAR_CATEGORIES[0]?.id ?? "adh-morning",
  text: "",
  count: 1,
  keywords: [],
};

export function AdhkarSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState(() => getAllAdhkarForAdmin());
  const [search, setSearch] = useState(() => { const p = new URLSearchParams(window.location.search); return p.get("q") || ""; });
  const [category, setCategory] = useState("all");
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<AdhkarItem | null>(null);
  const [form, setForm] = useState<AdhkarItem>(EMPTY);
  const [saving, setSaving] = useState(false);

  const reload = () => setItems(getAllAdhkarForAdmin());

  useEffect(() => {
    if (!preview) return;
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") setPreview(null); };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [preview]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (category !== "all" && item.categoryId !== category) return false;
      return arabicMatchAny([item.text, item.source ?? "", item.reference ?? "", ...(item.keywords ?? [])], search);
    });
  }, [items, search, category]);

  const openAdd = () => {
    setForm({ ...EMPTY, id: newAdhkarId() });
    setOpen(true);
  };

  const openEdit = (item: AdhkarItem) => {
    setForm({ ...item, keywords: [...(item.keywords ?? [])] });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.text.trim()) {
      showError("نص الذكر مطلوب.");
      return;
    }
    setSaving(true);
    try {
      upsertAdhkarItem({
        ...form,
        text: form.text.trim(),
        count: Math.max(1, form.count || 1),
        keywords: form.keywords ?? [],
      });
      reload();
      setOpen(false);
      showSuccess("تم حفظ الذكر بنجاح.");
    } catch {
      showError("تعذر حفظ الذكر.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = (item: AdhkarItem) => {
    const hidden = isAdhkarHidden(item.id);
    setAdhkarHidden(item.id, !hidden);
    reload();
    showSuccess(hidden ? "تم نشر الذكر." : "تم إخفاء الذكر.");
  };

  const handleDelete = (item: AdhkarItem) => {
    if (!confirm("هل تريد حذف/إخفاء هذا الذكر؟")) return;
    deleteAdhkarItem(item.id);
    reload();
    showSuccess("تم حذف الذكر.");
  };

  const categoryName = (id: string) =>
    ADHKAR_CATEGORIES.find((c) => c.id === id)?.name ?? id;

  return (
    <div>
      <AdminSectionToolbar
        title="الأذكار"
        count={items.length}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث في الأذكار..."
        actions={
          <button type="button" onClick={openAdd} className="adh-add-btn">
            + إضافة ذكر
          </button>
        }
        filters={
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="adm-select adh-cat-select"
          >
            <option value="all">كل الأقسام</option>
            {ADHKAR_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        }
      />

      <div className="adh-list">
        {filtered.map((item) => {
          const hidden = isAdhkarHidden(item.id);
          return (
            <div key={item.id} className={`adh-item${hidden ? " adh-item--hidden" : ""}`}>
              <div className="adh-item__hdr">
                <span className={`adh-status${hidden ? " adh-status--hidden" : ""}`}>
                  {hidden ? "مخفي" : "منشور"}
                </span>
                <p className="adh-item__text">{item.text}</p>
              </div>
              <div className="adh-item__ftr">
                <div className="adh-btns">
                  <button type="button" className="adh-btn" onClick={() => setPreview(item)}>معاينة</button>
                  <button type="button" className="adh-btn" onClick={() => openEdit(item)}>تعديل</button>
                  <button type="button" className="adh-btn" onClick={() => togglePublish(item)}>
                    {hidden ? "نشر" : "إخفاء"}
                  </button>
                  <button type="button" className="adh-btn adh-btn--del" onClick={() => handleDelete(item)}>
                    حذف
                  </button>
                </div>
                <span className="adh-item__meta">
                  {categoryName(item.categoryId)} · ×{item.count}
                  {item.source ? ` · ${item.source}` : ""}
                </span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="adh-empty">لا توجد أذكار مطابقة.</p>
        )}
      </div>

      <AdminModal title={form.id.startsWith("adh-custom") && !items.some((i) => i.id === form.id) ? "إضافة ذكر" : "تعديل ذكر"} open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="القسم">
          <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="adm-select">
            {ADHKAR_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="نص الذكر">
          <textarea value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} className="adm-textarea" />
        </Field>
        <Field label="عدد التكرار">
          <input type="number" min={1} value={form.count} onChange={(e) => setForm((f) => ({ ...f, count: Number(e.target.value) || 1 }))} className="adm-input" />
        </Field>
        <Field label="المصدر">
          <input value={form.source ?? ""} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} className="adm-input" />
        </Field>
        <Field label="الراوي">
          <input value={form.narrator ?? ""} onChange={(e) => setForm((f) => ({ ...f, narrator: e.target.value }))} className="adm-input" />
        </Field>
        <Field label="الدرجة">
          <input value={form.grade ?? ""} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))} className="adm-input" />
        </Field>
      </AdminModal>

      {preview && (
        <div className="adm-modal__overlay" onClick={() => setPreview(null)}>
          <div className="adh-preview-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="adh-preview-h3">معاينة الذكر</h3>
            <p className="adh-preview-text">{preview.text}</p>
            <p className="adh-preview-meta">
              {categoryName(preview.categoryId)} · ×{preview.count}
              {preview.source ? ` · ${preview.source}` : ""}
            </p>
            <button type="button" onClick={() => setPreview(null)} className="adh-btn adh-btn--mt">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
