import { useEffect, useState } from "react";
import { adminGetAllFawaid, moderateFawaid, adminDeleteFawaid, adminUpsertFawaid } from "@/lib/supabase";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field } from "./AdminModal";
import { BulkImport } from "./BulkImport";

const STATUS_OPTIONS: Record<string, string> = { approved: "مقبول", pending: "معلّق", rejected: "مرفوض" };
const EMPTY_FAWAID: any = { text: "", author_name: "", status: "approved" };

const STATUS_AR: Record<string, string> = { approved: "مقبول", pending: "معلّق", rejected: "مرفوض" };
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  approved: { bg: "#D1FAE5", text: "var(--majalis-emerald-deep)" },
  pending:  { bg: "rgba(14,110,82,0.08)", text: "#0E6E52" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
};
const FILTERS: [string, string][] = [["all", "الكل"], ["pending", "معلّقة"], ["approved", "مقبولة"], ["rejected", "مرفوضة"]];

export function FawaidSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState(() => { const p = new URLSearchParams(window.location.search); return p.get("q") || ""; });
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
      <div className="faw-header">
        <h2 className="faw-title">
          الفوائد ({items.length})
          {pendingCount > 0 && (
            <span className="faw-pending-badge">{pendingCount} بانتظار الموافقة</span>
          )}
        </h2>
        <div className="faw-actions">
          <BulkImport
            title="استيراد الفوائد"
            template={[{ text: "نص الفائدة العلمية أو الأثر…", author_name: "ابن القيم رحمه الله", status: "approved" }]}
            importRow={(row) => adminUpsertFawaid({ status: "approved", ...row })}
            onDone={load}
          />
          <button onClick={openAdd} className="faw-add-btn">+ إضافة فائدة</button>
        </div>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في الفوائد..." className="adm-input faw-search" />

      <div className="faw-filter-row">
        {FILTERS.map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`faw-filter-btn${filter === v ? " faw-filter-btn--active" : ""}`}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : (
        <div className="faw-grid">
          {filtered.map(item => {
            const sc = STATUS_COLORS[item.status] || { bg: "var(--majalis-parchment-deep)", text: "var(--majalis-ink-soft)" };
            return (
              <div key={item.id} className="faw-card">
                <div className="faw-card__header">
                  <span
                    className="faw-status-badge"
                    style={{ "--faw-status-bg": sc.bg, "--faw-status-color": sc.text } as React.CSSProperties}
                  >
                    {STATUS_AR[item.status] || item.status}
                  </span>
                  <p className="faw-card__text">{item.text}</p>
                </div>
                <div className="faw-card__footer">
                  <div className="faw-card__actions">
                    {item.status !== "approved" && (
                      <button onClick={() => moderate(item.id, "approved")} className="faw-approve-btn">
                        قبول
                      </button>
                    )}
                    {item.status !== "rejected" && (
                      <button onClick={() => moderate(item.id, "rejected")} className="faw-reject-btn">
                        رفض
                      </button>
                    )}
                    {item.status === "approved" && (
                      <button onClick={() => moderate(item.id, "pending")} className="faw-pending-btn">
                        إعادة للانتظار
                      </button>
                    )}
                    <button onClick={() => openEdit(item)} className="faw-edit-btn">تعديل</button>
                    <button onClick={() => handleDelete(item.id)} className="faw-del-btn">حذف</button>
                  </div>
                  <div className="faw-card__meta">
                    {item.author_name && <span>{item.author_name} · </span>}
                    <span>{new Date(item.created_at).toLocaleDateString("ar-KW")}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="faw-empty">لا توجد فوائد في هذه الفئة</p>}
        </div>
      )}

      <AdminModal title={form.id ? "تعديل الفائدة" : "إضافة فائدة جديدة"} open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="نص الفائدة *">
          <textarea className="adm-textarea faw-textarea--tall" value={form.text} onChange={e => set("text", e.target.value)} placeholder="اكتب نص الفائدة العلمية أو الأثر..." />
        </Field>
        <Field label="القائل / المصدر">
          <input className="adm-input" value={form.author_name || ""} onChange={e => set("author_name", e.target.value)} placeholder="اسم العالم أو المرجع (اختياري)" />
        </Field>
        <Field label="الحالة">
          <select className="adm-select" value={form.status} onChange={e => set("status", e.target.value)}>
            {Object.entries(STATUS_OPTIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </AdminModal>
    </div>
  );
}
