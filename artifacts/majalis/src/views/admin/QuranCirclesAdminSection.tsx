import { useEffect, useState } from "react";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { useAdminShell } from "./AdminShell";
import { QURAN_CIRCLES_SEED, QURAN_CIRCLE_CATEGORIES, type QuranCircle } from "@/lib/quran-circles";

const STORAGE_KEY = "majlis_admin_quran_circles";

function loadCircles(): QuranCircle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as QuranCircle[];
  } catch { /* ignore */ }
  return QURAN_CIRCLES_SEED;
}

function saveCircles(items: QuranCircle[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const EMPTY: Partial<QuranCircle> = {
  name: "",
  sheikh_name: "",
  level: "مبتدئ",
  city: "الكويت",
  days: "",
  time: "",
  age_group: "",
  registration_method: "",
  description: "",
  categories: ["حفظ"],
  status: "open",
};

export function QuranCirclesAdminSection() {
  const { showSuccess } = useAdminShell();
  const [items, setItems] = useState<QuranCircle[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<QuranCircle>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    setItems(loadCircles());
    setLoading(false);
  }, []);

  const persist = (next: QuranCircle[]) => {
    setItems(next);
    saveCircles(next);
    showSuccess("تم الحفظ");
  };

  const set = (k: keyof QuranCircle, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, color: C.emeraldDeep }}>حلقات القرآن ({items.length})</h2>
        <button type="button" onClick={() => { setForm({ ...EMPTY, id: `halaqa-${Date.now()}` }); setEditId(null); setOpen(true); }} style={{ padding: "0.5rem 1rem", background: C.emerald, color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer" }}>+ إضافة</button>
      </div>
      {loading ? <Loading /> : items.map((item) => (
        <div key={item.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem", marginBottom: "0.75rem" }}>
          <strong>{item.name}</strong> — {item.sheikh_name} · {item.city}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button type="button" onClick={() => { setForm(item); setEditId(item.id); setOpen(true); }}>تعديل</button>
            <button type="button" style={{ color: "#dc2626" }} onClick={() => { if (confirm("حذف؟")) persist(items.filter((i) => i.id !== item.id)); }}>حذف</button>
          </div>
        </div>
      ))}
      <AdminModal open={open} onClose={() => setOpen(false)} title="حلقة قرآن" onSave={() => {
        if (!form.name?.trim()) return;
        const row = { ...EMPTY, ...form, id: form.id || `halaqa-${Date.now()}` } as QuranCircle;
        if (editId) persist(items.map((i) => (i.id === editId ? row : i)));
        else persist([row, ...items]);
        setOpen(false);
      }} saving={false}>
        <Field label="الاسم"><input style={inputSt} value={form.name || ""} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="الشيخ"><input style={inputSt} value={form.sheikh_name || ""} onChange={(e) => set("sheikh_name", e.target.value)} /></Field>
        <Field label="المدينة"><input style={inputSt} value={form.city || ""} onChange={(e) => set("city", e.target.value)} /></Field>
        <Field label="المستوى"><select style={selectSt} value={form.level || "مبتدئ"} onChange={(e) => set("level", e.target.value)}>{["مبتدئ", "متوسط", "متقدم", "حفظ كامل"].map((l) => <option key={l} value={l}>{l}</option>)}</select></Field>
        <Field label="التصنيف"><select style={selectSt} value={form.categories?.[0] || "حفظ"} onChange={(e) => set("categories", [e.target.value])}>{QURAN_CIRCLE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
        <Field label="الأيام"><input style={inputSt} value={form.days || ""} onChange={(e) => set("days", e.target.value)} /></Field>
        <Field label="الوقت"><input style={inputSt} value={form.time || ""} onChange={(e) => set("time", e.target.value)} /></Field>
        <Field label="الوصف"><textarea style={textareaSt} value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} /></Field>
      </AdminModal>
    </div>
  );
}
