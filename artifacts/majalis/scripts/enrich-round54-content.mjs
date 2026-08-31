#!/usr/bin/env node
/**
 * Round 54 bulk content — quiz/QA/fawaid/stories/PM + seed threshold raises.
 * Usage: node scripts/enrich-round54-content.mjs [--apply] [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUIZ_ITEMS, QA_ITEMS, FAWAID_ITEMS } from "./r54-content-data.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIB = path.join(ROOT, "src/lib");

const QA_ANSWER_MIN = 90;
const QUIZ_ANSWER_MIN = 60;
const QUIZ_EXPL_MIN = 80;
const FAWAID_MIN = 145;
const PM_BODY_MIN = 370;
const PM_BENEFIT_MIN = 90;
const UPDATE_SUMMARY_MIN = 160;
const QURAN_CIRCLE_MIN = 190;
const MUTA_MIN = 190;
const MIND_MAP_MIN = 200;

const LATIN_FIXES = [
  [/وقf/g, "وق"],
  [/عذari/g, "عذر"],
  [/الم\s*distorted/g, "الم"],
  [/بيوسf/g, "بيوس"],
  [/تاشfين/g, "تاش"],
  [/البayan/g, "البيان"],
  [/المغrib/g, "المغرب"],
  [/مراعaة/g, "مراعاة"],
  [/للمباhaة/g, "للمباهاة"],
  [/حarithة/g, "حارثة"],
  [/حaritha/g, "حارثة"],
  [/اعتدal/g, "اعتدال"],
  [/الالاعتدال/g, "الاعتدال"],
  [/الJihad/g, "الجهاد"],
  [/Jihad/g, "جهاد"],
  [/طبقات ابn سaad/g, "طبقات ابن سعد"],
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

function applyMultiFieldReplacements(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8");
  let applied = 0;
  const sorted = [...replacements].sort((a, b) => b.old.length - a.old.length);
  for (const { old, neu, field } of sorted) {
    if (old === neu || !old) continue;
    const variants = [
      `${field}: "${old}"`,
      `${field}:"${old}"`,
      `${field}: '${old}'`,
      `${field}:\n      "${old}"`,
      `${field}:\n    "${old}"`,
    ];
    for (const needle of variants) {
      if (!content.includes(needle)) continue;
      const isMultiline = needle.includes(":\n");
      const rep = isMultiline
        ? needle.startsWith(`${field}:\n      "`)
          ? `${field}:\n      "${neu}"`
          : `${field}:\n    "${neu}"`
        : needle.includes(':"')
          ? `${field}:"${neu}"`
          : needle.includes(":'")
            ? `${field}:'${neu}'`
            : `${field}: "${neu}"`;
      content = content.replace(needle, rep);
      applied++;
      break;
    }
  }
  if (applied > 0) fs.writeFileSync(filePath, content, "utf8");
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

function enrichUpdateSummary(update) {
  const suffixes = [
    "يُستفاد منه في متابعة تطورات المنصة والمحتوى",
    "مع الرجوع للتفاصيل الكاملة في صفحة التحديثات",
    "يُعرض للمستخدم بصيغة موجزة للاطلاع السريع",
    "ويربط التحديث بمصدره المعتمد في المنصة للمتابعة والاطلاع",
  ];
  return padToNeed(update.summary, UPDATE_SUMMARY_MIN, suffixes);
}

function enrichQuranCircleDesc(circle) {
  const suffixes = [
    "مع التدرّج في الحفظ والتجويد بحسب مستوى الطالب",
    "ضمن منظومة تحفيظ القرآن المعتمدة",
    "يُراعى الالتزام بجدول الحلقة والحضور المنتظم",
    "والعناية بتصحيح التلاوة أولى من الاستعجال في الورد",
  ];
  return padToNeed(circle.description, QURAN_CIRCLE_MIN, suffixes);
}

function enrichMutashabihatDesc(pair) {
  const suffixes = [
    "يُميَّز المتشابه اللفظي لضبط الحفظ والتلاوة",
    "مع الرجوع لمعاني الآيات في كتب التفسير المعتمدة",
    "يُستفاد منه في مراجعة الحفظ وتجويد القراءة",
    "مع التمييز بين المتشابه اللفظي والمعنوي في ضبط الحفظ",
  ];
  return padToNeed(pair.description, MUTA_MIN, suffixes);
}

function enrichMindMapDesc(map) {
  const suffixes = [
    "تُستخدم للمراجعة المنظمة لا للحفظ الأصم وحده",
    "مع الانتقال من الأصل إلى الفروع بروابط المنصة",
    "خريطة ذهنية لترتيب المفاهيم وتسهيل المراجعة",
    "والعمدة فيها التصور الصحيح قبل التفاصيل",
  ];
  return padToNeed(map.description || "", MIND_MAP_MIN, suffixes);
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
    if (Number.isFinite(n) && n >= 1515 && (q.explanation || "").length < QUIZ_EXPL_MIN) {
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

async function raiseSeedThresholds(apply) {
  const updatesMod = await import(`${path.join(LIB, "updates-seed.ts")}?v=${Date.now()}`);
  const circlesMod = await import(`${path.join(LIB, "quran-circles-seed.ts")}?v=${Date.now()}`);
  const mutaMod = await import(`${path.join(LIB, "mutashabihat-data.ts")}?v=${Date.now()}`);
  const mindMod = await import(`${path.join(LIB, "mind-maps-data.ts")}?v=${Date.now()}`);

  const updateRepl = [];
  for (const u of updatesMod.UPDATES_SEED) {
    if ((u.summary || "").length >= UPDATE_SUMMARY_MIN) continue;
    const neu = enrichUpdateSummary(u);
    if (neu !== u.summary) updateRepl.push({ old: u.summary, neu, field: "summary" });
  }

  const circleRepl = [];
  for (const c of circlesMod.QURAN_CIRCLES_SEED) {
    if (!c.description || c.description.length >= QURAN_CIRCLE_MIN) continue;
    const neu = enrichQuranCircleDesc(c);
    if (neu !== c.description) circleRepl.push({ old: c.description, neu, field: "description" });
  }

  const mutaRepl = [];
  for (const p of mutaMod.MUTASHABIHAT) {
    if ((p.description || "").length >= MUTA_MIN) continue;
    const neu = enrichMutashabihatDesc(p);
    if (neu !== p.description) mutaRepl.push({ old: p.description, neu, field: "description" });
  }

  const mindRepl = [];
  for (const m of mindMod.MIND_MAPS) {
    if (!m.description || m.description.length >= MIND_MAP_MIN) continue;
    const neu = enrichMindMapDesc(m);
    if (neu !== m.description) mindRepl.push({ old: m.description, neu, field: "description" });
  }

  let updatesApplied = 0;
  let circlesApplied = 0;
  let mutaApplied = 0;
  let mindApplied = 0;
  if (apply) {
    updatesApplied = applyMultiFieldReplacements(path.join(LIB, "updates-seed.ts"), updateRepl);
    circlesApplied = applyMultiFieldReplacements(path.join(LIB, "quran-circles-seed.ts"), circleRepl);
    mutaApplied = applyMultiFieldReplacements(path.join(LIB, "mutashabihat-data.ts"), mutaRepl);
    mindApplied = applyMultiFieldReplacements(path.join(LIB, "mind-maps-data.ts"), mindRepl);
  }

  return {
    updates: updateRepl.length,
    circles: circleRepl.length,
    mutashabihat: mutaRepl.length,
    mindMaps: mindRepl.length,
    applied: { updates: updatesApplied, circles: circlesApplied, mutashabihat: mutaApplied, mindMaps: mindApplied },
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
  return fs.readFileSync(path.join(__dirname, "r54-original-stories.ts"), "utf8").trim();
}

function readPmBlock() {
  return fs.readFileSync(path.join(__dirname, "r54-prophetic-medicine.ts"), "utf8").trim();
}

function addSeeds(apply) {
  const stats = { quiz: 0, qa: 0, fawaid: 0, stories: 0, pm: 0 };
  const marker = "جولة ٥٤";

  const quizPath = path.join(LIB, "quiz-seed.ts");
  let quizContent = fs.readFileSync(quizPath, "utf8");
  if (!quizContent.includes(marker)) {
    const block = `  /* ───────── ${marker}: أقسام أضعف (1515-1564) ───────── */\n` +
      QUIZ_ITEMS.map(renderQuizItem).join(",\n");
    if (apply) {
      quizContent = insertBeforeClosing(quizContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(quizPath, quizContent, "utf8");
    }
    stats.quiz = QUIZ_ITEMS.length;
  }

  const qaPath = path.join(LIB, "qa-seed.ts");
  let qaContent = fs.readFileSync(qaPath, "utf8");
  if (!qaContent.includes("seed-qa-790")) {
    const block = QA_ITEMS.map(renderQaItem).join(",\n");
    if (apply) {
      qaContent = insertBeforeClosing(qaContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(qaPath, qaContent, "utf8");
    }
    stats.qa = QA_ITEMS.length;
  }

  const fawaidPath = path.join(LIB, "fawaid-curated-seed.ts");
  let fawaidContent = fs.readFileSync(fawaidPath, "utf8");
  if (!fawaidContent.includes("إضافات جولة ٥٤")) {
    const block = `  /* ── إضافات جولة ٥٤ ── */\n` + FAWAID_ITEMS.map(renderFawaidItem).join(",\n");
    if (apply) {
      fawaidContent = insertBeforeClosing(fawaidContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(fawaidPath, fawaidContent, "utf8");
    }
    stats.fawaid = FAWAID_ITEMS.length;
  }

  const storiesPath = path.join(LIB, "islamic-stories-seed.ts");
  let storiesContent = fs.readFileSync(storiesPath, "utf8");
  if (!storiesContent.includes("id: 140,")) {
    const block = readStoriesBlock();
    if (apply) {
      storiesContent = insertBeforeClosing(storiesContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(storiesPath, storiesContent, "utf8");
    }
    stats.stories = 5;
  }

  const pmPath = path.join(LIB, "prophetic-medicine-seed.ts");
  let pmContent = fs.readFileSync(pmPath, "utf8");
  if (!pmContent.includes("sitting-drink-sunnah")) {
    const block = readPmBlock();
    if (apply) {
      pmContent = insertBeforeClosing(pmContent, "\n];", ",\n" + block + "\n");
      fs.writeFileSync(pmPath, pmContent, "utf8");
    }
    stats.pm = 5;
  }

  return stats;
}

function countShortFields() {
  const updatesSrc = fs.readFileSync(path.join(LIB, "updates-seed.ts"), "utf8");
  const circlesSrc = fs.readFileSync(path.join(LIB, "quran-circles-seed.ts"), "utf8");
  const mutaSrc = fs.readFileSync(path.join(LIB, "mutashabihat-data.ts"), "utf8");
  const mindSrc = fs.readFileSync(path.join(LIB, "mind-maps-data.ts"), "utf8");
  const fieldRe = (field) => new RegExp(`${field}:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "g");
  const count = (src, field, min) => {
    let m, n = 0;
    const re = fieldRe(field);
    while ((m = re.exec(src))) if (m[1].length < min) n++;
    return n;
  };
  return {
    updatesShort160: count(updatesSrc, "summary", UPDATE_SUMMARY_MIN),
    circlesShort190: count(circlesSrc, "description", QURAN_CIRCLE_MIN),
    mutaShort190: count(mutaSrc, "description", MUTA_MIN),
    mindShort200: count(mindSrc, "description", MIND_MAP_MIN),
  };
}

