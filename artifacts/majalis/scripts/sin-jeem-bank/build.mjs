/**
 * Sin Jeem question bank builder
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SECTION_MAP = {
  "\u0627\u0644\u0623\u0646\u0628\u064a\u0627\u0621": { slug: "prophets", type: "multiple_choice", source: "\u0627\u0644\u0642\u0631\u0622\u0646" },
  "\u0627\u0644\u0635\u062d\u0627\u0628\u0629": { slug: "sahaba", type: "companion_choice", source: "\u0627\u0644\u0633\u064a\u0631\u0629" },
  "\u0627\u0644\u0633\u064a\u0631\u0629": { slug: "seera", type: "multiple_choice", source: "\u0627\u0644\u0633\u064a\u0631\u0629 \u0627\u0644\u0646\u0628\u0648\u064a\u0629" },
  "\u0627\u0644\u0623\u062d\u0643\u0627\u0645": { slug: "fiqh", type: "multiple_choice", source: "\u0627\u0644\u0641\u0642\u0647" },
  "\u0627\u0644\u0635\u0627\u0644\u062d\u0648\u0646": { slug: "fiqh", sub: "scholars", type: "scholar_choice", source: "\u062a\u0631\u0627\u062c\u0645 \u0627\u0644\u0639\u0644\u0645\u0627\u0621" },
  "\u0627\u0644\u0623\u0644\u063a\u0627\u0632 \u0627\u0644\u0634\u0631\u0639\u064a\u0629": { slug: "islamic-puzzles", type: "multiple_choice", source: "\u0627\u0644\u062b\u0642\u0627\u0641\u0629 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064a\u0629" },
};

const SUBSECTION_HINTS = {
  "\u0623\u0645\u0647\u0627\u062a \u0627\u0644\u0645\u0624\u0645\u0646\u064a\u0646": "um-muminin",
  "\u0627\u0644\u0645\u0633\u0627\u062c\u062f": "mosques",
  "\u0627\u0644\u063a\u0632\u0648\u0627\u062a": "ghazwat",
  "\u0627\u0644\u062e\u0644\u0641\u0627\u0621": "khulafa-rashidun",
};

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function mcOptions(correct, pool) {
  const opts = [correct];
  for (const x of shuffle(pool)) {
    if (x !== correct && !opts.includes(x) && opts.length < 4) opts.push(x);
  }
  while (opts.length < 4) opts.push("\u2014");
  return shuffle(opts);
}

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, name), "utf8"));
}

function loadCsvQuestions() {
  const csvPath = path.join(ROOT, "data/quiz_questions.csv");
  if (!fs.existsSync(csvPath)) return [];
  return fs
    .readFileSync(csvPath, "utf8")
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const m = line.match(/^"([^"]*)","([^"]*)","([^"]*)","([^"]*)","([^"]*)"$/);
      if (!m) return null;
      return { section: m[1], category: m[2], level: m[3], question: m[4], answer: m[5] };
    })
    .filter(Boolean);
}

function buildFromCsv() {
  const rows = loadCsvQuestions();
  const answers = rows.map((r) => r.answer);
  return rows.map((row) => {
    const map = SECTION_MAP[row.section] || { slug: "fiqh", type: "multiple_choice", source: "\u0627\u0644\u0641\u0642\u0647" };
    const sub = SUBSECTION_HINTS[row.category];
    const opts = mcOptions(row.answer, answers);
    return {
      category_slug: map.slug,
      subcategory_slug: sub || map.sub,
      question_type: map.type,
      difficulty: row.level === "\u0633\u0647\u0644" ? "\u0633\u0647\u0644" : "\u0645\u062a\u0648\u0633\u0637",
      question: row.question,
      options: opts,
      correct_index: opts.indexOf(row.answer),
      explanation: `\u0627\u0644\u062c\u0648\u0627\u0628 \u0627\u0644\u0635\u062d\u064a\u062d: ${row.answer}`,
      source: map.source,
      keywords: [row.category, row.section],
    };
  });
}

function buildSurahQuestions(surahs) {
  const out = [];
  const ayahPool = surahs.map((s) => String(s.ayahs));
  const numPool = surahs.map((s) => String(s.n));
  const meccan = "\u0645\u0643\u064a\u0629";
  const medinan = "\u0645\u062f\u0646\u064a\u0629";

  for (const s of surahs) {
    const o1 = mcOptions(String(s.ayahs), ayahPool.filter((x) => x !== String(s.ayahs)));
    out.push({
      category_slug: "quran",
      question_type: "multiple_choice",
      difficulty: s.ayahs > 150 ? "\u0645\u062a\u0648\u0633\u0637" : "\u0633\u0647\u0644",
      question: `\u0643\u0645 \u0639\u062f\u062f \u0622\u064a\u0627\u062a \u0633\u0648\u0631\u0629 ${s.name}\u061f`,
      options: o1,
      correct_index: o1.indexOf(String(s.ayahs)),
      explanation: `\u0633\u0648\u0631\u0629 ${s.name} \u0639\u062f\u062f \u0622\u064a\u0627\u062a\u0647\u0627 ${s.ayahs}.`,
      source: "\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064a\u0645",
      keywords: [s.name, "\u0622\u064a\u0627\u062a"],
    });

    const o2 = mcOptions(String(s.n), numPool.filter((x) => x !== String(s.n)));
    out.push({
      category_slug: "quran",
      question_type: "count",
      difficulty: "\u0645\u062a\u0648\u0633\u0637",
      question: `\u0645\u0627 \u0631\u0642\u0645 \u0633\u0648\u0631\u0629 ${s.name} \u0641\u064a \u0627\u0644\u0645\u0635\u062d\u0641\u061f`,
      options: o2,
      correct_index: o2.indexOf(String(s.n)),
      source: "\u0627\u0644\u0642\u0631\u0622\u0646",
      keywords: [s.name, "\u062a\u0631\u062a\u064a\u0628"],
    });

    const label = s.type === medinan ? medinan : meccan;
    out.push({
      category_slug: "maki-madani",
      subcategory_slug: "maki-madani",
      question_type: "true_false",
      difficulty: "\u0645\u062a\u0648\u0633\u0637",
      question: `\u0633\u0648\u0631\u0629 ${s.name} ${label}.`,
      options: ["\u0635\u062d", "\u062e\u0637\u0623"],
      correct_index: 0,
      explanation: `\u0633\u0648\u0631\u0629 ${s.name} ${label}.`,
      source: "\u0639\u0644\u0648\u0645 \u0627\u0644\u0642\u0631\u0622\u0646",
      keywords: [s.name, label],
    });

    const namePool = surahs.map((x) => x.name).filter((x) => x !== s.name);
    const o3 = mcOptions(s.name, namePool);
    out.push({
      category_slug: "quran-sciences",
      question_type: "multiple_choice",
      difficulty: "\u0645\u062a\u0648\u0633\u0637",
      question: `\u0645\u0627 \u0627\u0633\u0645 \u0627\u0644\u0633\u0648\u0631\u0629 \u0631\u0642\u0645 ${s.n}\u061f`,
      options: o3,
      correct_index: o3.indexOf(s.name),
      source: "\u0627\u0644\u0642\u0631\u0622\u0646",
      keywords: [s.name, "\u0627\u0633\u0645"],
    });
  }
  return out;
}

function buildExtended() {
  const batches = loadJson("extended.json");
  const pool = batches.map((b) => b.answer);
  return batches.map((b) => {
    const opts = mcOptions(b.answer, pool.filter((x) => x !== b.answer));
    return {
      category_slug: b.slug,
      subcategory_slug: b.sub,
      question_type: b.type,
      difficulty: b.difficulty || "\u0645\u062a\u0648\u0633\u0637",
      question: b.question,
      options: opts,
      correct_index: opts.indexOf(b.answer),
      explanation: b.explanation,
      source: b.source,
      keywords: b.keywords || [],
    };
  });
}

export function buildAll() {
  const surahs = loadJson("surahs.json");
  let curated = [];
  try {
    curated = loadJson("curated.json");
  } catch {
    curated = [];
  }

  const all = [
    ...curated,
    ...buildFromCsv(),
    ...buildSurahQuestions(surahs),
    ...buildExtended(),
  ];

  const seen = new Set();
  const unique = [];
  for (const q of all) {
    const key = q.question.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(q);
  }

  return unique.map((q, i) => {
    const item = {
      id: `sq-${String(i + 1).padStart(3, "0")}`,
      category_slug: q.category_slug,
      question_type: q.question_type,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      difficulty: q.difficulty,
      source: q.source,
      keywords: q.keywords || [],
    };
    if (q.subcategory_slug) item.subcategory_slug = q.subcategory_slug;
    if (q.explanation) item.explanation = q.explanation;
    return item;
  });
}

export function writeBank(outPath) {
  const questions = buildAll();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(questions, null, 2), "utf8");
  return questions;
}
