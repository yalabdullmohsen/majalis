import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  adminArchiveCircle,
  adminDeleteCircle,
  adminGetAllCircles,
  adminPublishCircle,
  adminUpsertCircle,
} from "@/lib/quran-scientific-circles-supabase";
import { QURAN_SCIENTIFIC_CIRCLES_SEED } from "@/lib/quran-scientific-circles-seed";
import {
  assessImportCompleteness,
  extractCircleFromPosterText,
  extractCircleFromUrl,
  normalizeImportRow,
  parseCirclesCsv,
  parseCirclesJson,
} from "@/lib/quran-scientific-circles-import";
import { CIRCLE_TABS, STATUS_LABELS, type CircleStatus } from "@/lib/quran-scientific-circles-types";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { BulkImport } from "./BulkImport";
import { useAdminShell } from "./AdminShell";

const EMPTY = {
  title: "",
  summary: "",
  tab_group: "quran",
  country: "الكويت",
  status: "review" as CircleStatus,
  registration_status: "soon",
  is_free: true,
  has_attendance: true,
  gender_access: "عام",
};

const STATUSES = Object.keys(STATUS_LABELS) as CircleStatus[];

export function QuranScientificCirclesSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [importText, setImportText] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    adminGetAllCircles()
      .then(({ data }) => {
        setItems(data.length > 0 ? data : QURAN_SCIENTIFIC_CIRCLES_SEED);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  const saveRow = async (row: Record<string, unknown>) => {
    const assessment = assessImportCompleteness(row as any);
    const payload = {
      ...row,
      data_incomplete: assessment.data_incomplete,
      status: row.status || (assessment.data_incomplete ? "review" : "published"),
    };
    return adminUpsertCircle(payload);
  };

  const handleSmartImport = async (source: "text" | "url" | "file", content?: string) => {
    try {
      let extracted;
      if (source === "url") {
        extracted = extractCircleFromUrl(importUrl);
      } else if (source === "text") {
        extracted = extractCircleFromPosterText(content || importText);
      } else {
        return;
      }
      setForm({ ...EMPTY, ...extracted });
      setOpen(true);
      showSuccess("تم استخراج البيانات — راجع قبل النشر");
    } catch (e: any) {
      showError(e?.message || "فشل الاستخراج");
    }
  };

  const handleFileImport = async (file: File) => {
    const text = await file.text();
    const name = file.name.toLowerCase();
    try {
      let rows;
      if (name.endsWith(".csv")) rows = parseCirclesCsv(text);
      else if (name.endsWith(".json")) rows = parseCirclesJson(text);
      else {
        rows = [extractCircleFromPosterText(text)];
      }
      let ok = 0;
      for (const row of rows) {
        const normalized = normalizeImportRow(row as Record<string, unknown>);
        const { error } = await saveRow(normalized);
        if (!error) ok++;
      }
      showSuccess(`تم استيراد ${ok} من ${rows.length}`);
      load();
    } catch (e: any) {
      showError(e?.message || "فشل الاستيراد");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ margin: 0, color: C.emeraldDeep }}>الحلقات القرآنية والعلمية ({items.length})</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setForm({ ...EMPTY });
              setOpen(true);
            }}
            style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer" }}
          >
            + إضافة
          </button>
          <BulkImport
            title="استيراد JSON للحلقات"
            template={[EMPTY]}
            importRow={async (row) => saveRow(normalizeImportRow(row))}
            onDone={load}
          />
          <Link href="/admin/content-import/image" style={{ padding: "0.5rem 1rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", textDecoration: "none", color: C.emeraldDeep, fontSize: "0.875rem" }}>
            استخراج من صورة
          </Link>
        </div>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", color: C.emeraldDeep }}>استيراد ذكي</h3>
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div>
            <label style={{ fontSize: "0.75rem", color: C.inkSoft }}>نص إعلان / CSV / JSON</label>
            <textarea style={{ ...textareaSt, minHeight: "6rem" }} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="الصق نص الإعلان أو CSV..." />
            <button type="button" style={{ marginTop: "0.5rem", fontSize: "0.8125rem" }} onClick={() => void handleSmartImport("text")}>
              استخراج من النص
            </button>
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", color: C.inkSoft }}>رابط الإعلان</label>
            <input style={inputSt} value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="https://..." />
            <button type="button" style={{ marginTop: "0.5rem", fontSize: "0.8125rem" }} onClick={() => void handleSmartImport("url")}>
              استخراج من الرابط
            </button>
          </div>
          <div>
            <label style={{ fontSize: "0.75rem", color: C.inkSoft }}>ملف CSV / JSON / Excel</label>
            <input ref={fileRef} type="file" accept=".csv,.json,.xlsx,.xls,.txt" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFileImport(f);
            }} />
          </div>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        items.map((item) => (
          <div key={item.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
              <div>
                <strong>{item.title}</strong>
                <span style={{ marginInlineStart: "0.5rem", fontSize: "0.75rem", color: C.inkSoft }}>
                  {item.circle_type} · {item.country} · {STATUS_LABELS[item.status as CircleStatus] || item.status}
                </span>
                {item.data_incomplete && (
                  <span style={{ marginInlineStart: "0.5rem", fontSize: "0.6875rem", background: "#FEF3C7", padding: "0.1rem 0.4rem", borderRadius: "999px" }}>
                    بيانات ناقصة
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                <button onClick={() => { setForm({ ...item }); setOpen(true); }} style={{ fontSize: "0.75rem" }}>تعديل</button>
                <button onClick={() => adminPublishCircle(item.id, "published").then(load)} style={{ fontSize: "0.75rem" }}>نشر</button>
                <button onClick={() => adminPublishCircle(item.id, "review").then(load)} style={{ fontSize: "0.75rem" }}>مراجعة</button>
                <button onClick={() => adminArchiveCircle(item.id).then(load)} style={{ fontSize: "0.75rem" }}>أرشفة</button>
                <button onClick={() => adminUpsertCircle({ ...item, is_pinned: !item.is_pinned }).then(load)} style={{ fontSize: "0.75rem" }}>
                  {item.is_pinned ? "إلغاء التثبيت" : "تثبيت"}
                </button>
                <button onClick={() => adminUpsertCircle({ ...item, is_featured: !item.is_featured }).then(load)} style={{ fontSize: "0.75rem" }}>
                  {item.is_featured ? "إلغاء التمييز" : "تمييز"}
                </button>
                <button onClick={() => { if (confirm("حذف؟")) adminDeleteCircle(item.id).then(load); }} style={{ fontSize: "0.75rem", color: "#dc2626" }}>حذف</button>
              </div>
            </div>
          </div>
        ))
      )}

      <AdminModal
        open={open}
        onClose={() => setOpen(false)}
        title="حلقة قرآنية / علمية"
        onSave={async () => {
          if (!form.title?.trim()) return showError("العنوان مطلوب");
          setSaving(true);
          const { error } = await saveRow(form);
          setSaving(false);
          if (error) return showError(error.message);
          showSuccess("تم الحفظ");
          setOpen(false);
          load();
        }}
        saving={saving}
      >
        <Field label="العنوان"><input style={inputSt} value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="التبويب">
          <select style={selectSt} value={form.tab_group} onChange={(e) => set("tab_group", e.target.value)}>
            {CIRCLE_TABS.filter((t) => t.id !== "all").map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </Field>
        <Field label="النوع"><input style={inputSt} value={form.circle_type || ""} onChange={(e) => set("circle_type", e.target.value)} /></Field>
        <Field label="الملخص"><textarea style={textareaSt} value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={2} /></Field>
        <Field label="الوصف"><textarea style={textareaSt} value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} /></Field>
        <Field label="الدولة"><input style={inputSt} value={form.country || "الكويت"} onChange={(e) => set("country", e.target.value)} /></Field>
        <Field label="المحافظة"><input style={inputSt} value={form.governorate || ""} onChange={(e) => set("governorate", e.target.value)} /></Field>
        <Field label="المنطقة"><input style={inputSt} value={form.region || ""} onChange={(e) => set("region", e.target.value)} /></Field>
        <Field label="المسجد / المركز"><input style={inputSt} value={form.venue_name || ""} onChange={(e) => set("venue_name", e.target.value)} /></Field>
        <Field label="الجهة"><input style={inputSt} value={form.organizer || ""} onChange={(e) => set("organizer", e.target.value)} /></Field>
        <Field label="الشيخ"><input style={inputSt} value={form.sheikh_name || ""} onChange={(e) => set("sheikh_name", e.target.value)} /></Field>
        <Field label="المشرف"><input style={inputSt} value={form.supervisor_name || ""} onChange={(e) => set("supervisor_name", e.target.value)} /></Field>
        <Field label="الجنس"><input style={inputSt} value={form.gender_access || "عام"} onChange={(e) => set("gender_access", e.target.value)} /></Field>
        <Field label="المستوى"><input style={inputSt} value={form.level || ""} onChange={(e) => set("level", e.target.value)} /></Field>
        <Field label="الوقت"><input style={inputSt} value={form.lesson_time || ""} onChange={(e) => set("lesson_time", e.target.value)} /></Field>
        <Field label="تاريخ البداية"><input style={inputSt} type="date" value={form.start_date || ""} onChange={(e) => set("start_date", e.target.value)} /></Field>
        <Field label="رابط التسجيل"><input style={inputSt} value={form.registration_url || ""} onChange={(e) => set("registration_url", e.target.value)} /></Field>
        <Field label="الهاتف"><input style={inputSt} value={form.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value)} /></Field>
        <Field label="واتساب"><input style={inputSt} value={form.whatsapp_url || ""} onChange={(e) => set("whatsapp_url", e.target.value)} /></Field>
        <Field label="الخريطة"><input style={inputSt} value={form.map_url || ""} onChange={(e) => set("map_url", e.target.value)} /></Field>
        <Field label="الحالة">
          <select style={selectSt} value={form.status || "review"} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </Field>
        <Field label="ملاحظات"><textarea style={textareaSt} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={2} /></Field>
      </AdminModal>
    </div>
  );
}
