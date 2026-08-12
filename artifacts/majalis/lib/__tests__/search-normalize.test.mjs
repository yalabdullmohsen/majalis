/**
 * اختبارات وحدة للبحث العربي — لا تحتاج قاعدة بيانات.
 *
 * ١) تحميل lib/api-handlers/search.js دون خطأ
 *    يمنع رجوع عطل حقيقي وقع في الإنتاج: character class عربي بترتيب مدى
 *    غير صحيح (SyntaxError: Range out of order in character class) كان يمنع
 *    تحميل الموديول بالكامل فيُعيد /api/search دائمًا HTTP 500.
 *
 * ٢) أنماط ilike العربية (arabicSearchPatterns)
 *    SearchPage يُطبّع الاستعلام قبل تمريره (normalizeArabic): «الصلاة» → «الصلاه».
 *    أعمدة قاعدة البيانات غير مطبَّعة، فأي بحث ilike يُبنى من الاستعلام الخام
 *    مباشرةً (ilikePattern(term)) يعود بصفر نتائج. هذه الاختبارات تفشل إن:
 *      - أعادت «الصلاه» صفر أنماط،
 *      - أو لم تتقاطع أنماط «الصلاة» مع أنماط «الصلاه» (أي أن الصيغتين تبحثان
 *        في فضاءين منفصلين ⇒ نتائج مختلفة لنفس الكلمة).
 *
 * ٣) حارس انحدار على المصدر: لا دالة بحث في src/lib/supabase.ts تستعمل
 *    ilikePattern(term) الخام على الاستعلام بدل توسعته عبر arabicSearchPatterns.
 *
 * تُشغَّل عبر: node lib/__tests__/search-normalize.test.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..", "..");
const srcDir = path.join(appRoot, "src");

// ─── ١) تحميل search.js بلا SyntaxError ──────────────────────────────────────

console.log("\n=== تحميل search.js بلا SyntaxError ===");

let mod = null;
let loadError = null;
try {
  mod = await import("../api-handlers/search.js");
} catch (e) {
  loadError = e;
}

assert(loadError === null, `الموديول يُحمَّل بلا خطأ${loadError ? ": " + loadError.message : ""}`);
assert(typeof mod?.default === "function", "handler الافتراضي دالة صحيحة");

// ─── ٢) أنماط البحث العربي ───────────────────────────────────────────────────

console.log("\n=== أنماط ilike العربية (arabicSearchPatterns) ===");

// نستورد المصدر TypeScript مباشرة: Node ≥22 يزيل الأنواع، ونضيف hook بسيطًا
// لحلّ alias "@/" ولاحقة .ts كما يفعل Vite.
const hookSource = `
export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    let target = ${JSON.stringify(pathToFileURL(srcDir + path.sep).href)} + specifier.slice(2);
    if (!/\\.[a-zA-Z]+$/.test(target)) target += ".ts";
    return next(target, context);
  }
  return next(specifier, context);
}`;
register("data:text/javascript," + encodeURIComponent(hookSource));

const { arabicSearchPatterns, ilikePattern, normalizeArabic } = await import(
  pathToFileURL(path.join(srcDir, "lib", "arabic-search.ts")).href
);

const RAW = "الصلاة";       // ما يكتبه المستخدم
const NORMALIZED = "الصلاه"; // ما يصل فعلًا من SearchPage بعد normalizeArabic

assert(normalizeArabic(RAW) === NORMALIZED, `normalizeArabic("${RAW}") === "${NORMALIZED}"`);

const rawPatterns = arabicSearchPatterns(RAW);
const normPatterns = arabicSearchPatterns(NORMALIZED);

assert(rawPatterns.length > 0, `«${RAW}» تُنتج أنماطًا (${rawPatterns.length})`);
assert(normPatterns.length > 0, `«${NORMALIZED}» تُنتج أنماطًا — لا صفر (${normPatterns.length})`);

// الصيغة المطبَّعة يجب أن تصل إلى الصفوف المخزَّنة بالتاء المربوطة، والعكس.
assert(
  normPatterns.includes(RAW),
  `أنماط «${NORMALIZED}» تشمل الصيغة الأصلية «${RAW}» (وإلا فلا تطابق صفوف قاعدة البيانات)`,
);
assert(
  rawPatterns.includes(NORMALIZED),
  `أنماط «${RAW}» تشمل الصيغة المطبَّعة «${NORMALIZED}»`,
);

// أي صف يطابق أحد الاستعلامين لا بد أن يطابق الآخر: الفضاءان متقاطعان
// في كلتا الصيغتين — وإلا اختلفت النتائج بين «الصلاة» و«الصلاه».
const rawSet = new Set(rawPatterns);
const normSet = new Set(normPatterns);
const shared = [...normSet].filter((p) => rawSet.has(p));
assert(
  shared.includes(RAW) && shared.includes(NORMALIZED),
  "الصيغتان تتشاركان أنماط «الصلاة» و«الصلاه» معًا ⇒ نتائج متطابقة",
);

// نفس الاختبار لحالات التاء المربوطة/الألف المقصورة/الهمزة الشائعة
for (const [written, normalized] of [
  ["زكاة", "زكاه"],
  ["مصلّى", "مصلي"],
  ["إيمان", "ايمان"],
]) {
  const norm = normalizeArabic(written);
  const pats = arabicSearchPatterns(norm);
  assert(pats.length > 0, `«${written}» → «${norm}» تُنتج أنماطًا`);
  assert(
    norm !== normalized || pats.includes(written) || arabicSearchPatterns(written).includes(norm),
    `«${written}» و«${norm}» يبحثان في نفس الفضاء`,
  );
}

// الشكل الخام (العطل الأصلي): نمط واحد بلا توسعة.
const naive = ilikePattern(NORMALIZED);
assert(
  naive === `%${NORMALIZED}%`,
  "ilikePattern الخام يعطي نمطًا واحدًا فقط (لا يطابق «الصلاة» في قاعدة البيانات) — لذلك يجب ألّا يُستعمل مباشرةً في البحث",
);

// ─── ٣) حارس انحدار على المصدر ───────────────────────────────────────────────

console.log("\n=== لا بحث يستعمل ilikePattern(term) الخام في supabase.ts ===");

const supabaseSrcRaw = fs.readFileSync(path.join(srcDir, "lib", "supabase.ts"), "utf8");
// نزيل التعليقات قبل الفحص — التوثيق يشرح النمط الممنوع نصًا (مثال:
// "استعمال ilikePattern(term) الخام يُرجع صفر نتائج") وهذا لا يعني استدعاءً فعليًا.
const supabaseSrc = supabaseSrcRaw
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

// أي `ilikePattern(<هوية>)` حيث الهوية ليست نمطًا مُوسَّعًا (p/pattern/chunk item)
// هو رجوع للعطل: توسعة الأنماط تُبنى دائمًا من arabicSearchPatterns.
const rawUses = [...supabaseSrc.matchAll(/ilikePattern\(\s*(\w+)\s*\)/g)]
  .map((m) => m[1])
  .filter((arg) => arg === "term" || arg === "search" || arg === "query");

assert(
  rawUses.length === 0,
  `لا استدعاء لـ ilikePattern على الاستعلام الخام${rawUses.length ? ` — وُجد: ${rawUses.join(", ")}` : ""}`,
);

// كل دوال الـfallback الأربع التي كانت معطوبة تمرّ الآن عبر توسعة الأنماط
for (const fn of [
  "searchMiraclesFallback",
  "searchFawaidFallback",
  "searchHadithFallback",
  "searchStoriesFallback",
]) {
  const start = supabaseSrc.indexOf(`async function ${fn}(`);
  const body = start === -1 ? "" : supabaseSrc.slice(start, start + 1400);
  assert(
    start !== -1 && /searchPatternChunks|arabicSearchPatterns/.test(body),
    `${fn} يستعمل توسعة الأنماط العربية`,
  );
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
