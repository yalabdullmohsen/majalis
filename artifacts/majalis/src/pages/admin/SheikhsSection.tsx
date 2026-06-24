import { useEffect, useRef, useState } from "react";
import { adminGetSheikhs, adminUpsertSheikh, adminDeleteSheikh, uploadSheikhImage, deleteSheikhImage } from "@/lib/supabase";
import { C, GOVERNORATES } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, FieldRow, inputSt, selectSt, textareaSt } from "./AdminModal";
import { BulkImport } from "./BulkImport";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { resolveSheikhImageUrl } from "@/lib/sheikh-image";

const toArr = (v: any) => Array.isArray(v) ? v : (v ? String(v).split(/[،,]/).map((s: string) => s.trim()).filter(Boolean) : []);

const EMPTY: any = {
  name: "", bio: "", biography: "", city: "", photo_url: "", image_url: "",
  years_experience: "", is_verified: false, specialties: "", qualifications: "", ijazah: "",
};

const BTN_EDIT: React.CSSProperties = { padding: "0.25rem 0.625rem", borderRadius: "0.25rem", border: `1px solid ${C.line}`, background: C.panel, color: C.emeraldDeep, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" };
const BTN_DEL: React.CSSProperties = { ...BTN_EDIT, color: "#dc2626" };

export function SheikhsSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => { setLoading(true); adminGetSheikhs().then(({ data }) => { setItems(data); setLoading(false); }); };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ ...EMPTY }); setImageFile(null); setImagePreview(""); setOpen(true); };
  const openEdit = (item: any) => {
    setForm({ ...EMPTY, ...item, specialties: (item.specialties || []).join("، "), qualifications: (item.qualifications || []).join("، ") });
    setImageFile(null);
    setImagePreview(resolveSheikhImageUrl(item) || "");
    setOpen(true);
  };
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل تريد حذف الشيخ "${name}"؟`)) return;
    await adminDeleteSheikh(id); load();
  };
  const handleSave = async () => {
    if (!form.name.trim()) return alert("الاسم مطلوب");
    setSaving(true);
    try {
      let imageUrl = form.image_url || form.photo_url || "";
      if (imageFile) {
        imageUrl = await uploadSheikhImage(imageFile, form.id);
      }
      const payload = {
        ...form,
        image_url: imageUrl || null,
        photo_url: imageUrl || form.photo_url || null,
        years_experience: form.years_experience ? parseInt(form.years_experience) : null,
        specialties: form.specialties ? form.specialties.split(/[،,]/).map((s: string) => s.trim()).filter(Boolean) : [],
        qualifications: form.qualifications ? form.qualifications.split(/[،,]/).map((s: string) => s.trim()).filter(Boolean) : [],
      };
      await adminUpsertSheikh(payload);
      setOpen(false);
      setImageFile(null);
      setImagePreview("");
      load();
    } catch (err: any) {
      alert(err?.message || "تعذر حفظ بيانات الشيخ.");
    } finally {
      setSaving(false);
    }
  };

  const handleImagePick = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("يرجى اختيار ملف صورة.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async () => {
    const current = resolveSheikhImageUrl(form);
    if (current && current.includes("/storage/v1/object/public/sheikhs/")) {
      await deleteSheikhImage(current);
    }
    setImageFile(null);
    setImagePreview("");
    setForm((f: any) => ({ ...f, image_url: "", photo_url: "" }));
  };
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>المشايخ ({items.length})</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <BulkImport
            title="استيراد المشايخ"
            hint="التخصصات والمؤهلات يمكن أن تكون مصفوفة نصوص أو نصًا مفصولًا بفواصل."
            template={[{ name: "الشيخ عبدالله الأنصاري", city: "العاصمة", bio: "نبذة مختصرة", specialties: ["الفقه", "العقيدة"], qualifications: ["بكالوريوس شريعة"], years_experience: 10, is_verified: true }]}
            importRow={(row) => adminUpsertSheikh({
              ...row,
              specialties: toArr(row.specialties),
              qualifications: toArr(row.qualifications),
              years_experience: row.years_experience ? parseInt(row.years_experience) : null,
            })}
            onDone={load}
          />
          <button onClick={openAdd} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 }}>+ إضافة شيخ</button>
        </div>
      </div>

      {loading ? <Loading /> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["الاسم", "المحافظة", "الحالة", "التخصصات", "سنوات الخبرة", "إجراءات"].map(h => (
                  <th key={h} style={{ padding: "0.625rem 0.75rem", textAlign: "right", color: C.emeraldDeep, fontWeight: 700, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.625rem 0.75rem", color: C.ink, fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft }}>{item.city || "—"}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>
                    <span style={{ padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: item.is_verified ? C.sage : C.parchmentDeep, color: item.is_verified ? C.emeraldDeep : C.inkSoft, fontSize: "0.75rem" }}>
                      {item.is_verified ? "معتمد ✓" : "غير معتمد"}
                    </span>
                  </td>
                  <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {(item.specialties || []).join("، ") || "—"}
                  </td>
                  <td style={{ padding: "0.625rem 0.75rem", color: C.inkSoft, textAlign: "center" }}>{item.years_experience ?? "—"}</td>
                  <td style={{ padding: "0.625rem 0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.375rem" }}>
                      <button onClick={() => openEdit(item)} style={BTN_EDIT}>تعديل</button>
                      <button onClick={() => handleDelete(item.id, item.name)} style={BTN_DEL}>حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p style={{ textAlign: "center", color: C.inkSoft, padding: "2rem" }}>لا يوجد مشايخ — ابدأ بإضافة أول شيخ</p>}
        </div>
      )}

      <AdminModal title={form.id ? "تعديل بيانات الشيخ" : "إضافة شيخ جديد"} open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="الاسم الكامل *">
          <input style={inputSt} value={form.name} onChange={e => set("name", e.target.value)} placeholder="اسم الشيخ" />
        </Field>
        <Field label="المحافظة">
          <select style={selectSt} value={form.city || ""} onChange={e => set("city", e.target.value)}>
            <option value="">اختر المحافظة</option>
            {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="نبذة تعريفية مختصرة">
          <textarea style={textareaSt} value={form.bio || ""} onChange={e => set("bio", e.target.value)} placeholder="وصف مختصر يظهر في بطاقة الشيخ..." />
        </Field>
        <Field label="السيرة العلمية التفصيلية">
          <textarea style={{ ...textareaSt, minHeight: "7rem" }} value={form.biography || ""} onChange={e => set("biography", e.target.value)} placeholder="السيرة العلمية الكاملة..." />
        </Field>
        <Field label="التخصصات (افصل بفاصلة)">
          <input style={inputSt} value={form.specialties || ""} onChange={e => set("specialties", e.target.value)} placeholder="الفقه، العقيدة، التفسير" />
        </Field>
        <Field label="المؤهلات العلمية (افصل بفاصلة)">
          <input style={inputSt} value={form.qualifications || ""} onChange={e => set("qualifications", e.target.value)} placeholder="بكالوريوس شريعة، ماجستير فقه مقارن" />
        </Field>
        <Field label="الإجازات العلمية">
          <input style={inputSt} value={form.ijazah || ""} onChange={e => set("ijazah", e.target.value)} placeholder="إجازات التسميع والرواية..." />
        </Field>
        <FieldRow>
          <Field label="سنوات الخبرة">
            <input type="number" style={inputSt} value={form.years_experience || ""} onChange={e => set("years_experience", e.target.value)} placeholder="عدد السنوات" min={0} />
          </Field>
          <Field label="رابط صورة خارجي (اختياري)">
            <input style={inputSt} value={form.image_url || form.photo_url || ""} onChange={e => { set("image_url", e.target.value); set("photo_url", e.target.value); setImagePreview(e.target.value); setImageFile(null); }} placeholder="https://..." />
          </Field>
        </FieldRow>
        <Field label="صورة الشيخ">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <SheikhAvatar src={imagePreview || resolveSheikhImageUrl(form)} name={form.name || "شيخ"} size={96} />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => handleImagePick(e.target.files?.[0] || null)} />
              <button type="button" style={BTN_EDIT} onClick={() => fileInputRef.current?.click()}>رفع صورة</button>
              {(imagePreview || resolveSheikhImageUrl(form)) && (
                <button type="button" style={BTN_DEL} onClick={handleRemoveImage}>حذف الصورة</button>
              )}
              <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>معاينة قبل الحفظ — تُرفع عند الضغط على «حفظ»</span>
            </div>
          </div>
        </Field>
        <Field label="الاعتماد">
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input type="checkbox" checked={!!form.is_verified} onChange={e => set("is_verified", e.target.checked)} />
            <span style={{ color: C.inkSoft, fontSize: "0.875rem" }}>شيخ معتمد ومُراجَع من فريق المنصة</span>
          </label>
        </Field>
      </AdminModal>
    </div>
  );
}
