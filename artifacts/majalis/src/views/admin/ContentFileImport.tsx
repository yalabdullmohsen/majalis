import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { C } from "@/lib/theme";
import {
  BATCH_SIZE,
  PREVIEW_ROWS,
  STAGE_LABELS_AR,
  chunkRows,
  humanizeError,
  parseFileContent,
  readFileAsText,
  stageProgress,
  type ImportStage,
} from "@/lib/content-import-client";

const IMPORT_TYPES = [
  { value: "lessons", label: "الدروس" },
  { value: "sheikhs", label: "المشايخ" },
  { value: "questions", label: "الأسئلة" },
  { value: "books", label: "الكتب" },
  { value: "courses", label: "الدورات" },
  { value: "benefits", label: "الفوائد" },
  { value: "adhkar", label: "الأذكار" },
  { value: "quran_surahs", label: "سور القرآن" },
  { value: "quran_topics", label: "قصص/موضوعات القرآن" },
  { value: "articles", label: "المقالات" },
  { value: "rulings", label: "الأحكام الشرعية" },
  { value: "categories", label: "التصنيفات" },
];

type PreviewRow = { row: Record<string, unknown>; valid: boolean; errors: string[] };
type HistoryJob = {
  id: string;
  filename: string;
  content_type: string;
  status: string;
  total_rows: number;
  imported_count: number;
  skipped_count: number;
  failed_count: number;
  duration_ms: number | null;
  created_at: string;
  error_summary: string | null;
};

interface ContentFileImportProps {
  onDone?: () => void;
}

