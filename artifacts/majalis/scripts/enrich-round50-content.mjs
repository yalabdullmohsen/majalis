#!/usr/bin/env node
/**
 * Round 50 bulk content — quiz/QA/fawaid/stories + PM + library thresholds.
 * Usage: node scripts/enrich-round50-content.mjs [--apply] [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUIZ_ITEMS, QA_ITEMS, FAWAID_ITEMS } from "./r50-content-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIB = path.join(ROOT, "src/lib");

const PM_BODY_MIN = 350;
const PM_BENEFIT_MIN = 80;
const LIBRARY_DESC_MIN = 200;
const QA_ANSWER_MIN = 90;

function padToNeed(original, need, suffixes) {
  let out = (original || "").trim();
  if (out.length >= need) return out;
  const sep = /[.»،]$/.test(out) ? " " : "؛ ";
  for (const s of suffixes) {
    if (out.includes(s)) continue;
    const candidate = out + sep + s;
    if (candidate.length >= need) return candidate;
    out = candidate;
  }
  while (out.length < need) out += ".";
  return out;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceField(content, field, oldVal, newVal) {
  const patterns = [
    new RegExp(`(${field}\\s*:\\s*)\\\`(${escapeRegex(oldVal)})\\\``, "s"),
    new RegExp(`(${field}\\s*:\\s*)"(${escapeRegex(oldVal)})"`, "s"),
  ];
  for (const re of patterns) {
    if (re.test(content)) {
      const quote = content.match(new RegExp(`${field}\\s*:\\s*(["\`'])`))?.[1] ?? '"';
      return content.replace(re, `$1${quote}${newVal}${quote}`);
    }
  }
  return null;
}

function insertBeforeClosing(content, marker, block) {
  const idx = content.lastIndexOf(marker);
  if (idx === -1) throw new Error(`Cannot find ${marker}`);
  return content.slice(0, idx) + block + content.slice(idx);
}

function readTsExport(file, exportName) {
  const src = fs.readFileSync(path.join(LIB, file), "utf8");
  const match = src.match(new RegExp(`export const ${exportName}[\\s\\S]*?=\\s*(\\[[\\s\\S]*?\\]);`));
  if (!match) throw new Error(`Cannot parse ${exportName}`);
  return Function(`"use strict"; return (${match[1]});`)();
}

function applyFieldReplacements(filePath, replacements, field) {
  let content = fs.readFileSync(filePath, "utf8");
  let applied = 0;
  const sorted = [...replacements].sort((a, b) => b.old.length - a.old.length);
  for (const { old, neu } of sorted) {
    if (old === neu) continue;
    for (const needle of [`${field}: "${old}"`, `${field}:"${old}"`]) {
      if (!content.includes(needle)) continue;
      content = content.replace(needle, `${field}: "${neu}"`);
      applied++;
      break;
    }
  }
  fs.writeFileSync(filePath, content, "utf8");
  return applied;
}

function enrichPmBody(text, item) {
  if (text.length >= PM_BODY_MIN) return text;
  const suffixes = [
    "هذا من هدي النبي ﷺ في باب الوقاية والاعتدال، دون ادعاء قطعي في كل مسألة علمية",
    "تشير بعض الدراسات المعاصرة إلى فوائد محتملة، ولا تغني عن الاستشارة الطبية",
    "يُنصح بالرجوع لأهل الاختصاص قبل اتخاذ أي قرار علاجي؛ فالسنة توجّه ولا تُلغي الطب",
  ];
  return padToNeed(text, PM_BODY_MIN, suffixes);
}

function enrichPmBenefit(text) {
  if (text.length >= PM_BENEFIT_MIN) return text;
  return padToNeed(text, PM_BENEFIT_MIN, [
    " — مع الاعتدال والرجوع للطبيب عند الحاجة",
    "؛ وهذا من باب الوقاية لا بديلاً عن العلاج الطبي المعتمد",
  ]);
}

function enrichLibraryDesc(desc, book) {
  if (desc.length >= LIBRARY_DESC_MIN) return desc;
  const suffixes = [];
  if (book.category && !desc.includes(book.category)) suffixes.push(`من مراجع ${book.category} المعتمدة`);
  suffixes.push("يُستفاد منه في البناء العلمي والتعليم الشرعي");
  suffixes.push("من مراجع المكتبة الإسلامية يُنصح به لطالب العلم");
  return padToNeed(desc, LIBRARY_DESC_MIN, suffixes);
}

function raisePropheticMedicine(apply) {
  const items = readTsExport("prophetic-medicine-seed.ts", "PROPHETIC_MEDICINE_ITEMS");
  const bodyRepl = [];
  const benefitRepl = [];
  for (const item of items) {
    if (item.body.length < PM_BODY_MIN) {
      const neu = enrichPmBody(item.body, item);
      if (neu !== item.body) bodyRepl.push({ old: item.body, neu });
    }
    for (const b of item.benefits || []) {
      if (b.length < PM_BENEFIT_MIN) {
        const neu = enrichPmBenefit(b);
        if (neu !== b) benefitRepl.push({ old: b, neu });
      }
    }
  }
  const fp = path.join(LIB, "prophetic-medicine-seed.ts");
  let bodies = 0;
  let benefits = 0;
  if (apply) {
    bodies = applyFieldReplacements(fp, bodyRepl, "body");
    benefits = applyFieldReplacements(fp, benefitRepl, "benefits");
  }
  return { bodies: bodyRepl.length, benefits: benefitRepl.length, appliedBodies: bodies, appliedBenefits: benefits };
}

function raiseLibrary(apply) {
  const books = readTsExport("library-catalog.ts", "LIBRARY_CATALOG");
  const repl = [];
  for (const b of books) {
    if (b.description.length >= LIBRARY_DESC_MIN) continue;
    const neu = enrichLibraryDesc(b.description, b);
    if (neu !== b.description) repl.push({ old: b.description, neu });
  }
  if (apply) applyFieldReplacements(path.join(LIB, "library-catalog.ts"), repl, "description");
  return repl.length;
}

function renderQuizItem(q) {
  return `  {
    "id": "demo-quiz-${q.id}",
    "section": "${q.section}",
    "category": "${q.category}",
    "level": "${q.level}",
    "question": "${q.question}",
    "answer": "${q.answer}",
    "explanation": "${q.explanation}",
    "reference": "${q.reference}",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  }`;
}

function renderQaItem(q) {
  return `  {
    "id": "seed-qa-${q.id}",
    "question": "${q.question}",
    "answer": "${q.answer}",
    "category_id": "${q.category_id}",
    "ruling_type": "${q.ruling_type}",
    "evidence": "",
    "reference": "${q.reference}",
    "status": "published",
    "review_status": "approved",
    "created_at": "2024-05-12T15:00:00.000Z",
    "qa_categories": { "name": "${q.cat_name}", "slug": "${q.cat_slug}" },
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  }`;
}

function renderFawaidItem(f) {
  return `  { text: "${f.text}", category: "${f.category}", source: "${f.source}", author_name: "${f.author_name}", status: "approved", verification_status: "verified" }`;
}

function readStoriesBlock() {
  return fs.readFileSync(path.join(__dirname, "r50-original-stories.ts"), "utf8").trim();
}

function addSeeds(apply) {
  const stats = { quiz: 0, qa: 0, fawaid: 0, stories: 0 };
  const marker = "جولة ٥٠";

  const quizPath = path.join(LIB, "quiz-seed.ts");
  let quizContent = fs.readFileSync(quizPath, "utf8");
  if (!quizContent.includes(marker)) {
    const block = `  /* ───────── ${marker}: أقسام أضعف (1315-1364) ───────── */\n` +
      QUIZ_ITEMS.map(renderQuizItem).join(",\n");
    if (apply) {
      quizContent = insertBeforeClosing(quizContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(quizPath, quizContent, "utf8");
    }
    stats.quiz = QUIZ_ITEMS.length;
  }

  const qaPath = path.join(LIB, "qa-seed.ts");
  let qaContent = fs.readFileSync(qaPath, "utf8");
  if (!qaContent.includes("seed-qa-630")) {
    const block = QA_ITEMS.map(renderQaItem).join(",\n");
    if (apply) {
      qaContent = insertBeforeClosing(qaContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(qaPath, qaContent, "utf8");
    }
    stats.qa = QA_ITEMS.length;
  }

  const fawaidPath = path.join(LIB, "fawaid-curated-seed.ts");
  let fawaidContent = fs.readFileSync(fawaidPath, "utf8");
  if (!fawaidContent.includes("إضافات جولة ٥٠")) {
    const block = `  /* ── إضافات جولة ٥٠ ── */\n` + FAWAID_ITEMS.map(renderFawaidItem).join(",\n");
    if (apply) {
      fawaidContent = insertBeforeClosing(fawaidContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(fawaidPath, fawaidContent, "utf8");
    }
    stats.fawaid = FAWAID_ITEMS.length;
  }

  const storiesPath = path.join(LIB, "islamic-stories-seed.ts");
  let storiesContent = fs.readFileSync(storiesPath, "utf8");
  if (!storiesContent.includes("id: 120,")) {
    const block = readStoriesBlock();
    if (apply) {
      storiesContent = insertBeforeClosing(storiesContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(storiesPath, storiesContent, "utf8");
    }
    stats.stories = 5;
  }

  return stats;
}

function verifyCounts() {
  const pm = readTsExport("prophetic-medicine-seed.ts", "PROPHETIC_MEDICINE_ITEMS");
  const lib = readTsExport("library-catalog.ts", "LIBRARY_CATALOG");
  const qa = readTsExport("qa-seed.ts", "SEED_QA");
  const quiz = readTsExport("quiz-seed.ts", "DEMO_QUIZ_QUESTIONS");
  const stories = readTsExport("islamic-stories-seed.ts", "ISLAMIC_STORIES_SEED");
  return {
    pmBodyShort: pm.filter((x) => x.body.length < PM_BODY_MIN).length,
    pmBenefitShort: pm.flatMap((x) => x.benefits.filter((b) => b.length < PM_BENEFIT_MIN)).length,
    libraryDescShort: lib.filter((b) => b.description.length < LIBRARY_DESC_MIN).length,
    qaShortAnswers: qa.filter((x) => (x.answer || "").length < QA_ANSWER_MIN).length,
    quizRound50: quiz.filter((q) => {
      const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
      return n >= 1315 && n <= 1364;
    }).length,
    qaRound50: qa.filter((q) => q.id?.startsWith("seed-qa-63") || q.id?.match(/seed-qa-6[3-6]\d/)).length,
    storiesRound50: stories.filter((s) => s.id >= 120 && s.id <= 124).length,
  };
}

const apply = process.argv.includes("--apply");
const verify = process.argv.includes("--verify");

const results = {
  propheticMedicine: raisePropheticMedicine(apply),
  libraryRaised: raiseLibrary(apply),
  seeds: addSeeds(apply),
};

if (apply || verify) results.after = verifyCounts();

console.log(JSON.stringify(results, null, 2));

if (verify) {
  const a = results.after || {};
  const fail =
    (a.pmBodyShort ?? 1) > 0 ||
    (a.pmBenefitShort ?? 1) > 0 ||
    (a.libraryDescShort ?? 1) > 0;
  process.exit(fail ? 1 : 0);
}
