#!/usr/bin/env node
/**
 * Round 79 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round79-content.mjs [--apply] [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUIZ_ITEMS, QA_ITEMS, FAWAID_ITEMS } from "./r79-content-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIB = path.join(ROOT, "src/lib");

const QA_ANSWER_MIN = 90;
const QUIZ_ANSWER_MIN = 60;
const QUIZ_EXPL_MIN = 80;
const FAWAID_MIN = 145;
const STORY_CONTENT_MIN = 450;

const QUIZ_START = 2755;
const QUIZ_END = 2804;
const QA_START = 1780;
const QA_END = 1819;
const STORY_SLUGS = ["story-r79-1", "story-r79-2", "story-r79-3", "story-r79-4", "story-r79-5"];
const PM_R79_IDS = [
  "fever-water-r79",
  "honey-abdomen-r79",
  "fly-vessel-r79",
  "qist-therapy-r79",
  "patient-appetite-r79",
];

function insertBeforeClosing(content, marker, block) {
  const idx = content.lastIndexOf(marker);
  if (idx === -1) throw new Error(`Cannot find ${marker}`);
  return content.slice(0, idx) + block + content.slice(idx);
}

function readTsExport(file, exportName) {
  const src = fs.readFileSync(path.join(LIB, file), "utf8");
  if (file === "quiz-seed.ts") {
    const match = src.match(/export const DEMO_QUIZ_QUESTIONS: QuizQuestion\[\] = (\[[\s\S]*\]);/);
    if (!match) throw new Error("Cannot parse quiz");
    return Function(`"use strict"; return (${match[1]});`)();
  }
  const anchor = `export const ${exportName}`;
  const startIdx = src.indexOf(anchor);
  if (startIdx === -1) throw new Error(`Cannot find ${exportName}`);
  const arrStart = src.indexOf("[", src.indexOf("=", startIdx));
  let depth = 0;
  let inStr = null;
  let escape = false;
  for (let i = arrStart; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      continue;
    }
    if (c === "[") depth++;
    if (c === "]") {
      depth--;
      if (depth === 0) return Function(`"use strict"; return (${src.slice(arrStart, i + 1)});`)();
    }
  }
  throw new Error(`Cannot parse ${exportName}`);
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

function readBlock(file) {
  return fs.readFileSync(path.join(__dirname, file), "utf8").trim();
}

function assertSourceData() {
  const problems = [];
  if (QUIZ_ITEMS.length !== 50) problems.push(`QUIZ_ITEMS length ${QUIZ_ITEMS.length}`);
  if (QA_ITEMS.length !== 40) problems.push(`QA_ITEMS length ${QA_ITEMS.length}`);
  if (FAWAID_ITEMS.length !== 25) problems.push(`FAWAID_ITEMS length ${FAWAID_ITEMS.length}`);
  for (const q of QUIZ_ITEMS) {
    if ((q.answer || "").length < QUIZ_ANSWER_MIN) problems.push(`short quiz answer ${q.id}`);
    if ((q.explanation || "").length < QUIZ_EXPL_MIN) problems.push(`short quiz explanation ${q.id}`);
  }
  for (const q of QA_ITEMS) {
    if ((q.answer || "").length < QA_ANSWER_MIN) problems.push(`short QA answer ${q.id}`);
  }
  for (const f of FAWAID_ITEMS) {
    if ((f.text || "").length < FAWAID_MIN) problems.push(`short fawaid text ${f.category}`);
  }
  if (problems.length) throw new Error(`Invalid r79 source data: ${problems.join(", ")}`);
}

function addSeeds(apply) {
  assertSourceData();
  const stats = { quiz: 0, qa: 0, fawaid: 0, stories: 0, pm: 0 };
  const marker = "جولة ٧٩";

  const quizPath = path.join(LIB, "quiz-seed.ts");
  let quizContent = fs.readFileSync(quizPath, "utf8");
  if (!quizContent.includes(marker)) {
    const block =
      `  /* ───────── ${marker}: محتوى أفقي (2755-2804) ───────── */\n` +
      QUIZ_ITEMS.map(renderQuizItem).join(",\n");
    if (apply) {
      quizContent = insertBeforeClosing(quizContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(quizPath, quizContent, "utf8");
    }
    stats.quiz = QUIZ_ITEMS.length;
  }

  const qaPath = path.join(LIB, "qa-seed.ts");
  let qaContent = fs.readFileSync(qaPath, "utf8");
  if (!qaContent.includes("seed-qa-1780")) {
    const block = QA_ITEMS.map(renderQaItem).join(",\n");
    if (apply) {
      qaContent = insertBeforeClosing(qaContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(qaPath, qaContent, "utf8");
    }
    stats.qa = QA_ITEMS.length;
  }

  const fawaidPath = path.join(LIB, "fawaid-curated-seed.ts");
  let fawaidContent = fs.readFileSync(fawaidPath, "utf8");
  if (!fawaidContent.includes("إضافات جولة ٧٩")) {
    const block = `  /* ── إضافات جولة ٧٩ ── */\n` + FAWAID_ITEMS.map(renderFawaidItem).join(",\n");
    if (apply) {
      fawaidContent = insertBeforeClosing(fawaidContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(fawaidPath, fawaidContent, "utf8");
    }
    stats.fawaid = FAWAID_ITEMS.length;
  }

  const storiesPath = path.join(LIB, "islamic-stories-seed.ts");
  let storiesContent = fs.readFileSync(storiesPath, "utf8");
  if (!storiesContent.includes("story-r79-1")) {
    const block = readBlock("r79-original-stories.ts");
    if (apply) {
      storiesContent = insertBeforeClosing(storiesContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(storiesPath, storiesContent, "utf8");
    }
    stats.stories = STORY_SLUGS.length;
  }

  const pmPath = path.join(LIB, "prophetic-medicine-seed.ts");
  let pmContent = fs.readFileSync(pmPath, "utf8");
  if (!pmContent.includes("fever-water-r79")) {
    const block = readBlock("r79-prophetic-medicine.ts");
    if (apply) {
      pmContent = insertBeforeClosing(pmContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(pmPath, pmContent, "utf8");
    }
    stats.pm = PM_R79_IDS.length;
  }

  return stats;
}

function countFawaidCurated() {
  const src = fs.readFileSync(path.join(LIB, "fawaid-curated-seed.ts"), "utf8");
  return [...src.matchAll(/\{\s*text:\s*"/g)].length;
}

async function verifyCounts() {
  const qa = readTsExport("qa-seed.ts", "SEED_QA");
  const quiz = readTsExport("quiz-seed.ts", "DEMO_QUIZ_QUESTIONS");
  const pm = readTsExport("prophetic-medicine-seed.ts", "PROPHETIC_MEDICINE_ITEMS");
  const stories = readTsExport("islamic-stories-seed.ts", "ISLAMIC_STORIES_SEED");
  const fawaidSrc = fs.readFileSync(path.join(LIB, "fawaid-curated-seed.ts"), "utf8");
  const round79Idx = fawaidSrc.indexOf("إضافات جولة ٧٩");
  const fawaidRound79Block =
    round79Idx >= 0 ? fawaidSrc.slice(round79Idx).split("{ text:").length - 1 : 0;
  const fawaidRound79Texts =
    round79Idx >= 0
      ? [...fawaidSrc.slice(round79Idx).matchAll(/text:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1])
      : [];

  const quizRound79 = quiz.filter((q) => {
    const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
    return n >= QUIZ_START && n <= QUIZ_END;
  });
  const qaRound79 = qa.filter((q) => {
    const n = parseInt((q.id || "").replace("seed-qa-", ""), 10);
    return n >= QA_START && n <= QA_END;
  });
  const storiesRound79 = stories.filter((s) => STORY_SLUGS.includes(s.slug));
  const pmRound79 = pm.filter((x) => PM_R79_IDS.includes(x.id));

  return {
    quizRound79: quizRound79.length,
    quizRound79ShortAnswers: quizRound79.filter((q) => (q.answer || "").length < QUIZ_ANSWER_MIN).length,
    quizRound79ShortExpl: quizRound79.filter((q) => (q.explanation || "").length < QUIZ_EXPL_MIN).length,
    qaRound79: qaRound79.length,
    qaRound79ShortAnswers: qaRound79.filter((q) => (q.answer || "").length < QA_ANSWER_MIN).length,
    fawaidRound79Block,
    fawaidRound79Short145: fawaidRound79Texts.filter((t) => t.length < FAWAID_MIN).length,
    storiesRound79: storiesRound79.length,
    storiesRound79ShortContent: storiesRound79.filter((s) => (s.full_content || "").length < STORY_CONTENT_MIN).length,
    pmRound79: pmRound79.length,
    pmRound79WeakAsFixed: pmRound79.filter((x) => /ضعيف/.test(x.hadithSource || "") && !/لا يثبت|ضعف|ضعيف/.test(`${x.body || ""} ${x.benefits?.join(" ") || ""}`)).length,
    quizTotal: quiz.length,
    qaTotal: qa.length,
    fawaidTotal: countFawaidCurated(),
    storiesTotal: stories.length,
    pmTotal: pm.length,
  };
}

const apply = process.argv.includes("--apply");
const verify = process.argv.includes("--verify");

const results = {
  seeds: addSeeds(apply),
};

if (apply || verify) results.after = await verifyCounts();

console.log(JSON.stringify(results, null, 2));

if (verify) {
  const a = results.after || {};
  const fail =
    (a.quizRound79 ?? 0) !== 50 ||
    (a.quizRound79ShortAnswers ?? 1) > 0 ||
    (a.quizRound79ShortExpl ?? 1) > 0 ||
    (a.qaRound79 ?? 0) !== 40 ||
    (a.qaRound79ShortAnswers ?? 1) > 0 ||
    (a.fawaidRound79Block ?? 0) !== 25 ||
    (a.fawaidRound79Short145 ?? 1) > 0 ||
    (a.storiesRound79 ?? 0) !== 5 ||
    (a.storiesRound79ShortContent ?? 1) > 0 ||
    (a.pmRound79 ?? 0) !== 5 ||
    (a.pmRound79WeakAsFixed ?? 1) > 0;
  process.exit(fail ? 1 : 0);
}
