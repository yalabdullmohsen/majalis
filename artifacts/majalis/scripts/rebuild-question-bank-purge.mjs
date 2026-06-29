#!/usr/bin/env node
/**
 * Global Quality Edition — purge legacy questions and build v2 bank.
 * Usage: node scripts/rebuild-question-bank-purge.mjs [--write]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BANK_PATH = join(ROOT, "data/sin-jeem/questions-bank.json");
const SEED_PATH = join(ROOT, "src/lib/sin-jeem/questions-seed.ts");
const V2_SEED_PATH = join(ROOT, "data/sin-jeem/questions-bank-v2-seed.json");
const OUT_PATH = join(ROOT, "data/sin-jeem/questions-bank-v2.json");
const REPORT_PATH = join(ROOT, "reports/question-bank-v2-rebuild.json");

const ARABIC_RE = /[\u0600-\u06FF]/;
const PLACEHOLDER_RE = /^(test|e2e|mock|placeholder|xxx|lorem|تجرب|تجريب)/i;
const AMBIGUOUS_RE = /(\?\?|؟؟|\.\.\.|ربما|قد ي)/i;
const WEAK_TEMPLATE_RE = /^(ما معنى|من هو|من هي|كم عدد|في أي|أين)/;

function normalizeArabic(text) {
  return String(text || "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function contentHash(question, answer) {
  const payload = `${normalizeArabic(question)}|${normalizeArabic(answer)}`;
  return createHash("sha256").update(payload, "utf8").digest("hex").slice(0, 32);
}

function tokenSimilarity(a, b) {
  const ta = new Set(normalizeArabic(a).split(/\s+/).filter(Boolean));
  const tb = new Set(normalizeArabic(b).split(/\s+/).filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / Math.max(ta.size, tb.size);
}

function validate(q) {
  const errors = [];
  if (!q.question?.trim()) errors.push("missing_question");
  if (q.question && !ARABIC_RE.test(q.question)) errors.push("not_arabic");
  if (q.question && PLACEHOLDER_RE.test(q.question)) errors.push("test_demo");
  if (q.question && AMBIGUOUS_RE.test(q.question)) errors.push("ambiguous");
  if (q.question && q.question.length < 12) errors.push("too_short");
  if (q.question && q.question.length > 400) errors.push("too_long");
  if (q.id && /^(test|e2e|demo|mock)/i.test(q.id)) errors.push("test_demo");

  const opts = q.options;
  if (!Array.isArray(opts) || opts.length !== 4) errors.push("requires_four_options");
  else {
    const t = opts.map((o) => String(o).trim());
    if (t.some((o) => !o)) errors.push("empty_option");
    if (new Set(t).size < 4) errors.push("duplicate_options");
  }

  const ci = q.correct_index;
  if (ci == null || ci < 0 || ci >= (opts?.length || 0)) errors.push("invalid_correct_index");
  if (!q.explanation?.trim()) errors.push("missing_explanation");
  if (!q.source?.trim()) errors.push("missing_source");

  return errors;
}

const LEGACY_MAP = {
  "quran-sciences": "quran",
  gharib: "quran",
  tajweed: "quran",
  "hadith-sciences": "hadith-sciences",
  prophets: "seera",
  sahaba: "scholars",
  dua: "adhkar",
  mutoon: "mutoon",
};

function resolveMain(slug) {
  if (!slug) return "quran";
  return LEGACY_MAP[slug] || slug;
}

function loadAll() {
  const bank = JSON.parse(readFileSync(BANK_PATH, "utf8"));
  let seed = [];
  let v2Seed = [];
  try {
    const raw = readFileSync(SEED_PATH, "utf8");
    const re = /q\(\{([\s\S]*?)\}\)/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
      try {
        const obj = Function(`"use strict"; return ({${m[1]}});`)();
        seed.push(obj);
      } catch {
        /* skip */
      }
    }
  } catch {
    /* ignore */
  }
  try {
    v2Seed = JSON.parse(readFileSync(V2_SEED_PATH, "utf8"));
  } catch {
    /* run enrich-seed-to-v2.mjs first */
  }
  const total = bank.length + seed.length + v2Seed.length;
  return {
    bank,
    seed,
    v2Seed,
    sources: { bank: bank.length, seed: seed.length, v2Seed: v2Seed.length, total },
  };
}

