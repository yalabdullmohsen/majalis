import { useEffect, useState } from "react";
import {
  adminDeletePermanentCommitteeFatwa,
  adminGetPermanentCommitteeFatwas,
  adminUpsertPermanentCommitteeFatwa,
  getPermanentCommitteeStats,
} from "@/lib/permanent-committee/service";
import { PC_FATWA_SEED, PC_CATEGORIES } from "@/lib/permanent-committee";
import { PC_SOURCE_NAME } from "@/lib/permanent-committee/types";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { useAdminShell } from "./AdminShell";

const CATEGORY_NAMES = PC_CATEGORIES.flatMap((c) => [c.name, ...(c.subcategories?.map((s) => s.name) || [])]);

const EMPTY = {
  title: "",
  question: "",
  answer: "",
  summary: "",
  category: "فقه عام",
  fatwa_number: "",
  keywords: [] as string[],
  reference: "",
  source_url: "https://www.alifta.gov.sa",
  source_name: PC_SOURCE_NAME,
  status: "pending",
};

export function PermanentCommitteeAdminSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"fatwas" | "stats">("fatwas");

  const load = () => {
    setLoading(true);
    Promise.all([adminGetPermanentCommitteeFatwas(), getPermanentCommitteeStats()])
      .then(([rows, s]) => {
        setItems(rows.data?.length ? rows.data : PC_FATWA_SEED);
        setStats(s);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));
  const isEdit = Boolean(form.id);

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {[
          ["fatwas", "الفتاوى"],
          ["stats", "الإحصاءات"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key as typeof tab)}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "0.375rem",
              border: `1px solid ${C.line}`,
              background: tab === key ? C.emerald : C.panel,
              color: tab === key ? C.parchment : C.ink,
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 700,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "stats" && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(8rem, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
          {[
            ["الإجمالي", stats.total],
            ["منشور", stats.approved],
            ["قيد المراجعة", stats.pending],
            ["التصنيفات", stats.categories],
          ].map(([label, val]) => (
            <div key={String(label)} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "0.85rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: C.emeraldDeep }}>{val}</div>
              <div style={{ fontSize: "0.78rem", color: C.inkSoft }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "fatwas" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h2 style={{ margin: 0, color: C.emeraldDeep }}>اللجنة الدائمة ({items.length})</h2>
            <button
              type="button"
              onClick={() => {
                setForm({ ...EMPTY });
                setOpen(true);
              }}
              style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}
            >
              + إضافة فتوى
            </button>
          </div>
          {loading ? (
            <Loading />
          ) : (
            items.map((item) => (
              <div key={item.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem", marginBottom: "0.75rem" }}>
                <strong>{item.title || item.question}</strong>
                <div style={{ fontSize: "0.78rem", color: C.inkSoft, marginTop: "0.25rem" }}>
                  {[item.category, item.fatwa_number ? `#${item.fatwa_number}` : null, item.status].filter(Boolean).join(" · ")}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => { setForm({ ...item }); setOpen(true); }} style={{ fontSize: "0.75rem" }}>تعديل البيانات</button>
                  {item.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() =>
                        adminUpsertPermanentCommitteeFatwa({ ...item, status: "approved" }).then(() => {
                          showSuccess("تم النشر");
                          load();
                        })
                      }
                      style={{ fontSize: "0.75rem" }}
                    >
                      نشر
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("حذف؟")) adminDeletePermanentCommitteeFatwa(item.id).then(load);
                    }}
                    style={{ fontSize: "0.75rem", color: "#dc2626" }}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))
          )}
        </>
      )}

      <AdminModal
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? "تعديل فتوى — البيانات الوصفية" : "إضافة فتوى"}
        onSave={async () => {
          if (!form.question?.trim() || !form.answer?.trim()) return showError("السؤال والجواب مطلوبان");
          setSaving(true);
          const payload = {
            ...form,
            title: form.title || form.question,
            source_name: PC_SOURCE_NAME,
            keywords: Array.isArray(form.keywords)
              ? form.keywords
              : String(form.keywords || "")
                  .split(",")
                  .map((k: string) => k.trim())
                  .filter(Boolean),
          };
          const { error } = await adminUpsertPermanentCommitteeFatwa(payload);
          setSaving(false);
          if (error) return showError(String(error.message || error));
          showSuccess("تم الحفظ");
          setOpen(false);
          load();
        }}
        saving={saving}
      >
        <Field label="العنوان"><input style={inputSt} value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="السؤال"><textarea style={textareaSt} value={form.question || ""} onChange={(e) => set("question", e.target.value)} rows={2} readOnly={isEdit} /></Field>
        <Field label="الجواب (النص الأصلي — لا يُعدّل بعد النشر)">
          <textarea
            style={textareaSt}
            value={form.answer || ""}
            onChange={(e) => set("answer", e.target.value)}
            rows={6}
            readOnly={isEdit && form.status === "approved"}
          />
        </Field>
        <Field label="ملخص"><textarea style={textareaSt} value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={2} /></Field>
        <Field label="رقم الفتوى"><input style={inputSt} value={form.fatwa_number || ""} onChange={(e) => set("fatwa_number", e.target.value)} /></Field>
        <Field label="التصنيف">
          <select style={selectSt} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORY_NAMES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="المرجع"><input style={inputSt} value={form.reference || ""} onChange={(e) => set("reference", e.target.value)} /></Field>
        <Field label="رابط المصدر"><input style={inputSt} value={form.source_url || ""} onChange={(e) => set("source_url", e.target.value)} /></Field>
        <Field label="كلمات مفتاحية (مفصولة بفاصلة)">
          <input
            style={inputSt}
            value={Array.isArray(form.keywords) ? form.keywords.join(", ") : form.keywords || ""}
            onChange={(e) => set("keywords", e.target.value)}
          />
        </Field>
        <Field label="الحالة">
          <select style={selectSt} value={form.status || "pending"} onChange={(e) => set("status", e.target.value)}>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">منشور</option>
          </select>
        </Field>
      </AdminModal>
    </div>
  );
}
