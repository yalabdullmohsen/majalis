/**
 * اختبار: لا يتسرّب محتوى الصفحة الرئيسية إلى صفحات الكتب والعلماء (فحص HTML الفعلي).
 *
 * السبب الجذري السابق: المسارات غير المُولَّدة كانت ترتد إلى قالب SPA (dist/index.html)
 * الذي يحمل noscript الصفحة الرئيسية (إحصاءات + قوائم كتب وعلماء). بعد تغطية كل
 * الصفحات بنسخة prerender خاصة، يجب ألا تحتوي أي صفحة داخلية على محتوى الرئيسية.
 *
 * يفحص ملفات seo-prerender/ الفعلية (ما يراه الزاحف بلا JavaScript):
 *   1. كل كتاب وكل عالِم له صفحة prerender (لا ثغرة تغطية).
 *   2. لا تحتوي صفحة داخلية على عبارات إحصاءات الرئيسية.
 *   3. تشابه النص الظاهر مع الرئيسية أقل من 35%.
 *
 * يُشغَّل: node scripts/test-no-homepage-leak.mjs
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const PRE = resolve(appRoot, "seo-prerender");

let passed = 0;
let failed = 0;
function assert(cond, label) {
  if (cond) { passed++; } else { failed++; console.error(`  ✗ FAIL: ${label}`); }
}

// عبارات تخصّ الصفحة الرئيسية حصراً (إحصاءات وشعارات تسويقية)
const HOMEPAGE_MARKERS = [
  /\d+\+\s*دورة علمية/,
  /\d+\+\s*كتاب في التفسير/,
  /\d+\+\s*عالماً من أئمة/,
  /منصة الدروس الشرعية والعلوم الإسلامية/,
  /الدروس والدورات الشرعية/,
  /مكتبة الكتب الشرعية/,
  /العلماء والأئمة/,
];

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
// النص الرئيسي فقط (داخل <main>) — نستبعد الهيدر والفوتر المشتركين لأنهما يرفعان
// التشابه صناعيًا في الصفحات القصيرة.
function mainText(html) {
  const m = html.match(/<main[\s\S]*?<\/main>/i);
  return stripTags(m ? m[0] : html);
}
function tokens(text) {
  return text.split(/\s+/).filter((w) => w.length > 2);
}
function similarity(aTokens, bSet) {
  if (!aTokens.length) return 0;
  let hit = 0;
  for (const t of aTokens) if (bSet.has(t)) hit++;
  return hit / aTokens.length;
}

// مرجع الرئيسية المميّز = كتلة noscript الخاصة بها (الإحصاءات + قوائم الكتب والعلماء)،
// وهي ما يتسرّب فعلاً عند ارتداد الصفحة إلى قالب SPA.
const rootIndex = resolve(appRoot, "index.html");
const rootHtml = existsSync(rootIndex) ? readFileSync(rootIndex, "utf8") : "";
const noscriptMatch = rootHtml.match(/<noscript>[\s\S]*?<\/noscript>/i);
const homepageText = noscriptMatch ? stripTags(noscriptMatch[0]) : stripTags(rootHtml);
const homepageSet = new Set(tokens(homepageText));

function collectPages(subdir) {
  const base = resolve(PRE, subdir);
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ slug: d.name, file: resolve(base, d.name, "index.html") }))
    .filter((p) => existsSync(p.file));
}

// ── تغطية: كل كتاب وكل عالِم منشور له صفحة prerender ─────────────────────
const catalog = JSON.parse(readFileSync(resolve(appRoot, "src/data/library-catalog.json"), "utf8"));
const scholars = JSON.parse(readFileSync(resolve(appRoot, "src/data/scholars-list.json"), "utf8"));
const bookDirs = new Set(collectPages("library").map((p) => p.slug));
const scholarDirs = new Set(collectPages("scholars").map((p) => p.slug));

const missingBooks = catalog.filter((b) => !bookDirs.has(b.id)).map((b) => b.id);
const missingScholars = scholars.filter((s) => !scholarDirs.has(s.id)).map((s) => s.id);
console.log("\n=== تغطية الفهرسة ===");
assert(missingBooks.length === 0, `كل الكتب (${catalog.length}) لها صفحة prerender${missingBooks.length ? " — ناقص: " + missingBooks.join(", ") : ""}`);
assert(missingScholars.length === 0, `كل العلماء (${scholars.length}) لهم صفحة prerender${missingScholars.length ? " — ناقص: " + missingScholars.join(", ") : ""}`);

// ── لا تسرّب لمحتوى الرئيسية داخل صفحات الكتب/العلماء ────────────────────
console.log("\n=== فحص كل صفحات الكتب والعلماء ===");
const internalPages = [...collectPages("library"), ...collectPages("scholars")];
const leaked = [];
const tooSimilar = [];
for (const p of internalPages) {
  const html = readFileSync(p.file, "utf8");
  const fullText = stripTags(html);
  const main = mainText(html);
  if (HOMEPAGE_MARKERS.some((re) => re.test(fullText))) leaked.push(p.slug);
  const sim = similarity(tokens(main), homepageSet);
  if (sim > 0.35) tooSimilar.push(`${p.slug} (${Math.round(sim * 100)}%)`);
}
assert(leaked.length === 0, `لا صفحة داخلية تحوي إحصاءات الرئيسية${leaked.length ? " — تسرّب في: " + leaked.slice(0, 10).join(", ") : ""}`);
assert(tooSimilar.length === 0, `لا صفحة داخلية تشبه الرئيسية >35%${tooSimilar.length ? " — " + tooSimilar.slice(0, 10).join(", ") : ""}`);
console.log(`  فُحصت ${internalPages.length} صفحة داخلية.`);

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
