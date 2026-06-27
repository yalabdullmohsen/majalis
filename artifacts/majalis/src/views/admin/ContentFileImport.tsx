import { useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { C } from "@/lib/theme";

const IMPORT_TYPES = [
  { value: "lessons", label: "الدروس" },
  { value: "sheikhs", label: "المشايخ" },
  { value: "questions", label: "الأسئلة" },
  { value: "books", label: "الكتب" },
  { value: "courses", label: "الدورات" },
  { value: "benefits", label: "الفوائد" },
  { value: "adhkar", label: "الأذكار" },
  { value: "quran_surahs", label: "سور القرآن" },
];

const BTN: React.CSSProperties = {
  padding: "0.5rem 1.1rem",
  borderRadius: "0.375rem",
  border: `1px solid ${C.emerald}`,
  background: C.panel,
  color: C.emeraldDeep,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "0.875rem",
  fontWeight: 600,
};

type ImportReport = {
  ok: boolean;
  label?: string;
  stats?: {
    read: number;
    imported: number;
    skipped: number;
    failed: number;
    invalid: number;
  };
  validationErrors?: string[];
  importErrors?: string[];
};

interface ContentFileImportProps {
  onDone?: () => void;
}

export function ContentFileImport({ onDone }: ContentFileImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("lessons");
  const [filename, setFilename] = useState("");
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setRunning(false);
    setReport(null);
    setError(null);
    setFilename("");
  };

  const runImport = async (file: File) => {
    setRunning(true);
    setReport(null);
    setError(null);
    setFilename(file.name);

    try {
      const content = await file.text();
      const res = await adminFetch("/api/admin/content-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content, filename: file.name }),
      });
      const json = await res.json();
      if (!res.ok && !json.report) {
        const debugLine = json.debug?.guard ? ` [${json.debug.guard}]` : "";
        setError((json.userMessageAr || json.userMessage || json.error || `HTTP ${res.status}`) + debugLine);
        return;
      }
      setReport(json.report || json);
      if (json.report?.ok && json.report.stats?.imported) onDone?.();
    } catch (e) {
      setError(String((e as Error).message || e));
    } finally {
      setRunning(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void runImport(file);
    e.target.value = "";
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={BTN}>
        ⇪ استيراد من ملف
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".json,.csv,application/json,text/csv"
        style={{ display: "none" }}
        onChange={onFileChange}
      />

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(36,31,24,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={close}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "32rem",
              background: C.parchment,
              borderRadius: "0.5rem",
              border: `1px solid ${C.line}`,
              padding: "1.25rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.0625rem", color: C.emeraldDeep }}>
              استيراد من ملف (JSON / CSV)
            </h2>
            <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: C.inkSoft, lineHeight: 1.8 }}>
              يستخدم محرك Content Import Engine نفسه — يدعم ملفات JSON و CSV من مجلد{" "}
              <code style={{ direction: "ltr" }}>data/imports/</code>.
            </p>

            <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
              نوع المحتوى
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={running}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "0.35rem",
                  padding: "0.5rem",
                  borderRadius: "0.375rem",
                  border: `1px solid ${C.line}`,
                  fontFamily: "inherit",
                }}
              >
                {IMPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={running}
                onClick={() => inputRef.current?.click()}
                style={{
                  ...BTN,
                  background: running ? C.sage : C.emerald,
                  color: C.parchment,
                  border: "none",
                }}
              >
                {running ? "جارٍ الاستيراد…" : "اختيار ملف"}
              </button>
              <button type="button" onClick={close} disabled={running} style={BTN}>
                إغلاق
              </button>
            </div>

            {filename && (
              <p style={{ margin: "0.75rem 0 0", fontSize: "0.8125rem", color: C.inkSoft }}>
                الملف: {filename}
              </p>
            )}

            {error && (
              <p style={{ margin: "0.75rem 0 0", color: "#92400E", fontSize: "0.875rem" }}>{error}</p>
            )}

            {report && (
              <div
                style={{
                  marginTop: "0.875rem",
                  padding: "0.875rem",
                  borderRadius: "0.375rem",
                  background: report.ok ? "#D1FAE5" : "#FEF3C7",
                  border: `1px solid ${C.line}`,
                  fontSize: "0.875rem",
                }}
              >
                <p style={{ margin: 0, fontWeight: 600 }}>
                  {report.ok ? "✓ نجح الاستيراد" : "✗ اكتمل مع أخطاء"} — {report.label}
                </p>
                {report.stats && (
                  <p style={{ margin: "0.5rem 0 0" }}>
                    قرئ {report.stats.read} · استورد {report.stats.imported} · تخطى {report.stats.skipped} ·
                    فشل {report.stats.failed}
                  </p>
                )}
                {[...(report.validationErrors || []), ...(report.importErrors || [])].slice(0, 5).map((msg) => (
                  <p key={msg} style={{ margin: "0.25rem 0 0", color: "#92400E", fontSize: "0.8125rem" }}>
                    • {msg}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
