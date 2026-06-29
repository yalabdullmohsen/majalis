import { useState } from "react";
import { Link } from "wouter";
import { PageHeader, Card } from "@/components/ui-common";
import { C } from "@/lib/theme";

const CONTACT_EMAIL = "yalabdullmohsen1@gmail.com";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("استفسار عام");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("تعذّر النسخ — انسخ البريد يدوياً.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/contact?action=submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || "تعذّر إرسال الرسالة. حاول مجدداً.");
        return;
      }
      setSuccess(data.message || "شكراً لتواصلك! استلمنا رسالتك.");
      setName("");
      setEmail("");
      setSubject("استفسار عام");
      setMessage("");
    } catch {
      setError("تعذّر الاتصال بالخادم. تحقق من الشبكة وحاول مجدداً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell narrow contact-page" dir="rtl">
      <PageHeader
        eyebrow="التواصل"
        title="تواصل معنا"
        subtitle="نرحّب باستفساراتك واقتراحاتك وملاحظاتك على المنصة"
      />

      <div className="contact-page-grid">
        <Card className="contact-card">
          <h2 className="contact-card__title">البريد الإلكتروني</h2>
          <p className="contact-card__desc">للاستفسارات العامة، اقتراحات المحتوى، أو الإبلاغ عن مشكلة:</p>
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
            <li>طلبات تحديث أو حذف بيانات الحساب</li>
          </ul>
          <p className="contact-response-time">نسعى للرد خلال أيام العمل. شكرًا لصبرك وتعاونك.</p>
        </Card>

        <Card className="contact-form-card">
          <h2 className="contact-card__title">نموذج التواصل</h2>
          <p className="contact-card__desc">أرسل رسالتك مباشرة — تُحفظ في لوحة التحكم للمتابعة.</p>

          {success && (
            <div className="contact-alert contact-alert--success" role="status">
              {success}
            </div>
          )}
          {error && (
            <div className="contact-alert contact-alert--error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="contact-form">
            <label className="contact-field">
              <span>الاسم</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                autoComplete="name"
                placeholder="اسمك الكامل"
              />
            </label>
            <label className="contact-field">
              <span>البريد الإلكتروني</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="example@email.com"
                dir="ltr"
              />
            </label>
            <label className="contact-field">
              <span>الموضوع</span>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option value="استفسار عام">استفسار عام</option>
                <option value="اقتراح محتوى">اقتراح محتوى</option>
                <option value="إبلاغ عن خطأ">إبلاغ عن خطأ</option>
                <option value="دعم تقني">دعم تقني</option>
                <option value="حساب المستخدم">حساب المستخدم</option>
              </select>
            </label>
            <label className="contact-field">
              <span>الرسالة</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                minLength={10}
                rows={5}
                placeholder="اكتب رسالتك هنا..."
              />
            </label>
            <button type="submit" className="ds-btn ds-btn--primary contact-submit" disabled={loading}>
              {loading ? "جارٍ الإرسال..." : "إرسال الرسالة"}
            </button>
          </form>
        </Card>
      </div>

      <p className="contact-back">
        <Link href="/" style={{ color: C.emeraldDeep }}>
          ← العودة للرئيسية
        </Link>
        {" · "}
        <Link href="/about" style={{ color: C.emeraldDeep }}>
          عن المنصة
        </Link>
      </p>
    </div>
  );
}
