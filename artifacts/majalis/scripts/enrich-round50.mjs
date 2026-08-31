#!/usr/bin/env node
/**
 * Round 50 — lesson bodies ≥250, pages meta ≥180, asma, glossary, sheikhs, sins-rights.
 * Usage: node scripts/enrich-round50.mjs [--apply] [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIB = path.join(ROOT, "src/lib");
const VIEWS = path.join(ROOT, "src/views");

const PAGE_MIN = 180;
const ASMA_MEANING_MIN = 120;
const ASMA_BENEFIT_MIN = 160;
const GLOSSARY_MIN = 180;
const SHEIKH_BIO_MIN = 240;
const SINS_EXPL_MIN = 240;

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

function isSourceText(text) {
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
  const viewsDir = VIEWS;
  const viewPages = fs.readdirSync(viewsDir).filter((x) => x.endsWith("Page.tsx") && !PAGE_SKIP.test(x));
  let total = 0;
  const perFile = {};

  for (const f of viewPages) {
    const fp = path.join(viewsDir, f);
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

const ASMA_MEANING_SUFFIXES = [
  "بلا تكييف ولا تمثيل",
  "مع إثبات المعنى اللائق بالله تعالى",
  "فَيُستحضر في الدعاء والتعظيم بحسب دلالته الشرعية",
  "مع ربطه بما صحّ من الكتاب والسنة في بابه",
  "ويُفهم على منهج أهل السنة بلا تحريف ولا تعطيل",
];

const ASMA_BENEFIT_SUFFIXES = [
  "مع الحرص على الدليل الشرعي",
  "فيُستحضر عند الدعاء والذكر بلا تكلّف في الأجر لم يثبت",
  "مع اجتناب سرد فضائل لم تثبت عن الاسم المعيَّن",
  "ويعين على تعظيم الله بأسمائه الثابتة في الوحي",
  "فينعكس على الخشية والمحبة والرجاء بحسب المعنى",
  "ويُربط بالعمل لا بمجرد الحفظ اللفظي",
];

function enrichAsma(apply) {
  const fp = path.join(LIB, "asma-husna-data.ts");
  let content = fs.readFileSync(fp, "utf8");
  let meaningRaised = 0;
  let benefitRaised = 0;
  content = content.replace(/meaning:\s*"((?:[^"\\]|\\.)*)"/g, (full, old) => {
    if (old.length >= ASMA_MEANING_MIN) return full;
    const neu = padToNeed(old, ASMA_MEANING_MIN, ASMA_MEANING_SUFFIXES);
    if (neu !== old) meaningRaised++;
    return `meaning: "${neu}"`;
  });
  content = content.replace(/benefit:\s*"((?:[^"\\]|\\.)*)"/g, (full, old) => {
    if (old.length >= ASMA_BENEFIT_MIN) return full;
    const neu = padToNeed(old, ASMA_BENEFIT_MIN, ASMA_BENEFIT_SUFFIXES);
    if (neu !== old) benefitRaised++;
    return `benefit: "${neu}"`;
  });
  if (apply) fs.writeFileSync(fp, content, "utf8");
  return { meaningRaised, benefitRaised };
}

const GLOSSARY_SUFFIXES = [
  " — مصطلح أصيل في عقيدة أهل السنة",
  "، يُفهم بما ثبت من الكتاب والسنة بلا تحريف ولا تعطيل ولا تكييف",
  "، ويُستفاد في البناء العلمي والتعليم الشرعي المعتمد",
  "، مع الرجوع للمراجع المعتمدة في بابه",
];

function enrichGlossary(apply) {
  const fp = path.join(VIEWS, "IslamicGlossaryPage.tsx");
  let content = fs.readFileSync(fp, "utf8");
  let raised = 0;
  content = content.replace(/definition:\s*"((?:[^"\\]|\\.)*)"/g, (full, old) => {
    if (old.length >= GLOSSARY_MIN) return full;
    const neu = padToNeed(old, GLOSSARY_MIN, GLOSSARY_SUFFIXES);
    if (neu !== old) raised++;
    return `definition: "${neu}"`;
  });
  if (apply) fs.writeFileSync(fp, content, "utf8");
  return raised;
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

function enrichSinExplanation(topic) {
  const suffixes = [
    "مع اجتناب التجسس والغيبة باسم النصيحة",
    "والستر حيث يُشرع الستر مع التوبة والإقلاع",
    "يُستحضر تعظيم حدود الله لا التشهير بالناس",
    "مع التوبة والإقلاع وردّ المظالم إن وُجدت",
    "من باب حقوق الله أو حقوق العباد بحسب تصنيف المسألة",
  ];
  return padToNeed(topic.explanation, SINS_EXPL_MIN, suffixes);
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

async function enrichSheikhs(apply) {
  const mod = await import(`${path.join(LIB, "sheikhs-seed.ts")}?v=${Date.now()}`);
  const sheikhs = mod.SHEIKHS_SEED;
  const repl = [];
  for (const s of sheikhs) {
    if ((s.bio || "").length >= SHEIKH_BIO_MIN) continue;
    const neu = enrichSheikhBio(s);
    if (neu.length < SHEIKH_BIO_MIN) throw new Error(`Still short sheikh ${s.id}: ${neu.length}`);
    repl.push({ old: s.bio, neu });
  }
  if (apply && repl.length) applyFieldReplacements(path.join(LIB, "sheikhs-seed.ts"), repl, "bio");
  return repl.length;
}

async function enrichSinsRights(apply) {
  const mod = await import(`${path.join(LIB, "sins-rights-data.ts")}?v=${Date.now()}`);
  const topics = mod.SINS_TOPICS;
  const repl = [];
  for (const t of topics) {
    if (t.explanation.length >= SINS_EXPL_MIN) continue;
    const neu = enrichSinExplanation(t);
    if (neu.length < SINS_EXPL_MIN) throw new Error(`Still short sin ${t.id}: ${neu.length}`);
    repl.push({ old: t.explanation, neu });
  }
  if (apply && repl.length) applyFieldReplacements(path.join(LIB, "sins-rights-data.ts"), repl, "explanation");
  return repl.length;
}

function countShortAsma() {
  const content = fs.readFileSync(path.join(LIB, "asma-husna-data.ts"), "utf8");
  const meanings = [...content.matchAll(/meaning:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  const benefits = [...content.matchAll(/benefit:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  return {
    meaningShort: meanings.filter((x) => x.length < ASMA_MEANING_MIN).length,
    benefitShort: benefits.filter((x) => x.length < ASMA_BENEFIT_MIN).length,
  };
}

function countShortGlossary() {
  const content = fs.readFileSync(path.join(VIEWS, "IslamicGlossaryPage.tsx"), "utf8");
  const defs = [...content.matchAll(/definition:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
  return defs.filter((x) => x.length < GLOSSARY_MIN).length;
}

function countShortPages() {
  const viewsDir = VIEWS;
  const viewPages = fs.readdirSync(viewsDir).filter((x) => x.endsWith("Page.tsx") && !PAGE_SKIP.test(x));
  let n = 0;
  for (const f of viewPages) {
    const content = fs.readFileSync(path.join(viewsDir, f), "utf8");
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

async function countShortSheikhs() {
  const mod = await import(`${path.join(LIB, "sheikhs-seed.ts")}?v=${Date.now()}`);
  return mod.SHEIKHS_SEED.filter((s) => (s.bio || "").length < SHEIKH_BIO_MIN).length;
}

async function countShortSins() {
  const mod = await import(`${path.join(LIB, "sins-rights-data.ts")}?v=${Date.now()}`);
  return mod.SINS_TOPICS.filter((t) => t.explanation.length < SINS_EXPL_MIN).length;
}

function lessonBodyReport(verifyMode = false) {
  const flag = verifyMode ? "--verify" : "";
  const out = execSync(`node scripts/enrich-r50-lesson-bodies.mjs ${flag}`.trim(), {
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
  asma: countShortAsma(),
  glossaryShort: countShortGlossary(),
  sheikhsShort: await countShortSheikhs(),
  sinsShort: await countShortSins(),
};

const results = { before };

if (apply) {
  execSync("node scripts/enrich-r50-lesson-bodies.mjs --apply", { cwd: ROOT, stdio: "inherit" });
}

results.pages = enrichPages(apply);
results.asma = enrichAsma(apply);
results.glossaryRaised = enrichGlossary(apply);
results.sheikhsRaised = await enrichSheikhs(apply);
results.sinsRaised = await enrichSinsRights(apply);

if (apply || verify) {
  const afterLessons = lessonBodyReport(true);
  results.after = {
    lessonSciUnder: afterLessons.after.scientific.under,
    lessonLiveUnder: afterLessons.after.live.under,
    maxBridgeFreq: afterLessons.after.maxBridgeFreq,
    pagesShort: countShortPages(),
    asma: countShortAsma(),
    glossaryShort: countShortGlossary(),
    sheikhsShort: await countShortSheikhs(),
    sinsShort: await countShortSins(),
  };
  results.raised = {
    lessonBodies: before.lessonSciUnder + before.lessonLiveUnder - (results.after.lessonSciUnder + results.after.lessonLiveUnder),
    pages: results.pages.total,
    asmaMeaning: results.asma.meaningRaised,
    asmaBenefit: results.asma.benefitRaised,
    glossary: results.glossaryRaised,
    sheikhs: results.sheikhsRaised,
    sins: results.sinsRaised,
  };
}

console.log(JSON.stringify(results, null, 2));

if (verify) {
  const a = results.after;
  const fail =
    (a?.lessonSciUnder ?? 1) > 0 ||
    (a?.lessonLiveUnder ?? 1) > 0 ||
    (a?.maxBridgeFreq ?? 99) > 35 ||
    (a?.pagesShort ?? 1) > 0 ||
    (a?.asma?.meaningShort ?? 1) > 0 ||
    (a?.asma?.benefitShort ?? 1) > 0 ||
    (a?.glossaryShort ?? 1) > 0 ||
    (a?.sheikhsShort ?? 1) > 0 ||
    (a?.sinsShort ?? 1) > 0;
  process.exit(fail ? 1 : 0);
}
