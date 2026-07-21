import { useState } from "react";
import { Link } from "wouter";
import seoData from "@/lib/seo-routes.json";
import { getSiteSettings, updateSiteSettings } from "@/lib/site-settings";
import { AdminSectionToolbar } from "./AdminSectionToolbar";
import { useAdminShell } from "./AdminShell";
import { Field } from "./AdminModal";

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
          <button type="button" onClick={save} className="set-save-btn">
            حفظ الإعدادات
          </button>
        }
      />

      <div className="set-grid">
        <section className="set-section">
          <h3 className="set-section-h3">وضع الصيانة</h3>
          <label className="set-toggle-label">
            <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} />
            <span className="set-toggle-text">تفعيل رسالة الصيانة على الرئيسية</span>
          </label>
          <Field label="رسالة الصيانة">
            <textarea value={maintenanceMessage} onChange={(e) => setMaintenanceMessage(e.target.value)} className="adm-textarea" rows={2} />
          </Field>
        </section>

        <section className="set-section">
          <h3 className="set-section-h3">أقسام المحتوى</h3>
          <p className="set-notice">
            يمكن إدارة الدروس والمكتبة والإعجاز العلمي والفوائد والأسئلة والأذكار من القائمة الجانبية في لوحة الإدارة.
          </p>
        </section>

        <section className="set-section">
          <h3 className="set-section-h3">SEO، معاينة الصفحات العامة</h3>
          <p className="set-seo-info">
            {publicRoutes.length} صفحة مفهرسة · robots.txt و sitemap.xml يُولَّدان تلقائيًا عند البناء
          </p>
          <div className="set-seo-grid">
            {publicRoutes.map((r) => (
              <div key={r.path} className="set-seo-row">
                <Link href={r.path} target="_blank" rel="noopener noreferrer" className="set-preview-link">معاينة</Link>
                <span className="set-route-title">{r.title}</span>
                <code className="set-route-path">{r.path}</code>
              </div>
            ))}
          </div>
        </section>

        <section className="set-section">
          <h3 className="set-section-h3">التحديث التلقائي</h3>
          <p className="set-notice">
            يعمل cron يوميًا على: مواقيت الصلاة، المناسبات، أرشفة الدروس المنتهية، وفحص الروابط.
            المسار: <code>/api/cron/sync-data</code>، يتطلب <code>CRON_SECRET</code> في الإنتاج.
          </p>
          <p className="set-notice set-notice--sm">
            سؤال اليوم والحديث والفوائد تُدوّر تلقائيًا حسب تاريخ الكويت. المحتوى الجديد يُضاف من لوحة الإدارة ثم يُعتمد قبل النشر.
          </p>
        </section>

        <section className="set-section set-section--security">
          <h3 className="set-section-h3 set-section-h3--sm">الأمان</h3>
          <ul className="set-security-ul">
            <li>صفحات الإدارة محمية بـ AdminRouteGuard</li>
            <li>مفاتيح API سرية على الخادم فقط (لا NEXT_PUBLIC)</li>
            <li>رسائل الخطأ آمنة، لا stack trace للمستخدم</li>
            <li>صفحات /admin و /login غير مفهرسة (noindex)</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
