/**
 * Permanent Committee import pipeline — fetch, dedup, classify, review queue.
 * No auto-publish without source verification.
 */
import { createHash } from "node:crypto";

export const PC_SOURCE_SLUG = "lajna-daima";

export function dedupeKey(row) {
  const base = [row.fatwa_number, row.question, row.external_key].filter(Boolean).join("|");
  return createHash("sha256").update(base).digest("hex").slice(0, 24);
}

export function classifyPcCategory(title = "", question = "", answer = "") {
  const blob = `${title} ${question} ${answer}`;
  const rules = [
    ["الزكاة", /زكا|زكوة|نصاب|مال/],
    ["الصلاة", /صلا|جمعة|ركوع|سجود/],
    ["الصيام", /صيام|رمضان|فطر/],
    ["الحج والعمرة", /حج|عمرة|عرفة/],
    ["الأسرة", /نكاح|طلاق|ميراث|زوج/],
    ["النوازل", /عملات|رقمية|تقنية|covid/i],
    ["العبادات", /وضو|تيمم|طهارة|غسل/],
    ["المعاملات", /بيع|ربا|قرض|تجارة/],
    ["العقيدة", /عقيد|توحيد|شرك/i],
  ];
  for (const [cat, re] of rules) {
    if (re.test(blob)) return cat;
  }
  return "فقه عام";
}

/** Normalize import row — preserves original answer text. */
export function normalizeImportRow(raw, sourceUrl) {
  const question = String(raw.question || raw.title || "").trim();
  const answer = String(raw.answer || raw.body || "").trim();
  if (!question || !answer) return { ok: false, error: "missing question or answer" };

  const external_key = raw.external_key || `${PC_SOURCE_SLUG}:${dedupeKey({ question, fatwa_number: raw.fatwa_number })}`;

  return {
    ok: true,
    row: {
      external_key,
      fatwa_number: raw.fatwa_number ? String(raw.fatwa_number) : null,
      title: String(raw.title || question).trim(),
      question,
      answer,
      summary: raw.summary ? String(raw.summary).trim() : answer.slice(0, 200),
      category: raw.category || classifyPcCategory(raw.title, question, answer),
      keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
      reference: raw.reference || "اللجنة الدائمة للبحوث العلمية والإفتاء",
      source_url: raw.source_url || sourceUrl || "https://www.alifta.gov.sa",
      source_name: "اللجنة الدائمة للبحوث العلمية والإفتاء",
      status: "pending",
    },
  };
}

export function findDuplicates(incoming, existing) {
  const keys = new Set(existing.map((r) => r.external_key || dedupeKey(r)));
  const dupes = [];
  const fresh = [];
  for (const row of incoming) {
    const key = row.external_key || dedupeKey(row);
    if (keys.has(key)) dupes.push(row);
    else fresh.push(row);
  }
  return { dupes, fresh };
}

/** Stage rows for admin review — never auto-approve. */
export function stageForReview(rows) {
  return rows.map((row) => ({
    ...row,
    status: "pending",
    metadata: { import_staged_at: new Date().toISOString(), requires_review: true },
  }));
}
