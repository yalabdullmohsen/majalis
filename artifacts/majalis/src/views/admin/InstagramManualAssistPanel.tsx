import { useState } from "react";
import { Link } from "wouter";
import { runInstagramManualAssist } from "@/lib/instagram-integration-api";
import { C } from "@/lib/theme";
import type { TrustedLessonSource } from "@/lib/lesson-automation-api";

const inputSt: React.CSSProperties = {
  width: "100%",
  padding: "0.4rem",
  borderRadius: "0.375rem",
  border: `1px solid ${C.line}`,
  fontFamily: "inherit",
  fontSize: "0.8125rem",
};

type Props = {
  source: TrustedLessonSource;
  onDone: () => void;
};

export function InstagramManualAssistPanel({ source, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"upload" | "url" | "caption">("upload");
  const [postUrl, setPostUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [result, setResult] = useState("");

  const onFile = (file: File | null) => {
    if (!file || !source.id) return;
    setBusy(true);
    setResult("");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = String(reader.result || "").split(",")[1];
        const r = await runInstagramManualAssist({
          sourceId: source.id!,
          mode: "upload",
          imageBase64: base64,
          mimeType: file.type || "image/jpeg",
        });
        setResult(r.ok ? `✓ ${r.outcome?.decision || "تم"}` : `✗ ${r.error}`);
        if (r.ok) onDone();
      } finally {
        setBusy(false);
      }
    };
    reader.onerror = () => {
      setResult("✗ تعذّرت قراءة الملف");
      setBusy(false);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async () => {
    if (!source.id) return;
    setBusy(true);
    setResult("");
    try {
      const r = await runInstagramManualAssist({
        sourceId: source.id,
        mode,
        postUrl: mode === "url" ? postUrl : undefined,
        imageUrl: mode === "url" ? imageUrl : undefined,
        caption: mode === "caption" ? caption : undefined,
      });
      setResult(r.ok ? `✓ ${r.outcome?.decision || "تم"}` : `✗ ${r.error}`);
      if (r.ok) onDone();
    } finally {
      setBusy(false);
    }
  };

  if (source.source_type !== "instagram" && source.platform !== "instagram") return null;

  return (
    <div style={{ marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: `1px dashed ${C.line}` }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer", fontFamily: "inherit", color: C.emeraldDeep, fontWeight: 600 }}
      >
        {open ? "▾" : "▸"} Manual Assist — رفع إعلان يدويًا
      </button>
      {open && (
        <div style={{ marginTop: "0.5rem", display: "grid", gap: "0.5rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", color: C.inkSoft }}>
            Instagram Graph API غير مفعّل أو محدود —{" "}
            <Link href="/admin/integrations/instagram" style={{ color: C.emeraldDeep }}>ربط Graph API</Link>
          </p>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
            {(["upload", "url", "caption"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} style={{
                fontSize: "0.7rem", padding: "0.2rem 0.45rem", cursor: "pointer", fontFamily: "inherit",
                background: mode === m ? C.emeraldDeep : C.panel,
                color: mode === m ? "#fff" : C.inkSoft,
                border: `1px solid ${C.line}`, borderRadius: "0.25rem",
              }}>
                {m === "upload" ? "رفع صورة" : m === "url" ? "رابط + صورة" : "Caption"}
              </button>
            ))}
          </div>
          {mode === "upload" && (
            <input type="file" accept="image/*" disabled={busy} onChange={(e) => onFile(e.target.files?.[0] || null)} style={{ fontSize: "0.75rem" }} />
          )}
          {mode === "url" && (
            <>
              <input placeholder="رابط المنشور" value={postUrl} onChange={(e) => setPostUrl(e.target.value)} className="adm-input" dir="ltr" />
              <input placeholder="رابط الصورة (اختياري)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="adm-input" dir="ltr" />
              <button type="button" disabled={busy} onClick={onSubmit} style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", cursor: "pointer", fontFamily: "inherit" }}>فحص بالذكاء الاصطناعي</button>
            </>
          )}
          {mode === "caption" && (
            <>
              <textarea placeholder="الصق Caption الإعلان" value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="adm-input" />
              <button type="button" disabled={busy} onClick={onSubmit} style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", cursor: "pointer", fontFamily: "inherit" }}>إنشاء مسودة</button>
            </>
          )}
          {result && <p style={{ margin: 0, fontSize: "0.75rem" }}>{result}</p>}
        </div>
      )}
    </div>
  );
}
