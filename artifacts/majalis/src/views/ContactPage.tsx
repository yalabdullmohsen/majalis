import { useState } from "react";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { submitContactMessage } from "@/lib/quran-circles-mutoon-service";
import { CONTACT_CATEGORIES } from "@/lib/platform-types";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "استفسار عام", message: "", category: "general" as const });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("يرجى تعبئة جميع الحقول المطلوبة.");
      return;
    }
    setSending(true);
    setError("");
    const { error: submitError } = await submitContactMessage(form);
    setSending(false);
    if (submitError) {
      setError(submitError.message || "تعذّر إرسال الرسالة. حاول لاحقاً أو راسلنا عبر البريد.");
      return;
    }
    setSent(true);
  };

  return (
    <LegalPageLayout eyebrow="التواصل" title="تواصل معنا">
      <LegalSection title="نرحّب بتواصلك">
        <p>
          للاستفسارات العامة، اقتراحات المحتوى، أو الإبلاغ عن مشكلة في المنصة،
          يمكنك استخدام النموذج أدناه أو التواصل عبر البريد الإلكتروني.
        </p>
      </LegalSection>

      {sent ? (
        <LegalSection title="تم إرسال رسالتك">
          <p>شكرًا لتواصلك. سنرد خلال أيام العمل.</p>
        </LegalSection>
      ) : (
        <LegalSection title="نموذج التواصل">
          <form onSubmit={handleSubmit} className="contact-form">
            <label>
              الاسم
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              البريد الإلكتروني
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label>
              التصنيف
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as typeof form.category })}>
                {CONTACT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label>
              الموضوع
              <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </label>
            <label>
              الرسالة
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} required />
            </label>
            {error && <p role="alert" className="form-error">{error}</p>}
            <button type="submit" disabled={sending}>{sending ? "جاري الإرسال..." : "إرسال"}</button>
          </form>
        </LegalSection>
      )}

      <LegalSection title="البريد الإلكتروني">
        <p>
          <a href="mailto:info@majlisilm.com">info@majlisilm.com</a>
        </p>
      </LegalSection>

      <LegalBackLink />
    </LegalPageLayout>
  );
}
