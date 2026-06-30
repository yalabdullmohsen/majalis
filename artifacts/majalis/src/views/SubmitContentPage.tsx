"use client";

import { useState, type FormEvent } from "react";
import { Link } from "wouter";

const SECTIONS = ["القرآن", "السيرة", "الفقه", "الأنبياء", "الصحابة", "العقيدة", "الحديث"] as const;
const LEVELS = [
  { value: "beginner", label: "مبتدئ (200 نقطة)" },
  { value: "intermediate", label: "متوسط (400 نقطة)" },
  { value: "advanced", label: "متقدم (600 نقطة)" },
] as const;

type FormType = "lesson" | "question";
type Status = "idle" | "loading" | "success" | "error";

export default function SubmitContentPage() {
  const [formType, setFormType] = useState<FormType>("lesson");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [section, setSection] = useState<string>(SECTIONS[0]);
  const [level, setLevel] = useState<string>("intermediate");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const body: Record<string, unknown> = { type: formType, title, content, author };
    if (formType === "question") body.meta = { section, level };

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok) {
        setStatus("success");
        setMessage(json.message || "شكراً! ينتظر موافقة الأدمن.");
        setTitle("");
        setContent("");
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
    <div
      style={{
        maxWidth: 600,
        margin: "2rem auto",
        padding: "1.5rem",
        background: "#fff",
        borderRadius: "0.75rem",
        boxShadow: "0 2px 12px rgba(0,0,0,.08)",
        direction: "rtl",
      }}
    >
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
        <div
          role="status"
          style={{
            padding: "1rem",
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "0.5rem",
            color: "#166534",
            marginBottom: "1.25rem",
            fontWeight: 600,
          }}
        >
          {message}
        </div>
      )}

      {status === "error" && (
        <div
          role="alert"
          style={{
            padding: "1rem",
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "0.5rem",
            color: "#991b1b",
            marginBottom: "1.25rem",
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Type toggle */}
        <fieldset style={{ border: "none", padding: 0, marginBottom: "1.25rem" }}>
          <legend style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem", color: "#374151" }}>
            نوع المحتوى
          </legend>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {(["lesson", "question"] as FormType[]).map((t) => (
              <label
                key={t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  cursor: "pointer",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.4rem",
                  border: `2px solid ${formType === t ? "#C9A84C" : "#e5e7eb"}`,
                  background: formType === t ? "#fffbeb" : "#fff",
                  fontWeight: formType === t ? 600 : 400,
                  fontSize: "0.9rem",
                  color: "#0D1B2A",
                  transition: "border-color .15s",
                }}
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={formType === t}
                  onChange={() => setFormType(t)}
                  style={{ accentColor: "#C9A84C" }}
                />
                {t === "lesson" ? "درس" : "سؤال للعبة"}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Question-specific fields */}
        {formType === "question" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <label style={labelStyle}>
              القسم
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                required
                style={inputStyle}
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label style={labelStyle}>
              المستوى
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                required
                style={inputStyle}
              >
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <label style={{ ...labelStyle, display: "flex", flexDirection: "column", marginBottom: "1rem" }}>
          {formType === "lesson" ? "عنوان الدرس" : "نص السؤال"}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            maxLength={500}
            placeholder={formType === "lesson" ? "عنوان الدرس أو الموضوع" : "اكتب السؤال كاملاً"}
            style={inputStyle}
          />
        </label>

        <label style={{ ...labelStyle, display: "flex", flexDirection: "column", marginBottom: "1rem" }}>
          {formType === "lesson" ? "محتوى الدرس" : "الإجابة الصحيحة"}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            minLength={3}
            maxLength={8000}
            rows={formType === "lesson" ? 6 : 3}
            placeholder={formType === "lesson" ? "اكتب محتوى الدرس هنا..." : "اكتب الإجابة الصحيحة"}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </label>

        <label style={{ ...labelStyle, display: "flex", flexDirection: "column", marginBottom: "1.5rem" }}>
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
          style={{
            width: "100%",
            padding: "0.75rem",
            background: status === "loading" ? "#9ca3af" : "#C9A84C",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: status === "loading" ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {status === "loading" ? "جارٍ الإرسال..." : "إرسال المقترح"}
        </button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "0.875rem",
  color: "#374151",
  gap: "0.4rem",
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
