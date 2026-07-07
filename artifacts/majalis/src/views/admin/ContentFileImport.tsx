import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminImportFetch } from "@/lib/admin-api";
import { chunkRows, formatImportApiError, parseImportFile, UPLOAD_BATCH_SIZE } from "@/lib/import-parse";

const IMPORT_TYPES = [
  { value: "lessons", label: "الدروس" },
  { value: "sheikhs", label: "المشايخ" },
  { value: "questions", label: "الأسئلة (QA)" },
  { value: "books", label: "المكتب" },
  { value: "articles", label: "المقالات" },
  { value: "courses", label: "الدورات" },
  { value: "benefits", label: "الفوائد" },
  { value: "adhkar", label: "الأذكار" },
  { value: "rulings", label: "الفتاوى" },
];

const POLL_INTERVAL_MS = 1000;
const KICK_AFTER_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;
const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);

const IMPORT_TARGET_TABLES: Record<string, string> = {
  lessons: "lessons",
  sheikhs: "sheikhs",
  questions: "qa_questions",
  books: "library_items",
  articles: "library_items",
  courses: "lessons",
  benefits: "fawaid",
  adhkar: "verified_adhkar_items",
  rulings: "sharia_rulings",
};

type ImportReport = {
  ok: boolean;
  label?: string;
  jobId?: string;
  targetTable?: string;
  stats?: {
    read: number;
    imported: number;
    skipped: number;
    failed: number;
    invalid: number;
    rejected?: number;
  };
  validationErrors?: string[];
  importErrors?: string[];
  timings?: {
    parse_ms?: number;
    validation_ms?: number;
    database_ms?: number;
    total_ms?: number;
  };
};

type JobProgress = {
  status: string;
  phase: string;
  progress_pct: number;
  processed_rows: number;
  total_rows: number;
  imported: number;
  skipped: number;
  failed: number;
  validation_errors?: string[];
  import_errors?: string[];
  timings?: ImportReport["timings"];
  report?: ImportReport;
};

function phaseLabel(phase: string): string {
  switch (phase) {
    case "parsing":
      return "تحليل الملف";
    case "uploading":
      return "رفع البيانات";
    case "queued":
      return "في قائمة الانتظار";
    case "processing":
      return "بدء المعالجة";
    case "validating":
      return "التحقق من الصفوف";
    case "importing":
      return "الاستيراد إلى قاعدة البيانات";
    case "completed":
      return "اكتمل بنجاح";
    case "failed":
      return "فشل الاستيراد";
    case "cancelled":
      return "أُلغيت المهمة";
    default:
      return "جارٍ المعالجة";
  }
}

function jobToReport(job: JobProgress, importType: string, jobId?: string): ImportReport {
  const rejected = job.validation_errors?.length || 0;
  const imported = job.imported ?? job.report?.stats?.imported ?? 0;
  const read = job.total_rows ?? job.report?.stats?.read ?? 0;
  const targetTable = IMPORT_TARGET_TABLES[importType] || "—";

  if (job.report) {
    const skipped = job.skipped ?? job.report.stats?.skipped ?? 0;
    const ok =
      job.status === "completed" &&
      (imported > 0 || skipped > 0) &&
      (job.failed ?? job.report.stats?.failed ?? 0) === 0;
    return {
      ...job.report,
      ok,
      jobId: jobId || job.report.jobId,
      targetTable,
      stats: {
        read,
        imported,
        skipped: job.skipped ?? job.report.stats?.skipped ?? 0,
        failed: job.failed ?? job.report.stats?.failed ?? 0,
        invalid: rejected || job.report.stats?.invalid || 0,
        rejected: rejected || job.report.stats?.invalid || 0,
      },
      timings: job.timings || job.report.timings,
    };
  }
  const failed = job.failed ?? 0;
  const skippedCount = job.skipped ?? 0;
  const ok = job.status === "completed" && (imported > 0 || skippedCount > 0) && failed === 0;
  return {
    ok,
    jobId,
    targetTable,
    stats: {
      read,
      imported,
      skipped: job.skipped,
      failed,
      invalid: rejected,
      rejected,
    },
    validationErrors: job.validation_errors,
    importErrors: job.import_errors,
    timings: job.timings,
  };
}