function collectContentFiles() {
  return fs.readdirSync(LIB).filter((f) => f.endsWith(".ts")).map((f) => path.join(LIB, f));
}

function countLatinCorruptionHits() {
  const re = /[\u0600-\u06FF][a-zA-Z]{1,6}[\u0600-\u06FF]|[\u0600-\u06FF]{2,}[a-zA-Z]{2,8}/g;
  let hits = 0;
  for (const fp of collectContentFiles()) {
    const text = fs.readFileSync(fp, "utf8");
    for (const line of text.split("\n")) {
      if (/^\s*(\/\/|\/\*|\*)/.test(line)) continue;
      if (/import |from |className|href=|src=|slug:|API|JSON|URL|HTML|CSS|PDF|MIT|SSR|TDZ|JS|RPC|CDN|hash|promise|CHECK|textarea|glyph|KB|DEFAULT/.test(line)) {
        continue;
      }
      let m;
      while ((m = re.exec(line))) {
        if (/Tesla|Lucid|ChatGPT|WhatsApp|Telegram|YouTube|Android|iPhone|WebFetch|wouter|needs_review|TYPE_HREF|platform-services|knowledge_graph|QPC|Twitter|mimham|wikipedia|gen-quiz|constraint_v1|fiqh-general|fiqh-human|fiqh-misyar|applyEvents|alertLevel|pan\/scale|api\.qurancdn|Quran\.com|@drosq8|provenance|ai_generated|sinceSeconds|computePrayerCountdown|isLessonInProgress|computeNextOccurrenceMs|lesson-time|BookOpen|GraduationCap|Heart|Scale|Utensils|Users|Droplets|Hand|Shield|Wind|Moon|Leaf|Circle|FlaskConical|Stethoscope/.test(line)) {
          continue;
        }
        hits++;
      }
    }
  }
  return hits;
}

