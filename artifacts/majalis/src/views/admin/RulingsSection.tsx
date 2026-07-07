import { useEffect, useMemo, useState } from "react";
import { adminGetAllRulings, adminUpsertRuling, adminDeleteRuling } from "@/lib/platform-supabase";
import { getAllRulingsForAdmin } from "@/lib/rulings-service";
import { RULING_CATEGORIES } from "@/lib/platform-types";
import { RULINGS_CATEGORY_TREE, flattenCategories } from "@/lib/rulings-categories";
import { importRulingsFromText, RULINGS_CSV_TEMPLATE } from "@/lib/rulings-import";
import { validateRuling, findSimilarRulings } from "@/lib/rulings-validator";
import { Loading } from "@/components/ui-common";
import { adminListLoad } from "@/lib/admin-list-load";
import { StatusBadge } from "./AdminUI";
import { AdminModal, Field } from "./AdminModal";
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
  const [filter, setFilter] = useState(() => { const p = new URLSearchParams(window.location.search); return p.get("q") || ""; });

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
      <div className="rls-header">
        <h2 className="rls-title">موسوعة الأحكام ({stats.total})</h2>
        <div className="rls-btn-group">
          <button
            type="button"
            onClick={() => {
              setForm({ ...EMPTY });
              setOpen(true);
            }}
            className="rls-add-btn"
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
        <h3 className="rls-import-h3">استيراد جماعي (CSV / JSON / Markdown)</h3>
        <div className="rls-fmt-row">
          {(["csv", "json", "markdown"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setImportFormat(f)}
              className={`rls-fmt-btn${importFormat === f ? " rls-fmt-btn--active" : ""}`}
            >
              {f.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setImportText(RULINGS_CSV_TEMPLATE)}
            className="rls-tmpl-btn"
          >
            تحميل قالب CSV
          </button>
        </div>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={5}
          placeholder="الصق محتوى الاستيراد هنا..."
          className="adm-textarea rls-textarea--mb"
        />
        <button type="button" onClick={handleImport} className="rls-import-btn">
          استيراد
        </button>
        {importResult && <p className="rls-import-result">{importResult}</p>}
      </div>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="بحث في الأحكام..."
        className="adm-input rls-filter-mb"
      />

      {loading ? (
        <Loading />
      ) : (
        <>
        {filtered.length > 100 && (
          <p className="rls-hint">
            عرض 100 من {filtered.length.toLocaleString("ar")} — استخدم البحث لتضييق النتائج.
          </p>
        )}
        {filtered.slice(0, 100).map((item) => (
          <div key={item.id} className="adm-item-card">
            <strong>{item.title}</strong>{" "}
            <StatusBadge status={item.verification_status} />
            {" — "}
            <span className="rls-item-cat">
              {item.category}
              {item.subcategory ? ` / ${item.subcategory}` : ""}
            </span>
            <div className="rls-item-actions">
              <button type="button" onClick={() => { setForm({ ...item }); setOpen(true); }} className="rls-edit-btn">
                تعديل
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("حذف؟")) adminDeleteRuling(item.id).then(load);
                }}
                className="rls-del-btn"
              >
                حذف
              </button>
              {item.verification_status === "pending" && (
                <button
                  type="button"
                  onClick={() => adminUpsertRuling({ ...item, verification_status: "approved" }).then(load)}
                  className="rls-approve-btn"
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
          <input className="adm-input" value={form.title || ""} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="التصنيف">
          <select className="adm-select" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {RULING_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            {RULINGS_CATEGORY_TREE.map((c) => (
              <option key={c.slug} value={c.name}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="التصنيف الفرعي">
          <select className="adm-select" value={form.subcategory || ""} onChange={(e) => set("subcategory", e.target.value)}>
            <option value="">—</option>
            {subcategoryOptions.map((s) => (
              <option key={s.slug} value={s.sub}>{s.sub}</option>
            ))}
          </select>
        </Field>
        <Field label="الملخص">
          <textarea className="adm-textarea" value={form.summary || ""} onChange={(e) => set("summary", e.target.value)} rows={2} />
        </Field>
        <Field label="التفصيل">
          <textarea className="adm-textarea" value={form.body || ""} onChange={(e) => set("body", e.target.value)} rows={8} />
        </Field>
        <Field label="الراجح">
          <input className="adm-input" value={form.prevailing_view || ""} onChange={(e) => set("prevailing_view", e.target.value)} />
        </Field>
        <Field label="درجة الحديث">
          <input className="adm-input" value={form.hadith_grade || ""} onChange={(e) => set("hadith_grade", e.target.value)} />
        </Field>
        <Field label="الكلمات المفتاحية (فاصلة)">
          <input
            className="adm-input"
            value={(form.keywords || []).join("، ")}
            onChange={(e) => set("keywords", e.target.value.split(/[،,]/).map((s) => s.trim()).filter(Boolean))}
          />
        </Field>
        <Field label="المراجع (JSON)">
          <textarea
            className="adm-textarea"
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
            className="adm-input"
            value={form.importance_score ?? 50}
            onChange={(e) => set("importance_score", Number(e.target.value))}
          />
        </Field>
        <Field label="الحالة">
          <select className="adm-select" value={form.status || "approved"} onChange={(e) => set("status", e.target.value)}>
            <option value="approved">منشور</option>
            <option value="pending">معلّق</option>
            <option value="draft">مسودة</option>
          </select>
        </Field>
        <Field label="التحقق">
          <select
            className="adm-select"
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
