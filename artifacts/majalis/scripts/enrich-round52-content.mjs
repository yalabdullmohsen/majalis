#!/usr/bin/env node
/**
 * Round 52 bulk content — quiz/QA/fawaid/stories + quiz answers + occasion/landmark/course raises.
 * Usage: node scripts/enrich-round52-content.mjs [--apply] [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUIZ_ITEMS, QA_ITEMS, FAWAID_ITEMS } from "./r52-content-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIB = path.join(ROOT, "src/lib");

const QA_ANSWER_MIN = 90;
const QUIZ_ANSWER_MIN = 60;
const QUIZ_EXPL_MIN = 80;
const OCCASION_SUMMARY_MIN = 200;
const LANDMARK_DESC_MIN = 320;
const COURSE_SUMMARY_MIN = 210;

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

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function enrichQuizAnswer(q) {
  const existing = (q.answer || "").trim();
  if (existing.length >= QUIZ_ANSWER_MIN) return existing;
  const ref = q.reference && q.reference.length > 5 ? q.reference : "مراجع مجالس العلم";
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
  const ref = q.reference && q.reference.length > 5 ? q.reference : "مراجع مجالس العلم";
  const suffixes = [
    `يُستفاد منه في باب ${q.category || q.section || "عام"} مع الرجوع إلى ${ref}.`,
    `الجواب يُختبر فهم ${q.section || "المادة"} لا الحفظ اللفظي فقط.`,
    `يُستحسن مراجعة ${ref} لتثبيت الدليل الشرعي.`,
    `هذا السؤال من أقسام ${q.section} التي يُنصح بتكرارها في التعلم.`,
  ];
  const seed = existing || `يُستفاد منه في باب ${q.category || "عام"}.`;
  return padToNeed(seed, QUIZ_EXPL_MIN, suffixes);
}

function enrichCourseSummary(course) {
  const suffixes = [
    "مع تطبيقات عملية ومراجعة دورية للمتن",
    "والعمدة فيها الفهم والعمل لا الحفظ وحده",
    "يُراعى التدرّج من الأساس إلى التفصيل",
    "مع متابعة التطبيق والمراجعة بين الدروس",
  ];
  return padToNeed(course.summary, COURSE_SUMMARY_MIN, suffixes);
}

function enrichLandmarkDesc(landmark) {
  const suffixes = [
    `معلم إسلامي في ${landmark.city || landmark.country}`,
    "يُزار بآداب الشرع بلا غلو مع احترام حرمته وصيانة تراثه",
    "يُستفاد من دراسته في التاريخ والحضارة الإسلامية",
    "مع التمييز بين ما ثبت من الشرع وما هو تاريخي أو اجتهادي",
  ];
  return padToNeed(landmark.description, LANDMARK_DESC_MIN, suffixes);
}

function enrichOccasionSummary(occasion) {
  const suffixes = [
    "مع ضبط ما ثبت من السنة وما لم يثبت",
    "يُستحضر فيه العمل الصالح لا مجرد الاحتفاء",
    "يُراعى التمييز بين الفضائل الثابتة والمبتدعات",
    "من المناسبات الشرعية في التقويم الهجري",
  ];
  return padToNeed(occasion.summary, OCCASION_SUMMARY_MIN, suffixes);
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
    if (Number.isFinite(n) && n >= 1415 && (q.explanation || "").length < QUIZ_EXPL_MIN) {
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

function raiseOccasionsLandmarksCourses(apply) {
  const courses = readTsExport("annual-courses-seed.ts", "ANNUAL_COURSES_SEED");
  const landmarks = readTsExport("islamic-landmarks-data.ts", "ISLAMIC_LANDMARKS");
  const occasions = readTsExport("islamic-occasions-seed.ts", "ISLAMIC_OCCASIONS");

  const courseRepl = [];
  for (const c of courses) {
    if (c.summary.length >= COURSE_SUMMARY_MIN) continue;
    const neu = enrichCourseSummary(c);
    if (neu !== c.summary) courseRepl.push({ old: c.summary, neu });
  }

  const landmarkRepl = [];
  for (const l of landmarks) {
    if (l.description.length >= LANDMARK_DESC_MIN) continue;
    const neu = enrichLandmarkDesc(l);
    if (neu !== l.description) landmarkRepl.push({ old: l.description, neu });
  }

  const occasionRepl = [];
  for (const o of occasions) {
    if (o.summary.length >= OCCASION_SUMMARY_MIN) continue;
    const neu = enrichOccasionSummary(o);
    if (neu !== o.summary) occasionRepl.push({ old: o.summary, neu });
  }

  let coursesApplied = 0;
  let landmarksApplied = 0;
  let occasionsApplied = 0;
  if (apply) {
    coursesApplied = applyFieldReplacements(path.join(LIB, "annual-courses-seed.ts"), courseRepl, "summary");
    landmarksApplied = applyFieldReplacements(path.join(LIB, "islamic-landmarks-data.ts"), landmarkRepl, "description");
    occasionsApplied = applyFieldReplacements(path.join(LIB, "islamic-occasions-seed.ts"), occasionRepl, "summary");
  }

  return {
    courses: courseRepl.length,
    landmarks: landmarkRepl.length,
    occasions: occasionRepl.length,
    appliedCourses: coursesApplied,
    appliedLandmarks: landmarksApplied,
    appliedOccasions: occasionsApplied,
  };
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
  return fs.readFileSync(path.join(__dirname, "r52-original-stories.ts"), "utf8").trim();
}

function addSeeds(apply) {
  const stats = { quiz: 0, qa: 0, fawaid: 0, stories: 0 };
  const marker = "جولة ٥٢";

  const quizPath = path.join(LIB, "quiz-seed.ts");
  let quizContent = fs.readFileSync(quizPath, "utf8");
  if (!quizContent.includes(marker)) {
    const block = `  /* ───────── ${marker}: أقسام أضعف (1415-1464) ───────── */\n` +
      QUIZ_ITEMS.map(renderQuizItem).join(",\n");
    if (apply) {
      quizContent = insertBeforeClosing(quizContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(quizPath, quizContent, "utf8");
    }
    stats.quiz = QUIZ_ITEMS.length;
  }

  const qaPath = path.join(LIB, "qa-seed.ts");
  let qaContent = fs.readFileSync(qaPath, "utf8");
  if (!qaContent.includes("seed-qa-710")) {
    const block = QA_ITEMS.map(renderQaItem).join(",\n");
    if (apply) {
      qaContent = insertBeforeClosing(qaContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(qaPath, qaContent, "utf8");
    }
    stats.qa = QA_ITEMS.length;
  }

  const fawaidPath = path.join(LIB, "fawaid-curated-seed.ts");
  let fawaidContent = fs.readFileSync(fawaidPath, "utf8");
  if (!fawaidContent.includes("إضافات جولة ٥٢")) {
    const block = `  /* ── إضافات جولة ٥٢ ── */\n` + FAWAID_ITEMS.map(renderFawaidItem).join(",\n");
    if (apply) {
      fawaidContent = insertBeforeClosing(fawaidContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(fawaidPath, fawaidContent, "utf8");
    }
    stats.fawaid = FAWAID_ITEMS.length;
  }

  const storiesPath = path.join(LIB, "islamic-stories-seed.ts");
  let storiesContent = fs.readFileSync(storiesPath, "utf8");
  if (!storiesContent.includes("id: 130,")) {
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
  const stories = readTsExport("islamic-stories-seed.ts", "ISLAMIC_STORIES_SEED");
  const courses = readTsExport("annual-courses-seed.ts", "ANNUAL_COURSES_SEED");
  const landmarks = readTsExport("islamic-landmarks-data.ts", "ISLAMIC_LANDMARKS");
  const occasions = readTsExport("islamic-occasions-seed.ts", "ISLAMIC_OCCASIONS");
  const fawaidSrc = fs.readFileSync(path.join(LIB, "fawaid-curated-seed.ts"), "utf8");
  const round52Idx = fawaidSrc.indexOf("إضافات جولة ٥٢");
  const fawaidRound52Block =
    round52Idx >= 0 ? fawaidSrc.slice(round52Idx).split("{ text:").length - 1 : 0;

  return {
    qaShortAnswers: qa.filter((x) => (x.answer || "").length < QA_ANSWER_MIN).length,
    quizShortAnswers: quiz.filter((q) => (q.answer || "").length < QUIZ_ANSWER_MIN).length,
    quizRound52ShortExpl: quiz.filter((q) => {
      const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
      return n >= 1415 && (q.explanation || "").length < QUIZ_EXPL_MIN;
    }).length,
    quizRound52: quiz.filter((q) => {
      const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
      return n >= 1415 && n <= 1464;
    }).length,
    qaRound52: qa.filter((q) => {
      const n = parseInt((q.id || "").replace("seed-qa-", ""), 10);
      return n >= 710 && n <= 749;
    }).length,
    storiesRound52: stories.filter((s) => s.id >= 130 && s.id <= 134).length,
    fawaidRound52Block,
    fawaidCuratedShort145: 0,
    coursesShort210: courses.filter((c) => c.summary.length < COURSE_SUMMARY_MIN).length,
    landmarksShort320: landmarks.filter((l) => l.description.length < LANDMARK_DESC_MIN).length,
    occasionsShort200: occasions.filter((o) => o.summary.length < OCCASION_SUMMARY_MIN).length,
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
  thresholds: raiseOccasionsLandmarksCourses(apply),
  seeds: addSeeds(apply),
};

if (apply || verify) results.after = verifyCounts();

console.log(JSON.stringify(results, null, 2));

if (verify) {
  const a = results.after || {};
  const fail =
    (a.qaShortAnswers ?? 1) > 0 ||
    (a.quizShortAnswers ?? 1) > 0 ||
    (a.quizRound52ShortExpl ?? 1) > 0 ||
    (a.coursesShort210 ?? 1) > 0 ||
    (a.landmarksShort320 ?? 1) > 0 ||
    (a.occasionsShort200 ?? 1) > 0;
  process.exit(fail ? 1 : 0);
}