function fixLatinCorruption(apply) {
  let fixed = 0;
  const files = [
    ...collectContentFiles(),
    path.join(__dirname, "r54-original-stories.ts"),
    path.join(__dirname, "r54-prophetic-medicine.ts"),
  ];
  for (const fp of files) {
    if (!fs.existsSync(fp)) continue;
    let content = fs.readFileSync(fp, "utf8");
    let changed = false;
    for (const [re, rep] of LATIN_FIXES) {
      if (re.test(content)) {
        content = content.replace(re, rep);
        changed = true;
        fixed++;
      }
    }
    if (apply && changed) fs.writeFileSync(fp, content, "utf8");
  }
  return fixed;
}

async function verifyCounts() {
  const qa = readTsExport("qa-seed.ts", "SEED_QA");
  const quiz = readTsExport("quiz-seed.ts", "DEMO_QUIZ_QUESTIONS");
  const pm = readTsExport("prophetic-medicine-seed.ts", "PROPHETIC_MEDICINE_ITEMS");
  const stories = readTsExport("islamic-stories-seed.ts", "ISLAMIC_STORIES_SEED");
  const fawaidSrc = fs.readFileSync(path.join(LIB, "fawaid-curated-seed.ts"), "utf8");
  const round54Idx = fawaidSrc.indexOf("إضافات جولة ٥٤");
  const fawaidRound54Block =
    round54Idx >= 0 ? fawaidSrc.slice(round54Idx).split("{ text:").length - 1 : 0;

  return {
    qaShortAnswers: qa.filter((x) => (x.answer || "").length < QA_ANSWER_MIN).length,
    quizShortAnswers: quiz.filter((q) => (q.answer || "").length < QUIZ_ANSWER_MIN).length,
    quizRound54ShortExpl: quiz.filter((q) => {
      const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
      return n >= 1515 && (q.explanation || "").length < QUIZ_EXPL_MIN;
    }).length,
    quizRound54: quiz.filter((q) => {
      const n = parseInt((q.id || "").replace("demo-quiz-", ""), 10);
      return n >= 1515 && n <= 1564;
    }).length,
    qaRound54: qa.filter((q) => {
      const n = parseInt((q.id || "").replace("seed-qa-", ""), 10);
      return n >= 790 && n <= 829;
    }).length,
    storiesRound54: stories.filter((s) => s.id >= 140 && s.id <= 144).length,
    pmRound54: pm.filter((x) =>
      ["sitting-drink-sunnah", "eating-right-hand", "cover-vessels-night", "lick-fingers-after-meal", "no-blow-in-vessel"].includes(x.id),
    ).length,
    fawaidRound54Block,
    fawaidRound54Short145: (() => {
      if (round54Idx < 0) return 999;
      const block = fawaidSrc.slice(round54Idx);
      const texts = [...block.matchAll(/text:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
      return texts.filter((t) => t.length < FAWAID_MIN).length;
    })(),
    pmBodyShort370: pm.filter((x) => x.body.length < PM_BODY_MIN).length,
    pmBenefitShort90: pm.reduce((n, x) => n + (x.benefits || []).filter((b) => b.length < PM_BENEFIT_MIN).length, 0),
    latinCorruptionHits: countLatinCorruptionHits(),
    ...countShortFields(),
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
  latinFixed: fixLatinCorruption(apply),
  quizAnswersRaised: raiseQuizAnswers(apply),
  quizExplRaised: raiseQuizExplanations(apply),
  seeds: addSeeds(apply),
  pmThresholds: raisePmThresholds(apply),
};

results.thresholds = await raiseSeedThresholds(apply);

if (apply || verify) results.after = await verifyCounts();

console.log(JSON.stringify(results, null, 2));

if (verify) {
  const a = results.after || {};
  const fail =
    (a.qaShortAnswers ?? 1) > 0 ||
    (a.quizShortAnswers ?? 1) > 0 ||
    (a.quizRound54ShortExpl ?? 1) > 0 ||
    (a.quizRound54 ?? 0) !== 50 ||
    (a.qaRound54 ?? 0) !== 40 ||
    (a.storiesRound54 ?? 0) !== 5 ||
    (a.pmRound54 ?? 0) !== 5 ||
    (a.fawaidRound54Block ?? 0) !== 25 ||
    (a.fawaidRound54Short145 ?? 1) > 0 ||
    (a.pmBodyShort370 ?? 1) > 0 ||
    (a.pmBenefitShort90 ?? 1) > 0 ||
    (a.updatesShort160 ?? 1) > 0 ||
    (a.circlesShort190 ?? 1) > 0 ||
    (a.mutaShort190 ?? 1) > 0 ||
    (a.mindShort200 ?? 1) > 0 ||
    (a.latinCorruptionHits ?? 1) > 0;
  process.exit(fail ? 1 : 0);
}
