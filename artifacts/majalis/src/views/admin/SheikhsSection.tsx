import { useEffect, useRef, useState } from "react";
import { adminGetSheikhs, adminUpsertSheikh, adminDeleteSheikh, uploadSheikhImage, deleteSheikhImage } from "@/lib/supabase";
import { GOVERNORATES } from "@/lib/theme";
import { SkeletonCardGrid } from "@/components/ui-common";
import { AdminModal, Field, FieldRow } from "./AdminModal";
import { BulkImport } from "./BulkImport";
import { SheikhAvatar } from "@/components/lessons/SheikhAvatar";
import { resolveSheikhImageUrl } from "@/lib/sheikh-image";
import { sanitizeText, sanitizeOptionalUrl } from "@/lib/sanitize";
import { validateSheikhImage } from "@/lib/file-validation";

const toArr = (v: any) => Array.isArray(v) ? v : (v ? String(v).split(/[،,]/).map((s: string) => s.trim()).filter(Boolean) : []);

const EMPTY: any = {
  name: "", bio: "", biography: "", city: "", photo_url: "", image_url: "",
  years_experience: "", is_verified: false, specialties: "", qualifications: "", ijazah: "",
};

export function SheikhsSection() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => { const p = new URLSearchParams(window.location.search); return p.get("q") || ""; });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => { setLoading(true); adminGetSheikhs().then(({ data }) => {  setItems(data ?? []); setLoading(false);  }).catch(() => {}).finally(() => setLoading(false)); };
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
        name: sanitizeText(form.name, 200),
        bio: sanitizeText(form.bio, 2000),
        biography: sanitizeText(form.biography, 10000),
        city: sanitizeText(form.city, 80),
        ijazah: sanitizeText(form.ijazah, 500),
        image_url: imageUrl || null,
        photo_url: imageUrl || sanitizeOptionalUrl(form.photo_url) || null,
        years_experience: form.years_experience ? parseInt(form.years_experience) : null,
        specialties: form.specialties ? form.specialties.split(/[،,]/).map((s: string) => sanitizeText(s, 80)).filter(Boolean) : [],
        qualifications: form.qualifications ? form.qualifications.split(/[،,]/).map((s: string) => sanitizeText(s, 120)).filter(Boolean) : [],
      };
      await adminUpsertSheikh(payload);
      setOpen(false);
      setImageFile(null);
      setImagePreview("");
      load();
    } catch {
      alert("تعذر حفظ بيانات الشيخ.");
    } finally {
      setSaving(false);
    }
  };

  const handleImagePick = (file: File | null) => {
    if (!file) return;
    const check = validateSheikhImage(file);
    if (!check.ok) {
      alert(check.error);
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

  const filtered = items.filter((item) => {
    const q = search.trim();
    if (!q) return true;
    const hay = `${item.name} ${item.city ?? ""} ${(item.specialties || []).join(" ")}`;
    return hay.includes(q);
  });

  return (
    <div>
      <div className="skh-header">
        <h2 className="skh-title">المشايخ ({items.length})</h2>
        <div className="skh-actions">
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
          <button type="button" onClick={openAdd} className="skh-add-btn">+ إضافة شيخ</button>
        </div>
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في المشايخ..." className="adm-input skh-search" />

      {loading ? <SkeletonCardGrid count={6} /> : (
        <div className="skh-table-wrap">
          <table className="skh-table">
            <thead>
              <tr className="skh-thead-row">
                {["الاسم", "المحافظة", "الحالة", "التخصصات", "سنوات الخبرة", "إجراءات"].map(h => (
                  <th key={h} className="skh-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="skh-tr">
                  <td className="skh-td skh-td--name">{item.name}</td>
                  <td className="skh-td">{item.city || "—"}</td>
                  <td className="skh-td">
                    <span
                      className="skh-verified-badge"
                      style={item.is_verified
                        ? { "--skh-badge-bg": "var(--majalis-sage)", "--skh-badge-color": "var(--majalis-emerald-deep)" } as React.CSSProperties
                        : undefined
                      }
                    >
                      {item.is_verified ? "معتمد" : "غير معتمد"}
                    </span>
                  </td>
                  <td className="skh-td skh-td--specialty">
                    {(item.specialties || []).join("، ") || "—"}
                  </td>
                  <td className="skh-td skh-td--center">{item.years_experience ?? "—"}</td>
                  <td className="skh-td">
                    <div className="skh-cell-actions">
                      <button type="button" onClick={() => openEdit(item)} className="skh-btn-edit">تعديل</button>
                      <button type="button" onClick={() => handleDelete(item.id, item.name)} className="skh-btn-del">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="skh-empty">{search ? "لا يوجد مشايخ مطابقون" : "لا يوجد مشايخ — ابدأ بإضافة أول شيخ"}</p>}
        </div>
      )}

      <AdminModal title={form.id ? "تعديل بيانات الشيخ" : "إضافة شيخ جديد"} open={open} onClose={() => setOpen(false)} onSave={handleSave} saving={saving}>
        <Field label="الاسم الكامل *">
          <input className="adm-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="اسم الشيخ" />
        </Field>
        <Field label="المحافظة">
          <select className="adm-select" value={form.city || ""} onChange={e => set("city", e.target.value)}>
            <option value="">اختر المحافظة</option>
            {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="نبذة تعريفية مختصرة">
          <textarea className="adm-textarea" value={form.bio || ""} onChange={e => set("bio", e.target.value)} placeholder="وصف مختصر يظهر في بطاقة الشيخ..." />
        </Field>
        <Field label="السيرة العلمية التفصيلية">
          <textarea className="adm-textarea skh-textarea--tall" value={form.biography || ""} onChange={e => set("biography", e.target.value)} placeholder="السيرة العلمية الكاملة..." />
        </Field>
        <Field label="التخصصات (افصل بفاصلة)">
          <input className="adm-input" value={form.specialties || ""} onChange={e => set("specialties", e.target.value)} placeholder="الفقه، العقيدة، التفسير" />
        </Field>
        <Field label="المؤهلات العلمية (افصل بفاصلة)">
          <input className="adm-input" value={form.qualifications || ""} onChange={e => set("qualifications", e.target.value)} placeholder="بكالوريوس شريعة، ماجستير فقه مقارن" />
        </Field>
        <Field label="الإجازات العلمية">
          <input className="adm-input" value={form.ijazah || ""} onChange={e => set("ijazah", e.target.value)} placeholder="إجازات التسميع والرواية..." />
        </Field>
        <FieldRow>
          <Field label="سنوات الخبرة">
            <input type="number" className="adm-input" value={form.years_experience || ""} onChange={e => set("years_experience", e.target.value)} placeholder="عدد السنوات" min={0} />
          </Field>
          <Field label="رابط صورة خارجي (اختياري)">
            <input className="adm-input" value={form.image_url || form.photo_url || ""} onChange={e => { set("image_url", e.target.value); set("photo_url", e.target.value); setImagePreview(e.target.value); setImageFile(null); }} placeholder="https://..." />
          </Field>
        </FieldRow>
        <Field label="صورة الشيخ">
          <div className="skh-img-row">
            <SheikhAvatar src={imagePreview || resolveSheikhImageUrl(form)} name={form.name || "شيخ"} size={96} />
            <div className="skh-img-actions">
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" hidden onChange={(e) => handleImagePick(e.target.files?.[0] || null)} />
              <button type="button" className="skh-btn-edit" onClick={() => fileInputRef.current?.click()}>رفع صورة</button>
              {(imagePreview || resolveSheikhImageUrl(form)) && (
                <button type="button" className="skh-btn-del" onClick={handleRemoveImage}>حذف الصورة</button>
              )}
              <span className="skh-img-hint">معاينة قبل الحفظ — تُرفع عند الضغط على «حفظ»</span>
            </div>
          </div>
        </Field>
        <Field label="الاعتماد">
          <label className="skh-checkbox-label">
            <input type="checkbox" checked={!!form.is_verified} onChange={e => set("is_verified", e.target.checked)} />
            <span className="skh-checkbox-text">شيخ معتمد ومُراجَع من فريق المنصة</span>
          </label>
        </Field>
      </AdminModal>
    </div>
  );
}
