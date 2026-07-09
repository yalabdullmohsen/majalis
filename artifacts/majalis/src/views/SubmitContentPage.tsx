import { useEffect, useState, type FormEvent } from "react";
import { GraduationCap } from "lucide-react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";

const CONTENT_TYPES = ["درس", "فائدة", "معلومة", "سؤال لعبة", "فكرة"] as const;
type ContentType = (typeof CONTENT_TYPES)[number];

type Status = "idle" | "loading" | "success" | "error";

export default function SubmitContentPage() {
  const [contentType, setContentType] = useState<ContentType>("درس");

  useEffect(() => {
    applyPageSeo({
      path: "/submit",
      title: "أضف محتوى | المجلس العلمي",
      description: "شارك في إثراء المجلس العلمي — أرسل درساً أو فائدة أو سؤالاً وساهم في نشر العلم الشرعي.",
      keywords: ["إضافة محتوى", "مشاركة علمية", "إرسال درس", "نشر العلم", "المجلس العلمي"],
    });
  }, []);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: contentType, title, content: details, author }),
      });
      const json = await res.json();
      if (json.ok) {
        setStatus("success");
        setMessage(json.message || "شكراً! ينتظر موافقة المشرف.");
        setTitle("");
        setDetails("");
        setAuthor("");
      } else {
        setStatus("error");
        setMessage(json.message || "حدث خطأ، حاول مرة أخرى.");
      }
    } catch {
      setStatus("error");
      setMessage("تعذر الاتصال، حاول مرة أخرى.");
    }
  };

  return (
    <div className="scp-page">
      <div className="scp-back-row">
        <Link href="/" className="scp-back-link">← الرئيسية</Link>
      </div>

      <h1 className="scp-title">أضف محتوى</h1>
      <p className="scp-subtitle">يصل مقترحك للأدمن لمراجعته قبل النشر.</p>

      <div
        className="scp-banner"
        onClick={() => setContentType("درس")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setContentType("درس")}
      >
        <div className="scp-banner__emoji" aria-hidden="true"><GraduationCap size={32} strokeWidth={1.4} /></div>
        <div>
          <p className="scp-banner__heading">أضف درساً علمياً</p>
          <p className="scp-banner__desc">شارك درساً، محاضرة، أو موضوعاً علمياً مفيداً</p>
        </div>
      </div>

      {status === "success" && (
        <div role="status" className="scp-feedback scp-feedback--success">{message}</div>
      )}

      {status === "error" && (
        <div role="alert" className="scp-feedback scp-feedback--error">{message}</div>
      )}

      <form onSubmit={handleSubmit}>
        <label className="scp-label">
          نوع المحتوى
          <select
            name="content-type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
            required
            className="scp-input"
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="scp-label scp-label--mt">
          عنوان الموضوع
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            maxLength={500}
            placeholder="اكتب عنواناً مختصراً للموضوع"
            className="scp-input"
          />
        </label>

        <label className="scp-label scp-label--mt">
          التفاصيل
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            required
            minLength={3}
            maxLength={8000}
            rows={6}
            placeholder="اكتب التفاصيل هنا..."
            className="scp-input scp-input--textarea"
          />
        </label>

        <label className="scp-label scp-label--mt scp-label--mb">
          اسمك (اختياري)
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={200}
            placeholder="للنسب الصحيح"
            className="scp-input"
          />
        </label>

        <button
          type="submit"
          disabled={status === "loading"}
          className={`scp-submit-btn${status === "loading" ? " is-loading" : ""}`}
        >
          {status === "loading" ? "جارٍ الإرسال..." : "إرسال المقترح"}
        </button>
      </form>
    </div>
  );
}
