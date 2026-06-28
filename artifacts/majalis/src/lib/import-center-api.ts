import { adminImportFetch } from "@/lib/admin-api";

export type ImportPreviewStats = {
  totalRows: number;
  validRows: number;
  rejectedRows: number;
  duplicateRows: number;
  importableRows: number;
};

export type StructuredImportError = {
  line: number;
  field: string;
  fieldLabel?: string;
  value?: unknown;
  reason: string;
  suggestion: string;
  message: string;
  errorType?: string;
};

export type ImportPreview = {
  ok: boolean;
  canImport: boolean;
  contentType?: string;
  label?: string;
  targetTable?: string;
  format?: string;
  encoding?: string;
  delimiter?: string;
  detectedColumns?: Array<{ original: string; canonical: string | null; recognized: boolean }>;
  missingRequiredFields?: string[];
  stats?: ImportPreviewStats;
  batchSize?: number;
  estimatedBatches?: number;
  validationErrors?: string[];
  structuredErrors?: StructuredImportError[];
  warnings?: string[];
  error?: string;
};

export type ImportCenterMetrics = {
  totalJobsListed: number;
  activeJobs: number;
  successRate30d: number | null;
  avgExecutionTimeMs: number;
  avgImportSpeedRowsPerSec: number;
  completedLast30d: number;
  failedLast30d: number;
};

export type ImportJobSummary = {
  id: string;
  type: string;
  label: string;
  targetTable: string | null;
  filename: string | null;
  status: string;
  phase: string;
  totalRows: number;
  imported: number;
  skipped: number;
  failed: number;
  duplicates: number;
  rejected: number;
  progressPct: number;
  executionTimeMs: number | null;
  startedAt?: string;
  completedAt?: string;
  errors: StructuredImportError[];
};

export type ImportCenterDashboard = {
  ok: boolean;
  generatedAt: string;
  metrics: ImportCenterMetrics;
  recentJobs: ImportJobSummary[];
  activeJobs: ImportJobSummary[];
  latestErrors: ImportJobSummary[];
  latestRejected: ImportJobSummary[];
  latestDuplicates: ImportJobSummary[];
  latestFiles: Array<{ id: string; filename: string | null; type: string; status: string; startedAt?: string }>;
};

const IMPORT_API = "/api/admin/import";

export async function previewImport(opts: {
  type: string;
  filename: string;
  content: string;
}): Promise<ImportPreview> {
  const res = await adminImportFetch(IMPORT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "preview", ...opts }),
  });
  return res.json() as Promise<ImportPreview>;
}

export async function fetchImportCenter(limit = 30): Promise<ImportCenterDashboard> {
  const res = await adminImportFetch(`${IMPORT_API}?action=center&limit=${limit}`);
  return res.json() as Promise<ImportCenterDashboard>;
}

export async function fetchImportStatus(jobId: string, kick = false): Promise<unknown> {
  const res = await adminImportFetch(
    `${IMPORT_API}?action=status&jobId=${encodeURIComponent(jobId)}${kick ? "&kick=1" : ""}`,
  );
  return res.json();
}

export async function fetchImportResult(jobId: string): Promise<unknown> {
  const res = await adminImportFetch(`${IMPORT_API}?action=result&jobId=${encodeURIComponent(jobId)}`);
  return res.json();
}

export async function retryImportJobApi(jobId: string): Promise<unknown> {
  const res = await adminImportFetch(IMPORT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "retry", jobId }),
  });
  return res.json();
}

export async function cancelImportJobApi(jobId: string): Promise<unknown> {
  const res = await adminImportFetch(IMPORT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cancel", jobId }),
  });
  return res.json();
}

export { IMPORT_API };
