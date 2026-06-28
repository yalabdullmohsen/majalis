/**
 * Production Guard — blocks test/demo/seed content from reaching public tables.
 */
import { isProductionContentMode } from "./cms/production-mode.mjs";

/** Substrings/regex that indicate non-production content. */
export const TEST_CONTENT_FLAGS = [
  "test",
  "testing",
  "testdata",
  "demo",
  "sample",
  "mock",
  "placeholder",
  "dummy",
  "e2e",
  "fixture",
  "sandbox",
  "temp",
  "seed-",
  "import-",
  "qa-test",
  "phase2",
  "phase 2",
  "تجريبي",
  "اختبار",
  "وهمي",
  "بيانات تجريبية",
  "مسجد تجريبي",
  "درس تجريبي",
];

const TEST_PATTERNS = [
  /\be2e[\-_]?test\b/i,
  /\bphase\s*2\b/i,
  /\bphase2[\-_]/i,
  /\[import[\-_]?\d+\]/gi,
  /\bimport[\-_]?\d{1,6}\b/i,
  /\bseed[\-_]/i,
  /\b\d{13}[\-_]\d+\b/,
  /\b(test|demo|mock|sample|fixture|sandbox|placeholder|dummy)[\-_]/i,
  /[\-_](test|demo|mock|sample|fixture|sandbox)\b/i,
  /\be2e[\-_]/i,
  /تجريبي/u,
  /اختبار/u,
  /وهمي/u,
  /بيانات\s*تجريبية/u,
  /مسجد\s*تجريبي/u,
  /درس\s*تجريبي/u,
];

const PUBLIC_TEXT_FIELDS = [
  "text",
  "title",
  "body",
  "description",
  "question",
  "answer",
  "name",
  "mosque",
  "category",
  "source",
  "author_name",
  "speaker_name",
  "sheikh_name",
  "reference",
  "summary",
  "content",
  "bio",
  "notes",
  "tags",
  "slug",
  "external_key",
  "id",
  "created_by",
  "filename",
];

function flattenValues(value, depth = 0) {
  if (depth > 4 || value == null) return [];
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }
  if (Array.isArray(value)) return value.flatMap((v) => flattenValues(v, depth + 1));
  if (typeof value === "object") {
    return Object.values(value).flatMap((v) => flattenValues(v, depth + 1));
  }
  return [];
}

export function collectTestContentSignals(record, extraFields = []) {
  const signals = [];
  const fields = [...new Set([...PUBLIC_TEXT_FIELDS, ...extraFields])];

  for (const field of fields) {
    const raw = record?.[field];
    if (raw == null) continue;
    const text = String(raw).trim();
    if (!text) continue;

    const lower = text.toLowerCase();
    for (const flag of TEST_CONTENT_FLAGS) {
      if (lower.includes(flag.toLowerCase()) || text.includes(flag)) {
        signals.push({ field, flag, value: text.slice(0, 120) });
        break;
      }
    }

    for (const pattern of TEST_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        signals.push({ field, flag: pattern.source, value: text.slice(0, 120) });
        break;
      }
    }
  }

  if (record?.metadata && typeof record.metadata === "object") {
    const metaText = flattenValues(record.metadata).join(" ");
    if (metaText) {
      const nested = collectTestContentSignals({ ...record.metadata, id: record.id }, extraFields);
      for (const s of nested) signals.push({ ...s, field: `metadata.${s.field}` });
    }
  }

  const seen = new Set();
  return signals.filter((s) => {
    const k = `${s.field}:${s.flag}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function isTestContent(record, opts = {}) {
  if (!record || typeof record !== "object") return false;
  if (opts.allowInDev && !isProductionContentMode()) return false;
  return collectTestContentSignals(record, opts.extraFields).length > 0;
}

export function guardPublishRecord(record, context = {}) {
  const signals = collectTestContentSignals(record, context.extraFields);
  if (!signals.length) {
    return { allowed: true, record, rejected: false, reasons: [] };
  }

  return {
    allowed: false,
    rejected: true,
    record,
    reasons: signals.map((s) => `test_content:${s.field}:${s.flag}`),
    message: "محتوى تجريبي/اختباري — مرفوض من Production Guard",
    signals,
    context,
  };
}

export function filterPublicRecords(rows, opts = {}) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => !isTestContent(row, opts));
}

/** Strip internal import/debug markers from public-facing text. */
export function sanitizePublicText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\[import[\-_]?\d+\]/gi, "")
    .replace(/\[e2e[\-_]?[^\]]+\]/gi, "")
    .replace(/\be2e[\-_]?test[\-_]?\d*\b/gi, "")
    .replace(/\b\d{13}[\-_]\d+\b/g, "")
    .replace(/\s*\(Phase\s*2\)\s*/gi, " ")
    .replace(/\s*Phase2\s*/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sanitizePublicRecord(record) {
  if (!record || typeof record !== "object") return record;
  const out = { ...record };
  for (const field of ["text", "title", "body", "description", "question", "answer", "summary", "content"]) {
    if (typeof out[field] === "string") out[field] = sanitizePublicText(out[field]);
  }
  return out;
}

export async function enqueueRejectedTestContent(admin, { record, reasons, source = "production-guard", table = null }) {
  if (!admin) {
    console.log(JSON.stringify({ tag: "production-guard:rejected", source, table, reasons }));
    return { ok: true, local: true };
  }

  const payload = {
    content_type: table || source,
    record_snapshot: record,
    rejection_reason: reasons?.join("; ") || "test_content",
    status: "rejected",
    metadata: { guard: "production-guard", source },
  };

  try {
    await admin.from("akp_review_queue").insert({
      content_type: payload.content_type,
      record: payload.record_snapshot,
      status: "rejected",
      rejection_reason: payload.rejection_reason,
      metadata: payload.metadata,
    });
    return { ok: true };
  } catch {
    try {
      await admin.from("content_import_staging").insert({
        job_id: null,
        row_index: -1,
        payload: record,
        status: "rejected_test",
        error: payload.rejection_reason,
      });
    } catch {
      /* optional tables */
    }
    return { ok: true, fallback: true };
  }
}
