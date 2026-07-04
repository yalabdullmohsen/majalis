import { useEffect, useState } from "react";
import { adminGetAllFawaid, moderateFawaid, adminDeleteFawaid, adminUpsertFawaid } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { BulkImport } from "./BulkImport";

const STATUS_OPTIONS: Record<string, string> = { approved: "مقبول", pending: "معلّق", rejected: "مرفوض" };
const EMPTY_FAWAID: any = { text: "", author_name: "", status: "approved" };

const STATUS_AR: Record<string, string> = { approved: "مقبول", pending: "معلّق", rejected: "مرفوض" };
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  approved: { bg: "#D1FAE5", text: C.emeraldDeep },
  pending:  { bg: "#FEF3C7", text: "#92400E" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
};
const FILTERS: [string, string][] = [["all", "الكل"], ["pending", "معلّقة"], ["approved", "مقبولة"], ["rejected", "مرفوضة"]];

export function FawaidSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY_FAWAID);
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); adminGetAllFawaid().then(({ data }) => {  setItems(data ?? []); setLoading(false);  }).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const moderate = async (id: string, status: string) => { await moderateFawaid(id, status); load(); };
  const handleDelete = async (id: string) => { if (!confirm("هل تريد حذف هذه الفائدة نهائيًا؟")) return; await adminDeleteFawaid(id); load(); };

  const openAdd = () => { setForm({ ...EMPTY_FAWAID }); setOpen(true); };
  const openEdit = (item: any) => { setForm({ id: item.id, text: item.text || "", author_name: item.author_name || "", status: item.status || "approved" }); setOpen(true); };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const handleSave = async () => {
    if (!form.text.trim()) return alert("نص الفائدة مطلوب");
    setSaving(true);
    const { error } = await adminUpsertFawaid(form);
    setSaving(false);
    if (error) return alert(`تعذّر الحفظ: ${error.message}`);
    setOpen(false); load();
  };

  const filtered = items
    .filter((i) => filter === "all" || i.status === filter)
    .filter((i) => {
      const q = search.trim();
      if (!q) return true;
      return `${i.text} ${i.author_name ?? ""}`.includes(q);
    });
  const pendingCount = items.filter(i => i.status === "pending").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          الفوائد ({items.length})
          {pendingCount > 0 && (
            <span style={{ padding: "0.1rem 0.5rem", borderRadius: "0.75rem", background: "#dc2626", color: "#fff", fontSize: "0.75rem" }}>{pendingCount} بانتظار الموافقة</span>
          )}
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <BulkImport
            title="استيراد الفوائد"
            template={[{ text: "نص الفائدة العلمية أو الأثر…", author_name: "ابن القيم رحمه الله", status: "approved" }]}
            importRow={(row) => adminUpsertFawaid({ status: "approved", ...row })}
            onDone={load}
          />
          <button onClick={openAdd} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 }}>+ إضافة فائدة</button>
        </div>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في الفوائد..." style={{ ...inputSt, maxWidth: "20rem", marginBottom: "0.75rem" }} />

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {FILTERS.map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              style={{ padding: "0.375rem 0.875rem", borderRadius: "0.375rem", border: `1px solid ${filter === v ? C.emerald : C.line}`, background: filter === v ? C.emerald : C.panel, color: filter === v ? C.parchment : C.inkSoft, cursor: "pointer", fontSize: "0.8125rem", fontFamily: "inherit" }}
            >
              {l}
            </button>
          ))}
      </div>

      {loading ? <Loading /> : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {filtered.map(item => {
            const sc = STATUS_COLORS[item.status] || { bg: C.parchmentDeep, text: C.inkSoft };
            return (
              <div key={item.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
                  <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: sc.bg, color: sc.text, fontSize: "0.75rem", flexShrink: 0, alignSelf: "flex-start", marginTop: "0.2rem" }}>
                    {STATUS_AR[item.status] || item.status}
                  </span>
                  <p style={{ margin: 0, fontSize: "0.9375rem", color: C.ink, lineHeight: "1.75", flex: 1, textAlign: "right" }}>{item.text}</p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.625rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {item.status !== "approved" && (
                      <button onClick={() => moderate(item.id, "approved")} style={{ padding: "0.25rem 0.75rem", borderRadius: "0.25rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>
                        قبول
                      </button>
                    )}
                    {item.status !== "rejected" && (
                      <button onClick={() => moderate(item.id, "rejected")} style={{ padding: "0.25rem 0.75rem", borderRadius: "0.25rem", background: C.panel, color: "#dc2626", border: `1px solid ${C.line}`, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>
                        رفض
                      </button>
                    )}
                    {item.status === "approved" && (
                      <button onClick={() => moderate(item.id, "pending")} style={{ padding: "0.25rem 0.75rem", borderRadius: "0.25rem", background: C.panel, color: C.inkSoft, border: `1px solid ${C.line}`, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>
                        إعادة للانتظار
                      </button>
                    )}
                    <button onClick={() => openEdit(item)} style={{ padding: "0.25rem 0.75rem", borderRadius: "0.25rem", background: C.panel, color: C.emeraldDeep, border: `1px solid ${C.line}`, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>
                      تعديل
                    </button>
                    <button onClick={() => handleDelete(item.id)} style={{ padding: "0.25rem 0.75rem", borderRadius: "0.25rem", background: C.panel, color: C.inkSoft, border: `1px solid ${C.line}`, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>
                      حذف
                    </button>
                  </div>
                  <div style={{ textAlign: "left", fontSize: "0.75rem", color: C.inkSoft }}>
                    {item.author_name && <span>{item.author_name} · </span>}
                    <span>{new Date(item.created_at).toLocaleDateString("ar-KW")}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p style={{ textAlign: "center", color: C.inkSoft, padding: "2.5rem" }}>لا توجد فوائد في هذه الفئة</p>}
        </div>
      )}

      <AdminModal title={form.id ? "تعديل الفائدة" : "إضافة فائدة جديدة"} open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="نص الفائدة *">
          <textarea style={{ ...textareaSt, minHeight: "7rem" }} value={form.text} onChange={e => set("text", e.target.value)} placeholder="اكتب نص الفائدة العلمية أو الأثر..." />
        </Field>
        <Field label="القائل / المصدر">
          <input style={inputSt} value={form.author_name || ""} onChange={e => set("author_name", e.target.value)} placeholder="اسم العالم أو المرجع (اختياري)" />
        </Field>
        <Field label="الحالة">
          <select style={selectSt} value={form.status} onChange={e => set("status", e.target.value)}>
            {Object.entries(STATUS_OPTIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </AdminModal>
    </div>
  );
}
