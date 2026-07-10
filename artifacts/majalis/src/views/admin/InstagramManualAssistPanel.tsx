import { useState } from "react";
import { Link } from "wouter";
import { runInstagramManualAssist } from "@/lib/instagram-integration-api";
import type { TrustedLessonSource } from "@/lib/lesson-automation-api";

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
    <div className="igp-panel">
      <button type="button" onClick={() => setOpen(!open)} className="igp-toggle-btn">
        {open ? "▾" : "▸"} Manual Assist، رفع إعلان يدويًا
      </button>
      {open && (
        <div className="igp-body">
          <p className="igp-info">
            Instagram Graph API غير مفعّل أو محدود —{" "}
            <Link href="/admin/integrations/instagram" className="igp-link">ربط Graph API</Link>
          </p>
          <div className="igp-mode-tabs">
            {(["upload", "url", "caption"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`igp-mode-tab${mode === m ? " igp-mode-tab--active" : ""}`}>
                {m === "upload" ? "رفع صورة" : m === "url" ? "رابط + صورة" : "Caption"}
              </button>
            ))}
          </div>
          {mode === "upload" && (
            <input type="file" accept="image/*" disabled={busy} onChange={(e) => onFile(e.target.files?.[0] || null)} className="igp-file-input" />
          )}
          {mode === "url" && (
            <>
              <input placeholder="رابط المنشور" value={postUrl} onChange={(e) => setPostUrl(e.target.value)} className="adm-input" dir="ltr" />
              <input placeholder="رابط الصورة (اختياري)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="adm-input" dir="ltr" />
              <button type="button" disabled={busy} onClick={onSubmit} className="igp-action-btn">فحص بالذكاء الاصطناعي</button>
            </>
          )}
          {mode === "caption" && (
            <>
              <textarea placeholder="الصق Caption الإعلان" value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} className="adm-input" />
              <button type="button" disabled={busy} onClick={onSubmit} className="igp-action-btn">إنشاء مسودة</button>
            </>
          )}
          {result && <p className="igp-result">{result}</p>}
        </div>
      )}
    </div>
  );
}