function main() {
  const { bank, seed, v2Seed, sources } = loadAll();
  // v2 seed first (curated + enriched), then legacy for dedup audit
  const all = [...v2Seed, ...bank, ...seed];
  const removed = { total: 0, byReason: {} };
  const kept = [];
  const seenHash = new Set();
  const seenText = new Set();

  function bump(reason) {
    removed.total++;
    removed.byReason[reason] = (removed.byReason[reason] || 0) + 1;
  }

  for (const raw of all) {
    const errors = validate(raw);
    if (errors.length) {
      for (const e of errors) bump(e);
      continue;
    }

    const answer = raw.options[raw.correct_index];
    const hash = contentHash(raw.question, answer);
    if (seenHash.has(hash)) {
      bump("duplicate_hash");
      continue;
    }

    const norm = normalizeArabic(raw.question);
    if (seenText.has(norm)) {
      bump("duplicate_wording");
      continue;
    }

    let dupSim = false;
    for (const prev of kept) {
      if (tokenSimilarity(raw.question, prev.question) >= 0.92) {
        dupSim = true;
        break;
      }
    }
    if (dupSim) {
      bump("semantic_duplicate");
      continue;
    }

    if (WEAK_TEMPLATE_RE.test(raw.question) && !raw.explanation?.includes("لأن")) {
      bump("weak_quality");
      continue;
    }

    seenHash.add(hash);
    seenText.add(norm);

    const category_slug = resolveMain(raw.category_slug);
    const hasFullMeta = Boolean(raw.reference || raw.book_name || raw.evidence);

    const alreadyV2 = raw.workflow_stage && raw.content_hash;
    kept.push({
      id: raw.id?.startsWith("sq-") ? `qb-v2-${raw.id}` : raw.id || `qb-v2-${hash.slice(0, 8)}`,
      question: raw.question.trim(),
      options: raw.options.map((o) => String(o).trim()),
      correct_index: raw.correct_index,
      explanation: raw.explanation.trim(),
      evidence: raw.evidence || undefined,
      source: raw.source.trim(),
      reference: raw.reference || raw.source,
      book_name: raw.book_name || undefined,
      chapter: raw.chapter || undefined,
      difficulty: raw.difficulty || "متوسط",
      category_slug,
      subcategory_slug: raw.subcategory_slug || (raw.category_slug !== category_slug ? raw.category_slug : undefined),
      keywords: raw.keywords || [],
      language: raw.language || "ar",
      reviewed_at: raw.reviewed_at || undefined,
      last_reviewer: raw.last_reviewer || undefined,
      status: alreadyV2 ? raw.status : hasFullMeta ? "published" : "review",
      workflow_stage: alreadyV2 ? raw.workflow_stage : hasFullMeta ? "published" : "sharia_review",
      content_hash: alreadyV2 ? raw.content_hash : hash,
      question_type: raw.question_type || "multiple_choice",
      points: raw.points || 10,
      linked_lesson_ids: raw.linked_lesson_ids || [],
    });
  }

  const coverageByCategory = {};
  for (const q of kept) {
    coverageByCategory[q.category_slug] = (coverageByCategory[q.category_slug] || 0) + 1;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    before: { total: all.length, sources },
    removed,
    kept: {
      total: kept.length,
      published: kept.filter((q) => q.status === "published").length,
      review: kept.filter((q) => q.status === "review").length,
    },
    qualityScore: kept.length ? Math.round((kept.filter((q) => q.status === "published").length / kept.length) * 100) : 0,
    coverageByCategory,
  };

  console.log("=== Question Bank V2 Rebuild ===\n");
  console.log(`Before: ${all.length} questions`);
  console.log(`Removed: ${removed.total}`);
  console.log(`Kept: ${kept.length} (${report.kept.published} published, ${report.kept.review} review)`);
  console.log(`Quality score: ${report.qualityScore}%`);
  console.log("\nRemoved by reason:");
  for (const [k, v] of Object.entries(removed.byReason).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  if (process.argv.includes("--write")) {
    mkdirSync(join(ROOT, "reports"), { recursive: true });
    writeFileSync(OUT_PATH, JSON.stringify(kept, null, 2), "utf8");
    writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nWrote ${OUT_PATH}`);
    console.log(`Report: ${REPORT_PATH}`);
  } else {
    console.log("\nRun with --write to emit questions-bank-v2.json");
  }
}

main();
