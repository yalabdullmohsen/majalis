import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Download, Shield, Trash2, Cookie, Wifi } from "lucide-react";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { applyPageSeo } from "@/lib/seo";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { readCookieConsent, writeCookieConsent } from "@/lib/cookie-consent";

/**
 * Interactive privacy hub — rights + consent + export/delete links.
 */
export default function PrivacyCenterPage() {
  const { isLoggedIn } = useAuth();
  const [consent, setConsent] = useState(() => readCookieConsent());
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/privacy-center",
      title: "مركز الخصوصية | سُنّة",
      description: "إدارة موافقة الكوكيز، تصدير بياناتك، وحذف الحساب وفق حقوق الخصوصية.",
      robots: "index, follow",
    });
  }, []);

  async function handleServerExport() {
    if (!isLoggedIn) {
      setExportMsg("سجّل الدخول لتصدير بيانات الحساب من الخادم.");
      return;
    }
    setExporting(true);
    setExportMsg("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("لا يوجد JWT صالح");
      const res = await fetch("/api/account/export", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "فشل التصدير");
      const blob = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ssunnah-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
      setExportMsg("تم تنزيل نسخة بياناتك.");
    } catch (e) {
      setExportMsg(e instanceof Error ? e.message : "تعذّر التصدير");
    } finally {
      setExporting(false);
    }
  }

  return (
    <LegalPageLayout eyebrow="الخصوصية" title="مركز الخصوصية" updatedAt="2026-08-07">
      <LegalSection title="حقوقك باختصار">
        <ul>
          <li>الاطلاع على سياسة الخصوصية وشروط الاستخدام.</li>
          <li>التحكم في الموافقة على التحليلات الاختيارية.</li>
          <li>تصدير بيانات حسابك (قابلية النقل).</li>
          <li>طلب حذف الحساب نهائيًا (حق النسيان).</li>
        </ul>
      </LegalSection>

      <LegalSection title="الموافقة والتخزين">
        <p>
          التخزين الضروري مطلوب لتشغيل الجلسة والتفضيلات. التحليلات اختيارية وحاليًا{" "}
          <strong>{consent.analytics ? "مفعّلة" : "غير مفعّلة"}</strong>.
        </p>
        <div className="settings-actions" style={{ marginTop: "0.75rem" }}>
          <button
            type="button"
            className="ui-card-btn"
            onClick={() => setConsent(writeCookieConsent({ preferences: true, analytics: true }))}
          >
            <Cookie size={16} aria-hidden="true" /> تفعيل التحليلات الاختيارية
          </button>
          <button
            type="button"
            className="ui-card-btn"
            onClick={() => setConsent(writeCookieConsent({ preferences: true, analytics: false }))}
          >
            إيقاف التحليلات
          </button>
        </div>
      </LegalSection>

      <LegalSection title="تصدير البيانات">
        <p>احصل على ملف JSON يتضمن بيانات حسابك المرتبطة في المنصة (أفضل جهد للجداول المتاحة).</p>
        <button type="button" className="ui-card-btn" disabled={exporting} onClick={() => void handleServerExport()}>
          <Download size={16} aria-hidden="true" /> {exporting ? "جاري التصدير…" : "تصدير بيانات الحساب"}
        </button>
        {exportMsg && <p className="settings-note">{exportMsg}</p>}
        <p className="settings-note">
          لتصدير تفضيلات الجهاز فقط استخدم زر التنزيل في{" "}
          <Link href="/settings">الإعدادات</Link>.
        </p>
      </LegalSection>

      <LegalSection title="حذف الحساب">
        <p>
          <Link href="/account-deletion">
            <Trash2 size={14} aria-hidden="true" /> طلب حذف الحساب نهائيًا
          </Link>
        </p>
      </LegalSection>

      <LegalSection title="سياسات ومستندات">
        <div className="settings-legal-links">
          <Link href="/privacy" className="settings-legal-link">
            <Shield size={14} aria-hidden="true" /> سياسة الخصوصية
          </Link>
          <Link href="/terms" className="settings-legal-link">
            شروط الاستخدام
          </Link>
          <Link href="/settings" className="settings-legal-link">
            <Wifi size={14} aria-hidden="true" /> إعدادات الكثافة وتوفير البيانات
          </Link>
        </div>
      </LegalSection>

      <LegalBackLink />
    </LegalPageLayout>
  );
}
