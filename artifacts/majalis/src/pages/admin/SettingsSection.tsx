import { useState } from "react";
import { Link } from "wouter";
import seoData from "@/lib/seo-routes.json";
import { getSiteSettings, updateSiteSettings } from "@/lib/site-settings";
import { C } from "@/lib/theme";
import { AdminSectionToolbar } from "./AdminSectionToolbar";
import { useAdminShell } from "./AdminShell";
import { Field, textareaSt } from "./AdminModal";

export function SettingsSection() {
  const { showSuccess, showError } = useAdminShell();
  const initial = getSiteSettings();
  const [maintenanceMode, setMaintenanceMode] = useState(initial.maintenanceMode);
  const [maintenanceMessage, setMaintenanceMessage] = useState(initial.maintenanceMessage);

  const save = () => {
    try {
      updateSiteSettings({ maintenanceMode, maintenanceMessage: maintenanceMessage.trim() || initial.maintenanceMessage });
      showSuccess("تم حفظ الإعدادات.");
    } catch {
      showError("تعذر حفظ الإعدادات.");
    }
  };

  const publicRoutes = (seoData.routes as { path: string; title: string; sitemap?: boolean }[]).filter(
    (r) => r.sitemap !== false && !r.path.startsWith("/admin"),
  );

  return (
    <div>
      <AdminSectionToolbar
        title="الإعدادات"
        actions={
          <button
            type="button"
            onClick={save}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "0.375rem",
              border: "none",
              background: C.emerald,
              color: C.parchment,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.875rem",
              fontWeight: 600,
            }}
          >
            حفظ الإعدادات
          </button>
        }
      />

      <div style={{ display: "grid", gap: "1.25rem" }}>
        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 1rem", color: C.emeraldDeep, fontSize: "1rem" }}>وضع الصيانة</h3>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", cursor: "pointer" }}>
            <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} />
            <span style={{ fontSize: "0.875rem" }}>تفعيل رسالة الصيانة على الرئيسية</span>
          </label>
          <Field label="رسالة الصيانة">
            <textarea value={maintenanceMessage} onChange={(e) => setMaintenanceMessage(e.target.value)} style={textareaSt} rows={2} />
          </Field>
        </section>

        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 1rem", color: C.emeraldDeep, fontSize: "1rem" }}>أقسام المحتوى</h3>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", color: C.inkSoft, lineHeight: 1.7 }}>
            يمكن إدارة الدروس والمكتبة والإعجاز العلمي والفوائد والأسئلة والأذكار من القائمة الجانبية في لوحة الإدارة.
          </p>
        </section>

        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 1rem", color: C.emeraldDeep, fontSize: "1rem" }}>SEO — معاينة الصفحات العامة</h3>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.8125rem", color: C.inkSoft }}>
            {publicRoutes.length} صفحة مفهرسة · robots.txt و sitemap.xml يُولَّدان تلقائيًا عند البناء
          </p>
          <div style={{ display: "grid", gap: "0.35rem", maxHeight: "16rem", overflowY: "auto" }}>
            {publicRoutes.map((r) => (
              <div key={r.path} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", fontSize: "0.8125rem", padding: "0.35rem 0" }}>
                <Link href={r.path} target="_blank" style={{ color: C.brassDeep, textDecoration: "none", flexShrink: 0 }}>معاينة</Link>
                <span style={{ color: C.inkSoft, textAlign: "left" }}>{r.title}</span>
                <code style={{ color: C.emeraldDeep }}>{r.path}</code>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 1rem", color: C.emeraldDeep, fontSize: "1rem" }}>التحديث التلقائي</h3>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", color: C.inkSoft, lineHeight: 1.7 }}>
            يعمل cron يوميًا على: مواقيت الصلاة، المناسبات، أرشفة الدروس المنتهية، وفحص الروابط.
            المسار: <code>/api/cron/sync-data</code> — يتطلب <code>CRON_SECRET</code> في الإنتاج.
          </p>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: C.inkSoft }}>
            سؤال اليوم والحديث والفوائد تُدوّر تلقائيًا حسب تاريخ الكويت. المحتوى الجديد يُضاف من لوحة الإدارة ثم يُعتمد قبل النشر.
          </p>
        </section>

        <section style={{ background: "#E8F5E9", border: `1px solid ${C.emerald}`, borderRadius: "0.5rem", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.5rem", color: C.emeraldDeep, fontSize: "1rem" }}>الأمان</h3>
          <ul style={{ margin: 0, paddingInlineStart: "1.25rem", fontSize: "0.875rem", color: C.emeraldDeep, lineHeight: 1.9 }}>
            <li>صفحات الإدارة محمية بـ AdminRouteGuard</li>
            <li>مفاتيح API سرية على الخادم فقط (لا NEXT_PUBLIC)</li>
            <li>رسائل الخطأ آمنة — لا stack trace للمستخدم</li>
            <li>صفحات /admin و /login غير مفهرسة (noindex)</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