interface ContentFileImportProps {
  onDone?: () => void;
}

async function pollJobUntilDone(
  jobId: string,
  onUpdate: (job: JobProgress) => void,
): Promise<{ job: JobProgress; timedOut: boolean }> {
  const started = Date.now();
  let kicked = false;
  let lastPct = -1;

  for (;;) {
    const elapsed = Date.now() - started;
    const shouldKick = !kicked && elapsed >= KICK_AFTER_MS;
    const url = `/api/admin/content-import?action=progress&jobId=${encodeURIComponent(jobId)}${shouldKick ? "&kick=1" : ""}`;

    if (shouldKick) kicked = true;

    const res = await adminImportFetch(url);
    const json = await res.json();

    if (json.ok && json.job) {
      const job = json.job as JobProgress;
      onUpdate(job);
      if (TERMINAL_STATUSES.has(job.status)) {
        return { job, timedOut: false };
      }
      if (job.progress_pct !== lastPct) {
        lastPct = job.progress_pct;
      }
    }

    if (elapsed >= POLL_TIMEOUT_MS) {
      const fallback: JobProgress = json.job || {
        status: "failed",
        phase: "failed",
        progress_pct: lastPct >= 0 ? lastPct : 40,
        processed_rows: 0,
        total_rows: 0,
        imported: 0,
        skipped: 0,
        failed: 0,
        import_errors: [
          "انتهت مهلة انتظار الاستيراد (120 ثانية). حاول مرة أخرى — إذا تكرّر، تحقق من إعدادات الخادم.",
        ],
      };
      return { job: fallback, timedOut: true };
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

export function ContentFileImport({ onDone }: ContentFileImportProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const retryFileRef = useRef<File | null>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("lessons");
  const [filename, setFilename] = useState("");
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);

  const close = () => {
    setOpen(false);
    setRunning(false);
    setPhase("");
    setProgressPct(0);
    setReport(null);
    setError(null);
    setCanRetry(false);
    setFilename("");
    retryFileRef.current = null;
  };

  const applyJobResult = (job: JobProgress, jobId: string) => {
    const importReport = jobToReport(job, type, jobId);
    setReport(importReport);

    const imported = importReport.stats?.imported ?? 0;
    const rejected = importReport.stats?.rejected ?? importReport.stats?.invalid ?? 0;
    const msgs = [...(job.validation_errors || []), ...(job.import_errors || [])];

    if (job.status === "failed" || job.status === "cancelled") {
      setError(msgs[0] || (job.status === "cancelled" ? "أُلغيت المهمة" : "فشل الاستيراد"));
      setCanRetry(true);
      return;
    }

    if (job.status === "completed" && imported === 0) {
      const skipped = importReport.stats?.skipped ?? job.skipped ?? 0;
      if (skipped > 0) {
        setError(null);
        setCanRetry(false);
        void queryClient.invalidateQueries({ queryKey: ["fawaid"] });
        onDone?.();
        return;
      }
      const detail =
        msgs[0] ||
        (rejected > 0
          ? `لم يُستورد أي صف — ${rejected} صف مرفوض`
          : "اكتملت المهمة دون استيراد أي صف — تحقق من محتوى الملف أو سجلات الخادم");
      setError(detail);
      setCanRetry(true);
      return;
    }

    if (importReport.ok) {
      setError(null);
      setCanRetry(false);
      void queryClient.invalidateQueries({ queryKey: ["adhkar"] });
      void queryClient.invalidateQueries({ queryKey: ["fawaid"] });
      onDone?.();
    } else if (job.status === "completed") {
      setError(msgs[0] || `اكتمل مع ${importReport.stats?.failed ?? 0} فشل`);
      setCanRetry(true);
    }
  };

  const runAsyncImport = async (file: File, rows: Record<string, unknown>[]) => {
    setPhase("تحليل الملف");
    setProgressPct(2);
    setCanRetry(false);

    const startRes = await adminImportFetch("/api/admin/content-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", type, filename: file.name, totalRows: rows.length }),
    });
    const startJson = await startRes.json();
    if (!startRes.ok || !startJson.jobId) {
      throw new Error(formatImportApiError(startRes, startJson, "تعذّر بدء مهمة الاستيراد"));
    }

    const jobId = startJson.jobId as string;
    const batches = chunkRows(rows, UPLOAD_BATCH_SIZE);

    for (let i = 0; i < batches.length; i++) {
      setPhase(`رفع البيانات (${i + 1}/${batches.length})`);
      const pct = Math.round(((i + 1) / batches.length) * 38);
      setProgressPct(pct);

      const stageRes = await adminImportFetch("/api/admin/content-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "stage",
          jobId,
          rows: batches[i],
          startIndex: i * UPLOAD_BATCH_SIZE,
        }),
      });
      const stageJson = await stageRes.json();
      if (!stageRes.ok) {
        throw new Error(formatImportApiError(stageRes, stageJson, `فشل رفع الدفعة ${i + 1}`));
      }
    }

    setPhase("بدء المعالجة في الخلفية");
    setProgressPct(40);

    const commitRes = await adminImportFetch("/api/admin/content-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "commit", jobId }),
    });
    const commitJson = await commitRes.json();
    if (!commitRes.ok && commitRes.status !== 202) {
      throw new Error(formatImportApiError(commitRes, commitJson, "تعذّر إرسال مهمة الاستيراد"));
    }

    if (commitJson.sync && TERMINAL_STATUSES.has(commitJson.status)) {
      const syncJob: JobProgress = {
        status: commitJson.status,
        phase: commitJson.status,
        progress_pct: 100,
        processed_rows: rows.length,
        total_rows: rows.length,
        imported: commitJson.report?.stats?.imported ?? 0,
        skipped: commitJson.report?.stats?.skipped ?? 0,
        failed: commitJson.report?.stats?.failed ?? 0,
        report: {
          ...commitJson.report,
          jobId,
          targetTable: commitJson.targetTable || IMPORT_TARGET_TABLES[type],
        },
        timings: commitJson.timings,
        import_errors: commitJson.report?.importErrors,
        validation_errors: commitJson.report?.validationErrors,
      };
      setProgressPct(100);
      setPhase(phaseLabel(syncJob.phase));
      applyJobResult(syncJob, jobId);
      const imported = syncJob.imported ?? 0;
      const skipped = syncJob.skipped ?? 0;
      if (commitJson.status === "failed" || !commitJson.ok) {
        throw new Error(
          formatImportApiError(
            { ok: false, status: commitRes.status } as Response,
            commitJson,
            syncJob.import_errors?.[0] || "فشل الاستيراد",
          ),
        );
      }
      if (imported === 0 && skipped === 0) {
        throw new Error(
          commitJson.error ||
            syncJob.import_errors?.[0] ||
            syncJob.validation_errors?.[0] ||
            "اكتملت المهمة دون استيراد أي صف — تحقق من أعمدة CSV (مطلوب: text)",
        );
      }
      return;
    }

    const { job: finalJob, timedOut } = await pollJobUntilDone(jobId, (job) => {
      setProgressPct(Math.max(40, job.progress_pct || 0));
      setPhase(phaseLabel(job.phase || job.status));
    });

    applyJobResult(finalJob, jobId);
    if (timedOut) {
      setCanRetry(true);
      throw new Error(finalJob.import_errors?.[0] || "انتهت مهلة الاستيراد");
    }
    if (finalJob.status === "failed" || finalJob.status === "cancelled") {
      throw new Error(finalJob.import_errors?.[0] || "فشل الاستيراد");
    }
    if (finalJob.status === "completed" && (finalJob.imported ?? 0) === 0) {
      const skipped = finalJob.skipped ?? 0;
      if (skipped > 0) return;
      throw new Error(
        finalJob.import_errors?.[0] ||
          finalJob.validation_errors?.[0] ||
          "اكتملت المهمة دون استيراد أي صف — تحقق من أعمدة CSV (مطلوب: text)",
      );
    }
  };

  const runImport = async (file: File) => {
    setRunning(true);
    setReport(null);
    setError(null);
    setFilename(file.name);
    setProgressPct(0);
    retryFileRef.current = file;

    try {
      const content = await file.text();
      setPhase("تحليل الملف");
      const rows = parseImportFile(content, file.name);

      if (!rows.length) {
        throw new Error("الملف فارغ أو لا يحتوي على صفوف صالحة");
      }

      await runAsyncImport(file, rows);
    } catch (e) {
      setError(String((e as Error).message || e));
      setCanRetry(true);
    } finally {
      setRunning(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void runImport(file);
    e.target.value = "";
  };

  const retryImport = () => {
    const file = retryFileRef.current;
    if (file) void runImport(file);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="cfi-trigger-btn">
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
        <div className="adm-modal__overlay" onClick={close}>
          <div className="cfi-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="cfi-title">استيراد من ملف (JSON / CSV)</h2>
            <p className="cfi-desc">
              يُحلَّل الملف محليًا ثم تُرفع الدفعات إلى مهمة استيراد — الملفات الصغيرة تُعالَج فورًا،
              والكبيرة في الخلفية مع تتبع التقدّم كل ثانية.
            </p>

            <label className="cfi-type-label">
              نوع المحتوى
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={running}
                className="cfi-type-select"
              >
                {IMPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>

            <div className="cfi-btn-row">
              <button
                type="button"
                disabled={running}
                onClick={() => inputRef.current?.click()}
                className="cfi-choose-btn"
              >
                {running ? "جارٍ الاستيراد…" : "اختيار ملف"}
              </button>
              {canRetry && !running && (
                <button type="button" onClick={retryImport} className="cfi-retry-btn">
                  إعادة المحاولة
                </button>
              )}
              <button type="button" onClick={close} disabled={running} className="cfi-close-btn">
                إغلاق
              </button>
            </div>

            {filename && <p className="cfi-filename">الملف: {filename}</p>}

            {running && (
              <div className="blk-progress">
                <div className="blk-progress__track">
                  <div
                    className="blk-progress__fill"
                    style={{ "--blk-pct": `${progressPct}%` } as React.CSSProperties}
                  />
                </div>
                <p className="blk-progress__text">{phase} ({progressPct}%)</p>
              </div>
            )}

            {error && <p className="cfi-error">{error}</p>}

            {report && (
              <div className={`cfi-report${report.ok ? " cfi-report--ok" : " cfi-report--fail"}`}>
                <p className="cfi-report__hd">
                  {report.ok ? "✓ نجح الاستيراد" : "✗ اكتمل مع أخطاء"} — {report.label || type}
                </p>
                {report.jobId && (
                  <p className="cfi-report__meta">
                    معرّف المهمة: <code>{report.jobId}</code>
                    {report.targetTable ? ` · الجدول: ${report.targetTable}` : ""}
                  </p>
                )}
                {report.stats && (
                  <p className="cfi-report__stats">
                    قرئ {report.stats.read} · استورد {report.stats.imported} · تخطى {report.stats.skipped} ·
                    فشل {report.stats.failed}
                    {(report.stats.rejected ?? report.stats.invalid)
                      ? ` · مرفوض ${report.stats.rejected ?? report.stats.invalid}`
                      : ""}
                  </p>
                )}
                {report.timings && (
                  <p className="cfi-report__timing">
                    تحليل {report.timings.parse_ms ?? "—"}ms · تحقق {report.timings.validation_ms ?? "—"}ms ·
                    قاعدة البيانات {report.timings.database_ms ?? "—"}ms · الإجمالي{" "}
                    {report.timings.total_ms ?? "—"}ms
                  </p>
                )}
                {[...(report.validationErrors || []), ...(report.importErrors || [])].slice(0, 20).map((msg) => (
                  <p key={msg} className="cfi-report__err">• {msg}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}