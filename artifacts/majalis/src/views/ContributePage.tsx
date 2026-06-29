import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/ui-common";
import {
  submitContribution,
  CONTRIBUTION_TYPE_LABELS,
  type ContributionType,
} from "@/lib/cms/contribution-service";

const CONTRIBUTION_OPTIONS: { value: ContributionType; hint: string }[] = [
  { value: "research", hint: "رسالة أو بحث علمي" },
  { value: "lesson", hint: "إعلان أو تفاصيل درس" },
  { value: "circle_announcement", hint: "حلقة قرآنية أو علمية" },
  { value: "course_announcement", hint: "دورة علمية" },
  { value: "book", hint: "كتاب أو مرجع" },
  { value: "text", hint: "متن علمي" },
  { value: "fawaid", hint: "فائدة علمية قصيرة" },
  { value: "question_suggestion", hint: "سؤال لقسم سؤال وجواب" },
  { value: "correction", hint: "تصحيح معلومة منشورة" },
];

export default function ContributePage() {
  const { user } = useAuth();
  const [type, setType] = useState<ContributionType>("fawaid");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState(user?.profile?.full_name || "");
  const [authorEmail, setAuthorEmail] = useState(user?.email || "");
  const [sourceUrl, setSourceUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setMsg("يرجى إدخال العنوان");
      return;
    }
    setBusy(true);
    setMsg("جاري الإرسال…");
    try {
      const res = await submitContribution(user?.id, {
        type,
        title: title.trim(),
        body: body.trim() || undefined,
        authorName: authorName.trim() || undefined,
        authorEmail: authorEmail.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
      });
      if (res.ok) {
        setMsg("✓ تم استلام مساهمتك — ستُراجع من الإدارة قبل النشر");
        setTitle("");
        setBody("");
        setSourceUrl("");
      } else {
        setMsg(res.error || "فشل الإرسال");
      }
    } catch {
      setMsg("فشل الاتصال — حاول لاحقاً");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <Link href="/">← الرئيسية</Link>
      <PageHeader
        eyebrow="شارك العلم"
        title="بوابة المساهمة"
        subtitle="ارفع محتوى علمي موثوق — يدخل تلقائياً إلى قائمة المراجعة ولا يُنشر إلا بعد اعتماد الإدارة."
      />

      <form className="ui-card" style={{ padding: "1.25rem", maxWidth: "40rem" }} onSubmit={submit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="ctype" style={{ display: "block", marginBottom: "0.35rem", fontWeight: 600 }}>
            نوع المساهمة
          </label>
          <select
            id="ctype"
            className="ds-input full"
            value={type}
            onChange={(e) => setType(e.target.value as ContributionType)}
          >
            {CONTRIBUTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {CONTRIBUTION_TYPE_LABELS[o.value]} — {o.hint}
              </option>
            ))}
          </select>
        </div>

        {(
          [
            { key: "title", label: "العنوان", inputType: "text" as const, required: true },
            { key: "authorName", label: "اسم المُساهم", inputType: "text" as const, required: false },
            { key: "authorEmail", label: "البريد (اختياري)", inputType: "email" as const, required: false },
            { key: "sourceUrl", label: "رابط المصدر (اختياري)", inputType: "url" as const, required: false },
          ] as const
        ).map(({ key, label, inputType, required }) => (
          <div key={key} style={{ marginBottom: "1rem" }}>
            <label htmlFor={key} style={{ display: "block", marginBottom: "0.35rem" }}>
              {label}
            </label>
            <input
              id={key}
              type={inputType}
              className="ds-input full"
              value={
                key === "title"
                  ? title
                  : key === "authorName"
                    ? authorName
                    : key === "authorEmail"
                      ? authorEmail
                      : sourceUrl
              }
              onChange={(e) => {
                if (key === "title") setTitle(e.target.value);
                else if (key === "authorName") setAuthorName(e.target.value);
                else if (key === "authorEmail") setAuthorEmail(e.target.value);
                else setSourceUrl(e.target.value);
              }}
              required={required}
            />
          </div>
        ))}

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="body" style={{ display: "block", marginBottom: "0.35rem" }}>
            التفاصيل / المحتوى
          </label>
          <textarea
            id="body"
            className="ds-input full"
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب التفاصيل أو النص أو وصف التصحيح…"
          />
        </div>

        <button type="submit" className="ds-btn primary" disabled={busy}>
          {busy ? "جاري الإرسال…" : "إرسال للمراجعة"}
        </button>

        {msg && (
          <p style={{ marginTop: "0.75rem", fontSize: "0.875rem" }} role="status">
            {msg}
          </p>
        )}

        <p style={{ marginTop: "1rem", fontSize: "0.8125rem", color: "var(--ink-soft, #666)" }}>
          مساهمتك تمر بمراحل: مسودة → تحقق آلي → كشف تكرار → تصنيف → مراجعة → نشر.
          {!user && " يمكنك الإرسال دون تسجيل، لكن يُفضّل تسجيل الدخول لتتبع مساهماتك."}
        </p>
      </form>

      <p style={{ marginTop: "1rem", fontSize: "0.8125rem" }}>
        للأبحاث الكاملة مع PDF:{" "}
        <Link href="/research/upload">رفع بحث علمي متقدم</Link>
      </p>
    </PageShell>
  );
}
