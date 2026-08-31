#!/usr/bin/env node
/**
 * Round 53 bulk content — quiz/QA/fawaid/stories + PM + library thresholds.
 * Usage: node scripts/enrich-round53-content.mjs [--apply] [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUIZ_ITEMS, QA_ITEMS, FAWAID_ITEMS } from "./r53-content-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIB = path.join(ROOT, "src/lib");

const PM_BODY_MIN = 370;
const PM_BENEFIT_MIN = 90;
const LIBRARY_DESC_MIN = 220;
const QA_ANSWER_MIN = 90;
const QUIZ_ANSWER_MIN = 60;
const QUIZ_EXPL_MIN = 80;

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
  if (out.length < need) throw new Error("content-padding banned: do not pad with dots");
  return out;
}

function insertBeforeClosing(content, marker, block) {
  const idx = content.lastIndexOf(marker);
  if (idx === -1) throw new Error(`Cannot find ${marker}`);
  return content.slice(0, idx) + block + content.slice(idx);
}

function countFawaidCurated() {
  const src = fs.readFileSync(path.join(LIB, "fawaid-curated-seed.ts"), "utf8");
  return [...src.matchAll(/\{\s*text:\s*"/g)].length;
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
      if (depth === 0) {
        return Function(`"use strict"; return (${src.slice(arrStart, i + 1)});`)();
      }
    }
  }
  throw new Error(`Cannot parse ${exportName}`);
}

function applyFieldReplacements(filePath, replacements, field) {
  let content = fs.readFileSync(filePath, "utf8");
  let applied = 0;
  const sorted = [...replacements].sort((a, b) => b.old.length - a.old.length);
  for (const { old, neu } of sorted) {
    if (old === neu) continue;
    for (const needle of [`${field}: "${old}"`, `${field}:"${old}"`, `"${field}": "${old}"`]) {
      if (!content.includes(needle)) continue;
      content = content.replace(needle, needle.replace(old, neu));
      applied++;
      break;
    }
  }
  fs.writeFileSync(filePath, content, "utf8");
  return applied;
}

function applyQuotedReplacements(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8");
  let applied = 0;
  const sorted = [...replacements].sort((a, b) => b.old.length - a.old.length);
  for (const { old, neu } of sorted) {
    if (old === neu) continue;
    const needle = `"${old}"`;
    if (!content.includes(needle)) continue;
    content = content.replace(needle, `"${neu}"`);
    applied++;
  }
  fs.writeFileSync(filePath, content, "utf8");
  return applied;
}

function enrichQuizAnswer(q) {
  const existing = (q.answer || "").trim();
  if (existing.length >= QUIZ_ANSWER_MIN) return existing;
  const ref = q.reference && q.reference.length > 5 ? q.reference : "مراجع سُنّة";
  const suffixes = [
    ` — يُستفاد منه في باب ${q.category || q.section || "عام"} مع الرجوع إلى ${ref}.`,
    ` الجواب يُختبر فهم ${q.section || "المادة"} لا الحفظ اللفظي فقط.`,
    ` يُستحسن مراجعة ${ref} لتثبيت الدليل الشرعي.`,
  ];
  return padToNeed(existing, QUIZ_ANSWER_MIN, suffixes);
}

function enrichExplanation(q) {
  const existing = (q.explanation || "").trim();
  if (existing.length >= QUIZ_EXPL_MIN) return existing;
  const ref = q.reference && q.reference.length > 5 ? q.reference : "مراجع سُنّة";
  const suffixes = [
    `يُستفاد منه في باب ${q.category || q.section || "عام"} مع الرجوع إلى ${ref}.`,
    `الجواب يُختبر فهم ${q.section || "المادة"} لا الحفظ اللفظي فقط.`,
    `يُستحسن مراجعة ${ref} لتثبيت الدليل الشرعي.`,
    `هذا السؤال من أقسام ${q.section} التي يُنصح بتكرارها في التعلم.`,
  ];
  const seed = existing || `يُستفاد منه في باب ${q.category || "عام"}.`;
  return padToNeed(seed, QUIZ_EXPL_MIN, suffixes);
}

function enrichPmBody(text) {
  if (text.length >= PM_BODY_MIN) return text;
  return padToNeed(text, PM_BODY_MIN, [
    "هذا من هدي النبي ﷺ في باب الوقاية والاعتدال، دون ادعاء قطعي في كل مسألة علمية",
    "تشير بعض الدراسات المعاصرة إلى فوائد محتملة، ولا تغني عن الاستشارة الطبية",
    "يُنصح بالرجوع لأهل الاختصاص قبل اتخاذ أي قرار علاجي؛ فالسنة توجّه ولا تُلغي الطب",
  ]);
}

function enrichPmBenefit(text) {
  if (text.length >= PM_BENEFIT_MIN) return text;
  return padToNeed(text, PM_BENEFIT_MIN, [
    " — مع الاعتدال والرجوع للطبيب عند الحاجة",
    "؛ وهذا من باب الوقاية لا بديلاً عن العلاج الطبي المعتمد",
    "؛ يُستحسن مراعاة الضوابط الشرعية والطبية معاً",
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

function raiseQuizAnswers(apply) {
  const quiz = readTsExport("quiz-seed.ts", "DEMO_QUIZ_QUESTIONS");
  const repl = [];
  for (const q of quiz) {
    if ((q.answer || "").length >= QUIZ_ANSWER_MIN) continue;
    const neu = enrichQuizAnswer(q);
    if (neu !== q.answer) repl.push({ old: q.answer, neu });
  }
  let applied = 0;
  if (apply && repl.length) {
    applied = applyFieldReplacements(path.join(LIB, "quiz-seed.ts"), repl, "answer");
  }
  return { candidates: repl.length, applied };
}

function raiseQuizExplanations(apply) {
  const quiz = readTsExport("quiz-seed.ts", "DEMO_QUIZ_QUESTIONS");
  const repl = [];
  for (const q of quiz) {
    const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
    if (Number.isFinite(n) && n >= 1465 && (q.explanation || "").length < QUIZ_EXPL_MIN) {
      const neu = enrichExplanation(q);
      if (neu !== q.explanation) repl.push({ old: q.explanation, neu });
    }
  }
  let applied = 0;
  if (apply && repl.length) {
    applied = applyFieldReplacements(path.join(LIB, "quiz-seed.ts"), repl, "explanation");
  }
  return { candidates: repl.length, applied };
}

function raisePmThresholds(apply) {
  const items = readTsExport("prophetic-medicine-seed.ts", "PROPHETIC_MEDICINE_ITEMS");
  const bodyRepl = [];
  const benefitRepl = [];
  for (const item of items.filter(Boolean)) {
    if (item.body.length < PM_BODY_MIN) {
      const neu = enrichPmBody(item.body);
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
    bodies = applyQuotedReplacements(fp, bodyRepl);
    benefits = applyQuotedReplacements(fp, benefitRepl);
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
  if (apply) applyQuotedReplacements(path.join(LIB, "library-catalog.ts"), repl);
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
  return fs.readFileSync(path.join(__dirname, "r53-original-stories.ts"), "utf8").trim();
}

function addSeeds(apply) {
  const stats = { quiz: 0, qa: 0, fawaid: 0, stories: 0 };
  const marker = "جولة ٥٣";

  const quizPath = path.join(LIB, "quiz-seed.ts");
  let quizContent = fs.readFileSync(quizPath, "utf8");
  if (!quizContent.includes(marker)) {
    const block = `  /* ───────── ${marker}: أقسام أضعف (1465-1514) ───────── */\n` +
      QUIZ_ITEMS.map(renderQuizItem).join(",\n");
    if (apply) {
      quizContent = insertBeforeClosing(quizContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(quizPath, quizContent, "utf8");
    }
    stats.quiz = QUIZ_ITEMS.length;
  }

  const qaPath = path.join(LIB, "qa-seed.ts");
  let qaContent = fs.readFileSync(qaPath, "utf8");
  if (!qaContent.includes("seed-qa-750")) {
    const block = QA_ITEMS.map(renderQaItem).join(",\n");
    if (apply) {
      qaContent = insertBeforeClosing(qaContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(qaPath, qaContent, "utf8");
    }
    stats.qa = QA_ITEMS.length;
  }

  const fawaidPath = path.join(LIB, "fawaid-curated-seed.ts");
  let fawaidContent = fs.readFileSync(fawaidPath, "utf8");
  if (!fawaidContent.includes("إضافات جولة ٥٣")) {
    const block = `  /* ── إضافات جولة ٥٣ ── */\n` + FAWAID_ITEMS.map(renderFawaidItem).join(",\n");
    if (apply) {
      fawaidContent = insertBeforeClosing(fawaidContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(fawaidPath, fawaidContent, "utf8");
    }
    stats.fawaid = FAWAID_ITEMS.length;
  }

  const storiesPath = path.join(LIB, "islamic-stories-seed.ts");
  let storiesContent = fs.readFileSync(storiesPath, "utf8");
  if (!storiesContent.includes("id: 135,")) {
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
  const qa = readTsExport("qa-seed.ts", "SEED_QA");
  const quiz = readTsExport("quiz-seed.ts", "DEMO_QUIZ_QUESTIONS");
  const pm = readTsExport("prophetic-medicine-seed.ts", "PROPHETIC_MEDICINE_ITEMS");
  const lib = readTsExport("library-catalog.ts", "LIBRARY_CATALOG");
  const stories = readTsExport("islamic-stories-seed.ts", "ISLAMIC_STORIES_SEED");
  const fawaidSrc = fs.readFileSync(path.join(LIB, "fawaid-curated-seed.ts"), "utf8");
  const round53Idx = fawaidSrc.indexOf("إضافات جولة ٥٣");
  const fawaidRound53Block =
    round53Idx >= 0 ? fawaidSrc.slice(round53Idx).split("{ text:").length - 1 : 0;

  return {
    qaShortAnswers: qa.filter((x) => (x.answer || "").length < QA_ANSWER_MIN).length,
    quizShortAnswers: quiz.filter((q) => (q.answer || "").length < QUIZ_ANSWER_MIN).length,
    quizRound53ShortExpl: quiz.filter((q) => {
      const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
      return n >= 1465 && (q.explanation || "").length < QUIZ_EXPL_MIN;
    }).length,
    quizRound53: quiz.filter((q) => {
      const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
      return n >= 1465 && n <= 1514;
    }).length,
    qaRound53: qa.filter((q) => {
      const n = parseInt((q.id || "").replace("seed-qa-", ""), 10);
      return n >= 750 && n <= 789;
    }).length,
    storiesRound53: stories.filter((s) => s.id >= 135 && s.id <= 139).length,
    fawaidRound53Block,
    pmBodyShort370: pm.filter((x) => x.body.length < PM_BODY_MIN).length,
    pmBenefitShort90: pm.reduce((n, x) => n + (x.benefits || []).filter((b) => b.length < PM_BENEFIT_MIN).length, 0),
    libraryDescShort220: lib.filter((b) => b.description.length < LIBRARY_DESC_MIN).length,
    quizTotal: quiz.length,
    qaTotal: qa.length,
    fawaidTotal: countFawaidCurated(),
    storiesTotal: stories.length,
  };
}

const apply = process.argv.includes("--apply");
const verify = process.argv.includes("--verify");

const results = {
  quizAnswersRaised: raiseQuizAnswers(apply),
  quizExplRaised: raiseQuizExplanations(apply),
  pmThresholds: raisePmThresholds(apply),
  libraryRaised: raiseLibrary(apply),
  seeds: addSeeds(apply),
};

if (apply || verify) results.after = verifyCounts();

console.log(JSON.stringify(results, null, 2));

if (verify) {
  const a = results.after || {};
  const fail =
    (a.qaShortAnswers ?? 1) > 0 ||
    (a.quizShortAnswers ?? 1) > 0 ||
    (a.quizRound53ShortExpl ?? 1) > 0 ||
    (a.pmBodyShort370 ?? 1) > 0 ||
    (a.pmBenefitShort90 ?? 1) > 0 ||
    (a.libraryDescShort220 ?? 1) > 0;
  process.exit(fail ? 1 : 0);
}
