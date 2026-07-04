import { useEffect, useMemo, useState } from "react";
import { adminGetAllRulings, adminUpsertRuling, adminDeleteRuling } from "@/lib/platform-supabase";
import { getAllRulingsForAdmin } from "@/lib/rulings-service";
import { RULING_CATEGORIES } from "@/lib/platform-types";
import { RULINGS_CATEGORY_TREE, flattenCategories } from "@/lib/rulings-categories";
import { importRulingsFromText, RULINGS_CSV_TEMPLATE } from "@/lib/rulings-import";
import { validateRuling, findSimilarRulings } from "@/lib/rulings-validator";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { adminListLoad } from "@/lib/admin-list-load";
import { StatusBadge } from "./AdminUI";
import { AdminModal, Field, inputSt, selectSt, textareaSt } from "./AdminModal";
import { useAdminShell } from "./AdminShell";
import type { ShariaRulingExtended } from "@/lib/rulings-types";

const EMPTY: Partial<ShariaRulingExtended> = {
  title: "",
  summary: "",
  body: "",
  category: "الطهارة",
  subcategory: "",
  status: "approved",
  verification_status: "approved",
  importance_score: 50,
  keywords: [],
  references: [],
  quran_evidence: [],
  sunnah_evidence: [],
};

export function RulingsSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<ShariaRulingExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<ShariaRulingExtended>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [importText, setImportText] = useState("");
  const [importFormat, setImportFormat] = useState<"csv" | "json" | "markdown">("csv");
  const [importResult, setImportResult] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const subcategoryOptions = useMemo(() => flattenCategories(), []);

  const load = () => {
    adminListLoad({
      label: "admin:rulings",
      setLoading,
      load: async () => {
        const [{ data: dbData }, serviceData] = await Promise.all([adminGetAllRulings(), getAllRulingsForAdmin()]);
        const rows = dbData ?? [];
        return (rows.length > 0 ? rows : serviceData) as ShariaRulingExtended[];
      },
      onSuccess: (merged) => setItems(merged),
      onError: () => setItems([]),
    });
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    for (const item of items) {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    }
    return {
      total: items.length,
      approved: items.filter((i) => i.verification_status === "approved" || !i.verification_status).length,
      pending: items.filter((i) => i.verification_status === "pending").length,
      byCategory,
    };
  }, [items]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return items;
    const q = filter.trim().toLowerCase();
    return items.filter(
      (i) => (i.title ?? "").toLowerCase().includes(q) || (i.category ?? "").toLowerCase().includes(q),
    );
  }, [items, filter]);

  const handleSave = async () => {
    const validation = validateRuling(form, items);
    if (!validation.valid) return showError(validation.errors.join(" — "));

    const similar = findSimilarRulings(form, items);
    if (similar.length > 0 && !confirm(`يوجد ${similar.length} حكم مشابه. متابعة الحفظ؟`)) return;

    setSaving(true);
    const { error } = await adminUpsertRuling(form);
    setSaving(false);
    if (error) return showError(error.message);
    showSuccess("تم الحفظ");
    setOpen(false);
    load();
  };

  const handleImport = async () => {
    try {
      const result = importRulingsFromText(importText, importFormat);
      let imported = 0;
      for (const row of result.valid) {
        const { error } = await adminUpsertRuling(row);
        if (!error) imported++;
      }
      setImportResult(
        `تم استيراد ${imported} حكم. تخطي ${result.invalid.length} صف بسبب أخطاء.`,
      );
      showSuccess(`استيراد: ${imported} حكم`);
      load();
    } catch (e) {
      showError(e instanceof Error ? e.message : "فشل الاستيراد");
    }
  };

  return (
    <div className="rulings-admin">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ margin: 0, color: C.emeraldDeep }}>موسوعة الأحكام ({stats.total})</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => {
              setForm({ ...EMPTY });
              setOpen(true);
            }}
            style={{ padding: "0.5rem 1rem", background: C.emerald, color: C.parchment, border: "none", borderRadius: "0.375rem", cursor: "pointer" }}
          >
            + إضافة حكم
          </button>
        </div>
      </div>

      <div className="rulings-admin-stats">
        <div className="rulings-admin-stat">
          <strong>{stats.total}</strong>
          <span>إجمالي</span>
        </div>
        <div className="rulings-admin-stat">
          <strong>{stats.approved}</strong>
          <span>معتمد</span>
        </div>
        <div className="rulings-admin-stat">
          <strong>{stats.pending}</strong>
          <span>قيد المراجعة</span>
        </div>
        <div className="rulings-admin-stat">
          <strong>{RULINGS_CATEGORY_TREE.length}</strong>
          <span>أقسام</span>
        </div>
      </div>

      <div className="rulings-admin-import">
        <h3 style={{ marginTop: 0 }}>استيراد جماعي (CSV / JSON / Markdown)</h3>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
          {(["csv", "json", "markdown"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setImportFormat(f)}
              style={{
                padding: "0.35rem 0.75rem",
                background: importFormat === f ? C.emerald : C.panel,
                color: importFormat === f ? C.parchment : C.ink,
                border: `1px solid ${C.line}`,
                borderRadius: "0.25rem",
                cursor: "pointer",
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setImportText(RULINGS_CSV_TEMPLATE)}
            style={{ fontSize: "0.8rem" }}
          >
            تحميل قالب CSV
          </button>
        </div>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={5}
          placeholder="الصق محتوى الاستيراد هنا..."
          style={{ ...textareaSt, width: "100%", marginBottom: "0.5rem" }}
        />
        <button type="button" onClick={handleImport} style={{ padding: "0.45rem 0.85rem", cursor: "pointer" }}>
          استيراد
        </button>
        {importResult && <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>{importResult}</p>}
      </div>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="بحث في الأحكام..."
        style={{ ...inputSt, width: "100%", marginBottom: "0.75rem" }}
      />

      {loading ? (
        <Loading />
      ) : (
        <>
        {filtered.length > 100 && (
          <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginBottom: "0.75rem" }}>
            عرض 100 من {filtered.length.toLocaleString("ar")} — استخدم البحث لتضييق النتائج.
          </p>
        )}
        {filtered.slice(0, 100).map((item) => (
          <div
            key={item.id}
            style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem", marginBottom: "0.75rem" }}
          >
            <strong>{item.title}</strong>{" "}
            <StatusBadge status={item.verification_status} />
            {" — "}
            <span style={{ fontSize: "0.875rem", color: C.inkSoft }}>
              {item.category}
              {item.subcategory ? ` / ${item.subcategory}` : ""}
            </span>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" onClick={() => { setForm({ ...item }); setOpen(true); }} style={{ fontSize: "0.75rem" }}>
                تعديل
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("حذف؟")) adminDeleteRuling(item.id).then(load);
                }}
                style={{ fontSize: "0.75rem", color: "#dc2626" }}
              >
                حذف
              </button>
              {item.verification_status === "pending" && (
                <button
                  type="button"
                  onClick={() => adminUpsertRuling({ ...item, verification_status: "approved" }).then(load)}
                  style={{ fontSize: "0.75rem", color: C.emerald }}
                >
                  اعتماد
                </button>
              )}
            </div>
          </div>
        ))}
        </>
      )}

      <AdminModal
        open={open}
        onClose={() => setOpen(false)}
        title="حكم شرعي"
        onSave={handleSave}
        saving={saving}
      >
        <Field label="العنوان">
          <input style={inputSt} value={form.title || ""} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="التصنيف">
          <select style={selectSt} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {RULING_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            {RULINGS_CATEGORY_TREE.map((c) => (
              <option key={c.slug} value={c.name}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="التصنيف الفرعي">
          <select style={selectSt} value={form.subcategory || ""} onChange={(e) => set("subcategory", e.target.value)}>
            <option value="">—</option>
            {subcategoryOptions.map((s) => (
              <option key={s.slug} value={s.sub}>{s.sub}</option>
            ))}
          </select>
        </Field>
        <Field label="الملخص">
          <textarea style={textareaSt} value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={2} />
        </Field>
        <Field label="التفصيل">
          <textarea style={textareaSt} value={form.body || ""} onChange={(e) => set("body", e.target.value)} rows={8} />
        </Field>
        <Field label="الراجح">
          <input style={inputSt} value={form.prevailing_view || ""} onChange={(e) => set("prevailing_view", e.target.value)} />
        </Field>
        <Field label="درجة الحديث">
          <input style={inputSt} value={form.hadith_grade || ""} onChange={(e) => set("hadith_grade", e.target.value)} />
        </Field>
        <Field label="الكلمات المفتاحية (فاصلة)">
          <input
            style={inputSt}
            value={(form.keywords || []).join("، ")}
            onChange={(e) => set("keywords", e.target.value.split(/[،,]/).map((s) => s.trim()).filter(Boolean))}
          />
        </Field>
        <Field label="المراجع (JSON)">
          <textarea
            style={textareaSt}
            value={JSON.stringify(form.references || [], null, 2)}
            onChange={(e) => {
              try { set("references", JSON.parse(e.target.value)); } catch { /* ignore */ }
            }}
            rows={3}
          />
        </Field>
        <Field label="درجة الأهمية (1-100)">
          <input
            type="number"
            min={1}
            max={100}
            style={inputSt}
            value={form.importance_score ?? 50}
            onChange={(e) => set("importance_score", Number(e.target.value))}
          />
        </Field>
        <Field label="الحالة">
          <select style={selectSt} value={form.status || "approved"} onChange={(e) => set("status", e.target.value)}>
            <option value="approved">منشور</option>
            <option value="pending">معلّق</option>
            <option value="draft">مسودة</option>
          </select>
        </Field>
        <Field label="التحقق">
          <select
            style={selectSt}
            value={form.verification_status || "approved"}
            onChange={(e) => set("verification_status", e.target.value)}
          >
            <option value="approved">معتمد</option>
            <option value="pending">قيد المراجعة</option>
            <option value="rejected">مرفوض</option>
          </select>
        </Field>
      </AdminModal>
    </div>
  );
}
