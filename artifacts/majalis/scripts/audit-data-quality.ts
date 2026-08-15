#!/usr/bin/env node
/**
 * تدقيق جودة البيانات — DATA QUALITY فقط (لا واجهة).
 * يقرأ مصادر البيانات الحالية ويخرج تقارير JSON/MD.
 * لا يعدّل الملفات؛ الإصلاح اليدوي فقط عند auto_fix_allowed وبعد دليل.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

type Severity = "critical" | "high" | "medium" | "low";
type Issue = {
  entity_type: string;
  entity_id: string;
  slug: string;
  title: string;
  field: string;
  current_value: string;
  issue_type: string;
  evidence: string;
  severity: Severity;
  recommendation: string;
  auto_fix_allowed: boolean;
};

const issues: Issue[] = [];
const counts: Record<string, number> = {};

function add(i: Issue) {
  issues.push(i);
}

function clip(v: unknown, n = 120): string {
  if (v === undefined) return "(undefined)";
  if (v === null) return "(null)";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

const GENERIC_TITLES = new Set(["كتاب شرعي", "صفحة شرعية", "عالم شرعي", "قصة سورة", "موضوع شرعي", "حكم شرعي"]);
const FAKE_SOURCES = ["رابط القراءة", "المصدر: رابط القراءة", "مصدر غير محدد", "المصدر غير متوفر", "لم يُسجل مصدر", "لم يُضبط بعد"];
const BOILERPLATE = [
  "تُربط سيرته",
  "يُستحضر المآل",
  "الصبر على مقتضاه",
  "فالعبرة بما ثبت في الوحي",
  "العبرة بما ثبت في الوحي",
  "مع اجتناب الغلو والإسرائيليات",
  "ويُسأل الله التوفيق للعمل",
];
const ABSOLUTE_PRAISE = ["فيلسوف الإسلام الأكبر", "فقيه المذهب غير المنازع", "أعظم شروح صحيح البخاري وأكملها"];
const OLD_EMAIL_A = ["info", "@", "majlisilm", ".", "com"].join("");
const OLD_EMAIL_B = ["yalabdullmohsen1", "@", "gmail", ".", "com"].join("");

function scanTextFields(
  entity_type: string,
  entity_id: string,
  slug: string,
  title: string,
  fields: Record<string, unknown>,
  evidenceFile: string,
) {
  for (const [field, raw] of Object.entries(fields)) {
    if (raw === undefined || raw === null) continue;
    const text = Array.isArray(raw) ? raw.join(" | ") : String(raw);
    if (!text.trim()) continue;
    if (text === "undefined" || text === "null" || text === "NaN") {
      add({
        entity_type,
        entity_id,
        slug,
        title,
        field,
        current_value: text,
        issue_type: "literal_nullish_string",
        evidence: evidenceFile,
        severity: "high",
        recommendation: "أزل القيمة النصية undefined/null/NaN من السجل",
        auto_fix_allowed: true,
      });
    }
    if (text.includes(OLD_EMAIL_A) || text.includes(OLD_EMAIL_B)) {
      add({
        entity_type,
        entity_id,
        slug,
        title,
        field,
        current_value: clip(text),
        issue_type: "old_email_in_data",
        evidence: evidenceFile,
        severity: "critical",
        recommendation: "استبدل بـ Majlisilm.app@gmail.com",
        auto_fix_allowed: true,
      });
    }
    for (const ph of BOILERPLATE) {
      if (text.includes(ph)) {
        add({
          entity_type,
          entity_id,
          slug,
          title,
          field,
          current_value: ph,
          issue_type: "prophet_boilerplate",
          evidence: evidenceFile,
          severity: "high",
          recommendation: "احذف الجملة القالبية واكتب ملخصاً خاصاً بالمصدر",
          auto_fix_allowed: true,
        });
      }
    }
    for (const ph of ABSOLUTE_PRAISE) {
      if (text.includes(ph)) {
        add({
          entity_type,
          entity_id,
          slug,
          title,
          field,
          current_value: ph,
          issue_type: "absolute_praise",
          evidence: evidenceFile,
          severity: "medium",
          recommendation: "حيّد العبارة بصياغة تراجم سياقية",
          auto_fix_allowed: true,
        });
      }
    }
    for (const fake of FAKE_SOURCES) {
      if (text.trim() === fake || text.includes(fake)) {
        add({
          entity_type,
          entity_id,
          slug,
          title,
          field,
          current_value: clip(text),
          issue_type: "fake_source_value",
          evidence: evidenceFile,
          severity: "high",
          recommendation: "حوّل إلى source_pending / needs_source ولا تعرض كمصدر موثوق",
          auto_fix_allowed: true,
        });
      }
    }
  }
}

// ── تحميل المصادر ─────────────────────────────────────────────────────────
const { PROPHETS } = await import(pathToFileURL(path.join(root, "src/lib/prophets-data.ts")).href);
const { LIBRARY_CATALOG, LIBRARY_CATEGORIES, resolveLibraryContentStatus } = await import(
  pathToFileURL(path.join(root, "src/lib/library-catalog.ts")).href,
);
const { SCHOLARS } = await import(pathToFileURL(path.join(root, "src/lib/scholars-data.ts")).href);
const { SINS_TOPICS } = await import(pathToFileURL(path.join(root, "src/lib/sins-rights-data.ts")).href);
const { getAllSurahStories } = await import(pathToFileURL(path.join(root, "src/lib/surah-stories.ts")).href);
const SURAH_STORIES = getAllSurahStories() as Array<{
  number: number;
  name: string;
  namingReason: string;
  sources: string[];
  trustNote: string;
  mainStories: string[];
}>;

counts.prophets = (PROPHETS as unknown[]).length;
counts.books = (LIBRARY_CATALOG as unknown[]).length;
counts.scholars = (SCHOLARS as unknown[]).length;
counts.sins = (SINS_TOPICS as unknown[]).length;
counts.surah_stories = SURAH_STORIES.length;

// optional modules
async function tryImport(rel: string) {
  try {
    return await import(pathToFileURL(path.join(root, rel)).href);
  } catch {
    return null;
  }
}

const rulingsMod = await tryImport("src/lib/rulings-encyclopedia-seed.generated.ts");
const fiqhMod = await tryImport("src/lib/fiqh-issues-seed.ts");
const adhkarMod = await tryImport("src/lib/adhkar-seed.ts");
const lessonsMod = await tryImport("src/lib/lesson-ads.ts");

// ── الأنبياء ──────────────────────────────────────────────────────────────
type Prophet = {
  id: number;
  slug: string;
  arabicName: string;
  title: string;
  peopleOrPlace: string;
  era: string;
  mainSurahs: string[];
  surahCount: number;
  briefBio: string;
  keyAttributes: string[];
  lessons: string[];
};

const prophetSlugs = new Set<string>();
const bioMap = new Map<string, string[]>();
for (const p of PROPHETS as Prophet[]) {
  const id = String(p.id);
  if (prophetSlugs.has(p.slug)) {
    add({
      entity_type: "prophet",
      entity_id: id,
      slug: p.slug,
      title: p.arabicName,
      field: "slug",
      current_value: p.slug,
      issue_type: "duplicate_slug",
      evidence: "src/lib/prophets-data.ts",
      severity: "critical",
      recommendation: "وحّد الـslug أو أزل المكرر",
      auto_fix_allowed: false,
    });
  }
  prophetSlugs.add(p.slug);

  const required: Array<[string, unknown]> = [
    ["slug", p.slug],
    ["arabicName", p.arabicName],
    ["title", p.title],
    ["peopleOrPlace", p.peopleOrPlace],
    ["era", p.era],
    ["mainSurahs", p.mainSurahs],
    ["surahCount", p.surahCount],
    ["briefBio", p.briefBio],
    ["keyAttributes", p.keyAttributes],
    ["lessons", p.lessons],
  ];
  for (const [field, val] of required) {
    const empty =
      val === undefined ||
      val === null ||
      (typeof val === "string" && !val.trim()) ||
      (Array.isArray(val) && val.length === 0);
    if (empty) {
      add({
        entity_type: "prophet",
        entity_id: id,
        slug: p.slug,
        title: p.arabicName,
        field,
        current_value: clip(val),
        issue_type: "missing_required_field",
        evidence: "src/lib/prophets-data.ts",
        severity: "high",
        recommendation: "أكمل الحقل من مصدر قرآني/سني موثوق",
        auto_fix_allowed: false,
      });
    }
  }

  if (typeof p.surahCount !== "number" || !Number.isFinite(p.surahCount) || p.surahCount < 0) {
    add({
      entity_type: "prophet",
      entity_id: id,
      slug: p.slug,
      title: p.arabicName,
      field: "surahCount",
      current_value: clip(p.surahCount),
      issue_type: "invalid_quran_mention_count",
      evidence: "src/lib/prophets-data.ts",
      severity: "high",
      recommendation: "اجعل العدد رقماً صحيحاً مطابقاً للمراجع",
      auto_fix_allowed: false,
    });
  }
  if (!p.mainSurahs?.length) {
    add({
      entity_type: "prophet",
      entity_id: id,
      slug: p.slug,
      title: p.arabicName,
      field: "mainSurahs",
      current_value: "[]",
      issue_type: "empty_quran_references",
      evidence: "src/lib/prophets-data.ts",
      severity: "high",
      recommendation: "أضف سوراً مذكورة في القرآن لهذا النبي",
      auto_fix_allowed: false,
    });
  }

  // مخطط مثالي غير موجود في النموذج الحالي — توثيق فقط
  for (const missing of ["status", "reviewStatus", "sources", "quranReferences"]) {
    add({
      entity_type: "prophet",
      entity_id: id,
      slug: p.slug,
      title: p.arabicName,
      field: missing,
      current_value: "(field absent in current schema)",
      issue_type: "schema_gap",
      evidence: "ProphetRecord في prophets-data.ts لا يتضمن الحقل",
      severity: "low",
      recommendation: "توسيع المخطط يتطلب مراجعة شرعية؛ لا اختراع قيم",
      auto_fix_allowed: false,
    });
  }

  if (p.slug === "dhul-kifl" && /خلاف/.test(p.briefBio + (p.keyAttributes || []).join(""))) {
    // حسن: البيانات تعترف بالخلاف — لا خطأ
  }

  const bioKey = p.briefBio.replace(/\s+/g, " ").trim();
  bioMap.set(bioKey, [...(bioMap.get(bioKey) || []), p.slug]);

  scanTextFields(
    "prophet",
    id,
    p.slug,
    p.arabicName,
    {
      title: p.title,
      briefBio: p.briefBio,
      peopleOrPlace: p.peopleOrPlace,
      era: p.era,
      keyAttributes: p.keyAttributes,
      lessons: p.lessons,
    },
    "src/lib/prophets-data.ts",
  );
}
for (const [bio, slugs] of bioMap) {
  if (slugs.length > 1) {
    add({
      entity_type: "prophet",
      entity_id: slugs.join(","),
      slug: slugs[0]!,
      title: slugs.join(" / "),
      field: "briefBio",
      current_value: clip(bio),
      issue_type: "duplicate_boilerplate_bio",
      evidence: "src/lib/prophets-data.ts",
      severity: "high",
      recommendation: "اكتب ملخصاً فريداً لكل نبي",
      auto_fix_allowed: false,
    });
  }
}

// ── المكتبة ───────────────────────────────────────────────────────────────
type Book = {
  id: string;
  title: string;
  author: string;
  type: string;
  category: string;
  description: string;
  external_url?: string;
  source_title?: string;
  contentStatus?: string;
  caution?: string;
  keywords: string[];
};

const bookIds = new Set<string>();
const allowedCats = new Set((LIBRARY_CATEGORIES as string[]).filter((c) => c !== "الكل"));
for (const b of LIBRARY_CATALOG as Book[]) {
  if (bookIds.has(b.id)) {
    add({
      entity_type: "book",
      entity_id: b.id,
      slug: b.id,
      title: b.title,
      field: "id",
      current_value: b.id,
      issue_type: "duplicate_slug",
      evidence: "src/lib/library-catalog.ts",
      severity: "critical",
      recommendation: "أزل أو دمج السجل المكرر",
      auto_fix_allowed: false,
    });
  }
  bookIds.add(b.id);

  if (GENERIC_TITLES.has(b.title?.trim())) {
    add({
      entity_type: "book",
      entity_id: b.id,
      slug: b.id,
      title: b.title,
      field: "title",
      current_value: b.title,
      issue_type: "generic_title",
      evidence: "src/lib/library-catalog.ts",
      severity: "critical",
      recommendation: "استبدل باسم الكتاب الحقيقي",
      auto_fix_allowed: true,
    });
  }
  if (!b.author?.trim()) {
    add({
      entity_type: "book",
      entity_id: b.id,
      slug: b.id,
      title: b.title,
      field: "author",
      current_value: "",
      issue_type: "missing_required_field",
      evidence: "src/lib/library-catalog.ts",
      severity: "high",
      recommendation: "أضف اسم المؤلف من مصدر موثوق",
      auto_fix_allowed: false,
    });
  }
  if (b.category && !allowedCats.has(b.category)) {
    add({
      entity_type: "book",
      entity_id: b.id,
      slug: b.id,
      title: b.title,
      field: "category",
      current_value: b.category,
      issue_type: "invalid_category",
      evidence: "src/lib/library-catalog.ts vs LIBRARY_CATEGORIES",
      severity: "medium",
      recommendation: "أعد التصنيف لأقرب فئة قائمة",
      auto_fix_allowed: true,
    });
  }

  const status = resolveLibraryContentStatus(b);
  if (!b.external_url?.trim()) {
    add({
      entity_type: "book",
      entity_id: b.id,
      slug: b.id,
      title: b.title,
      field: "external_url",
      current_value: "(empty)",
      issue_type: "source_pending",
      evidence: `resolveLibraryContentStatus → ${status}`,
      severity: "medium",
      recommendation: "أضف رابط مصدر موثوق أو أبقِ noindex",
      auto_fix_allowed: false,
    });
  }

  if (/shamaild/.test(b.id)) {
    add({
      entity_type: "book",
      entity_id: b.id,
      slug: b.id,
      title: b.title,
      field: "id",
      current_value: b.id,
      issue_type: "slug_typo",
      evidence: "العنوان «الشمائل» بينما الـid يحوي shamaild (حرف d زائد)",
      severity: "high",
      recommendation: "أعد التسمية إلى book-shamaail-tirmidhi مع redirect 301 من القديم",
      auto_fix_allowed: true,
    });
  }

  scanTextFields(
    "book",
    b.id,
    b.id,
    b.title,
    {
      title: b.title,
      author: b.author,
      description: b.description,
      source_title: b.source_title,
      category: b.category,
    },
    "src/lib/library-catalog.ts",
  );
}

// ── العلماء ───────────────────────────────────────────────────────────────
type Scholar = {
  id: string;
  name: string;
  fullName: string;
  era: string;
  specialty: string[];
  bio: string;
  key_works: string[];
  died: string;
  region: string;
  madhhab?: string;
  sources?: string[];
  verificationStatus: string;
  contentStatus?: string;
  caution?: string;
};

const scholarIds = new Set<string>();
for (const s of SCHOLARS as Scholar[]) {
  if (scholarIds.has(s.id)) {
    add({
      entity_type: "scholar",
      entity_id: s.id,
      slug: s.id,
      title: s.name,
      field: "id",
      current_value: s.id,
      issue_type: "duplicate_slug",
      evidence: "src/lib/scholars-data.ts",
      severity: "critical",
      recommendation: "وحّد السجلات المكررة",
      auto_fix_allowed: false,
    });
  }
  scholarIds.add(s.id);

  if (!s.name?.trim() || !s.fullName?.trim()) {
    add({
      entity_type: "scholar",
      entity_id: s.id,
      slug: s.id,
      title: s.name || s.id,
      field: !s.name?.trim() ? "name" : "fullName",
      current_value: "",
      issue_type: "missing_required_field",
      evidence: "src/lib/scholars-data.ts",
      severity: "critical",
      recommendation: "أكمل الاسم من كتب التراجم",
      auto_fix_allowed: false,
    });
  }
  if (GENERIC_TITLES.has(s.name?.trim())) {
    add({
      entity_type: "scholar",
      entity_id: s.id,
      slug: s.id,
      title: s.name,
      field: "name",
      current_value: s.name,
      issue_type: "generic_title",
      evidence: "src/lib/scholars-data.ts",
      severity: "critical",
      recommendation: "استخدم الاسم الحقيقي",
      auto_fix_allowed: true,
    });
  }

  scanTextFields(
    "scholar",
    s.id,
    s.id,
    s.name,
    {
      name: s.name,
      fullName: s.fullName,
      bio: s.bio,
      era: s.era,
      specialty: s.specialty,
      key_works: s.key_works,
      sources: s.sources,
    },
    "src/lib/scholars-data.ts",
  );
}

// ── الذنوب والحقوق ────────────────────────────────────────────────────────
type Sin = { id: string; slug: string; title: string; reviewStatus: string; shortDescription: string; explanation: string };
for (const t of SINS_TOPICS as Sin[]) {
  if (!t.reviewStatus) {
    add({
      entity_type: "sin_topic",
      entity_id: t.id,
      slug: t.slug,
      title: t.title,
      field: "reviewStatus",
      current_value: "(missing)",
      issue_type: "missing_required_field",
      evidence: "src/lib/sins-rights-data.ts",
      severity: "high",
      recommendation: "اضبط reviewStatus",
      auto_fix_allowed: false,
    });
  }
  if (t.reviewStatus === "pending") {
    add({
      entity_type: "sin_topic",
      entity_id: t.id,
      slug: t.slug,
      title: t.title,
      field: "reviewStatus",
      current_value: "pending",
      issue_type: "pending_must_noindex",
      evidence: "يجب أن يولّد generate-seo noindex + خارج sitemap",
      severity: "medium",
      recommendation: "تأكد أن المولّد يضع noindex (تحقق SEO منفصل)",
      auto_fix_allowed: false,
    });
  }
  scanTextFields(
    "sin_topic",
    t.id,
    t.slug,
    t.title,
    { title: t.title, shortDescription: t.shortDescription, explanation: t.explanation },
    "src/lib/sins-rights-data.ts",
  );
}

// ── قصص السور ─────────────────────────────────────────────────────────────
type Story = { number: number; name: string; namingReason: string; sources: string[]; trustNote: string; mainStories?: string[] };
for (const st of SURAH_STORIES) {
  const slug = String(st.number);
  if (GENERIC_TITLES.has(st.name?.trim()) || st.name?.trim() === "قصة سورة") {
    add({
      entity_type: "surah_story",
      entity_id: slug,
      slug,
      title: st.name,
      field: "name",
      current_value: st.name,
      issue_type: "generic_title",
      evidence: "src/lib/surah-stories.ts",
      severity: "critical",
      recommendation: "استخدم اسم السورة الحقيقي",
      auto_fix_allowed: true,
    });
  }
  scanTextFields(
    "surah_story",
    slug,
    slug,
    st.name,
    { name: st.name, namingReason: st.namingReason, trustNote: st.trustNote, sources: st.sources },
    "src/lib/surah-stories.ts",
  );
}

// ── مسائل فقهية / فتاوى إن وُجدت ─────────────────────────────────────────
if (fiqhMod?.FIQH_ISSUES_PUBLISHED_SEED) {
  const list = fiqhMod.FIQH_ISSUES_PUBLISHED_SEED as Array<{
    slug: string;
    title: string;
    summary?: string;
  }>;
  counts.fiqh_issues = list.length;
  for (const issue of list) {
    scanTextFields(
      "fiqh_issue",
      issue.slug,
      issue.slug,
      issue.title,
      { title: issue.title, summary: issue.summary },
      "src/lib/fiqh-issues-seed.ts",
    );
  }
}

if (adhkarMod?.ADHKAR_ITEMS) {
  counts.adhkar = (adhkarMod.ADHKAR_ITEMS as unknown[]).length;
}

if (lessonsMod?.LESSON_ADS) {
  counts.lessons = (lessonsMod.LESSON_ADS as unknown[]).length;
} else if (lessonsMod) {
  // عدّ أي مصفوفة دروس ظاهرة
  for (const [k, v] of Object.entries(lessonsMod)) {
    if (Array.isArray(v) && v.length > 10 && /lesson|ad/i.test(k)) {
      counts.lessons = v.length;
      break;
    }
  }
}

// ── عناوين عامة في بيانات فقط — تحقق أن seo.ts ليس مصدر بيانات ───────────
// (لا نُبلّغ seo.ts كسجل بيانات؛ يُذكر في الملخص فقط)

// ── تجميع schema_gap: لا تُغرق التقرير — اختصر إلى عيّنة ─────────────────
const schemaGaps = issues.filter((i) => i.issue_type === "schema_gap");
const nonSchema = issues.filter((i) => i.issue_type !== "schema_gap");
const schemaGapSummary = {
  count: schemaGaps.length,
  note: "حقول المخطط المثالي غير الموجودة في النموذج الحالي — auto_fix_allowed=false؛ عُرضت عيّنة فقط في MD",
  sample: schemaGaps.slice(0, 8),
};

const bySeverity = {
  critical: nonSchema.filter((i) => i.severity === "critical").length,
  high: nonSchema.filter((i) => i.severity === "high").length,
  medium: nonSchema.filter((i) => i.severity === "medium").length,
  low: nonSchema.filter((i) => i.severity === "low").length,
};

const gateFail = nonSchema.filter(
  (i) => (i.severity === "critical" || i.severity === "high") && i.issue_type !== "source_pending",
);

const report = {
  generatedAt: new Date().toISOString(),
  mode: "DATA_QUALITY",
  recordsScanned: counts,
  issueCounts: {
    totalIncludingSchemaGaps: issues.length,
    actionable: nonSchema.length,
    schemaGaps: schemaGaps.length,
    bySeverity,
    gateFailing: gateFail.length,
  },
  issues: nonSchema,
  schemaGapSummary,
};

fs.mkdirSync(path.join(root, "reports"), { recursive: true });
fs.writeFileSync(path.join(root, "reports/data-quality-audit.json"), JSON.stringify(report, null, 2) + "\n", "utf8");

const mdLines = [
  `# تدقيق جودة البيانات`,
  ``,
  `تاريخ: ${report.generatedAt.slice(0, 10)}`,
  ``,
  `## السجلات المفحوصة`,
  ``,
  ...Object.entries(counts).map(([k, v]) => `- **${k}**: ${v}`),
  ``,
  `## ملخص الأخطاء (بدون schema_gap)`,
  ``,
  `| الشدة | العدد |`,
  `|---|---|`,
  `| critical | ${bySeverity.critical} |`,
  `| high | ${bySeverity.high} |`,
  `| medium | ${bySeverity.medium} |`,
  `| low | ${bySeverity.low} |`,
  `| schema_gap (مؤجّل) | ${schemaGaps.length} |`,
  ``,
  `## أخطاء قابلة للمراجعة`,
  ``,
];

if (!nonSchema.length) {
  mdLines.push("_لا أخطاء actionable_");
} else {
  mdLines.push(`| entity | id | field | issue | severity | auto_fix |`);
  mdLines.push(`|---|---|---|---|---|---|`);
  for (const i of nonSchema.slice(0, 120)) {
    mdLines.push(
      `| ${i.entity_type} | ${i.entity_id} | ${i.field} | ${i.issue_type} | ${i.severity} | ${i.auto_fix_allowed} |`,
    );
  }
  if (nonSchema.length > 120) mdLines.push(`\n… و${nonSchema.length - 120} أخرى في JSON.`);
}

mdLines.push(``, `## schema_gap`, ``, schemaGapSummary.note, ``);
mdLines.push(`عيّنة:`, ``);
for (const i of schemaGapSummary.sample) {
  mdLines.push(`- ${i.entity_type}/${i.slug}.${i.field}`);
}

mdLines.push(
  ``,
  `## ملاحظات غير مثبتة في البيانات`,
  ``,
  `- عناوين «كتاب شرعي» / «قصة سورة» في \`src/lib/seo.ts\` = احتياطي SPA وليست سجلات بيانات → **لم يثبت في مصدر البيانات الحالي**.`,
  ``,
);

fs.writeFileSync(path.join(root, "reports/data-quality-audit.md"), mdLines.join("\n") + "\n", "utf8");

console.log(
  JSON.stringify(
    {
      recordsScanned: counts,
      actionable: nonSchema.length,
      schemaGaps: schemaGaps.length,
      gateFailing: gateFail.length,
      reportMd: "reports/data-quality-audit.md",
    },
    null,
    2,
  ),
);

if (gateFail.length) {
  console.error(
    `audit:data-quality FAILED (${gateFail.length})\n- ${gateFail
      .slice(0, 30)
      .map((i) => `${i.entity_type}/${i.entity_id}: ${i.issue_type} (${i.field})`)
      .join("\n- ")}`,
  );
  process.exit(1);
}
console.log("audit:data-quality OK");
