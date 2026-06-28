import { useEffect, useState } from "react";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { useAdminShell } from "./AdminShell";
import { MUTOON_SEED, MUTOON_CATEGORIES, type MutoonText } from "@/lib/mutoon";

const STORAGE_KEY = "majlis_admin_mutoon";

function loadMutoon(): MutoonText[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MutoonText[];
  } catch { /* ignore */ }
  return MUTOON_SEED;
}

function saveMutoon(items: MutoonText[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const EMPTY: Partial<MutoonText> = {
  name: "",
  author: "",
  category: "العقيدة",
  level: "مبتدئ",
  summary: "",
  text_excerpt: "",
  has_quiz: true,
};

export function MutoonAdminSection() {
  const { showSuccess } = useAdminShell();
  const [items, setItems] = useState<MutoonText[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<MutoonText>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    setItems(loadMutoon());
    setLoading(false);
  }, []);

  const persist = (next: MutoonText[]) => {
    setItems(next);
    saveMutoon(next);
    showSuccess("تم الحفظ");
  };

  const set = (k: keyof MutoonText, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, color: C.emeraldDeep }}>المتون العلمية ({items.length})</h2>
        <button type="button" onClick={() => { setForm({ ...EMPTY, id: `mutoon-${Date.now()}` }); setEditId(null); setOpen(true); }} style={{ padding: "0.5rem 1rem", background: C.emerald, color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer" }}>+ إضافة</button>
      </div>
      {loading ? <Loading /> : items.map((item) => (
        <div key={item.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem", marginBottom: "0.75rem" }}>
          <strong>{item.name}</strong> — {item.author} · {item.category}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button type="button" onClick={() => { setForm(item); setEditId(item.id); setOpen(true); }}>تعديل</button>
            <button type="button" style={{ color: "#dc2626" }} onClick={() => { if (confirm("حذف؟")) persist(items.filter((i) => i.id !== item.id)); }}>حذف</button>
          </div>
        </div>
      ))}
      <AdminModal open={open} onClose={() => setOpen(false)} title="متن علمي" onSave={() => {
        if (!form.name?.trim()) return;
        const row = { ...EMPTY, ...form, id: form.id || `mutoon-${Date.now()}` } as MutoonText;
        if (editId) persist(items.map((i) => (i.id === editId ? row : i)));
        else persist([row, ...items]);
        setOpen(false);
      }} saving={false}>
        <Field label="الاسم"><input style={inputSt} value={form.name || ""} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="المؤلف"><input style={inputSt} value={form.author || ""} onChange={(e) => set("author", e.target.value)} /></Field>
        <Field label="التصنيف"><select style={selectSt} value={form.category || "العقيدة"} onChange={(e) => set("category", e.target.value)}>{MUTOON_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
        <Field label="المستوى"><select style={selectSt} value={form.level || "مبتدئ"} onChange={(e) => set("level", e.target.value)}>{["مبتدئ", "متوسط", "متقدم", "تخصص"].map((l) => <option key={l} value={l}>{l}</option>)}</select></Field>
        <Field label="الملخص"><textarea style={textareaSt} value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={2} /></Field>
        <Field label="نص المتن"><textarea style={textareaSt} value={form.text_excerpt || ""} onChange={(e) => set("text_excerpt", e.target.value)} rows={4} /></Field>
      </AdminModal>
    </div>
  );
}
