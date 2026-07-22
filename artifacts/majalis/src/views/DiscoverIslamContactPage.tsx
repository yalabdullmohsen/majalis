import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { useLanguage } from "@/components/LanguageProvider";
import { submitDawahContactRequest, CONTACT_RELIGIONS, type ReligionCode } from "@/lib/dawah-service";
import "@/styles/discover-islam.css";

export default function DiscoverIslamContactPage() {
  const { lang } = useLanguage();
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "no_preference">("no_preference");
  const [religion, setReligion] = useState<ReligionCode | "other_religion" | "no_specific" | "prefer_not_to_say">("prefer_not_to_say");
  const [country, setCountry] = useState("");
  const [topic, setTopic] = useState("");
  const [contactMethod, setContactMethod] = useState("email");
  const [contactValue, setContactValue] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; trackingCode?: string; error?: string } | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/discover-islam/contact",
      title: "تواصل سرّي مع داعية | التعريف بالإسلام",
      description: "نموذج آمن للتواصل مع داعية أو داعية — بياناتك لا تُعرض لأحد.",
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !contactValue.trim() || !consent) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await submitDawahContactRequest({
        name: isAnonymous ? undefined : name,
        isAnonymous,
        lang,
        preferredDaeeGender: gender,
        religiousBackground: religion,
        country: country || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        topic,
        contactMethod,
        contactValue,
        privacyConsent: consent,
      });
      setResult(r);
    } finally {
      setBusy(false);
    }
  };

  if (result?.ok) {
    return (
      <div className="page-shell narrow">
        <PageHeader eyebrow="التعريف بالإسلام" title="تم استلام طلبك" />
        <div className="ui-card dii-answer-card">
          <p>سيتواصل معك أحد الدعاة قريبًا على الوسيلة التي حدّدتها. رمز المتابعة الخاص بك:</p>
          <p className="dii-tracking-code">{result.trackingCode}</p>
          <p className="page-desc">احتفظ بهذا الرمز إن احتجت للاستفسار عن حالة طلبك لاحقًا.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell narrow">
      <PageHeader eyebrow="التعريف بالإسلام" title="تواصل سرّي مع داعية" subtitle="بياناتك تُستخدَم فقط للتواصل معك، ولا تُعرض لأي طرف آخر أبدًا." />

      <form onSubmit={onSubmit} className="dii-contact-form ui-card">
        <label className="dii-checkbox-label">
          <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
          أفضّل عدم كتابة اسمي
        </label>

        {!isAnonymous && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم (اختياري)" className="adm-input" />
        )}

        <select value={gender} onChange={(e) => setGender(e.target.value as typeof gender)} className="adm-input">
          <option value="no_preference">لا تفضيل لجنس الداعية</option>
          <option value="male">أفضّل التحدث مع داعية</option>
          <option value="female">أفضّل التحدث مع داعية (امرأة)</option>
        </select>

        <select value={religion} onChange={(e) => setReligion(e.target.value as typeof religion)} className="adm-input">
          {CONTACT_RELIGIONS.map((r) => (
            <option key={r.code} value={r.code}>{r.label}</option>
          ))}
        </select>

        <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="الدولة (اختياري)" className="adm-input" />

        <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="ما الذي تودّ التحدث عنه؟" required rows={4} className="adm-input" />

        <div className="dii-contact-method-row">
          <select value={contactMethod} onChange={(e) => setContactMethod(e.target.value)} className="adm-input">
            <option value="email">البريد الإلكتروني</option>
            <option value="whatsapp">واتساب</option>
            <option value="phone">هاتف</option>
          </select>
          <input value={contactValue} onChange={(e) => setContactValue(e.target.value)} placeholder="بيانات التواصل" required dir="ltr" className="adm-input" />
        </div>

        <label className="dii-checkbox-label">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
          أوافق على استخدام بياناتي فقط لغرض التواصل معي في هذا الطلب.
        </label>

        {result && !result.ok && <p className="dii-form-error">{result.error === "consent_required" ? "الموافقة على سياسة الخصوصية مطلوبة." : "تعذّر إرسال الطلب، حاول مجددًا."}</p>}

        <button type="submit" disabled={busy} className="asp-run-btn">{busy ? "جارٍ الإرسال..." : "إرسال الطلب"}</button>
      </form>
    </div>
  );
}
