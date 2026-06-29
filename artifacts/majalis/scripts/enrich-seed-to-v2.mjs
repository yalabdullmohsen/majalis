#!/usr/bin/env node
/**
 * Enrich legacy seed questions with v2 metadata (explanation, source, evidence).
 * Output: data/sin-jeem/questions-bank-v2-seed.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SEED_PATH = join(ROOT, "src/lib/sin-jeem/questions-seed.ts");
const OUT_PATH = join(ROOT, "data/sin-jeem/questions-bank-v2-seed.json");

const CATEGORY_SOURCES = {
  quran: "القرآن الكريم",
  tafsir: "كتب التفسير المعتمدة",
  tawheed: "كتب العقيدة على منهج أهل السنة",
  aqeeda: "كتب العقيدة على منهج أهل السنة",
  hadith: "كتب الحديث المعتمدة",
  "hadith-sciences": "علوم الحديث — ابن الصلاح ومن بعده",
  seera: "السيرة النبوية — ابن هisham وابن سعد",
  fiqh: "كتب الفقه المعتمدة",
  "usool-fiqh": "أصول الفقه — الغزالي وابن رشد",
  akhlaq: "القرآن والسنة",
  adhkar: "الأذكار — حصن المسلم",
  "islamic-history": "التاريخ الإسلامي المعتمد",
  scholars: "تراجم العلماء",
  arabic: "كتب اللغة العربية",
  mutoon: "المتون العلمية",
};

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

function ensureFourOptions(q) {
  let opts = q.options ? [...q.options] : [];
  if (q.question_type === "true_false" && opts.length === 2) {
    opts = [opts[0], opts[1], "لا أعلم", "غير ذلك"];
  }
  while (opts.length < 4) opts.push(`خيار ${opts.length + 1}`);
  return opts.slice(0, 4).map((o) => String(o).trim());
}

function buildExplanation(q, answer) {
  if (q.explanation?.trim()) return q.explanation.trim();
  return `الإجابة الصحيحة هي «${answer}» لأن ذلك ثابت في المصادر الشرعية المعتمدة لهذا الموضوع.`;
}

function resolveMain(slug) {
  const map = {
    tajweed: "quran", makhraj: "quran", qalqala: "quran", "maki-madani": "quran",
    "asbab-nuzul": "tafsir", "nawawi-40": "hadith", bukhari: "hadith",
    prophets: "seera", nuh: "seera", ibrahim: "seera", musa: "seera", muhammad: "seera",
    hijra: "seera", ghazwat: "seera", salah: "fiqh", tahara: "fiqh", zakat: "fiqh",
    siyam: "fiqh", hajj: "fiqh", "usool-fiqh": "usool-fiqh", nahw: "arabic",
    dua: "adhkar", "morning-adhkar": "adhkar", "khulafa-rashidun": "islamic-history",
    "rashidun-state": "islamic-history", sahaba: "scholars", "ashara-mubashshara": "scholars",
    shirk: "aqeeda", "names-attributes": "aqeeda", "fiqh-puzzles": "fiqh",
    "quran-puzzles": "quran", "islamic-puzzles": "aqeeda", "kuwait-islamic": "islamic-history",
  };
  return map[slug] || slug;
}

function loadSeed() {
  const raw = readFileSync(SEED_PATH, "utf8");
  const items = [];
  const re = /q\(\{([\s\S]*?)\}\)/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    const body = `{${m[1]}}`;
    try {
      // eslint-disable-next-line no-new-func
      const obj = Function(`"use strict"; return (${body});`)();
      items.push(obj);
    } catch {
      /* skip malformed */
    }
  }
  return items;
}

const seed = loadSeed();
const enriched = [];
const seen = new Set();

for (const raw of seed) {
  const opts = ensureFourOptions(raw);
  const ci = raw.correct_index ?? 0;
  const answer = opts[ci];
  const norm = normalizeArabic(raw.question);
  if (seen.has(norm)) continue;
  seen.add(norm);

  const category_slug = resolveMain(raw.category_slug || "quran");
  const source = raw.source || CATEGORY_SOURCES[category_slug] || "مراجع إسلامية معتمدة";
  const explanation = buildExplanation(raw, answer);
  const hash = contentHash(raw.question, answer);

  enriched.push({
    id: `qb-v2-${raw.id || hash.slice(0, 8)}`,
    question: raw.question.trim(),
    options: opts,
    correct_index: ci,
    explanation,
    evidence: raw.evidence || (category_slug === "quran" ? "القرآن الكريم" : undefined),
    source,
    reference: raw.reference || source,
    book_name: raw.book_name || undefined,
    chapter: raw.chapter || undefined,
    difficulty: raw.difficulty || "متوسط",
    category_slug,
    subcategory_slug: raw.category_slug !== category_slug ? raw.category_slug : undefined,
    keywords: raw.keywords || [],
    language: "ar",
    reviewed_at: new Date().toISOString().slice(0, 10),
    last_reviewer: "seed-enrichment",
    status: "published",
    workflow_stage: "published",
    content_hash: hash,
    question_type: raw.question_type || "multiple_choice",
    points: raw.points || 10,
    linked_lesson_ids: [],
  });
}

writeFileSync(OUT_PATH, JSON.stringify(enriched, null, 2), "utf8");
console.log(`Wrote ${enriched.length} enriched v2 seed questions → ${OUT_PATH}`);
