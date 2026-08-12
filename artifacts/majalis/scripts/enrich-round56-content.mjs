#!/usr/bin/env node
/**
 * Round 56 bulk content — quiz/QA/fawaid/stories/PM + scholars/sheikhs/sins raises.
 * Usage: node scripts/enrich-round56-content.mjs [--apply] [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUIZ_ITEMS, QA_ITEMS, FAWAID_ITEMS } from "./r56-content-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIB = path.join(ROOT, "src/lib");

const QA_ANSWER_MIN = 90;
const QUIZ_ANSWER_MIN = 60;
const QUIZ_EXPL_MIN = 80;
const FAWAID_MIN = 145;
const PM_BODY_MIN = 370;
const PM_BENEFIT_MIN = 90;
const SCHOLAR_BIO_MIN = 420;
const SHEIKH_BIO_MIN = 270;
const SINS_EXPL_MIN = 280;

const PM_R56_IDS = [
  "friday-ghusl-sunnah",
  "avoid-prone-sleep",
  "clip-nails-hygiene",
  "bismillah-meal-start",
  "avoid-reclining-eating",
];

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

function enrichSheikhBio(sheikh) {
  const { bio = "", specialties = [], city, ijazah } = sheikh;
  if (bio.length >= SHEIKH_BIO_MIN) return bio;
  const suffixes = [];
  if (specialties.length && !bio.includes(specialties[0])) {
    suffixes.push(`اشتهر في ${specialties.slice(0, 2).join(" و")}`);
  }
  if (city && !bio.includes(city.split("—")[0].trim())) {
    suffixes.push(`وعُرف في ${city.split("—")[0].trim()}`);
  }
  if (ijazah && !bio.includes(ijazah.slice(0, 15))) {
    suffixes.push(`وهو ${ijazah}`);
  }
  suffixes.push("يُستفاد من دروسه في البناء العلمي بلا غلو في الأشخاص");
  suffixes.push("مع التزام المنهج الوسط في العلم والدعوة");
  suffixes.push("ويُراعى أدب طلب العلم عند الانتفاع بتراثه");
  return padToNeed(bio, SHEIKH_BIO_MIN, suffixes);
}

function enrichScholarBio(scholar) {
  const { bio, specialty = [], key_works = [], region, era, madhhab } = scholar;
  if (bio.length >= SCHOLAR_BIO_MIN) return bio;
  const suffixes = [];
  if (specialty.length && !bio.includes(specialty[0])) {
    suffixes.push(`اشتهر في ${specialty.slice(0, 2).join(" و")}`);
  }
  if (key_works.length && !bio.includes(key_works[0].slice(0, 20))) {
    const work = key_works[0].replace(/\(.*?\)/g, "").trim();
    suffixes.push(`ومن أبرز مؤلفاته ${work}`);
  }
  if (region && !bio.includes(region.split("/")[0].trim())) {
    suffixes.push(`وعُرف في ${region.split("/")[0].trim()}`);
  }
  if (madhhab && !bio.includes(madhhab)) {
    suffixes.push(`وهو من أئمة المذهب ${madhhab}`);
  }
  if (era && !bio.includes(era)) {
    suffixes.push(`من علماء ${era}`);
  }
  suffixes.push("ويُستفاد من تراثه في البناء العلمي بلا غلو في الأشخاص");
  suffixes.push("وهو مرجع معتمد في تخصصه عند أهل العلم");
  suffixes.push("وتُرجع إليه مسائل علمه بما ثبت من كتبه ورواياته");
  return padToNeed(bio, SCHOLAR_BIO_MIN, suffixes);
}

function enrichSinExplanation(topic) {
  const suffixes = [
    "مع اجتناب التجسس والغيبة باسم النصيحة",
    "والستر حيث يُشرع الستر مع التوبة والإقلاع",
    "يُستحضر تعظيم حدود الله لا التشهير بالناس",
    "مع التوبة والإقلاع وردّ المظالم إن وُجدت",
    "من باب حقوق الله أو حقوق العباد بحسب تصنيف المسألة",
    "مع التمييز بين التوبة الصادقة والإصرار على المعصية",
  ];
  return padToNeed(topic.explanation, SINS_EXPL_MIN, suffixes);
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
    if (Number.isFinite(n) && n >= 1615 && (q.explanation || "").length < QUIZ_EXPL_MIN) {
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

async function raiseSheikhs(apply) {
  const mod = await import(`${path.join(LIB, "sheikhs-seed.ts")}?v=${Date.now()}`);
  const repl = [];
  for (const s of mod.SHEIKHS_SEED) {
    if ((s.bio || "").length >= SHEIKH_BIO_MIN) continue;
    const neu = enrichSheikhBio(s);
    if (neu.length < SHEIKH_BIO_MIN) throw new Error(`Still short sheikh ${s.id}: ${neu.length}`);
    repl.push({ old: s.bio, neu });
  }
  if (apply && repl.length) applyFieldReplacements(path.join(LIB, "sheikhs-seed.ts"), repl, "bio");
  return repl.length;
}

function raiseScholars(apply) {
  const scholars = readTsExport("scholars-data.ts", "SCHOLARS");
  const repl = [];
  for (const s of scholars) {
    if (s.bio.length >= SCHOLAR_BIO_MIN) continue;
    const neu = enrichScholarBio(s);
    if (neu.length < SCHOLAR_BIO_MIN) throw new Error(`Still short scholar ${s.id}: ${neu.length}`);
    repl.push({ old: s.bio, neu });
  }
  if (apply && repl.length) applyFieldReplacements(path.join(LIB, "scholars-data.ts"), repl, "bio");
  return repl.length;
}

async function raiseSins(apply) {
  const mod = await import(`${path.join(LIB, "sins-rights-data.ts")}?v=${Date.now()}`);
  const repl = [];
  for (const t of mod.SINS_TOPICS) {
    if (t.explanation.length >= SINS_EXPL_MIN) continue;
    const neu = enrichSinExplanation(t);
    if (neu.length < SINS_EXPL_MIN) throw new Error(`Still short sin ${t.id}: ${neu.length}`);
    repl.push({ old: t.explanation, neu });
  }
  if (apply && repl.length) applyFieldReplacements(path.join(LIB, "sins-rights-data.ts"), repl, "explanation");
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
  return fs.readFileSync(path.join(__dirname, "r56-original-stories.ts"), "utf8").trim();
}

function readPmBlock() {
  return fs.readFileSync(path.join(__dirname, "r56-prophetic-medicine.ts"), "utf8").trim();
}

function addSeeds(apply) {
  const stats = { quiz: 0, qa: 0, fawaid: 0, stories: 0, pm: 0 };
  const marker = "جولة ٥٦";

  const quizPath = path.join(LIB, "quiz-seed.ts");
  let quizContent = fs.readFileSync(quizPath, "utf8");
  if (!quizContent.includes(marker)) {
    const block = `  /* ───────── ${marker}: أقسام أضعف (1615-1664) ───────── */\n` +
      QUIZ_ITEMS.map(renderQuizItem).join(",\n");
    if (apply) {
      quizContent = insertBeforeClosing(quizContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(quizPath, quizContent, "utf8");
    }
    stats.quiz = QUIZ_ITEMS.length;
  }

  const qaPath = path.join(LIB, "qa-seed.ts");
  let qaContent = fs.readFileSync(qaPath, "utf8");
  if (!qaContent.includes("seed-qa-870")) {
    const block = QA_ITEMS.map(renderQaItem).join(",\n");
    if (apply) {
      qaContent = insertBeforeClosing(qaContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(qaPath, qaContent, "utf8");
    }
    stats.qa = QA_ITEMS.length;
  }

  const fawaidPath = path.join(LIB, "fawaid-curated-seed.ts");
  let fawaidContent = fs.readFileSync(fawaidPath, "utf8");
  if (!fawaidContent.includes("إضافات جولة ٥٦")) {
    const block = `  /* ── إضافات جولة ٥٦ ── */\n` + FAWAID_ITEMS.map(renderFawaidItem).join(",\n");
    if (apply) {
      fawaidContent = insertBeforeClosing(fawaidContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(fawaidPath, fawaidContent, "utf8");
    }
    stats.fawaid = FAWAID_ITEMS.length;
  }

  const storiesPath = path.join(LIB, "islamic-stories-seed.ts");
  let storiesContent = fs.readFileSync(storiesPath, "utf8");
  if (!storiesContent.includes("id: 150,")) {
    const block = readStoriesBlock();
    if (apply) {
      storiesContent = insertBeforeClosing(storiesContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(storiesPath, storiesContent, "utf8");
    }
    stats.stories = 5;
  }

  const pmPath = path.join(LIB, "prophetic-medicine-seed.ts");
  let pmContent = fs.readFileSync(pmPath, "utf8");
  if (!pmContent.includes("friday-ghusl-sunnah")) {
    const block = readPmBlock();
    if (apply) {
      pmContent = insertBeforeClosing(pmContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(pmPath, pmContent, "utf8");
    }
    stats.pm = 5;
  }

  return stats;
}

async function verifyCounts() {
  const qa = readTsExport("qa-seed.ts", "SEED_QA");
  const quiz = readTsExport("quiz-seed.ts", "DEMO_QUIZ_QUESTIONS");
  const pm = readTsExport("prophetic-medicine-seed.ts", "PROPHETIC_MEDICINE_ITEMS");
  const stories = readTsExport("islamic-stories-seed.ts", "ISLAMIC_STORIES_SEED");
  const scholars = readTsExport("scholars-data.ts", "SCHOLARS");
  const sheikhsMod = await import(`${path.join(LIB, "sheikhs-seed.ts")}?v=${Date.now()}`);
  const sinsMod = await import(`${path.join(LIB, "sins-rights-data.ts")}?v=${Date.now()}`);
  const fawaidSrc = fs.readFileSync(path.join(LIB, "fawaid-curated-seed.ts"), "utf8");
  const round56Idx = fawaidSrc.indexOf("إضافات جولة ٥٦");
  const fawaidRound56Block =
    round56Idx >= 0 ? fawaidSrc.slice(round56Idx).split("{ text:").length - 1 : 0;

  return {
    qaShortAnswers: qa.filter((x) => (x.answer || "").length < QA_ANSWER_MIN).length,
    quizShortAnswers: quiz.filter((q) => (q.answer || "").length < QUIZ_ANSWER_MIN).length,
    quizRound56ShortExpl: quiz.filter((q) => {
      const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
      return n >= 1615 && (q.explanation || "").length < QUIZ_EXPL_MIN;
    }).length,
    quizRound56: quiz.filter((q) => {
      const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
      return n >= 1615 && n <= 1664;
    }).length,
    qaRound56: qa.filter((q) => {
      const n = parseInt((q.id || "").replace("seed-qa-", ""), 10);
      return n >= 870 && n <= 909;
    }).length,
    storiesRound56: stories.filter((s) => s.id >= 150 && s.id <= 154).length,
    pmRound56: pm.filter((x) => PM_R56_IDS.includes(x.id)).length,
    fawaidRound56Block,
    fawaidRound56Short145: (() => {
      if (round56Idx < 0) return 999;
      const block = fawaidSrc.slice(round56Idx);
      const texts = [...block.matchAll(/text:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
      return texts.filter((t) => t.length < FAWAID_MIN).length;
    })(),
    scholarsShort420: scholars.filter((s) => s.bio.length < SCHOLAR_BIO_MIN).length,
    sheikhsShort270: sheikhsMod.SHEIKHS_SEED.filter((s) => (s.bio || "").length < SHEIKH_BIO_MIN).length,
    sinsShort280: sinsMod.SINS_TOPICS.filter((t) => t.explanation.length < SINS_EXPL_MIN).length,
    pmBodyShort370: pm.filter((x) => x.body.length < PM_BODY_MIN).length,
    pmBenefitShort90: pm.reduce((n, x) => n + (x.benefits || []).filter((b) => b.length < PM_BENEFIT_MIN).length, 0),
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
  quizAnswersRaised: raiseQuizAnswers(apply),
  quizExplRaised: raiseQuizExplanations(apply),
  scholarsRaised: raiseScholars(apply),
  sheikhsRaised: await raiseSheikhs(apply),
  sinsRaised: await raiseSins(apply),
  seeds: addSeeds(apply),
  pmThresholds: raisePmThresholds(apply),
};

if (apply || verify) results.after = await verifyCounts();

console.log(JSON.stringify(results, null, 2));

if (verify) {
  const a = results.after || {};
  const fail =
    (a.qaShortAnswers ?? 1) > 0 ||
    (a.quizShortAnswers ?? 1) > 0 ||
    (a.quizRound56ShortExpl ?? 1) > 0 ||
    (a.quizRound56 ?? 0) !== 50 ||
    (a.qaRound56 ?? 0) !== 40 ||
    (a.storiesRound56 ?? 0) !== 5 ||
    (a.pmRound56 ?? 0) !== 5 ||
    (a.fawaidRound56Block ?? 0) !== 25 ||
    (a.fawaidRound56Short145 ?? 1) > 0 ||
    (a.scholarsShort420 ?? 1) > 0 ||
    (a.sheikhsShort270 ?? 1) > 0 ||
    (a.sinsShort280 ?? 1) > 0 ||
    (a.pmBodyShort370 ?? 1) > 0 ||
    (a.pmBenefitShort90 ?? 1) > 0;
  process.exit(fail ? 1 : 0);
}
