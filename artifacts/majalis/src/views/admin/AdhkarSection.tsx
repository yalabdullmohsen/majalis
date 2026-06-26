import { useMemo, useState } from "react";
import {
  ADHKAR_CATEGORIES,
  type AdhkarItem,
} from "@/lib/adhkar-seed";
import {
  deleteAdhkarItem,
  getAllAdhkarForAdmin,
  isAdhkarHidden,
  newAdhkarId,
  setAdhkarHidden,
  upsertAdhkarItem,
} from "@/lib/adhkar-admin";
import { C } from "@/lib/theme";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { AdminSectionToolbar } from "./AdminSectionToolbar";
import { useAdminShell } from "./AdminShell";

const EMPTY: AdhkarItem = {
  id: "",
  categoryId: ADHKAR_CATEGORIES[0]?.id ?? "adh-morning",
  text: "",
  count: 1,
  keywords: [],
};

const BTN: React.CSSProperties = {
  padding: "0.25rem 0.75rem",
  borderRadius: "0.25rem",
  border: `1px solid ${C.line}`,
  background: C.panel,
  cursor: "pointer",
  fontSize: "0.75rem",
  fontFamily: "inherit",
};

export function AdhkarSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState(() => getAllAdhkarForAdmin());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<AdhkarItem | null>(null);
  const [form, setForm] = useState<AdhkarItem>(EMPTY);
  const [saving, setSaving] = useState(false);

  const reload = () => setItems(getAllAdhkarForAdmin());

  const filtered = useMemo(() => {
    const q = search.trim();
    return items.filter((item) => {
      if (category !== "all" && item.categoryId !== category) return false;
      if (!q) return true;
      const hay = `${item.text} ${item.source ?? ""} ${item.reference ?? ""} ${(item.keywords ?? []).join(" ")}`;
      return hay.includes(q);
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
          <button
            type="button"
            onClick={openAdd}
            style={{
              ...BTN,
              background: C.emerald,
              color: C.parchment,
              border: "none",
              fontWeight: 600,
              padding: "0.5rem 1.25rem",
            }}
          >
            + إضافة ذكر
          </button>
        }
        filters={
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ ...selectSt, width: "auto", flex: "0 1 200px" }}
          >
            <option value="all">كل الأقسام</option>
            {ADHKAR_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        }
      />

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {filtered.map((item) => {
          const hidden = isAdhkarHidden(item.id);
          return (
            <div
              key={item.id}
              style={{
                background: C.panel,
                border: `1px solid ${C.line}`,
                borderRadius: "0.375rem",
                padding: "1rem 1.25rem",
                opacity: hidden ? 0.65 : 1,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    padding: "0.125rem 0.5rem",
                    borderRadius: "0.25rem",
                    background: hidden ? "#FEE2E2" : "#D1FAE5",
                    color: hidden ? "#991B1B" : C.emeraldDeep,
                    fontSize: "0.75rem",
                    flexShrink: 0,
                  }}
                >
                  {hidden ? "مخفي" : "منشور"}
                </span>
                <p style={{ margin: 0, flex: 1, textAlign: "right", lineHeight: 1.75, fontSize: "0.9375rem" }}>
                  {item.text}
                </p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                  <button type="button" style={BTN} onClick={() => setPreview(item)}>معاينة</button>
                  <button type="button" style={BTN} onClick={() => openEdit(item)}>تعديل</button>
                  <button type="button" style={BTN} onClick={() => togglePublish(item)}>
                    {hidden ? "نشر" : "إخفاء"}
                  </button>
                  <button type="button" style={{ ...BTN, color: "#dc2626" }} onClick={() => handleDelete(item)}>
                    حذف
                  </button>
                </div>
                <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>
                  {categoryName(item.categoryId)} · ×{item.count}
                  {item.source ? ` · ${item.source}` : ""}
                </span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", color: C.inkSoft, padding: "2rem" }}>لا توجد أذكار مطابقة.</p>
        )}
      </div>

      <AdminModal title={form.id.startsWith("adh-custom") && !items.some((i) => i.id === form.id) ? "إضافة ذكر" : "تعديل ذكر"} open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="القسم">
          <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} style={selectSt}>
            {ADHKAR_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="نص الذكر">
          <textarea value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} style={textareaSt} />
        </Field>
        <Field label="عدد التكرار">
          <input type="number" min={1} value={form.count} onChange={(e) => setForm((f) => ({ ...f, count: Number(e.target.value) || 1 }))} style={inputSt} />
        </Field>
        <Field label="المصدر">
          <input value={form.source ?? ""} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} style={inputSt} />
        </Field>
        <Field label="الراوي">
          <input value={form.narrator ?? ""} onChange={(e) => setForm((f) => ({ ...f, narrator: e.target.value }))} style={inputSt} />
        </Field>
        <Field label="الدرجة">
          <input value={form.grade ?? ""} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))} style={inputSt} />
        </Field>
      </AdminModal>

      {preview && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(36,31,24,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={() => setPreview(null)}
        >
          <div
            style={{ background: C.parchment, borderRadius: "0.5rem", padding: "1.5rem", maxWidth: "32rem", width: "100%", border: `1px solid ${C.line}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 1rem", color: C.emeraldDeep }}>معاينة الذكر</h3>
            <p style={{ lineHeight: 1.9, margin: "0 0 1rem" }}>{preview.text}</p>
            <p style={{ fontSize: "0.8125rem", color: C.inkSoft, margin: 0 }}>
              {categoryName(preview.categoryId)} · ×{preview.count}
              {preview.source ? ` · ${preview.source}` : ""}
            </p>
            <button type="button" onClick={() => setPreview(null)} style={{ ...BTN, marginTop: "1rem" }}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
