import { useEffect, useState } from "react";
import { adminDeleteMosque, adminGetMosques, adminUpsertMosque } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, FieldRow, inputSt, textareaSt } from "./AdminModal";

const EMPTY: any = {
  name: "", governorate: "", area: "", address: "",
  latitude: "", longitude: "", google_maps_url: "", image_url: "",
};

const BTN_EDIT: React.CSSProperties = { padding: "0.25rem 0.625rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, background: C.panel, color: C.emeraldDeep, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" };
const BTN_DEL: React.CSSProperties = { ...BTN_EDIT, color: "#dc2626" };

export function MosquesSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    adminGetMosques().then(({ data }) => { setItems(data); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((m) =>
    !search.trim() || [m.name, m.governorate, m.area].some((v) => v?.includes(search.trim()))
  );

  const openAdd = () => { setForm({ ...EMPTY }); setOpen(true); };
  const openEdit = (item: any) => { setForm({ ...EMPTY, ...item }); setOpen(true); };
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل تريد حذف "${name}"؟`)) return;
    await adminDeleteMosque(id);
    load();
  };
  const handleSave = async () => {
    if (!form.name.trim()) return alert("اسم المسجد مطلوب");
    setSaving(true);
    const payload = {
      ...form,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    };
    await adminUpsertMosque(payload);
    setSaving(false);
    setOpen(false);
    load();
  };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>المساجد ({items.length})</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." style={{ ...inputSt, width: "10rem" }} />
          <button onClick={openAdd} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 }}>+ إضافة مسجد</button>
        </div>
      </div>

      {loading ? <Loading /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["الاسم", "المحافظة", "المنطقة", "إجراءات"].map((h) => (
                  <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "right", fontWeight: 700, color: C.inkSoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{m.name}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{m.governorate}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>{m.area}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>
                    <button style={BTN_EDIT} onClick={() => openEdit(m)}>تعديل</button>
                    {" "}
                    <button style={BTN_DEL} onClick={() => handleDelete(m.id, m.name)}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <AdminModal title={form.id ? "تعديل مسجد" : "إضافة مسجد"} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
          <Field label="اسم المسجد *"><input style={inputSt} value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <FieldRow>
            <Field label="المحافظة"><input style={inputSt} value={form.governorate} onChange={(e) => set("governorate", e.target.value)} /></Field>
            <Field label="المنطقة"><input style={inputSt} value={form.area} onChange={(e) => set("area", e.target.value)} /></Field>
          </FieldRow>
          <Field label="العنوان"><textarea style={textareaSt} value={form.address || ""} onChange={(e) => set("address", e.target.value)} /></Field>
          <FieldRow>
            <Field label="خط العرض"><input style={inputSt} value={form.latitude || ""} onChange={(e) => set("latitude", e.target.value)} /></Field>
            <Field label="خط الطول"><input style={inputSt} value={form.longitude || ""} onChange={(e) => set("longitude", e.target.value)} /></Field>
          </FieldRow>
          <Field label="رابط Google Maps"><input style={inputSt} value={form.google_maps_url || ""} onChange={(e) => set("google_maps_url", e.target.value)} /></Field>
          <Field label="رابط الصورة"><input style={inputSt} value={form.image_url || ""} onChange={(e) => set("image_url", e.target.value)} /></Field>
        </AdminModal>
      )}
    </div>
  );
}
