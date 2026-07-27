#!/usr/bin/env node
/**
 * Round 81 bulk content — quiz/QA/fawaid/stories/PM.
 * Usage: node scripts/enrich-round81-content.mjs [--apply] [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUIZ_ITEMS, QA_ITEMS, FAWAID_ITEMS, STORY_ITEMS, PM_ITEMS } from "./r81-content-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIB = path.join(ROOT, "src/lib");

const ROUND = 81;
const QUIZ_START = 2855;
const QUIZ_END = 2904;
const QA_START = 1860;
const QA_END = 1899;
const STORY_SLUGS = STORY_ITEMS.map((s) => s.slug);
const PM_IDS = PM_ITEMS.map((x) => x.id);
const QUIZ_ANSWER_MIN = 60;
const QUIZ_EXPL_MIN = 80;
const QA_ANSWER_MIN = 90;
const FAWAID_MIN = 145;
const STORY_CONTENT_MIN = 500;

function insertBeforeClosing(content, marker, block) {
  const idx = content.lastIndexOf(marker);
  if (idx === -1) throw new Error(`Cannot find ${marker}`);
  return content.slice(0, idx) + block + content.slice(idx);
}

function js(value) {
  return JSON.stringify(value);
}

function renderObject(item) {
  return JSON.stringify(item, null, 2)
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}

function renderQuizItem(q) {
  return `  {
    "id": "demo-quiz-${q.id}",
    "section": ${js(q.section)},
    "category": ${js(q.category)},
    "level": ${js(q.level)},
    "question": ${js(q.question)},
    "answer": ${js(q.answer)},
    "explanation": ${js(q.explanation)},
    "reference": ${js(q.reference)},
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  }`;
}

function renderQaItem(q) {
  return `  {
    "id": "seed-qa-${q.id}",
    "question": ${js(q.question)},
    "answer": ${js(q.answer)},
    "category_id": ${js(q.category_id)},
    "ruling_type": ${js(q.ruling_type)},
    "evidence": "",
    "reference": ${js(q.reference)},
    "status": "published",
    "review_status": "approved",
    "created_at": "2024-05-12T15:00:00.000Z",
    "qa_categories": { "name": ${js(q.cat_name)}, "slug": ${js(q.cat_slug)} },
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  }`;
}

function renderFawaidItem(f) {
  return `  { text: ${js(f.text)}, category: ${js(f.category)}, source: ${js(f.source)}, author_name: ${js(f.author_name)}, status: "approved", verification_status: "verified" }`;
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

function assertSourceData() {
  const problems = [];
  if (QUIZ_ITEMS.length !== 50) problems.push(`QUIZ_ITEMS length ${QUIZ_ITEMS.length}`);
  if (QA_ITEMS.length !== 40) problems.push(`QA_ITEMS length ${QA_ITEMS.length}`);
  if (FAWAID_ITEMS.length !== 25) problems.push(`FAWAID_ITEMS length ${FAWAID_ITEMS.length}`);
  if (STORY_ITEMS.length !== 5) problems.push(`STORY_ITEMS length ${STORY_ITEMS.length}`);
  if (PM_ITEMS.length !== 5) problems.push(`PM_ITEMS length ${PM_ITEMS.length}`);
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
  for (const s of STORY_ITEMS) {
    if ((s.full_content || "").length < STORY_CONTENT_MIN) problems.push(`short story ${s.slug}`);
  }
  if (problems.length) throw new Error(`Invalid r${ROUND} source data: ${problems.join(", ")}`);
}

function addSeeds(apply) {
  assertSourceData();
  const stats = { quiz: 0, qa: 0, fawaid: 0, stories: 0, pm: 0 };

  const quizPath = path.join(LIB, "quiz-seed.ts");
  let quizContent = fs.readFileSync(quizPath, "utf8");
  if (!quizContent.includes("demo-quiz-2855")) {
    const block =
      "  /* ───────── جولة ٨١: محتوى أفقي (2855-2904) ───────── */\n" +
      QUIZ_ITEMS.map(renderQuizItem).join(",\n");
    if (apply) {
      quizContent = insertBeforeClosing(quizContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(quizPath, quizContent, "utf8");
    }
    stats.quiz = QUIZ_ITEMS.length;
  }

  const qaPath = path.join(LIB, "qa-seed.ts");
  let qaContent = fs.readFileSync(qaPath, "utf8");
  if (!qaContent.includes("seed-qa-1860")) {
    const block = QA_ITEMS.map(renderQaItem).join(",\n");
    if (apply) {
      qaContent = insertBeforeClosing(qaContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(qaPath, qaContent, "utf8");
    }
    stats.qa = QA_ITEMS.length;
  }

  const fawaidPath = path.join(LIB, "fawaid-curated-seed.ts");
  let fawaidContent = fs.readFileSync(fawaidPath, "utf8");
  if (!fawaidContent.includes("إضافات جولة ٨١")) {
    const block = "  /* ── إضافات جولة ٨١ ── */\n" + FAWAID_ITEMS.map(renderFawaidItem).join(",\n");
    if (apply) {
      fawaidContent = insertBeforeClosing(fawaidContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(fawaidPath, fawaidContent, "utf8");
    }
    stats.fawaid = FAWAID_ITEMS.length;
  }

  const storiesPath = path.join(LIB, "islamic-stories-seed.ts");
  let storiesContent = fs.readFileSync(storiesPath, "utf8");
  if (!storiesContent.includes("story-r81-1")) {
    const block =
      "  /* ────────── جولة ٨١: قصص أصلية (274-278) ────────── */\n" +
      STORY_ITEMS.map(renderObject).join(",\n");
    if (apply) {
      storiesContent = insertBeforeClosing(storiesContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(storiesPath, storiesContent, "utf8");
    }
    stats.stories = STORY_ITEMS.length;
  }

  const pmPath = path.join(LIB, "prophetic-medicine-seed.ts");
  let pmContent = fs.readFileSync(pmPath, "utf8");
  if (!pmContent.includes("miswak-oral-care-r81")) {
    const block =
      "/* ── إضافات جولة ٨١: طب نبوي بمنهجية التثبت ── */\n" +
      PM_ITEMS.map(renderObject).join(",\n");
    if (apply) {
      pmContent = insertBeforeClosing(pmContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(pmPath, pmContent, "utf8");
    }
    stats.pm = PM_ITEMS.length;
  }

  return stats;
}

function countFawaidCurated() {
  const src = fs.readFileSync(path.join(LIB, "fawaid-curated-seed.ts"), "utf8");
  return [...src.matchAll(/\{\s*text:\s*"/g)].length;
}

function countRoundFawaid(round) {
  const src = fs.readFileSync(path.join(LIB, "fawaid-curated-seed.ts"), "utf8");
  const marker = `إضافات جولة ${round === 81 ? "٨١" : "٨٢"}`;
  const start = src.indexOf(marker);
  if (start === -1) return { count: 0, short: 0 };
  const rest = src.slice(start + marker.length);
  const next = rest.search(/إضافات جولة [٠-٩]+/);
  const block = next === -1 ? rest : rest.slice(0, next);
  const texts = [...block.matchAll(/text:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`));
  return { count: texts.length, short: texts.filter((t) => t.length < FAWAID_MIN).length };
}

function maxNumericId(items, prefix) {
  return Math.max(...items.map((x) => parseInt((x.id || "").replace(prefix, ""), 10)).filter(Number.isFinite));
}

async function verifyCounts() {
  const qa = readTsExport("qa-seed.ts", "SEED_QA");
  const quiz = readTsExport("quiz-seed.ts", "DEMO_QUIZ_QUESTIONS");
  const pm = readTsExport("prophetic-medicine-seed.ts", "PROPHETIC_MEDICINE_ITEMS");
  const stories = readTsExport("islamic-stories-seed.ts", "ISLAMIC_STORIES_SEED");
  const fawaid = countRoundFawaid(81);
  const quizRound = quiz.filter((q) => {
    const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
    return n >= QUIZ_START && n <= QUIZ_END;
  });
  const qaRound = qa.filter((q) => {
    const n = parseInt((q.id || "").replace("seed-qa-", ""), 10);
    return n >= QA_START && n <= QA_END;
  });
  const storiesRound = stories.filter((s) => STORY_SLUGS.includes(s.slug));
  const pmRound = pm.filter((x) => PM_IDS.includes(x.id));

  return {
    quizRound81: quizRound.length,
    quizRound81ShortAnswers: quizRound.filter((q) => (q.answer || "").length < QUIZ_ANSWER_MIN).length,
    quizRound81ShortExpl: quizRound.filter((q) => (q.explanation || "").length < QUIZ_EXPL_MIN).length,
    qaRound81: qaRound.length,
    qaRound81ShortAnswers: qaRound.filter((q) => (q.answer || "").length < QA_ANSWER_MIN).length,
    fawaidRound81Block: fawaid.count,
    fawaidRound81Short145: fawaid.short,
    storiesRound81: storiesRound.length,
    storiesRound81ShortContent: storiesRound.filter((s) => (s.full_content || "").length < STORY_CONTENT_MIN).length,
    pmRound81: pmRound.length,
    pmRound81WeakAsFixed: pmRound.filter((x) => /ضعيف/.test(x.hadithSource || "") && !/لا يثبت|ضعف|ضعيف/.test(`${x.body || ""} ${x.benefits?.join(" ") || ""}`)).length,
    quizTotal: quiz.length,
    qaTotal: qa.length,
    fawaidTotal: countFawaidCurated(),
    storiesTotal: stories.length,
    pmTotal: pm.length,
    lastQuizId: `demo-quiz-${maxNumericId(quiz, "demo-quiz-")}`,
    lastQaId: `seed-qa-${maxNumericId(qa, "seed-qa-")}`,
    lastStorySlug: stories.at(-1)?.slug,
    roundLastQuizId: `demo-quiz-${maxNumericId(quizRound, "demo-quiz-")}`,
    roundLastQaId: `seed-qa-${maxNumericId(qaRound, "seed-qa-")}`,
    roundLastStorySlug: storiesRound.reduce((latest, story) => (!latest || story.id > latest.id ? story : latest), null)?.slug,
    pmRound81Ids: pmRound.map((x) => x.id),
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
    (a.quizRound81 ?? 0) !== 50 ||
    (a.quizRound81ShortAnswers ?? 1) > 0 ||
    (a.quizRound81ShortExpl ?? 1) > 0 ||
    (a.qaRound81 ?? 0) !== 40 ||
    (a.qaRound81ShortAnswers ?? 1) > 0 ||
    (a.fawaidRound81Block ?? 0) !== 25 ||
    (a.fawaidRound81Short145 ?? 1) > 0 ||
    (a.storiesRound81 ?? 0) !== 5 ||
    (a.storiesRound81ShortContent ?? 1) > 0 ||
    (a.pmRound81 ?? 0) !== 5 ||
    (a.pmRound81WeakAsFixed ?? 1) > 0 ||
    a.roundLastQuizId !== "demo-quiz-2904" ||
    a.roundLastQaId !== "seed-qa-1899" ||
    a.roundLastStorySlug !== "story-r81-5";
  process.exit(fail ? 1 : 0);
}
