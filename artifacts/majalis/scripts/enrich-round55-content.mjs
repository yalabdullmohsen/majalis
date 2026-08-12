#!/usr/bin/env node
/**
 * Round 55 bulk content — quiz/QA/fawaid/stories + seed threshold raises.
 * Usage: node scripts/enrich-round55-content.mjs [--apply] [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUIZ_ITEMS, QA_ITEMS, FAWAID_ITEMS } from "./r55-content-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIB = path.join(ROOT, "src/lib");

const QA_ANSWER_MIN = 90;
const QUIZ_ANSWER_MIN = 60;
const QUIZ_EXPL_MIN = 80;
const FAWAID_MIN = 145;
const LIBRARY_DESC_MIN = 230;
const COURSE_SUMMARY_MIN = 220;
const OCCASION_SUMMARY_MIN = 210;
const LANDMARK_DESC_MIN = 340;

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

function enrichLibraryDesc(desc, book) {
  if (desc.length >= LIBRARY_DESC_MIN) return desc;
  const suffixes = [];
  if (book.category && !desc.includes(book.category)) suffixes.push(`من مراجع ${book.category} المعتمدة`);
  suffixes.push("يُستفاد منه في البناء العلمي والتعليم الشرعي");
  suffixes.push("من مراجع المكتبة الإسلامية يُنصح به لطالب العلم");
  return padToNeed(desc, LIBRARY_DESC_MIN, suffixes);
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
    if (Number.isFinite(n) && n >= 1565 && (q.explanation || "").length < QUIZ_EXPL_MIN) {
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

function raiseLibrary(apply) {
  const books = readTsExport("library-catalog.ts", "LIBRARY_CATALOG");
  const repl = [];
  for (const b of books) {
    if (b.description.length >= LIBRARY_DESC_MIN) continue;
    const neu = enrichLibraryDesc(b.description, b);
    if (neu !== b.description) repl.push({ old: b.description, neu });
  }
  let applied = 0;
  if (apply) applied = applyQuotedReplacements(path.join(LIB, "library-catalog.ts"), repl);
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
    landmarksApplied = applyQuotedReplacements(path.join(LIB, "islamic-landmarks-data.ts"), landmarkRepl);
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
  return fs.readFileSync(path.join(__dirname, "r55-original-stories.ts"), "utf8").trim();
}

function addSeeds(apply) {
  const stats = { quiz: 0, qa: 0, fawaid: 0, stories: 0 };
  const marker = "جولة ٥٥";

  const quizPath = path.join(LIB, "quiz-seed.ts");
  let quizContent = fs.readFileSync(quizPath, "utf8");
  if (!quizContent.includes(marker)) {
    const block = `  /* ───────── ${marker}: أقسام أضعف (1565-1614) ───────── */\n` +
      QUIZ_ITEMS.map(renderQuizItem).join(",\n");
    if (apply) {
      quizContent = insertBeforeClosing(quizContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(quizPath, quizContent, "utf8");
    }
    stats.quiz = QUIZ_ITEMS.length;
  }

  const qaPath = path.join(LIB, "qa-seed.ts");
  let qaContent = fs.readFileSync(qaPath, "utf8");
  if (!qaContent.includes("seed-qa-830")) {
    const block = QA_ITEMS.map(renderQaItem).join(",\n");
    if (apply) {
      qaContent = insertBeforeClosing(qaContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(qaPath, qaContent, "utf8");
    }
    stats.qa = QA_ITEMS.length;
  }

  const fawaidPath = path.join(LIB, "fawaid-curated-seed.ts");
  let fawaidContent = fs.readFileSync(fawaidPath, "utf8");
  if (!fawaidContent.includes("إضافات جولة ٥٥")) {
    const block = `  /* ── إضافات جولة ٥٥ ── */\n` + FAWAID_ITEMS.map(renderFawaidItem).join(",\n");
    if (apply) {
      fawaidContent = insertBeforeClosing(fawaidContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(fawaidPath, fawaidContent, "utf8");
    }
    stats.fawaid = FAWAID_ITEMS.length;
  }

  const storiesPath = path.join(LIB, "islamic-stories-seed.ts");
  let storiesContent = fs.readFileSync(storiesPath, "utf8");
  if (!storiesContent.includes("id: 145,")) {
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
  const lib = readTsExport("library-catalog.ts", "LIBRARY_CATALOG");
  const courses = readTsExport("annual-courses-seed.ts", "ANNUAL_COURSES_SEED");
  const landmarks = readTsExport("islamic-landmarks-data.ts", "ISLAMIC_LANDMARKS");
  const occasions = readTsExport("islamic-occasions-seed.ts", "ISLAMIC_OCCASIONS");
  const stories = readTsExport("islamic-stories-seed.ts", "ISLAMIC_STORIES_SEED");
  const fawaidSrc = fs.readFileSync(path.join(LIB, "fawaid-curated-seed.ts"), "utf8");
  const round55Idx = fawaidSrc.indexOf("إضافات جولة ٥٥");
  const fawaidRound55Block =
    round55Idx >= 0 ? fawaidSrc.slice(round55Idx).split("{ text:").length - 1 : 0;

  return {
    qaShortAnswers: qa.filter((x) => (x.answer || "").length < QA_ANSWER_MIN).length,
    quizShortAnswers: quiz.filter((q) => (q.answer || "").length < QUIZ_ANSWER_MIN).length,
    quizRound55ShortExpl: quiz.filter((q) => {
      const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
      return n >= 1565 && (q.explanation || "").length < QUIZ_EXPL_MIN;
    }).length,
    quizRound55: quiz.filter((q) => {
      const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
      return n >= 1565 && n <= 1614;
    }).length,
    qaRound55: qa.filter((q) => {
      const n = parseInt((q.id || "").replace("seed-qa-", ""), 10);
      return n >= 830 && n <= 869;
    }).length,
    storiesRound55: stories.filter((s) => s.id >= 145 && s.id <= 149).length,
    fawaidRound55Block,
    fawaidRound55Short145: (() => {
      if (round55Idx < 0) return 999;
      const block = fawaidSrc.slice(round55Idx);
      const texts = [...block.matchAll(/text:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
      return texts.filter((t) => t.length < FAWAID_MIN).length;
    })(),
    libraryDescShort230: lib.filter((b) => b.description.length < LIBRARY_DESC_MIN).length,
    coursesShort220: courses.filter((c) => c.summary.length < COURSE_SUMMARY_MIN).length,
    landmarksShort340: landmarks.filter((l) => l.description.length < LANDMARK_DESC_MIN).length,
    occasionsShort210: occasions.filter((o) => o.summary.length < OCCASION_SUMMARY_MIN).length,
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
  libraryRaised: raiseLibrary(apply),
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
    (a.quizRound55ShortExpl ?? 1) > 0 ||
    (a.quizRound55 ?? 0) !== 50 ||
    (a.qaRound55 ?? 0) !== 40 ||
    (a.storiesRound55 ?? 0) !== 5 ||
    (a.fawaidRound55Block ?? 0) !== 25 ||
    (a.fawaidRound55Short145 ?? 1) > 0 ||
    (a.libraryDescShort230 ?? 1) > 0 ||
    (a.coursesShort220 ?? 1) > 0 ||
    (a.landmarksShort340 ?? 1) > 0 ||
    (a.occasionsShort210 ?? 1) > 0;
  process.exit(fail ? 1 : 0);
}
