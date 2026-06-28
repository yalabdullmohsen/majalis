import { useState } from "react";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";

const CONTACT_EMAIL = "yalabdullmohsen@gmail.com";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("انسخ البريد:", CONTACT_EMAIL);
    }
  };

  const mailto = () => {
    const body = encodeURIComponent(
      `الاسم: ${form.name}\n\n${form.message}`,
    );
    const subj = encodeURIComponent(form.subject || "تواصل — المجلس العلمي");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subj}&body=${body}`;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) return;
    try {
      const stored = JSON.parse(localStorage.getItem("majlis_contact_messages") || "[]");
      stored.unshift({
        ...form,
        id: `msg-${Date.now()}`,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem("majlis_contact_messages", JSON.stringify(stored.slice(0, 100)));
    } catch {
      /* ignore */
    }
    setSent(true);
  };

  return (
    <LegalPageLayout eyebrow="التواصل" title="تواصل معنا">
      <LegalSection title="نرحّب بتواصلك">
        <p>
          إذا كان لديك اقتراح أو ملاحظة أو واجهت أي مشكلة في المنصة، يسعدنا التواصل معك.
        </p>
      </LegalSection>

      <LegalSection title="البريد الإلكتروني">
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
          <button type="button" className="ds-btn ds-btn--ghost" onClick={copyEmail}>
            {copied ? "✓ تم النسخ" : "نسخ البريد"}
          </button>
          <button type="button" className="ds-btn ds-btn--primary" onClick={mailto}>
            إرسال رسالة
          </button>
        </div>
      </LegalSection>

      {sent ? (
        <div className="contact-success" role="status">
          <strong>تم إرسال رسالتك بنجاح.</strong>
          <p style={{ margin: "0.5rem 0 0" }}>شكرًا لتواصلك — سنرد في أقرب وقت ممكن.</p>
        </div>
      ) : (
        <LegalSection title="نموذج التواصل">
          <form className="contact-form" onSubmit={submit}>
            <label>
              الاسم
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label>
              البريد الإلكتروني
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label>
              الموضوع
              <select
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              >
                <option value="">اختر...</option>
                <option value="اقتراح">اقتراح</option>
                <option value="مشكلة تقنية">مشكلة تقنية</option>
                <option value="محتوى">محتوى</option>
                <option value="أخرى">أخرى</option>
              </select>
            </label>
            <label>
              الرسالة
              <textarea
                rows={5}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                required
              />
            </label>
            <button type="submit" className="ds-btn ds-btn--primary">
              إرسال
            </button>
          </form>
        </LegalSection>
      )}

      <LegalBackLink />
    </LegalPageLayout>
  );
}
