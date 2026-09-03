#!/usr/bin/env node
/**
 * hadith-section-audit.mjs — فحص قسم الحديث (سُنّة)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = path.resolve(ROOT, "../..");
const REPORTS = path.resolve(REPO_ROOT, "reports");

const findings = [];

function add(severity, id, message, fix = "") {
  findings.push({ severity, id, message, fix });
}

function read(rel) {
  const abs = path.resolve(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory() && ent.name !== "node_modules") out.push(...walk(p));
    else if (ent.isFile()) out.push(p);
  }
  return out;
}

// ── 1) الملفات المطلوبة ─────────────────────────────────────────────────────
const required = [
  "src/components/hadith/HadithCard.tsx",
  "src/components/hadith/HadithFilters.tsx",
  "src/components/hadith/HadithGradeBadge.tsx",
  "src/components/hadith/HadithSearch.tsx",
  "src/lib/hadith/hadithNormalize.ts",
  "src/lib/hadith/hadithFilters.ts",
  "src/lib/hadith/hadithSearch.ts",
  "src/pages/hadith/ui/HadithView.tsx",
];
for (const rel of required) {
  if (!fs.existsSync(path.resolve(ROOT, rel))) {
    add("critical", `missing-${path.basename(rel)}`, `الملف ${rel} غير موجود`, "أنشئ الملف المطلوب");
  }
}

// ── 2) عبارة «الدرجة في حقل الحكم» ─────────────────────────────────────────
for (const rel of ["src/pages/hadith", "src/components/hadith", "src/lib/hadith"]) {
  const abs = path.resolve(ROOT, rel);
  for (const file of walk(abs)) {
    if (!/\.(tsx?|css)$/.test(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    if (/الدرجة في حقل الحكم/.test(content) && !/replace|PUBLIC_WEAK|sanitize/i.test(content)) {
      add("high", "weak-phrase-ui", `عبارة «الدرجة في حقل الحكم» في ${path.relative(ROOT, file)}`, "أزل العبارة من العرض");
    }
  }
}

// ── 3) ضعيف في الرئيسية/الشريط ───────────────────────────────────────────────
const ticker = read("src/lib/ticker-content.ts");
const daily = read("src/lib/daily-content.ts");
const home = read("src/components/HomeDashboard.tsx");
if (ticker && !/filterForPublicZone/.test(ticker)) {
  add("high", "ticker-no-filter", "الشريط لا يفلتر المحتوى العام", "استخدم filterForPublicZone");
}
if (daily && /ضعيف/.test(daily) && !/filterForPublicZone/.test(daily)) {
  add("medium", "daily-pool-review", "راجع مجموعة حديث اليوم", "تأكد من filterForPublicZone");
}
if (home && /hadith.*ضعيف|ضعيف.*hadith/i.test(home)) {
  add("high", "weak-on-home", "حديث ضعيف في الرئيسية", "أزل الترويج للضعيف من الرئيسية");
}

// ── 4) صيغة الحكم الموحّدة ────────────────────────────────────────────────────
const normalize = read("src/lib/hadith/hadithNormalize.ts");
if (!normalize.includes("الحكم: صحيح")) {
  add("high", "grade-format", "صيغة الحكم الموحّدة مفقودة", "أضف formatHadithGradeLabel");
}
const badge = read("src/components/hadith/HadithGradeBadge.tsx");
if (!badge.includes("HadithGradeBadge")) {
  add("high", "grade-badge", "مكوّن شارة الحكم مفقود", "أنشئ HadithGradeBadge");
}

// ── 5) Majlisilm ─────────────────────────────────────────────────────────────
for (const rel of ["src/pages/hadith", "src/components/hadith"]) {
  const abs = path.resolve(ROOT, rel);
  for (const file of walk(abs)) {
    if (!/\.tsx?$/.test(file)) continue;
    const raw = fs.readFileSync(file, "utf8");
    const content = raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    if (/Majlisilm|المجلس العلمي/i.test(content)) {
      add("high", "brand-leak", `اسم قديم في ${path.relative(ROOT, file)}`, "استخدم سُنّة فقط");
    }
  }
}

// ── 6) مسارات داخلية في التنقّل العام ────────────────────────────────────────
const navFiles = ["src/lib/site-footer-nav.ts", "src/config/navigation.ts", "scripts/generate-seo.mjs"];
for (const rel of navFiles) {
  const content = read(rel);
  if (content && /["']\/(internal|admin|review)["']/i.test(content)) {
    add("high", `nav-internal-${path.basename(rel)}`, `مسار داخلي في ${rel}`, "أزل من التنقّل العام");
  }
}
const routes = read("src/AppRoutes.tsx");
if (routes) {
  const publicInternal = routes.match(
    /<Route path=["']\/(internal|admin)(?:\/[^"']*)?["']>(?!\s*<(?:AdminLazyRoute|Redirect))/g,
  );
  if (publicInternal?.length) {
    add("critical", "internal-routes-public", "مسار admin/internal بلا حماية AdminLazyRoute", "احمِ المسارات الداخلية");
  }
}

// ── 7) بطاقة بلا مصدر / accessible name طويل ───────────────────────────────
const card = read("src/components/hadith/HadithCard.tsx");
if (card && !/المصدر|source_name|normalizeHadithSource/.test(card)) {
  add("high", "card-no-source", "البطاقة لا تعرض المصدر", "أضف المصدر للبطاقة");
}
if (card && /aria-label=\{[^}]{200,}/.test(card)) {
  add("medium", "long-aria-label", "اسم وصول طويل جدًا في البطاقة", "اختصر aria-label");
}
if (card && /role="button"[^>]*>[\s\S]*blockquote[\s\S]{400,}/.test(card)) {
  add("medium", "full-text-link", "الحديث الكامل كعنصر قابل للنقر", "استخدم زر قراءة المزيد");
}

// ── 8) فلاتر وبحث ───────────────────────────────────────────────────────────
const view = read("src/pages/hadith/ui/HadithView.tsx");
if (!view.includes("HadithFilters")) {
  add("high", "filters-missing", "فلاتر الحكم غير مدمجة", "أضف HadithFilters");
}
if (!view.includes("HadithSearch")) {
  add("high", "search-missing", "بحث الحديث غير مدمج", "أضف HadithSearch");
}

// ── 9) مشاركة ───────────────────────────────────────────────────────────────
if (!normalize.includes("buildHadithShareText")) {
  add("high", "share-format", "نص مشاركة الحديث غير موحّد", "أضف buildHadithShareText");
}

// ── 10) تكرار ────────────────────────────────────────────────────────────────
if (!read("src/lib/hadith/hadithFilters.ts").includes("dedupeHadithRecords")) {
  add("medium", "dedupe-missing", "منع تكرار الأحاديث غير مفعّل", "أضف dedupeHadithRecords");
}

// ── 11) SEO title ─────────────────────────────────────────────────────────────
if (view.includes("Majlisilm")) {
  add("high", "seo-brand", "Majlisilm في SEO الحديث", "استبدل بسُنّة");
}

// ── 12) المصحف ──────────────────────────────────────────────────────────────
const mushafCss = read("src/features/mushaf-reader/mushaf-reader.css");
const forbidden = /\.(qpc-|mushaf-verse|tafsir-body)[^{]*\{[^}]*(?:font-size|line-height)\s*:/i;
if (forbidden.test(mushafCss)) {
  add("critical", "mushaf-typography", "تغيير خط المصحف", "لا تغيّر font-size/line-height");
}

const counts = { critical: 0, high: 0, medium: 0, low: 0 };
for (const f of findings) counts[f.severity] = (counts[f.severity] ?? 0) + 1;

const report = {
  generatedAt: new Date().toISOString(),
  product: "سُنّة",
  section: "hadith",
  counts,
  findings,
  passed: counts.critical === 0 && counts.high === 0,
  routes: ["/hadith", "/hadith/sahih", "/hadith/daif", "/hadith/mawdu"],
};

fs.mkdirSync(REPORTS, { recursive: true });
fs.writeFileSync(path.join(REPORTS, "hadith-section-audit.json"), JSON.stringify(report, null, 2));

const md = [
  "# تقرير فحص قسم الحديث — سُنّة",
  "",
  `تاريخ: ${report.generatedAt}`,
  "",
  "## الملخص",
  `- Critical: ${counts.critical}`,
  `- High: ${counts.high}`,
  `- Medium: ${counts.medium}`,
  `- الحالة: ${report.passed ? "✅ ناجح" : "❌ يحتاج إصلاح"}`,
  "",
  "## المسارات",
  report.routes.map((r) => `- ${r}`).join("\n"),
  "",
  "## النتائج",
  "",
  ...findings.map(
    (f) =>
      `### [${f.severity.toUpperCase()}] ${f.id}\n- **المشكلة:** ${f.message}\n- **الإصلاح:** ${f.fix || "—"}\n`,
  ),
].join("\n");
fs.writeFileSync(path.join(REPORTS, "hadith-section-audit.md"), md);

console.log(`hadith-section-audit: Critical=${counts.critical} High=${counts.high} Medium=${counts.medium}`);
for (const f of findings) console.log(`[${f.severity}] ${f.id}: ${f.message}`);
process.exit(report.passed ? 0 : 1);
