import { useState } from "react";
import { Link } from "wouter";
import { PageHeader, Card } from "@/components/ui-common";
import { C } from "@/lib/theme";

const CONTACT_EMAIL = "yalabdullmohsen1@gmail.com";

export default function ContactPage() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="page-shell narrow contact-page" dir="rtl">
      <PageHeader
        eyebrow="التواصل"
        title="تواصل معنا"
        subtitle="قناة داخلية للاقتراحات والشكاوى والملاحظات — دون مغادرة الموقع"
      />

      <Card className="contact-card contact-chat-intro">
        <h2 className="contact-card__title">الدردشة الداخلية — الطريقة المفضّلة</h2>
        <p className="contact-card__desc">
          للاقتراحات، الشكاوى، البلاغات، طلبات التصحيح، وملاحظات على الدروس والأبحاث وسؤال وجواب —
          ابدأ محادثة مباشرة مع إدارة المنصة داخل الموقع.
        </p>
        <Link href="/contact-chat" className="ds-btn ds-btn--primary contact-chat-cta">
          ابدأ محادثة
        </Link>
      </Card>

      <div className="contact-page-grid">
        <Card className="contact-card">
          <h2 className="contact-card__title">البريد الإلكتروني</h2>
          <p className="contact-card__desc">للمراسلات الرسمية أو عند تعذّر استخدام الدردشة:</p>
          <div className="contact-email-row">
            <a href={`mailto:${CONTACT_EMAIL}`} className="contact-email-link">
              {CONTACT_EMAIL}
            </a>
            <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm" onClick={copyEmail}>
              {copied ? "✓ تم النسخ" : "نسخ البريد"}
            </button>
          </div>
          <ul className="contact-help-list">
            <li>الإبلاغ عن خطأ في درس أو محتوى</li>
            <li>اقتراح درس أو شيخ لإضافته</li>
            <li>استفسارات تقنية عن استخدام المنصة</li>
          </ul>
        </Card>

        <Card className="contact-form-card">
          <h2 className="contact-card__title">نموذج التواصل السريع</h2>
          <p className="contact-card__desc">
            النموذج الكامل متاح عبر الدردشة الداخلية. للتواصل السريع عبر النموذج التقليدي:
          </p>
          <Link href="/contact-chat?type=أخرى" className="ds-btn ds-btn--ghost">
            فتح الدردشة
          </Link>
        </Card>
      </div>

      <p className="contact-back">
        <Link href="/" style={{ color: C.emeraldDeep }}>← العودة للرئيسية</Link>
        {" · "}
        <Link href="/about" style={{ color: C.emeraldDeep }}>عن المنصة</Link>
      </p>
    </div>
  );
}