export function ContentFileImport({ onDone }: ContentFileImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("lessons");
  const [filename, setFilename] = useState("");
  const [stage, setStage] = useState<ImportStage>("idle");
  const [progress, setProgress] = useState(0);
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [stats, setStats] = useState<{ total: number; valid: number; invalid: number; duplicatesInFile: number } | null>(null);
  const [columns, setColumns] = useState<{ missing: string[]; extra: string[]; headers: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [finalReport, setFinalReport] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<HistoryJob[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [batchIndex, setBatchIndex] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);

  const loadHistory = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/content-import?action=history");
      const json = await res.json();
      if (json.ok) setHistory(json.history || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (open) loadHistory();
  }, [open, loadHistory]);

  const reset = () => {
    setStage("idle");
    setProgress(0);
    setParsedRows([]);
    setPreview([]);
    setValidationErrors([]);
    setStats(null);
    setColumns(null);
    setError(null);
    setJobId(null);
    setFinalReport(null);
    setFilename("");
    setBatchIndex(0);
    setTotalBatches(0);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const processFile = async (file: File) => {
    reset();
    setFilename(file.name);
    setStage("uploading");
    setProgress(stageProgress("uploading", 0, 1));

    try {
      setStage("reading");
      setProgress(stageProgress("reading", 0, 1));
      const content = await readFileAsText(file);

      let rows: Record<string, unknown>[];
      try {
        rows = parseFileContent(content, file.name);
      } catch {
        throw new Error("invalid_csv");
      }

      if (rows.length > 100_000) throw new Error("too_many_rows");
      setParsedRows(rows);

      setStage("validating");
      setProgress(stageProgress("validating", 0, 1));

      const useRowsOnly = content.length > 3_000_000;
      const res = await adminFetch("/api/admin/content-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate",
          type,
          filename: file.name,
          fileSizeBytes: file.size,
          ...(useRowsOnly ? { rows } : { content }),
        }),
      });
      const json = await res.json();

      if (!json.ok) {
        console.error("[content-import validate]", json);
        throw new Error(humanizeError(json));
      }

      const v = json.validation;
      setPreview(v.preview || []);
      setValidationErrors(v.validationErrors || []);
      setStats(v.stats || null);
      setColumns(v.columns || null);
      setStage("preview");
      setProgress(stageProgress("preview", 0, 1));
    } catch (e) {
      console.error("[content-import]", e);
      setStage("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const runImport = async () => {
    if (!parsedRows.length) return;
    setError(null);
    setStage("preparing");
    setProgress(stageProgress("preparing", 0, 1));

    const batches = chunkRows(parsedRows, BATCH_SIZE);
    setTotalBatches(batches.length);

    try {
      const startRes = await adminFetch("/api/admin/content-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          type,
          filename,
          totalRows: parsedRows.length,
          columnHeaders: columns?.headers || Object.keys(parsedRows[0] || {}),
          fileSizeBytes: 0,
        }),
      });
      const startJson = await startRes.json();
      if (!startJson.ok) {
        console.error("[content-import start]", startJson);
        throw new Error(humanizeError(startJson));
      }
      const id = startJson.jobId as string;
      setJobId(id);

      setStage("importing");
      let lastReport = null;
      for (let b = 0; b < batches.length; b++) {
        setBatchIndex(b);
        setProgress(stageProgress("importing", b, batches.length));

        let batchRes = await adminFetch("/api/admin/content-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "batch",
            type,
            jobId: id,
            rows: batches[b],
            batchIndex: b,
            totalBatches: batches.length,
          }),
        });
        let batchJson = await batchRes.json();

        if (!batchJson.ok && batchRes.status >= 500) {
          await new Promise((r) => setTimeout(r, 500));
          batchRes = await adminFetch("/api/admin/content-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "batch",
              type,
              jobId: id,
              rows: batches[b],
              batchIndex: b,
              totalBatches: batches.length,
            }),
          });
          batchJson = await batchRes.json();
        }

        if (!batchJson.ok) {
          console.error("[content-import batch]", batchJson);
          throw new Error(
            batchJson.rolledBack
              ? `${humanizeError(batchJson)} — تم التراجع عن جميع السجلات (Rollback).`
              : humanizeError(batchJson),
          );
        }
        lastReport = batchJson.report;
      }

      setFinalReport(lastReport as Record<string, unknown>);
      setStage("done");
      setProgress(100);
      onDone?.();
      loadHistory();
    } catch (e) {
      console.error("[content-import run]", e);
      setStage("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

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
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void processFile(file);
          e.target.value = "";
        }}
      />

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(36,31,24,0.65)",
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
              maxWidth: "42rem",
              maxHeight: "90vh",
              overflow: "auto",
              background: C.parchment,
              borderRadius: "0.625rem",
              border: `1px solid ${C.line}`,
              padding: "1.25rem",
              boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem", color: C.emeraldDeep }}>
              Content Import Engine
            </h2>
            <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: C.inkSoft, lineHeight: 1.7 }}>
              قراءة مباشرة من المتصفح — بدون مجلدات محلية. يدعم حتى 100,000 سجل مع Rollback تلقائي.
            </p>

            <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
              نوع المحتوى
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={stage === "importing"}
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

            {stage === "idle" || stage === "error" ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                style={{
                  border: `2px dashed ${dragOver ? C.emerald : C.line}`,
                  borderRadius: "0.5rem",
                  padding: "2rem 1rem",
                  textAlign: "center",
                  background: dragOver ? "#ecfdf5" : C.panel,
                  marginBottom: "1rem",
                }}
              >
                <p style={{ margin: "0 0 0.75rem", color: C.inkSoft }}>اسحب ملف CSV أو JSON هنا</p>
                <button type="button" style={{ ...BTN, background: C.emerald, color: C.parchment, border: "none" }} onClick={() => inputRef.current?.click()}>
                  اختيار ملف
                </button>
              </div>
            ) : null}

            {stage !== "idle" && (
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: "0.35rem" }}>
                  <span>{STAGE_LABELS_AR[stage]}</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ height: 8, background: C.line, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${progress}%`, height: "100%", background: C.emerald, transition: "width 0.3s" }} />
                </div>
                {filename && (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", color: C.inkSoft }}>
                    {filename}
                    {stats ? ` — ${stats.total} صف (${stats.valid} صالح)` : ""}
                  </p>
                )}
              </div>
            )}

            {error && (
              <div style={{ padding: "0.75rem", background: "#FEE2E2", borderRadius: "0.375rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
                <strong>Reason:</strong> {error}
              </div>
            )}

            {columns && (columns.missing.length > 0 || columns.extra.length > 0) && (
              <div style={{ padding: "0.75rem", background: "#FEF3C7", borderRadius: "0.375rem", marginBottom: "1rem", fontSize: "0.8125rem" }}>
                {columns.missing.length > 0 && <p style={{ margin: 0 }}>أعمدة ناقصة: {columns.missing.join(", ")}</p>}
                {columns.extra.length > 0 && <p style={{ margin: "0.25rem 0 0" }}>أعمدة زائدة: {columns.extra.join(", ")}</p>}
              </div>
            )}

            {validationErrors.length > 0 && (
              <div style={{ maxHeight: 120, overflow: "auto", fontSize: "0.8125rem", marginBottom: "1rem", color: "#92400E" }}>
                {validationErrors.slice(0, 8).map((msg) => (
                  <p key={msg} style={{ margin: "0.15rem 0" }}>• {msg}</p>
                ))}
              </div>
            )}

            {stage === "preview" && preview.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.9375rem", margin: "0 0 0.5rem" }}>معاينة ({PREVIEW_ROWS} سجل)</h3>
                <div style={{ overflow: "auto", maxHeight: 200, border: `1px solid ${C.line}`, borderRadius: "0.375rem" }}>
                  <table style={{ width: "100%", fontSize: "0.75rem", borderCollapse: "collapse" }}>
                    <tbody>
                      {preview.map((p, i) => (
                        <tr key={i} style={{ background: p.valid ? "transparent" : "#FEF3C7" }}>
                          <td style={{ padding: "0.35rem", borderBottom: `1px solid ${C.line}` }}>{i + 1}</td>
                          <td style={{ padding: "0.35rem", borderBottom: `1px solid ${C.line}` }}>
                            {Object.entries(p.row)
                              .slice(0, 4)
                              .map(([k, v]) => `${k}: ${String(v).slice(0, 40)}`)
                              .join(" | ")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {finalReport && stage === "done" && (
              <div style={{ padding: "0.875rem", background: "#D1FAE5", borderRadius: "0.375rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
                <p style={{ margin: 0, fontWeight: 600 }}>✓ اكتمل الاستيراد</p>
                <p style={{ margin: "0.35rem 0 0" }}>
                  استورد {(finalReport as { imported?: number }).imported ?? 0} · تخطى {(finalReport as { skipped?: number }).skipped ?? 0}
                  {jobId ? ` · Job: ${jobId.slice(0, 8)}…` : ""}
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {stage === "preview" && validationErrors.length === 0 && (
                <button
                  type="button"
                  style={{ ...BTN, background: C.emerald, color: C.parchment, border: "none" }}
                  onClick={() => void runImport()}
                >
                  بدء الاستيراد ({parsedRows.length} سجل)
                </button>
              )}
              {stage === "error" && (
                <button type="button" style={BTN} onClick={reset}>
                  إعادة المحاولة
                </button>
              )}
              <button type="button" onClick={close} style={BTN}>
                إغلاق
              </button>
            </div>

            {history.length > 0 && (
              <details style={{ marginTop: "1.25rem" }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>سجل الاستيراد ({history.length})</summary>
                <ul style={{ fontSize: "0.8125rem", paddingRight: "1rem", marginTop: "0.5rem" }}>
                  {history.slice(0, 10).map((h) => (
                    <li key={h.id} style={{ marginBottom: "0.35rem" }}>
                      {h.filename || h.content_type} — {h.status} — {h.imported_count}/{h.total_rows} —{" "}
                      {new Date(h.created_at).toLocaleString("ar-KW")}
                      {h.error_summary ? ` (${h.error_summary})` : ""}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      )}
    </>
  );
}
