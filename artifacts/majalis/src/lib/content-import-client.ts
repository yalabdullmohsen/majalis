/**
 * Client-side CSV/JSON parser — reads in browser memory (no server filesystem).
 */

export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_ROWS = 100_000;
export const BATCH_SIZE = 100;
export const PREVIEW_ROWS = 20;

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseCsvContent(content: string): Record<string, string>[] {
  const text = content.replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    if (cells.every((c) => !c.trim())) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (cells[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

export function parseFileContent(content: string, filename: string): Record<string, unknown>[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) return parseCsvContent(content);
  const parsed = JSON.parse(content.trim());
  return Array.isArray(parsed) ? parsed : [parsed];
}

export async function readFileAsText(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("file_too_large");
  }
  return file.text();
}

export function chunkRows<T>(rows: T[], size = BATCH_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size));
  }
  return chunks;
}

export type ImportStage =
  | "idle"
  | "uploading"
  | "reading"
  | "validating"
  | "preview"
  | "preparing"
  | "importing"
  | "done"
  | "error";

export const STAGE_LABELS: Record<ImportStage, string> = {
  idle: "—",
  uploading: "Uploading…",
  reading: "Reading CSV…",
  validating: "Validating…",
  preview: "Import Preview",
  preparing: "Preparing records…",
  importing: "Importing…",
  done: "Done",
  error: "Error",
};

export const STAGE_LABELS_AR: Record<ImportStage, string> = {
  idle: "—",
  uploading: "جاري الرفع…",
  reading: "قراءة الملف…",
  validating: "التحقق من البيانات…",
  preview: "معاينة الاستيراد",
  preparing: "تجهيز السجلات…",
  importing: "جاري الاستيراد…",
  done: "اكتمل",
  error: "خطأ",
};

export function stageProgress(stage: ImportStage, batchIndex: number, totalBatches: number): number {
  switch (stage) {
    case "uploading":
      return 5;
    case "reading":
      return 15;
    case "validating":
      return 25;
    case "preview":
      return 30;
    case "preparing":
      return 35;
    case "importing":
      return 35 + Math.round(((batchIndex + 1) / Math.max(totalBatches, 1)) * 60);
    case "done":
      return 100;
    default:
      return 0;
  }
}

export function humanizeError(json: { userMessageAr?: string; userMessage?: string; reason?: string; error?: string }): string {
  if (json.userMessageAr) return json.userMessageAr;
  if (json.userMessage) return json.userMessage;
  if (json.reason) return json.reason;
  if (json.error === "permission_denied") return "Missing database permission.";
  return "The uploaded file could not be processed.";
}
