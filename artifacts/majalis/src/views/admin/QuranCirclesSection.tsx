import { useEffect, useMemo, useState } from "react";
import {
  adminGetAllQuranCircles,
  adminUpsertQuranCircle,
  adminDeleteQuranCircle,
  adminSetPlatformContentStatus,
  adminExportTable,
  adminImportRows,
} from "@/lib/platform-supabase";
import { QURAN_CIRCLES_SEED } from "@/lib/quran-circles-seed";
import { QURAN_CIRCLE_TYPES } from "@/lib/platform-types";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { AdminSectionToolbar } from "./AdminSectionToolbar";
import { useAdminShell } from "./AdminShell";

const EMPTY = {
  title: "", summary: "", body: "", circle_type: "حلقة", sheikh_name: "", mosque: "", city: "العاصمة",
  day_of_week: "", circle_time: "", registration_open: true, status: "approved",
};

export function QuranCirclesSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = () => {
    setLoading(true);
    adminGetAllQuranCircles()
      .then(({ data }) => { setItems(data.length > 0 ? data : QURAN_CIRCLES_SEED); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!search.trim()) return true;
      return JSON.stringify(item).includes(search.trim());
    });
  }, [items, search, statusFilter]);

  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  const exportJson = async () => {
    const { data, error } = await adminExportTable("quran_circles");
    if (error) return showError(error.message);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quran-circles.json";
    a.click();
    showSuccess("تم التصدير");
  };

  const importJson = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const rows = JSON.parse(await file.text());
      const { error } = await adminImportRows("quran_circles", rows);
      if (error) return showError(error.message);
      showSuccess(`تم استيراد ${rows.length} حلقة`);
      load();
    };
    input.click();
  };

  return (
    <div>
      <AdminSectionToolbar
        title={`حلقات القرآن (${filtered.length})`}
        actions={
          <>
            <button type="button" onClick={() => { setForm({ ...EMPTY }); setOpen(true); }} style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer" }}>+ إضافة</button>
            <button type="button" onClick={() => void exportJson()} style={{ padding: "0.5rem 1rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", cursor: "pointer", background: C.panel }}>تصدير</button>
            <button type="button" onClick={importJson} style={{ padding: "0.5rem 1rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", cursor: "pointer", background: C.panel }}>استيراد</button>
          </>
        }
      />
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input style={inputSt} placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select style={selectSt} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="approved">منشور</option>
          <option value="pending">معلّق</option>
          <option value="draft">مسودة</option>
          <option value="archived">مؤرشف</option>
        </select>
      </div>
      {loading ? <Loading /> : filtered.map((item) => (
        <div key={item.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem", marginBottom: "0.75rem" }}>
          <strong>{item.title}</strong> — {item.circle_type} · {item.status}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
            <button onClick={() => { setForm({ ...item }); setOpen(true); }} style={{ fontSize: "0.75rem" }}>تعديل</button>
            {item.status !== "approved" && <button onClick={() => adminSetPlatformContentStatus("quran_circles", item.id, "approved").then(load)} style={{ fontSize: "0.75rem" }}>نشر</button>}
            {item.status === "approved" && <button onClick={() => adminSetPlatformContentStatus("quran_circles", item.id, "pending").then(load)} style={{ fontSize: "0.75rem" }}>إلغاء نشر</button>}
            {item.status !== "archived" && <button onClick={() => adminSetPlatformContentStatus("quran_circles", item.id, "archived").then(load)} style={{ fontSize: "0.75rem" }}>أرشفة</button>}
            <button onClick={() => { if (confirm("حذف؟")) adminDeleteQuranCircle(item.id).then(load); }} style={{ fontSize: "0.75rem", color: "#dc2626" }}>حذف</button>
          </div>
        </div>
      ))}
      <AdminModal open={open} onClose={() => setOpen(false)} title="حلقة قرآن" onSave={async () => {
        if (!form.title?.trim()) return showError("العنوان مطلوب");
        setSaving(true);
        const { error } = await adminUpsertQuranCircle(form);
        setSaving(false);
        if (error) return showError(error.message);
        showSuccess("تم الحفظ"); setOpen(false); load();
      }} saving={saving}>
        <Field label="العنوان"><input style={inputSt} value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="النوع"><select style={selectSt} value={form.circle_type} onChange={(e) => set("circle_type", e.target.value)}>{QURAN_CIRCLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
        <Field label="الشيخ"><input style={inputSt} value={form.sheikh_name || ""} onChange={(e) => set("sheikh_name", e.target.value)} /></Field>
        <Field label="المسجد"><input style={inputSt} value={form.mosque || ""} onChange={(e) => set("mosque", e.target.value)} /></Field>
        <Field label="المدينة"><input style={inputSt} value={form.city || ""} onChange={(e) => set("city", e.target.value)} /></Field>
        <Field label="اليوم"><input style={inputSt} value={form.day_of_week || ""} onChange={(e) => set("day_of_week", e.target.value)} /></Field>
        <Field label="الوقت"><input style={inputSt} value={form.circle_time || ""} onChange={(e) => set("circle_time", e.target.value)} /></Field>
        <Field label="الملخص"><textarea style={textareaSt} value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={2} /></Field>
        <Field label="التفاصيل"><textarea style={textareaSt} value={form.body || ""} onChange={(e) => set("body", e.target.value)} rows={4} /></Field>
        <Field label="رابط التسجيل"><input style={inputSt} value={form.registration_url || ""} onChange={(e) => set("registration_url", e.target.value)} /></Field>
        <Field label="الحالة"><select style={selectSt} value={form.status || "approved"} onChange={(e) => set("status", e.target.value)}><option value="approved">منشور</option><option value="pending">معلّق</option><option value="draft">مسودة</option></select></Field>
      </AdminModal>
    </div>
  );
}
