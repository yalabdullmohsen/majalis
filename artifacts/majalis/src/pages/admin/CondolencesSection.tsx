import { useRef, useState } from "react";
import { Link } from "wouter";
import {
  CondolenceCard,
  defaultCondolenceForm,
  EXPORT_SIZES,
  type CondolenceForm,
} from "@/components/condolences/CondolenceCard";
import { getSiteSettings, updateSiteSettings } from "@/lib/site-settings";
import { C } from "@/lib/theme";
import { AdminSectionToolbar } from "./AdminSectionToolbar";
import { useAdminShell } from "./AdminShell";
import { Field, inputSt, selectSt, textareaSt } from "./AdminModal";

export function CondolencesSection() {
  const { showSuccess, showError } = useAdminShell();
  const settings = getSiteSettings();
  const [enabled, setEnabled] = useState(settings.condolencesEnabled);
  const [form, setForm] = useState<CondolenceForm>({
    ...defaultCondolenceForm,
    ...settings.condolencesDefaults,
  });
  const previewRef = useRef<HTMLDivElement>(null);
  const dims = EXPORT_SIZES[form.size];

  const update = <K extends keyof CondolenceForm>(key: K, value: CondolenceForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    try {
      updateSiteSettings({
        condolencesEnabled: enabled,
        condolencesDefaults: {
          size: form.size,
          showLogo: form.showLogo,
          extraText: form.extraText,
        },
      });
      showSuccess("تم حفظ إعدادات قوالب التعزية.");
    } catch {
      showError("تعذر حفظ الإعدادات.");
    }
  };

  const togglePublish = () => {
    const next = !enabled;
    setEnabled(next);
    updateSiteSettings({ condolencesEnabled: next });
    showSuccess(next ? "تم تفعيل صفحة التعزية." : "تم إخفاء صفحة التعزية.");
  };

  return (
    <div>
      <AdminSectionToolbar
        title="قوالب التعزية"
        badge={
          <span
            style={{
              padding: "0.1rem 0.5rem",
              borderRadius: "0.75rem",
              background: enabled ? "#D1FAE5" : "#FEE2E2",
              color: enabled ? C.emeraldDeep : "#991B1B",
              fontSize: "0.75rem",
            }}
          >
            {enabled ? "منشور" : "مخفي"}
          </span>
        }
        actions={
          <>
            <Link
              href="/condolences"
              target="_blank"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: `1px solid ${C.line}`,
                background: C.panel,
                color: C.emeraldDeep,
                textDecoration: "none",
                fontSize: "0.8125rem",
                fontWeight: 600,
              }}
            >
              فتح الصفحة العامة
            </Link>
            <button
              type="button"
              onClick={togglePublish}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "none",
                background: enabled ? "#dc2626" : C.emerald,
                color: C.parchment,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.8125rem",
                fontWeight: 600,
              }}
            >
              {enabled ? "إخفاء" : "نشر"}
            </button>
            <button
              type="button"
              onClick={saveSettings}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "none",
                background: C.emerald,
                color: C.parchment,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.8125rem",
                fontWeight: 600,
              }}
            >
              حفظ الإعدادات
            </button>
          </>
        }
      />

      <p style={{ color: C.inkSoft, fontSize: "0.875rem", lineHeight: 1.8, marginBottom: "1.5rem" }}>
        إدارة القالب الرسمي للتعزية — خلفية سوداء، جاهز للمشاركة على واتساب وإنستغرام.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 18rem), 1fr))", gap: "1.5rem" }}>
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", color: C.emeraldDeep }}>الإعدادات الافتراضية</h3>
          <Field label="المقاس الافتراضي">
            <select value={form.size} onChange={(e) => update("size", e.target.value as CondolenceForm["size"])} style={selectSt}>
              <option value="story">طولي 1080×1350</option>
              <option value="square">مربع 1080×1080</option>
            </select>
          </Field>
          <Field label="نص إضافي افتراضي">
            <textarea value={form.extraText} onChange={(e) => update("extraText", e.target.value)} style={textareaSt} rows={3} />
          </Field>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
            <input type="checkbox" checked={form.showLogo} onChange={(e) => update("showLogo", e.target.checked)} />
            إظهار الشعار افتراضيًا
          </label>
        </div>

        <div ref={previewRef} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", color: C.emeraldDeep }}>معاينة القالب</h3>
          <CondolenceCard
            form={{
              ...form,
              name: form.name || "اسم المتوفى (معاينة)",
              day: form.day || "الثلاثاء",
              deathDate: form.deathDate || "2026/6/23",
            }}
            width={dims.previewW}
            height={dims.previewH}
            preview
          />
        </div>
      </div>
    </div>
  );
}
