"use client";

import { useState, type FormEvent } from "react";
import { Link } from "wouter";

const CONTENT_TYPES = ["درس", "فائدة", "معلومة", "سؤال لعبة", "فكرة"] as const;
type ContentType = (typeof CONTENT_TYPES)[number];

type Status = "idle" | "loading" | "success" | "error";

export default function SubmitContentPage() {
  const [contentType, setContentType] = useState<ContentType>("درس");
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
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: "1.5rem", background: "#fff", borderRadius: "0.75rem", boxShadow: "0 2px 12px rgba(0,0,0,.08)", direction: "rtl" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <Link href="/" style={{ color: "#6b7280", fontSize: "0.85rem", textDecoration: "none" }}>
          ← الرئيسية
        </Link>
      </div>

      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", color: "#0D1B2A" }}>
        أضف محتوى
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        يصل مقترحك للأدمن لمراجعته قبل النشر.
      </p>

      {status === "success" && (
        <div role="status" style={{ padding: "1rem", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "0.5rem", color: "#166534", marginBottom: "1.25rem", fontWeight: 600 }}>
          {message}
        </div>
      )}

      {status === "error" && (
        <div role="alert" style={{ padding: "1rem", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "0.5rem", color: "#991b1b", marginBottom: "1.25rem" }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>
          نوع المحتوى
          <select
            name="content-type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
            required
            style={inputStyle}
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label style={{ ...labelStyle, marginTop: "1rem" }}>
          عنوان الموضوع
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            maxLength={500}
            placeholder="اكتب عنواناً مختصراً للموضوع"
            style={inputStyle}
          />
        </label>

        <label style={{ ...labelStyle, marginTop: "1rem" }}>
          التفاصيل
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            required
            minLength={3}
            maxLength={8000}
            rows={6}
            placeholder="اكتب التفاصيل هنا..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>

        <label style={{ ...labelStyle, marginTop: "1rem", marginBottom: "1.5rem" }}>
          اسمك (اختياري)
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={200}
            placeholder="للنسب الصحيح"
            style={inputStyle}
          />
        </label>

        <button
          type="submit"
          disabled={status === "loading"}
          style={{ width: "100%", padding: "0.75rem", background: status === "loading" ? "#9ca3af" : "#C9A84C", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "1rem", fontWeight: 700, cursor: status === "loading" ? "not-allowed" : "pointer", fontFamily: "inherit" }}
        >
          {status === "loading" ? "جارٍ الإرسال..." : "إرسال المقترح"}
        </button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  fontWeight: 600,
  fontSize: "0.875rem",
  color: "#374151",
  gap: "0.4rem",
  marginBottom: "0",
};

const inputStyle: React.CSSProperties = {
  marginTop: "0.375rem",
  padding: "0.6rem 0.75rem",
  border: "1px solid #d1d5db",
  borderRadius: "0.4rem",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  background: "#fafafa",
  color: "#0D1B2A",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  direction: "rtl",
};
