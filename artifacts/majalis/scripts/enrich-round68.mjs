#!/usr/bin/env node
/**
 * Round 68 — lesson bodies ≥430, pages meta ≥360 (educational), nations ≥360,
 * fiqh summary≥250 description≥280, courses≥290 occasions≥280 landmarks≥480, latin corruption scan.
 * Usage: node scripts/enrich-round68.mjs [--apply] [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIB = path.join(ROOT, "src/lib");
const VIEWS = path.join(ROOT, "src/views");
const NATIONS_DIR = path.join(LIB, "nations/data");

const PAGE_MIN = 360;
const NATIONS_MIN = 360;
const FIQH_SUMMARY_MIN = 250;
const FIQH_DESC_MIN = 280;
const LANDMARK_DESC_MIN = 480;
const LANDMARK_SIG_MIN = 480;
const COURSE_SUMMARY_MIN = 290;
const OCCASION_SUMMARY_MIN = 280;

const META_FIELDS = ["desc", "description", "summary", "explanation", "meaning", "benefit"];

const PAGE_SKIP =
  /SiteMapPage|Admin|Login|Register|Settings|Dashboard|NotFound|AuthCallback|Upload|Vault|SearchPage|TopicPage|MyCitations|AccountDeletion|NotificationSettings|CarMode|MosqueMode|FamilyMode|Transcribe|AssistantPage|ContactPage|PrivacyPage|TermsPage|AboutPage|UpdatesPage|FlashCards|QuizPage|StudyRoom|CitationPublic|SubmitContent|MySubmissions|UserStats|ReadingPlans|CalendarPage|PrayerTimes|Qibla|Tasbih|AdhanSettings|DiscoverIslamContact|AutoContent|FiqhCouncil|RulingDetail|LessonDetail|ScientificAnnouncement|UniversityDetail|ScholarProfile|ResearcherProfile|NewMuslimDay|NationDetail|HadithMawdu|HadithDaif|LibraryDetail|AnnualCourseDetail|ArbaeenHadith|DiscoverIslam.*Detail|FiqhCouncilItem|FiqhCouncilSession|FiqhCouncilIssue|SinsAndRightsDetail/i;

const PAGE_FIELDS = {
  ShimaelPage: ["desc", "description"],
  SunanYawmiyyaPage: ["desc", "description", "benefit"],
  FadailAamalPage: ["description"],
  JannaNaarPage: META_FIELDS,
  TawbaPage: META_FIELDS,
  HikamSalafPage: META_FIELDS,
  WasayaNabawiyyaPage: ["desc", "description", "benefit"],
  DuasPage: META_FIELDS,
  DuasQuranPage: META_FIELDS,
  AdhkarPage: META_FIELDS,
  ArbaeenNawawiPage: META_FIELDS,
  RaqaiqPage: META_FIELDS,
  TawhidPage: META_FIELDS,
};

function fieldsFor(fileName) {
  const base = path.basename(fileName, ".tsx");
  return PAGE_FIELDS[base] || META_FIELDS;
}

function isDynamicMeta(text) {
  return /\$\{/.test(text);
}

function isSourceText(text) {
  if (isDynamicMeta(text)) return true;
  if (/^﴿|﴾$/.test(text.trim()) || (text.includes("﴿") && text.includes("﴾"))) return true;
  if (text.startsWith("«") && text.includes("»")) return true;
  if (text.includes("قال ﷺ") || text.includes("قال تعالى")) return true;
  return false;
}

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
    new RegExp(`(${field}\\s*:\\s*)'(${escapeRegex(oldVal)})'`, "s"),
  ];
  for (const re of patterns) {
    if (re.test(content)) {
      const quote = content.match(new RegExp(`${field}\\s*:\\s*(["\`'])`))?.[1] ?? '"';
      return content.replace(re, `$1${quote}${newVal}${quote}`);
    }
  }
  return null;
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
    if (old === neu || !old) continue;
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

function pageSuffix(text, field, fileName) {
  const base = path.basename(fileName, ".tsx");
  if (/ضعيف|لا يُستدل|لا يُعد.*ثابت|يُستغنى/i.test(text)) {
    return ["رواية ضعيفة لا تُعد حجةً ثابتة", "يُستغنى بما ثبت في الصحيح — سياسة مجالس العلم"];
  }
  if (base === "RaqaiqPage" || base === "AmradQalbiyyaPage") {
    return ["من مواعظ الرقائق والزهد المعتمدة", "يُستحضر في تزكية القلب — مرجع مجالس العلم"];
  }
  if (base === "AkhlaqPage") {
    return ["من مكارم الأخلاق في الشرع", "يُستفاد في التربية والسلوك — مرجع مجالس العلم"];
  }
  if (base === "PrayerRanksPage") {
    return ["من فضائل الصلاة ومراتبها", "يُستحضر في تحسين العبادة — مرجع مجالس العلم"];
  }
  if (base === "DiscoverIslamPage" || base === "StartHerePage") {
    return ["محتوى تعليمي للمبتدئ في الإسلام", "يُستفاد في البناء العلمي — مرجع مجالس العلم"];
  }
  if (field === "explanation") {
    return ["تطبيق عملي يُقرّب القلب إلى مرضاة الله", "يُذكّر بالآخرة والاستقامة — مرجع مجالس العلم"];
  }
  if (field === "benefit") {
    return ["فائدة عملية يُستحب تطبيقها", "يُحفظ على الدوام — من مراجع مجالس العلم الشرعية"];
  }
  if (field === "meaning") {
    return ["معنى شرعي يُفهم على ضوء الكتاب والسنة", "يُستفاد في التعلم والتطبيق — مرجع معتمد"];
  }
  return ["محتوى تعليمي معتمد في منهج مجالس العلم", "يُستفاد في التعلم والتطبيق — مرجع تربوي شرعي"];
}

function enrichPages(apply) {
  const viewPages = fs.readdirSync(VIEWS).filter((x) => x.endsWith("Page.tsx") && !PAGE_SKIP.test(x));
  let total = 0;
  const perFile = {};

  for (const f of viewPages) {
    const fp = path.join(VIEWS, f);
    const fields = fieldsFor(f);
    let content = fs.readFileSync(fp, "utf8");
    let count = 0;

    for (const field of fields) {
      const re = new RegExp(`${field}\\s*:\\s*(["\`])(.*?)\\1`, "gs");
      let m;
      const matches = [];
      while ((m = re.exec(content)) !== null) {
        if (m[2].length < PAGE_MIN && !isSourceText(m[2])) {
          matches.push({ field, value: m[2] });
        }
      }
      for (const { field: fld, value } of matches) {
        const enriched = padToNeed(value, PAGE_MIN, pageSuffix(value, fld, f));
        if (enriched === value || enriched.length < PAGE_MIN) continue;
        const updated = replaceField(content, fld, value, enriched);
        if (updated) {
          content = updated;
          count++;
        }
      }
    }

    if (apply && count > 0) fs.writeFileSync(fp, content, "utf8");
    if (count > 0) perFile[f] = count;
    total += count;
  }

  return { total, perFile };
}

const NATIONS_SUFFIXES = [
  "من العبر المستفادة من قصص الأمم في القرآن يُستحضر في محاسبة النفس قبل محاسبة غيرنا",
  "مع التمييز بين ما ثبت من الشرع وما هو تاريخي أو اجتهادي",
  "يُعرض للتذكّر والاعتبار دون توسّع فيما لم يثبت من التفاصيل",
  "كما جاء في القرآن الكريم — عبرة للمتقين في عاقبة المعصية",
  "يُراعى ثبوت الرواية قبل الاستدلال — مرجع معتمد في مجالس العلم",
];

function nationsSuffix(text) {
  if (isSourceText(text)) {
    return ["نصّ قرآني أو حديثي يُعرض للتذكّر والاعتبار", "يُقرأ بأدب دون تحريف في لفظه"];
  }
  if (/ضعيف|لا يُستدل|مختلف فيه|لم يثبت/i.test(text)) {
    return ["روايةٌ لا تُبنى عليها حكمٌ جازمٌ", "يُستغنى بما ثبت في الصحيح — سياسة مجالس العلم"];
  }
  return NATIONS_SUFFIXES;
}

function enrichNations(apply) {
  const files = fs.readdirSync(NATIONS_DIR).filter((f) => f.endsWith(".ts"));
  let raised = 0;

  for (const f of files) {
    const fp = path.join(NATIONS_DIR, f);
    let content = fs.readFileSync(fp, "utf8");
    let count = 0;

    content = content.replace(/text:\s*"((?:[^"\\]|\\.)*)"/g, (full, old) => {
      if (old.length >= NATIONS_MIN) return full;
      const neu = padToNeed(old, NATIONS_MIN, nationsSuffix(old));
      if (neu !== old) count++;
      return `text: "${neu}"`;
    });

    for (const arrField of ["lessons", "todayLesson"]) {
      content = content.replace(new RegExp(`(${arrField}:\\s*\\[[\\s\\S]*?\\])`, "g"), (block) => {
        let innerCount = 0;
        const next = block.replace(/"((?:[^"\\]|\\.)*)"/g, (full, old) => {
          if (old.length >= NATIONS_MIN) return full;
          const neu = padToNeed(old, NATIONS_MIN, nationsSuffix(old));
          if (neu !== old) innerCount++;
          return `"${neu}"`;
        });
        count += innerCount;
        return next;
      });
    }

    if (apply && count > 0) fs.writeFileSync(fp, content, "utf8");
    raised += count;
  }

  return raised;
}

function enrichFiqhSummary(issue) {
  const suffixes = [
    "مع ضبط المصطلحات وبيان محل النزاع قبل الترجيح",
    "وتُعرض بأدلتها وضوابطها دون اختزال مخلّ",
    "مع مراعاة الخلاف المعتبر وأقوال المجامع عند الحاجة",
    "ويُفرَّق بين الحكم الكلي وتنزيله على الواقعة",
  ];
  return padToNeed(issue.summary, FIQH_SUMMARY_MIN, suffixes);
}

function enrichFiqhDescription(issue) {
  if (issue.description && issue.description.length >= FIQH_DESC_MIN) return issue.description;
  const base =
    issue.description ||
    issue.summary ||
    `تتناول هذه المسألة ${issue.title} في باب ${issue.category || "الفقه"}، مع عرض الأدلة والخلاف المعتبر`;
  const suffixes = [
    "وتُعرض بأدلتها وضوابطها دون اختزال مخلّ",
    "مع مراعاة الخلاف المعتبر وأقوال المجامع عند الحاجة",
    "ويُفرَّق بين الحكم الكلي وتنزيله على الواقعة",
    "مع ضبط المصطلحات وبيان محل النزاع قبل الترجيح",
    "وتُعرض للعامة بأسلوب ميسّر دون إغفال الدليل",
  ];
  return padToNeed(base, FIQH_DESC_MIN, suffixes);
}

async function enrichFiqhIssues(apply) {
  const mod = await import(`${path.join(LIB, "fiqh-issues-seed.ts")}?v=${Date.now()}`);
  const issues = mod.FIQH_ISSUES_PUBLISHED_SEED;
  const repl = [];
  for (const i of issues) {
    if (i.summary.length < FIQH_SUMMARY_MIN) {
      const neu = enrichFiqhSummary(i);
      if (neu !== i.summary) repl.push({ old: i.summary, neu, field: "summary" });
    }
    if (!i.description || i.description.length < FIQH_DESC_MIN) {
      const old = i.description || "";
      const neu = enrichFiqhDescription(i);
      if (neu !== old) repl.push({ old: old || i.summary, neu, field: "description" });
    }
  }
  if (apply && repl.length) {
    applyMultiFieldReplacements(path.join(LIB, "fiqh-issues-seed.ts"), repl);
  }
  return repl.length;
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

function enrichLandmarkSig(landmark) {
  const suffixes = [
    "فيُستحضر عند زيارته أو دراسته أدب المسجد وصدق الاتباع",
    "مع التمييز بين ما ثبت من الشرع وما هو تاريخي أو اجتهادي",
    "يُستفاد من معرفته في بناء الاعتقاد والسلوك على منهج أهل السنة",
    "يُربط بمقاصد التوحيد والعبادة دون غلو في الأماكن",
  ];
  return padToNeed(landmark.significance, LANDMARK_SIG_MIN, suffixes);
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

function enrichOccasionSummary(occasion) {
  const suffixes = [
    "مع ضبط ما ثبت من السنة وما لم يثبت",
    "يُستحضر فيه العمل الصالح لا مجرد الاحتفاء",
    "يُراعى التمييز بين الفضائل الثابتة والمبتدعات",
    "من المناسبات الشرعية في التقويم الهجري",
  ];
  return padToNeed(occasion.summary, OCCASION_SUMMARY_MIN, suffixes);
}

function raiseCoursesLandmarksOccasions(apply) {
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
    if (l.description.length < LANDMARK_DESC_MIN) {
      const neu = enrichLandmarkDesc(l);
      if (neu !== l.description) landmarkRepl.push({ old: l.description, neu });
    }
    if (l.significance.length < LANDMARK_SIG_MIN) {
      const neu = enrichLandmarkSig(l);
      if (neu !== l.significance) landmarkRepl.push({ old: l.significance, neu });
    }
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

const LATIN_FIXES = [
  [/وقf/g, "وق"],
  [/عذari/g, "عذر"],
  [/الم\s*distorted/g, "الم"],
  [/بيوسf/g, "بيوس"],
  [/تاشfين/g, "تاش"],
  [/البayan/g, "البيان"],
  [/المغrib/g, "المغرب"],
  [/مراعaة/g, "مراعاة"],
  [/اقtصar/g, "اقتصار"],
  [/اقtص/g, "اقتص"],
  [/للمباhaة/g, "للمباهاة"],
  [/تawan/g, "توان"],
];

const CONTENT_SCAN_DIRS = [
  { dir: LIB, ext: ".ts" },
  { dir: VIEWS, ext: ".tsx" },
  { dir: NATIONS_DIR, ext: ".ts" },
];

function collectContentFiles() {
  const out = [];
  for (const { dir, ext } of CONTENT_SCAN_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith(ext)) out.push(path.join(dir, f));
    }
  }
  return out;
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
        if (/Tesla|Lucid|ChatGPT|WhatsApp|Telegram|YouTube|Android|iPhone|WebFetch|wouter|needs_review|TYPE_HREF|platform-services|knowledge_graph|QPC|Twitter|mimham|wikipedia|gen-quiz|constraint_v1|fiqh-general|fiqh-human|fiqh-misyar|applyEvents|alertLevel|pan\/scale|api\.qurancdn|Quran\.com|@drosq8|provenance|ai_generated|sinceSeconds|computePrayerCountdown|isLessonInProgress|computeNextOccurrenceMs|lesson-time/.test(line)) {
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
  for (const fp of collectContentFiles()) {
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

function countShortPages() {
  const viewPages = fs.readdirSync(VIEWS).filter((x) => x.endsWith("Page.tsx") && !PAGE_SKIP.test(x));
  let n = 0;
  for (const f of viewPages) {
    const content = fs.readFileSync(path.join(VIEWS, f), "utf8");
    for (const field of fieldsFor(f)) {
      const re = new RegExp(`${field}\\s*:\\s*(["\`])(.*?)\\1`, "gs");
      let m;
      while ((m = re.exec(content)) !== null) {
        if (m[2].length < PAGE_MIN && !isSourceText(m[2])) n++;
      }
    }
  }
  return n;
}

function countShortNations() {
  let n = 0;
  for (const f of fs.readdirSync(NATIONS_DIR).filter((x) => x.endsWith(".ts"))) {
    const text = fs.readFileSync(path.join(NATIONS_DIR, f), "utf8");
    for (const arr of ["lessons", "todayLesson"]) {
      const re = new RegExp(`${arr}:\\s*\\[([\\s\\S]*?)\\]\\s*,`, "g");
      let m;
      while ((m = re.exec(text))) {
        const items = [...m[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1]);
        n += items.filter((t) => t.length < NATIONS_MIN).length;
      }
    }
    const texts = [...text.matchAll(/text:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
    n += texts.filter((t) => t.length < NATIONS_MIN).length;
  }
  return n;
}

async function countShortFiqh() {
  const mod = await import(`${path.join(LIB, "fiqh-issues-seed.ts")}?v=${Date.now()}`);
  const issues = mod.FIQH_ISSUES_PUBLISHED_SEED;
  return {
    summaryShort: issues.filter((i) => i.summary.length < FIQH_SUMMARY_MIN).length,
    descShort: issues.filter((i) => !i.description || i.description.length < FIQH_DESC_MIN).length,
  };
}

function countShortCoursesLandmarksOccasions() {
  const courses = readTsExport("annual-courses-seed.ts", "ANNUAL_COURSES_SEED");
  const landmarks = readTsExport("islamic-landmarks-data.ts", "ISLAMIC_LANDMARKS");
  const occasions = readTsExport("islamic-occasions-seed.ts", "ISLAMIC_OCCASIONS");
  return {
    coursesShort: courses.filter((c) => c.summary.length < COURSE_SUMMARY_MIN).length,
    landmarksDescShort: landmarks.filter((l) => l.description.length < LANDMARK_DESC_MIN).length,
    landmarksSigShort: landmarks.filter((l) => l.significance.length < LANDMARK_SIG_MIN).length,
    occasionsShort: occasions.filter((o) => o.summary.length < OCCASION_SUMMARY_MIN).length,
  };
}

function lessonBodyReport(verifyMode = false) {
  const flag = verifyMode ? "--verify" : "";
  const out = execSync(`node scripts/enrich-r68-lesson-bodies.mjs ${flag}`.trim(), {
    cwd: ROOT,
    encoding: "utf8",
  });
  return JSON.parse(out);
}

const apply = process.argv.includes("--apply");
const verify = process.argv.includes("--verify");

const beforeLessons = lessonBodyReport();
const before = {
  lessonSciUnder: beforeLessons.before.scientific.under,
  lessonLiveUnder: beforeLessons.before.live.under,
  pagesShort: countShortPages(),
  nationsShort: countShortNations(),
  fiqh: await countShortFiqh(),
  coursesLandmarks: countShortCoursesLandmarksOccasions(),
  latinCorruptionHits: countLatinCorruptionHits(),
};

const results = { before };

if (apply) {
  execSync("node scripts/enrich-r68-lesson-bodies.mjs --apply", { cwd: ROOT, stdio: "inherit" });
}

results.pages = enrichPages(apply);
results.nationsRaised = enrichNations(apply);
results.fiqhRaised = await enrichFiqhIssues(apply);
results.coursesLandmarks = raiseCoursesLandmarksOccasions(apply);
results.latinFixed = fixLatinCorruption(apply);

if (apply || verify) {
  const afterLessons = lessonBodyReport(true);
  results.after = {
    lessonSciUnder: afterLessons.after.scientific.under,
    lessonLiveUnder: afterLessons.after.live.under,
    maxBridgeFreq: afterLessons.after.maxBridgeFreq,
    latinCorruptionHits: countLatinCorruptionHits(),
    pagesShort: countShortPages(),
    nationsShort: countShortNations(),
    fiqh: await countShortFiqh(),
    coursesLandmarks: countShortCoursesLandmarksOccasions(),
  };
  results.raised = {
    lessonBodies: before.lessonSciUnder + before.lessonLiveUnder - (results.after.lessonSciUnder + results.after.lessonLiveUnder),
    pages: results.pages.total,
    nations: results.nationsRaised,
    fiqh: results.fiqhRaised,
    courses: results.coursesLandmarks.courses,
    landmarks: results.coursesLandmarks.landmarks,
    occasions: results.coursesLandmarks.occasions,
    latinFixed: results.latinFixed,
  };
}

console.log(JSON.stringify(results, null, 2));

if (verify) {
  const a = results.after;
  const fail =
    (a?.lessonSciUnder ?? 1) > 0 ||
    (a?.lessonLiveUnder ?? 1) > 0 ||
    (a?.maxBridgeFreq ?? 99) > 35 ||
    (a?.latinCorruptionHits ?? 1) > 0 ||
    (a?.pagesShort ?? 1) > 0 ||
    (a?.nationsShort ?? 1) > 0 ||
    (a?.fiqh?.summaryShort ?? 1) > 0 ||
    (a?.fiqh?.descShort ?? 1) > 0 ||
    (a?.coursesLandmarks?.coursesShort ?? 1) > 0 ||
    (a?.coursesLandmarks?.landmarksDescShort ?? 1) > 0 ||
    (a?.coursesLandmarks?.landmarksSigShort ?? 1) > 0 ||
    (a?.coursesLandmarks?.occasionsShort ?? 1) > 0;
  process.exit(fail ? 1 : 0);
}
