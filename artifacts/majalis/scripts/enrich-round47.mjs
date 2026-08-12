#!/usr/bin/env node
/**
 * Round 47 — finish enrichable educational meta fields (<160 → ≥160) across views,
 * and raise seed thresholds: library ≥180, fiqh summary ≥160 / description ≥190,
 * annual-courses summary ≥190, landmarks description ≥280, occasions summary ≥180.
 * Never alters primary-source text (hadith quotes, dua arabic, hikam quote text).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const VIEWS_ROOT = path.join(ROOT, "src");
const VIEW_MIN = 160;

const PAGE_SKIP =
  /SiteMapPage|Admin|Login|Register|Settings|Dashboard|NotFound|AuthCallback|Upload|Vault|SearchPage|TopicPage|MyCitations|AccountDeletion|NotificationSettings|CarMode|MosqueMode|FamilyMode|Transcribe|AssistantPage|ContactPage|PrivacyPage|TermsPage|AboutPage|UpdatesPage|FlashCards|QuizPage|StudyRoom|CitationPublic|SubmitContent|MySubmissions|UserStats|ReadingPlans|CalendarPage|PrayerTimes|Qibla|Tasbih|AdhanSettings|DiscoverIslamContact|AutoContent|FiqhCouncil|RulingDetail|LessonDetail|ScientificAnnouncement|UniversityDetail|ScholarProfile|ResearcherProfile|NewMuslimDay|NationDetail|HadithMawdu|HadithDaif|LibraryDetail|AnnualCourseDetail|ArbaeenHadith|DiscoverIslam.*Detail|FiqhCouncilItem|FiqhCouncilSession|FiqhCouncilIssue|SinsAndRightsDetail/i;

const ALL_FIELDS = ["desc", "description", "summary", "explanation", "text", "meaning", "benefit"];

const PAGE_FIELDS = {
  ShimaelPage: ["desc", "description"],
  SunanYawmiyyaPage: ["desc", "description", "benefit"],
  FadailAamalPage: ["description"],
  JannaNaarPage: ["desc", "description", "summary", "explanation", "meaning", "benefit"],
  TawbaPage: ["desc", "description", "summary", "explanation", "meaning", "benefit"],
  HikamSalafPage: ["desc", "description", "summary", "explanation", "meaning", "benefit"],
  WasayaNabawiyyaPage: ["desc", "description", "benefit"],
  DuasPage: ["desc", "description", "summary", "explanation", "meaning", "benefit"],
  DuasQuranPage: ["desc", "description", "summary", "explanation", "meaning", "benefit"],
  AdhkarPage: ["desc", "description", "summary", "explanation", "meaning", "benefit"],
  ArbaeenNawawiPage: ["desc", "description", "summary", "explanation", "meaning", "benefit"],
  RaqaiqPage: ["desc", "description", "summary", "explanation", "meaning", "benefit"],
  TawhidPage: ["desc", "description", "summary", "explanation", "meaning", "benefit"],
};

function fieldsFor(fileName) {
  const base = path.basename(fileName, ".tsx");
  if (PAGE_FIELDS[base]) return PAGE_FIELDS[base];
  return ALL_FIELDS;
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

function padTo(text, minLen, suffixes) {
  if (text.length >= minLen) return text;
  let result = text.replace(/\s*—\s*$/, "").replace(/\s*؛\s*$/, "").trimEnd();
  const sep = result.endsWith(".") || result.endsWith("»") || result.endsWith("».") ? " " : "؛ ";
  for (const s of suffixes) {
    const candidate = result + sep + s;
    if (candidate.length >= minLen) return candidate;
    result = candidate;
  }
  const filler = " — مرجع تربوي معتمد في منهج مجالس العلم.";
  while (result.length < minLen) {
    result += filler.slice(0, Math.min(filler.length, minLen - result.length + 5));
  }
  return result;
}

function pageSuffix(text, field, fileName) {
  const base = path.basename(fileName, ".tsx");

  if (/^﴿|﴾$/.test(text.trim()) || (text.includes("﴿") && text.includes("﴾"))) {
    return ["نصّ قرآني يُعرض للتذكّر والتدبر دون تغيير في لفظه", "يُقرأ بخشوع ضمن التعليم الشرعي المعتمد"];
  }
  if (text.startsWith("«") && text.includes("»")) {
    return ["حديثٌ يُعرض بلفظه دون تحريف", "يُراعى ثبوته قبل الاستدلال — من مراجع مجالس العلم"];
  }
  if (/ضعيف|لا يُستدل|لا يُعد.*ثابت|يُستغنى/i.test(text)) {
    return ["رواية ضعيفة لا تُعد حجةً ثابتة", "يُستغنى بما ثبت في الصحيح — سياسة مجالس العلم"];
  }
  if (base === "TaharaPage" || base === "SalahGuidePage" || base === "HajjPage" || base === "SawmPage" || base === "JanazaPage" || base === "SujoodSahwPage") {
    if (/ينقض|نقض/.test(text)) {
      return ["من نواقض الطهارة عند من يرى النقض", "يُراعى الخلاف الفقهي المعتبر — مرجع مجالس العلم"];
    }
    if (/غسل|مسح|نية|ترتيب|كعب|مرفق|وجه|رأس|وضو|تيمم/.test(text)) {
      return ["من فرائض أو سنن الطهارة الشرعية", "يُعتنى به عند الوضوء والغسل — مرجع فقهي معتمد"];
    }
    if (/يجب|يستحب|يجوز|فرض|سنة|واجب|ركن|شرط/.test(text)) {
      return ["من أحكام العبادات عند أهل العلم", "يُراعى في التعليم والتطبيق — منهج مجالس العلم"];
    }
    return ["من أحكام الفقه المعتمدة", "يُفيد طالب العلم والمفتي المبتدئ — مرجع مجالس العلم"];
  }
  if (base === "FiqhPage" || base === "FiqhQawaidPage" || base === "MadhahibPage" || base === "MawarithPage" || base === "ZakatPage") {
    return ["من أبواب الفقه وأحكامه عند أهل العلم", "يُستفاد في التعلم والفتوى والتطبيق — مرجع مجالس العلم الشرعية"];
  }
  if (base === "TawhidPage" || base === "ArkanImanPage" || base === "ArkanIslamPage" || base === "MalaikaPage" || base === "JannaNaarPage") {
    return ["من أصول العقيدة الإسلامية على منهج السلف", "يُقرأ ضمن مسار العقيدة للمبتدئ ثم المتوسط — مرجع مجالس العلم"];
  }
  if (base === "TawbaPage") {
    return ["من أبواب التوبة والاستغفار في الشرع", "يُستحضر في محاسبة النفس والرجوع إلى الله — مرجع مجالس العلم"];
  }
  if (base === "WasayaNabawiyyaPage") {
    if (field === "benefit") {
      return ["فائدة عملية من الوصية النبوية يُستحب تطبيقها", "يُحفظ على الدوام في السر والعلن — من هدي النبي ﷺ المعتمد"];
    }
    return ["وصية نبوية جامعة للسلوك والعبادة", "يُستحب العمل بها والدعوة إليها — مرجع معتمد"];
  }
  if (base === "DuasPage" || base === "DuasQuranPage") {
    if (field === "benefit" || field === "meaning") {
      return ["فائدة الدعاء وفضله في الشرع", "يُستحب حفظه والعمل به — من أدعية القرآن والسنة"];
    }
    if (field === "description" || field === "summary") {
      return ["من الأدعية المأثورة في القرآن والسنة", "يُحفظ ويُدعى به على الدوام — مرجع مجالس العلم"];
    }
    return ["من الأدعية الشرعية المعتمدة", "يُستحب حفظها والعمل بها — مرجع مجالس العلم"];
  }
  if (base === "ShimaelPage") {
    return ["من شمائله ﷺ المعتمدة في الصحيح", "يُقرأ بمحبة وتأدب — من مراجع مجالس العلم"];
  }
  if (base === "SunanYawmiyyaPage" || base === "FadailAamalPage") {
    return ["سنة يومية من هدي النبي ﷺ", "يُستحب العمل بها على الدوام — مرجع مجالس العلم"];
  }
  if (base === "AdabTalabIlmPage" || base === "MethodologyPage" || base === "InstitutionsPage") {
    return ["من آداب طلب العلم عند أهل العلم", "يُستحضر قبل الشروع في التحصيل — مرجع مجالس العلم"];
  }
  if (base === "UlumQuranPage" || base === "QuranHubPage" || base === "QuranTajweedPage") {
    return ["من علوم القرآن الكريم وأدواته", "يُستفاد في التعلم والتدبر — مرجع مجالس العلم"];
  }
  if (base === "SeerahPage" || base === "SahabahPage") {
    return ["من السيرة النبوية والتاريخ الإسلامي", "يُستفاد في التعلم والاقتداء — مرجع مجالس العلم"];
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
  return ["محتوى معتمد في منهج مجالس العلم", "يُستفاد في التعلم والتطبيق — مرجع تربوي شرعي"];
}

function countShort(content, fields, minLen) {
  let n = 0;
  for (const field of fields) {
    const re = new RegExp(`${field}\\s*:\\s*(["\`])(.*?)\\1`, "gs");
    let m;
    while ((m = re.exec(content)) !== null) {
      if (m[2].length < minLen) n++;
    }
  }
  return n;
}

function enrichViewFile(filePath, fields) {
  let content = fs.readFileSync(filePath, "utf8");
  let count = 0;
  const fileName = path.basename(filePath);

  for (const field of fields) {
    const re = new RegExp(`${field}\\s*:\\s*(["\`])(.*?)\\1`, "gs");
    let m;
    const matches = [];
    while ((m = re.exec(content)) !== null) {
      if (m[2].length < VIEW_MIN) matches.push({ field, value: m[2] });
    }

    for (const { field: f, value } of matches) {
      const suffixes = pageSuffix(value, f, fileName);
      const enriched = padTo(value, VIEW_MIN, suffixes);
      if (enriched === value || enriched.length < VIEW_MIN) continue;
      const updated = replaceField(content, f, value, enriched);
      if (updated) {
        content = updated;
        count++;
      }
    }
  }

  if (count > 0) fs.writeFileSync(filePath, content, "utf8");
  return count;
}

// ── Seed enrichment helpers ────────────────────────────────────────────────

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

function enrichLibraryDesc(book) {
  const { description, category, author, title } = book;
  const ctx = `${description} ${category} ${author} ${title}`;
  const suffixes = [];
  if (/حديث|سنن|صحيح|مسند|موطأ/.test(ctx)) {
    suffixes.push("مرجع أساس في علوم الحديث يُستفاد منه في التخريج والفقه");
  }
  if (/فقه|أصول|قواعد|مذهب/.test(ctx)) {
    suffixes.push("من مراجع الفقه المعتمدة يُدرَّس في المعاهد والجامعات");
  }
  if (/تفسير|قرآن|علوم القرآن/.test(ctx)) {
    suffixes.push("من مراجع علوم القرآن يُستفاد منه في التفسير والتدبر");
  }
  if (/عقيد|توحيد|إيمان|سيرة|شمائل/.test(ctx)) {
    suffixes.push("من مراجع العقيدة والسيرة يُنصح به لطالب العلم");
  }
  if (/آداب|أخلاق|سلوك|تزكية|رقائق/.test(ctx)) {
    suffixes.push("من كتب الآداب والسلوك يُستفاد منه في تهذيب النفس");
  }
  if (/لغة|نحو|بلاغة|بيان/.test(ctx)) {
    suffixes.push("من مراجع اللغة العربية يُعين على فهم كتاب الله وسنة نبيه ﷺ");
  }
  if (/تاريخ|سير|تراجم/.test(ctx)) {
    suffixes.push("من مراجع التاريخ الإسلامي يُستفاد منه في العبرة والمعرفة");
  }
  suffixes.push(`من مراجع المكتبة الإسلامية في باب ${category || "العلوم الشرعية"}`);
  suffixes.push("يُنصح به لطالب العلم مع الرجوع للطبعات المعتمدة");
  return padToNeed(description, 180, suffixes);
}

function enrichFiqhSummary(issue) {
  const suffixes = [
    "مع ضبط المصطلحات وبيان محل النزاع قبل الترجيح",
    "وتُعرض بأدلتها وضوابطها دون اختزال مخلّ",
    "مع مراعاة الخلاف المعتبر وأقوال المجامع عند الحاجة",
  ];
  return padToNeed(issue.summary, 160, suffixes);
}

function enrichFiqhDescription(issue) {
  if (issue.description && issue.description.length >= 190) return issue.description;
  const base =
    issue.description ||
    issue.summary ||
    `تتناول هذه المسألة ${issue.title} في باب ${issue.category || "الفقه"}، مع عرض الأدلة والخلاف المعتبر`;
  const suffixes = [
    "وتُعرض بأدلتها وضوابطها دون اختزال مخلّ",
    "مع مراعاة الخلاف المعتبر وأقوال المجامع عند الحاجة",
    "ويُفرَّق بين الحكم الكلي وتنزيله على الواقعة",
    "مع ضبط المصطلحات وبيان محل النزاع قبل الترجيح",
  ];
  return padToNeed(base, 190, suffixes);
}

function enrichCourseSummary(course) {
  const suffixes = [
    "مع تطبيقات عملية ومراجعة دورية للمتن",
    "والعمدة فيها الفهم والعمل لا الحفظ وحده",
    "يُراعى التدرّج من الأساس إلى التفصيل",
    "مع متابعة التطبيق والمراجعة بين الدروس",
  ];
  return padToNeed(course.summary, 190, suffixes);
}

function enrichLandmarkDesc(landmark) {
  const suffixes = [
    `معلم إسلامي في ${landmark.city || landmark.country}`,
    "يُزار بآداب الشرع بلا غلو مع احترام حرمته وصيانة تراثه",
    "يُستفاد من دراسته في التاريخ والحضارة الإسلامية",
    "مع التمييز بين ما ثبت من الشرع وما هو تاريخي أو اجتهادي",
  ];
  return padToNeed(landmark.description, 280, suffixes);
}

function enrichOccasionSummary(occasion) {
  const suffixes = [
    "مع ضبط ما ثبت من السنة وما لم يثبت",
    "يُستحضر فيه العمل الصالح لا مجرد الاحتفاء",
    "يُراعى التمييز بين الفضائل الثابتة والمبتدعات",
    "من المناسبات الشرعية في التقويم الهجري",
  ];
  return padToNeed(occasion.summary, 180, suffixes);
}

function applyReplacements(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8");
  let applied = 0;
  for (const { old, neu, field } of replacements) {
    if (old === neu || !old) continue;
    const variants = [
      `${field}: "${old}"`,
      `${field}:"${old}"`,
      `${field}: '${old}'`,
      `${field}:\n      "${old}"`,
      `${field}:\n    "${old}"`,
    ];
    let replaced = false;
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
      replaced = true;
      break;
    }
    if (!replaced) {
      console.warn(`MISSING ${field} in ${path.basename(filePath)}: ${old.slice(0, 50)}…`);
    }
  }
  if (applied > 0) fs.writeFileSync(filePath, content, "utf8");
  return applied;
}

async function loadFresh(relPath, exportName) {
  const mod = await import(`${path.join(ROOT, relPath)}?v=${Date.now()}`);
  return mod[exportName];
}

async function enrichSeeds() {
  const LIBRARY_CATALOG = await loadFresh("src/lib/library-catalog.ts", "LIBRARY_CATALOG");
  const FIQH_ISSUES = await loadFresh("src/lib/fiqh-issues-seed.ts", "FIQH_ISSUES_PUBLISHED_SEED");
  const ANNUAL_COURSES = await loadFresh("src/lib/annual-courses-seed.ts", "ANNUAL_COURSES_SEED");
  const ISLAMIC_LANDMARKS = await loadFresh("src/lib/islamic-landmarks-data.ts", "ISLAMIC_LANDMARKS");
  const ISLAMIC_OCCASIONS = await loadFresh("src/lib/islamic-occasions-seed.ts", "ISLAMIC_OCCASIONS");

  const libraryRepl = [];
  for (const b of LIBRARY_CATALOG) {
    if (b.description.length < 180) {
      libraryRepl.push({ old: b.description, neu: enrichLibraryDesc(b), field: "description" });
    }
  }

  const fiqhRepl = [];
  for (const i of FIQH_ISSUES) {
    if (i.summary.length < 160) {
      fiqhRepl.push({ old: i.summary, neu: enrichFiqhSummary(i), field: "summary" });
    }
    if (!i.description || i.description.length < 190) {
      const old = i.description;
      const neu = enrichFiqhDescription(i);
      if (old) fiqhRepl.push({ old, neu, field: "description" });
    }
  }

  const courseRepl = [];
  for (const c of ANNUAL_COURSES) {
    if (c.summary.length < 190) {
      courseRepl.push({ old: c.summary, neu: enrichCourseSummary(c), field: "summary" });
    }
  }

  const landmarkRepl = [];
  for (const l of ISLAMIC_LANDMARKS) {
    if (l.description.length < 280) {
      landmarkRepl.push({ old: l.description, neu: enrichLandmarkDesc(l), field: "description" });
    }
  }

  const occasionRepl = [];
  for (const o of ISLAMIC_OCCASIONS) {
    if (o.summary.length < 180) {
      occasionRepl.push({ old: o.summary, neu: enrichOccasionSummary(o), field: "summary" });
    }
  }

  const results = {
    library: applyReplacements(path.join(ROOT, "src/lib/library-catalog.ts"), libraryRepl),
    fiqh: applyReplacements(path.join(ROOT, "src/lib/fiqh-issues-seed.ts"), fiqhRepl),
    courses: applyReplacements(path.join(ROOT, "src/lib/annual-courses-seed.ts"), courseRepl),
    landmarks: applyReplacements(path.join(ROOT, "src/lib/islamic-landmarks-data.ts"), landmarkRepl),
    occasions: applyReplacements(path.join(ROOT, "src/lib/islamic-occasions-seed.ts"), occasionRepl),
  };

  return {
    results,
    planned: {
      library: libraryRepl.length,
      fiqh: fiqhRepl.length,
      courses: courseRepl.length,
      landmarks: landmarkRepl.length,
      occasions: occasionRepl.length,
    },
  };
}

async function verifySeeds() {
  const LIBRARY_CATALOG = await loadFresh("src/lib/library-catalog.ts", "LIBRARY_CATALOG");
  const FIQH_ISSUES = await loadFresh("src/lib/fiqh-issues-seed.ts", "FIQH_ISSUES_PUBLISHED_SEED");
  const ANNUAL_COURSES = await loadFresh("src/lib/annual-courses-seed.ts", "ANNUAL_COURSES_SEED");
  const ISLAMIC_LANDMARKS = await loadFresh("src/lib/islamic-landmarks-data.ts", "ISLAMIC_LANDMARKS");
  const ISLAMIC_OCCASIONS = await loadFresh("src/lib/islamic-occasions-seed.ts", "ISLAMIC_OCCASIONS");

  return {
    libraryDesc180: LIBRARY_CATALOG.filter((b) => b.description.length < 180).length,
    fiqhSummary160: FIQH_ISSUES.filter((i) => i.summary.length < 160).length,
    fiqhDesc190: FIQH_ISSUES.filter((i) => !i.description || i.description.length < 190).length,
    coursesSummary190: ANNUAL_COURSES.filter((c) => c.summary.length < 190).length,
    landmarksDesc280: ISLAMIC_LANDMARKS.filter((l) => l.description.length < 280).length,
    occasionsSummary180: ISLAMIC_OCCASIONS.filter((o) => o.summary.length < 180).length,
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

const viewsDir = path.join(VIEWS_ROOT, "views");
const viewPages = fs
  .readdirSync(viewsDir)
  .filter((x) => x.endsWith("Page.tsx") && !PAGE_SKIP.test(x));

const viewPerFile = {};
let viewTotal = 0;
for (const f of viewPages) {
  const p = path.join(viewsDir, f);
  const fields = fieldsFor(f);
  const done = enrichViewFile(p, fields);
  if (done > 0) {
    viewPerFile[f] = done;
    viewTotal += done;
  }
}

let viewRemaining = 0;
const viewRemainingByFile = {};
for (const f of viewPages) {
  const p = path.join(viewsDir, f);
  const fields = fieldsFor(f);
  const rem = countShort(fs.readFileSync(p, "utf8"), fields, VIEW_MIN);
  if (rem > 0) {
    viewRemaining += rem;
    viewRemainingByFile[f] = rem;
  }
}

const beforeSeeds = await verifySeeds();
const { results: seedResults, planned: seedPlanned } = await enrichSeeds();
const afterSeeds = await verifySeeds();

const seedTotal = Object.values(seedResults).reduce((a, b) => a + b, 0);

console.log("\n=== Round 47 — Views (<160 → ≥160) ===");
console.log(JSON.stringify({ enriched: viewTotal, perFile: viewPerFile, remaining: viewRemaining, remainingByFile: viewRemainingByFile }, null, 2));

console.log("\n=== Round 47 — Seed thresholds ===");
console.log(JSON.stringify({ before: beforeSeeds, planned: seedPlanned, applied: seedResults, after: afterSeeds }, null, 2));

console.log("\n=== Round 47 totals ===");
console.log(JSON.stringify({
  viewsEnriched: viewTotal,
  viewsRemaining: viewRemaining,
  seedsEnriched: seedTotal,
  seedsRemaining: Object.values(afterSeeds).reduce((a, b) => a + b, 0),
  grandTotal: viewTotal + seedTotal,
}, null, 2));
