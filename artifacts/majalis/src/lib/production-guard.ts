/**
 * Client-side Production Guard — filter test/demo content from public views.
 */
import { allowSeedFallback } from "@/lib/cms/production-config";

export const TEST_CONTENT_FLAGS = [
  "test",
  "testing",
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
  "phase2",
  "phase 2",
  "تجريبي",
  "اختبار",
  "وهمي",
  "بيانات تجريبية",
  "مسجد تجريبي",
  "درس تجريبي",
] as const;

const TEST_PATTERNS = [
  /\be2e[\-_]?test\b/i,
  /\bphase\s*2\b/i,
  /\[import[\-_]?\d+\]/gi,
  /\bimport[\-_]?\d{1,6}\b/i,
  /\bseed[\-_]/i,
  /\b\d{13}[\-_]\d+\b/,
  /تجريبي/u,
  /اختبار/u,
  /مسجد\s*تجريبي/u,
  /درس\s*تجريبي/u,
];

const SCAN_FIELDS = [
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
  "external_key",
  "id",
];

function fieldValues(record: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const key of SCAN_FIELDS) {
    const v = record[key];
    if (v != null && String(v).trim()) out.push(String(v));
  }
  const sheikhs = record.sheikhs as { name?: string } | undefined;
  if (sheikhs?.name) out.push(sheikhs.name);
  return out;
}

export function isTestContent(record: Record<string, unknown> | null | undefined): boolean {
  if (!record) return false;
  if (allowSeedFallback()) return false;

  for (const text of fieldValues(record)) {
    const lower = text.toLowerCase();
    if (TEST_CONTENT_FLAGS.some((f) => lower.includes(f.toLowerCase()) || text.includes(f))) return true;
    if (TEST_PATTERNS.some((p) => {
      p.lastIndex = 0;
      return p.test(text);
    })) return true;
  }
  return false;
}

export function filterPublicRecords<T extends Record<string, unknown>>(rows: T[]): T[] {
  if (allowSeedFallback()) return rows;
  return rows.filter((row) => !isTestContent(row));
}

/** Use seed data in dev only; empty collections in production. */
export function devSeedFallback<T>(seed: T): T {
  if (allowSeedFallback()) return seed;
  return (Array.isArray(seed) ? [] : seed) as T;
}
