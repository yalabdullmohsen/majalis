import { useEffect, useMemo, useState } from "react";
import {
  adminGetAllMutoon,
  adminUpsertMutoon,
  adminDeleteMutoon,
  adminSetPlatformContentStatus,
  adminExportTable,
  adminImportRows,
} from "@/lib/platform-supabase";
import { MUTOON_SEED } from "@/lib/mutoon-seed";
import { MUTOON_CATEGORIES, MUTOON_LEVELS } from "@/lib/platform-types";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { AdminSectionToolbar } from "./AdminSectionToolbar";
import { useAdminShell } from "./AdminShell";

const EMPTY = {
  title: "", author: "", summary: "", body: "", category: "متن", level: "مبتدئ",
  total_pages: 0, total_lessons: 0, status: "approved",
};

export function MutoonSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    adminGetAllMutoon()
      .then(({ data }) => { setItems(data.length > 0 ? data : MUTOON_SEED); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter((item) => JSON.stringify(item).includes(search.trim()));
  }, [items, search]);

  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div>
      <AdminSectionToolbar
        title={`المتون (${filtered.length})`}
        actions={
          <>
            <button type="button" onClick={() => { setForm({ ...EMPTY }); setOpen(true); }} style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer" }}>+ إضافة</button>
            <button type="button" onClick={async () => {
              const { data, error } = await adminExportTable("mutoon_texts");
              if (error) return showError(error.message);
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "mutoon.json"; a.click();
              showSuccess("تم التصدير");
            }} style={{ padding: "0.5rem 1rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", cursor: "pointer", background: C.panel }}>تصدير</button>
            <button type="button" onClick={() => {
              const input = document.createElement("input");
              input.type = "file"; input.accept = "application/json";
              input.onchange = async () => {
                const file = input.files?.[0]; if (!file) return;
                const rows = JSON.parse(await file.text());
                const { error } = await adminImportRows("mutoon_texts", rows);
                if (error) return showError(error.message);
                showSuccess(`تم استيراد ${rows.length} متن`); load();
              };
              input.click();
            }} style={{ padding: "0.5rem 1rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", cursor: "pointer", background: C.panel }}>استيراد</button>
          </>
        }
      />
      <input style={{ ...inputSt, marginBottom: "1rem" }} placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} />
      {loading ? <Loading /> : filtered.map((item) => (
        <div key={item.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem", marginBottom: "0.75rem" }}>
          <strong>{item.title}</strong> — {item.author} · {item.status}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
            <button onClick={() => { setForm({ ...item }); setOpen(true); }} style={{ fontSize: "0.75rem" }}>تعديل</button>
            {item.status !== "approved" && <button onClick={() => adminSetPlatformContentStatus("mutoon_texts", item.id, "approved").then(load)} style={{ fontSize: "0.75rem" }}>نشر</button>}
            {item.status !== "archived" && <button onClick={() => adminSetPlatformContentStatus("mutoon_texts", item.id, "archived").then(load)} style={{ fontSize: "0.75rem" }}>أرشفة</button>}
            <button onClick={() => { if (confirm("حذف؟")) adminDeleteMutoon(item.id).then(load); }} style={{ fontSize: "0.75rem", color: "#dc2626" }}>حذف</button>
          </div>
        </div>
      ))}
      <AdminModal open={open} onClose={() => setOpen(false)} title="متن" onSave={async () => {
        if (!form.title?.trim()) return showError("العنوان مطلوب");
        setSaving(true);
        const { error } = await adminUpsertMutoon(form);
        setSaving(false);
        if (error) return showError(error.message);
        showSuccess("تم الحفظ"); setOpen(false); load();
      }} saving={saving}>
        <Field label="العنوان"><input style={inputSt} value={form.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="المؤلف"><input style={inputSt} value={form.author || ""} onChange={(e) => set("author", e.target.value)} /></Field>
        <Field label="التصنيف"><select style={selectSt} value={form.category} onChange={(e) => set("category", e.target.value)}>{MUTOON_CATEGORIES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
        <Field label="المستوى"><select style={selectSt} value={form.level} onChange={(e) => set("level", e.target.value)}>{MUTOON_LEVELS.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
        <Field label="عدد الصفحات"><input style={inputSt} type="number" value={form.total_pages || 0} onChange={(e) => set("total_pages", Number(e.target.value))} /></Field>
        <Field label="عدد الدروس"><input style={inputSt} type="number" value={form.total_lessons || 0} onChange={(e) => set("total_lessons", Number(e.target.value))} /></Field>
        <Field label="الملخص"><textarea style={textareaSt} value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={2} /></Field>
        <Field label="النص"><textarea style={textareaSt} value={form.body || ""} onChange={(e) => set("body", e.target.value)} rows={4} /></Field>
        <Field label="الحالة"><select style={selectSt} value={form.status || "approved"} onChange={(e) => set("status", e.target.value)}><option value="approved">منشور</option><option value="pending">معلّق</option></select></Field>
      </AdminModal>
    </div>
  );
}
