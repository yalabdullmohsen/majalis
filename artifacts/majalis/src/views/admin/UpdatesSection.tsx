import { T } from "@/lib/terminology";
import { adminGetAllUpdates, adminUpsertUpdate, adminDeleteUpdate } from "@/lib/platform-supabase";
import { UPDATES_SEED } from "@/lib/updates-seed";
import { UPDATE_TYPES } from "@/lib/platform-types";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { useAdminShell } from "./AdminShell";

const EMPTY = { title: "", summary: "", update_type: "إعلان", source_url: "", status: "approved", published_at: new Date().toISOString() };

export function UpdatesSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); adminGetAllUpdates().then(({ data }) => { setItems(data.length > 0 ? data : UPDATES_SEED); setLoading(false); }); };
  useEffect(() => { load(); }, []);
  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, color: C.emeraldDeep }}>{T.adminUpdates} ({items.length})</h2>
        <button onClick={() => { setForm({ ...EMPTY }); setOpen(true); }} style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer" }}>+ إضافة</button>
      </div>
      {loading ? <Loading /> : items.map((item) => (
        <div key={item.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: "0.75rem", background: C.sage, padding: "0.125rem 0.5rem", borderRadius: "0.25rem" }}>{item.update_type}</span>
          <strong style={{ display: "block", marginTop: "0.5rem" }}>{item.title}</strong>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button onClick={() => { setForm({ ...item }); setOpen(true); }} style={{ fontSize: "0.75rem" }}>تعديل</button>
            <button onClick={() => { if (confirm("حذف؟")) adminDeleteUpdate(item.id).then(load); }} style={{ fontSize: "0.75rem", color: "#dc2626" }}>حذف</button>
          </div>
        </div>
      ))}
      <AdminModal open={open} onClose={() => setOpen(false)} title="مستجد" onSave={async () => {
        if (!form.title?.trim()) return showError("العنوان مطلوب");
        setSaving(true);
        const { error } = await adminUpsertUpdate(form);
        setSaving(false);
        if (error) return showError(error.message);
        showSuccess("تم الحفظ"); setOpen(false); load();
      }} saving={saving}>
        <Field label="العنوان"><input style={inputSt} value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="النوع"><select style={selectSt} value={form.update_type} onChange={(e) => set("update_type", e.target.value)}>{UPDATE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
        <Field label="الملخص"><textarea style={textareaSt} value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={2} /></Field>
        <Field label="رابط"><input style={inputSt} value={form.source_url || ""} onChange={(e) => set("source_url", e.target.value)} /></Field>
        <Field label="الحالة"><select style={selectSt} value={form.status || "approved"} onChange={(e) => set("status", e.target.value)}><option value="approved">منشور</option><option value="pending">معلّق</option></select></Field>
      </AdminModal>
    </div>
  );
}
