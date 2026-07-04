import { useEffect, useState } from "react";
import {
  type KnowledgeRelationship,
  type KnowledgeRelType,
  type KnowledgeSourceType,
  getAllKnowledgeRelationshipsAdmin,
  upsertKnowledgeRelationship,
  setKnowledgeRelVerified,
  deleteKnowledgeRelationship,
} from "@/lib/supabase";
import { useAdminShell } from "./AdminShell";

const SOURCE_TYPES: { value: KnowledgeSourceType; label: string }[] = [
  { value: "scholar", label: "عالم / شيخ" },
  { value: "lesson",  label: "درس" },
  { value: "book",    label: "كتاب" },
  { value: "fatwa",   label: "فتوى" },
  { value: "fawaid",  label: "فائدة" },
  { value: "question",label: "سؤال" },
];

const REL_TYPES: { value: KnowledgeRelType; label: string }[] = [
  { value: "شيخ_تلميذ",   label: "شيخ → تلميذ" },
  { value: "مؤلف_كتاب",   label: "مؤلف → كتاب" },
  { value: "شرح_لكتاب",   label: "شرح → كتاب" },
  { value: "فتوى_في_باب", label: "فتوى في باب فقهي" },
  { value: "درس_عن_كتاب", label: "درس عن كتاب" },
  { value: "مرتبط",       label: "مرتبط عمومًا" },
];

const EMPTY_FORM = {
  source_type: "scholar" as KnowledgeSourceType,
  source_id: "",
  target_type: "lesson" as KnowledgeSourceType,
  target_id: "",
  relationship_type: "مرتبط" as KnowledgeRelType,
  label: "",
  is_verified: false,
  source_reference: "",
};

