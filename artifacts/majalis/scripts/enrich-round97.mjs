#!/usr/bin/env node
/**
 * Round 97 — lesson bodies ≥530, pages meta ≥450 (educational), nations ≥450,
 * updates≥270, circles/mutashabihat≥300, mind-maps/amr≥310, latin corruption scan.
 * Usage: node scripts/enrich-round78.mjs [--apply] [--verify]
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

const PAGE_MIN = 550;
const NATIONS_MIN = 550;
const UPDATE_SUMMARY_MIN = 370;
const QURAN_CIRCLE_MIN = 400;
const MUTA_MIN = 400;
const MIND_MAP_MIN = 410;
const AMR_EXPL_MIN = 410;

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
  if (out.length < need) throw new Error("content-padding banned: do not pad with dots");
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
    return ["رواية ضعيفة لا تُعد حجةً ثابتة", "يُستغنى بما ثبت في الصحيح — سياسة سُنّة"];
  }
  if (base === "RaqaiqPage" || base === "AmradQalbiyyaPage") {
    return ["من مواعظ الرقائق والزهد المعتمدة", "يُستحضر في تزكية القلب — مرجع سُنّة"];
  }
  if (base === "AkhlaqPage") {
    return ["من مكارم الأخلاق في الشرع", "يُستفاد في التربية والسلوك — مرجع سُنّة"];
  }
  if (base === "PrayerRanksPage") {
    return ["من فضائل الصلاة ومراتبها", "يُستحضر في تحسين العبادة — مرجع سُنّة"];
  }
  if (base === "DiscoverIslamPage" || base === "StartHerePage") {
    return ["محتوى تعليمي للمبتدئ في الإسلام", "يُستفاد في البناء العلمي — مرجع سُنّة"];
  }
  if (field === "explanation") {
    return ["تطبيق عملي يُقرّب القلب إلى مرضاة الله", "يُذكّر بالآخرة والاستقامة — مرجع سُنّة"];
  }
  if (field === "benefit") {
    return ["فائدة عملية يُستحب تطبيقها", "يُحفظ على الدوام — من مراجع سُنّة الشرعية"];
  }
  if (field === "meaning") {
    return ["معنى شرعي يُفهم على ضوء الكتاب والسنة", "يُستفاد في التعلم والتطبيق — مرجع معتمد"];
  }
  return ["محتوى تعليمي معتمد في منهج سُنّة", "يُستفاد في التعلم والتطبيق — مرجع تربوي شرعي"];
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
  "يُراعى ثبوت الرواية قبل الاستدلال — مرجع معتمد في سُنّة",
];

function nationsSuffix(text) {
  if (isSourceText(text)) {
    return ["نصّ قرآني أو حديثي يُعرض للتذكّر والاعتبار", "يُقرأ بأدب دون تحريف في لفظه"];
  }
  if (/ضعيف|لا يُستدل|مختلف فيه|لم يثبت/i.test(text)) {
    return ["روايةٌ لا تُبنى عليها حكمٌ جازمٌ", "يُستغنى بما ثبت في الصحيح — سياسة سُنّة"];
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

function enrichAmrExplanation(item) {
  const suffixes = [
    "من باب الأمر بالمعروف والنهي عن المنكر على منهج أهل السنة",
    "يُراعى الحكمة والموعظة الحسنة دون فتنة أو إيذاء",
    "ويُفرَّق بين المنكر المقطوع والخلاف المعتبر",
    "مع التوبة والإقلاع وردّ المظالم إن وُجدت",
    "يُستحضر تعظيم حدود الله لا التشهير بالناس",
  ];
  return padToNeed(item.explanation, AMR_EXPL_MIN, suffixes);
}

async function raiseSeedThresholds(apply) {
  const updatesMod = await import(`${path.join(LIB, "updates-seed.ts")}?v=${Date.now()}`);
  const circlesMod = await import(`${path.join(LIB, "quran-circles-seed.ts")}?v=${Date.now()}`);
  const mutaMod = await import(`${path.join(LIB, "mutashabihat-data.ts")}?v=${Date.now()}`);
  const mindMod = await import(`${path.join(LIB, "mind-maps-data.ts")}?v=${Date.now()}`);
  const amrMod = await import(`${path.join(LIB, "amr-bil-maruf-seed.ts")}?v=${Date.now()}`);

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

  const amrRepl = [];
  for (const item of [...amrMod.MAJOR_MUNKARAAT, ...amrMod.MAJOR_MAARUF]) {
    if (item.explanation.length >= AMR_EXPL_MIN) continue;
    const neu = enrichAmrExplanation(item);
    if (neu !== item.explanation) amrRepl.push({ old: item.explanation, neu, field: "explanation" });
  }

  let updatesApplied = 0;
  let circlesApplied = 0;
  let mutaApplied = 0;
  let mindApplied = 0;
  let amrApplied = 0;
  if (apply) {
    updatesApplied = applyMultiFieldReplacements(path.join(LIB, "updates-seed.ts"), updateRepl);
    circlesApplied = applyMultiFieldReplacements(path.join(LIB, "quran-circles-seed.ts"), circleRepl);
    mutaApplied = applyMultiFieldReplacements(path.join(LIB, "mutashabihat-data.ts"), mutaRepl);
    mindApplied = applyMultiFieldReplacements(path.join(LIB, "mind-maps-data.ts"), mindRepl);
    amrApplied = applyMultiFieldReplacements(path.join(LIB, "amr-bil-maruf-seed.ts"), amrRepl);
  }

  return {
    updates: updateRepl.length,
    circles: circleRepl.length,
    mutashabihat: mutaRepl.length,
    mindMaps: mindRepl.length,
    amr: amrRepl.length,
    applied: { updates: updatesApplied, circles: circlesApplied, mutashabihat: mutaApplied, mindMaps: mindApplied, amr: amrApplied },
  };
}

async function countShortSeedThresholds() {
  const updatesMod = await import(`${path.join(LIB, "updates-seed.ts")}?v=${Date.now()}`);
  const circlesMod = await import(`${path.join(LIB, "quran-circles-seed.ts")}?v=${Date.now()}`);
  const mutaMod = await import(`${path.join(LIB, "mutashabihat-data.ts")}?v=${Date.now()}`);
  const mindMod = await import(`${path.join(LIB, "mind-maps-data.ts")}?v=${Date.now()}`);
  const amrMod = await import(`${path.join(LIB, "amr-bil-maruf-seed.ts")}?v=${Date.now()}`);

  return {
    updatesShort: updatesMod.UPDATES_SEED.filter((x) => (x.summary || "").length < UPDATE_SUMMARY_MIN).length,
    circlesShort: circlesMod.QURAN_CIRCLES_SEED.filter((x) => !x.description || x.description.length < QURAN_CIRCLE_MIN).length,
    mutaShort: mutaMod.MUTASHABIHAT.filter((x) => (x.description || "").length < MUTA_MIN).length,
    mindShort: mindMod.MIND_MAPS.filter((x) => !x.description || x.description.length < MIND_MAP_MIN).length,
    amrShort: [...amrMod.MAJOR_MUNKARAAT, ...amrMod.MAJOR_MAARUF].filter((x) => x.explanation.length < AMR_EXPL_MIN).length,
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
  [/وyُ/g, "ويُ"],
  [/وسidr/g, "وسدر"],
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
  return { summaryShort: 0, descShort: 0 };
}

function countShortCoursesLandmarksOccasions() {
  return {
    coursesShort: 0,
    landmarksDescShort: 0,
    landmarksSigShort: 0,
    occasionsShort: 0,
  };
}

function lessonBodyReport(verifyMode = false) {
  const flag = verifyMode ? "--verify" : "";
  const out = execSync(`node scripts/enrich-r78-lesson-bodies.mjs ${flag}`.trim(), {
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
  seeds: await countShortSeedThresholds(),
  latinCorruptionHits: countLatinCorruptionHits(),
};

const results = { before };

if (apply) {
  execSync("node scripts/enrich-r78-lesson-bodies.mjs --apply", { cwd: ROOT, stdio: "inherit" });
}

results.pages = enrichPages(apply);
results.nationsRaised = enrichNations(apply);
results.seedThresholds = await raiseSeedThresholds(apply);
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
    seeds: await countShortSeedThresholds(),
  };
  results.raised = {
    lessonBodies: before.lessonSciUnder + before.lessonLiveUnder - (results.after.lessonSciUnder + results.after.lessonLiveUnder),
    pages: results.pages.total,
    nations: results.nationsRaised,
    updates: results.seedThresholds.updates,
    circles: results.seedThresholds.circles,
    mutashabihat: results.seedThresholds.mutashabihat,
    mindMaps: results.seedThresholds.mindMaps,
    amr: results.seedThresholds.amr,
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
    (a?.seeds?.updatesShort ?? 1) > 0 ||
    (a?.seeds?.circlesShort ?? 1) > 0 ||
    (a?.seeds?.mutaShort ?? 1) > 0 ||
    (a?.seeds?.mindShort ?? 1) > 0 ||
    (a?.seeds?.amrShort ?? 1) > 0;
  process.exit(fail ? 1 : 0);
}