export function RelationshipsSection() {
  const { showSuccess, showError } = useAdminShell();
  const [rows, setRows] = useState<KnowledgeRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [filterVerified, setFilterVerified] = useState<"all" | "verified" | "pending">("all");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await getAllKnowledgeRelationshipsAdmin();
      setRows(data ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
  }

  function startEdit(r: KnowledgeRelationship) {
    setEditId(r.id);
    setForm({
      source_type: r.source_type,
      source_id: r.source_id,
      target_type: r.target_type,
      target_id: r.target_id,
      relationship_type: r.relationship_type,
      label: r.label ?? "",
      is_verified: r.is_verified,
      source_reference: r.source_reference ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave() {
    if (!form.source_id.trim() || !form.target_id.trim()) {
      showError("يجب إدخال معرّف المصدر والهدف");
      return;
    }
    setSaving(true);
    const result = await upsertKnowledgeRelationship({
      source_type: form.source_type,
      source_id: form.source_id.trim(),
      target_type: form.target_type,
      target_id: form.target_id.trim(),
      relationship_type: form.relationship_type,
      label: form.label.trim() || null,
      is_verified: form.is_verified,
      source_reference: form.source_reference.trim() || null,
    });
    setSaving(false);
    if (result.ok) {
      showSuccess(editId ? "تم تحديث العلاقة" : "تم إضافة العلاقة");
      resetForm();
      await load();
    } else {
      showError(`فشل الحفظ: ${result.error ?? "خطأ غير معروف"}`);
    }
  }

  async function handleToggleVerified(r: KnowledgeRelationship) {
    const ok = await setKnowledgeRelVerified(r.id, !r.is_verified);
    if (ok) {
      showSuccess(r.is_verified ? "تم إلغاء التحقق" : "تم التحقق من العلاقة");
      await load();
    } else {
      showError("فشل تغيير حالة التحقق");
    }
  }

  async function handleDelete(r: KnowledgeRelationship) {
    if (!window.confirm(`حذف العلاقة: ${r.source_id} → ${r.target_id}?`)) return;
    const ok = await deleteKnowledgeRelationship(r.id);
    if (ok) { showSuccess("تم الحذف"); await load(); }
    else showError("فشل الحذف");
  }

  const filtered = rows.filter((r) => {
    if (filterVerified === "verified" && !r.is_verified) return false;
    if (filterVerified === "pending" && r.is_verified) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        r.source_id.toLowerCase().includes(s) ||
        r.target_id.toLowerCase().includes(s) ||
        (r.label ?? "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  const stats = {
    total: rows.length,
    verified: rows.filter((r) => r.is_verified).length,
    pending: rows.filter((r) => !r.is_verified).length,
  };

  const F = form;
  const fieldStyle: React.CSSProperties = {
    width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db",
    borderRadius: "0.375rem", fontSize: "0.875rem", fontFamily: "inherit",
    background: "#fff",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem",
    color: "#374151",
  };
  const cardStyle: React.CSSProperties = {
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.5rem",
    padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem",
  };

  return (
    <div style={{ direction: "rtl", maxWidth: "900px" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", color: "#065f46" }}>
        الرسم البياني المعرفي — العلاقات
      </h2>

      {/* Stats */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { label: "الإجمالي", value: stats.total },
          { label: "محققة", value: stats.verified },
          { label: "قيد المراجعة", value: stats.pending },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.5rem",
            padding: "0.75rem 1.25rem", textAlign: "center", minWidth: "100px",
          }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#065f46" }}>{s.value}</div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "#1f2937" }}>
          {editId ? "تعديل العلاقة" : "إضافة علاقة جديدة"}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
          <div>
            <label style={labelStyle}>نوع المصدر</label>
            <select style={fieldStyle} value={F.source_type}
              onChange={(e) => setForm((p) => ({ ...p, source_type: e.target.value as KnowledgeSourceType }))}>
              {SOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>معرّف المصدر (ID)</label>
            <input style={fieldStyle} value={F.source_id} placeholder="uuid أو external_key..."
              onChange={(e) => setForm((p) => ({ ...p, source_id: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>نوع الهدف</label>
            <select style={fieldStyle} value={F.target_type}
              onChange={(e) => setForm((p) => ({ ...p, target_type: e.target.value as KnowledgeSourceType }))}>
              {SOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>معرّف الهدف (ID)</label>
            <input style={fieldStyle} value={F.target_id} placeholder="uuid أو external_key..."
              onChange={(e) => setForm((p) => ({ ...p, target_id: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>نوع العلاقة</label>
            <select style={fieldStyle} value={F.relationship_type}
              onChange={(e) => setForm((p) => ({ ...p, relationship_type: e.target.value as KnowledgeRelType }))}>
              {REL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>تسمية مختصرة (اختياري)</label>
            <input style={fieldStyle} value={F.label} placeholder="شرح ابن عثيمين لمتن الآجرومية..."
              onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>المصدر والمرجع (اختياري)</label>
            <input style={fieldStyle} value={F.source_reference} placeholder="كتاب السير / الطبقات الكبرى..."
              onChange={(e) => setForm((p) => ({ ...p, source_reference: e.target.value }))} />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" id="is_verified_chk" checked={F.is_verified}
              onChange={(e) => setForm((p) => ({ ...p, is_verified: e.target.checked }))} />
            <label htmlFor="is_verified_chk" style={{ fontSize: "0.875rem", cursor: "pointer" }}>
              محققة ومعتمدة
            </label>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button type="button" disabled={saving} onClick={handleSave}
            style={{ padding: "0.625rem 1.5rem", background: "#065f46", color: "#fff", border: "none",
              borderRadius: "0.375rem", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
              fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
            {saving ? "جارٍ الحفظ..." : editId ? "تحديث" : "إضافة"}
          </button>
          {editId && (
            <button type="button" onClick={resetForm}
              style={{ padding: "0.625rem 1rem", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db",
                borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem", fontFamily: "inherit" }}>
              إلغاء
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <input style={{ ...fieldStyle, maxWidth: "260px" }} value={search} placeholder="بحث بالمعرّف أو التسمية..."
          onChange={(e) => setSearch(e.target.value)} />
        {(["all", "verified", "pending"] as const).map((v) => (
          <button key={v} type="button" onClick={() => setFilterVerified(v)}
            style={{ padding: "0.375rem 0.875rem", border: "1px solid #d1d5db", borderRadius: "999px",
              background: filterVerified === v ? "#065f46" : "#fff",
              color: filterVerified === v ? "#fff" : "#374151",
              cursor: "pointer", fontSize: "0.8125rem", fontFamily: "inherit" }}>
            {v === "all" ? "الكل" : v === "verified" ? "محققة" : "قيد المراجعة"}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>جارٍ التحميل...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#6b7280", textAlign: "center", padding: "2rem" }}>
          {rows.length === 0
            ? "لا توجد علاقات بعد — أضف أول علاقة أعلاه."
            : "لا نتائج للفلتر المحدد."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.map((r) => (
            <div key={r.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.7rem", background: "#e0f2fe", color: "#0369a1", borderRadius: "4px", padding: "2px 6px" }}>
                      {SOURCE_TYPES.find((t) => t.value === r.source_type)?.label ?? r.source_type}
                    </span>
                    <code style={{ fontSize: "0.75rem", color: "#374151" }}>{r.source_id.slice(0, 20)}{r.source_id.length > 20 ? "…" : ""}</code>
                    <span style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                      {REL_TYPES.find((t) => t.value === r.relationship_type)?.label ?? r.relationship_type}
                    </span>
                    <span style={{ fontSize: "0.7rem", background: "#fef3c7", color: "#92400e", borderRadius: "4px", padding: "2px 6px" }}>
                      {SOURCE_TYPES.find((t) => t.value === r.target_type)?.label ?? r.target_type}
                    </span>
                    <code style={{ fontSize: "0.75rem", color: "#374151" }}>{r.target_id.slice(0, 20)}{r.target_id.length > 20 ? "…" : ""}</code>
                  </div>
                  {r.label && <span style={{ fontSize: "0.8125rem", color: "#374151", fontWeight: 500 }}>{r.label}</span>}
                  {r.source_reference && <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>المرجع: {r.source_reference}</span>}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, alignItems: "center" }}>
                  <span style={{
                    fontSize: "0.7rem", borderRadius: "999px", padding: "2px 8px",
                    background: r.is_verified ? "#d1fae5" : "#fef9c3",
                    color: r.is_verified ? "#065f46" : "#92400e",
                  }}>
                    {r.is_verified ? "محققة" : "قيد المراجعة"}
                  </span>
                  <button type="button" onClick={() => handleToggleVerified(r)}
                    style={{ padding: "0.25rem 0.625rem", fontSize: "0.75rem", background: r.is_verified ? "#fef3c7" : "#d1fae5",
                      border: "1px solid #d1d5db", borderRadius: "0.25rem", cursor: "pointer", fontFamily: "inherit" }}>
                    {r.is_verified ? "إلغاء التحقق" : "تحقق"}
                  </button>
                  <button type="button" onClick={() => startEdit(r)}
                    style={{ padding: "0.25rem 0.625rem", fontSize: "0.75rem", background: "#eff6ff",
                      border: "1px solid #bfdbfe", borderRadius: "0.25rem", cursor: "pointer", fontFamily: "inherit", color: "#1d4ed8" }}>
                    تعديل
                  </button>
                  <button type="button" onClick={() => handleDelete(r)}
                    style={{ padding: "0.25rem 0.625rem", fontSize: "0.75rem", background: "#fee2e2",
                      border: "1px solid #fecaca", borderRadius: "0.25rem", cursor: "pointer", fontFamily: "inherit", color: "#dc2626" }}>
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
