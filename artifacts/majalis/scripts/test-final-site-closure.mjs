#!/usr/bin/env node
/**
 * اختبار إغلاق تدقيق الموقع النهائي — يفشل عند عودة الادعاءات الخاطئة.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fail = (m) => {
  console.error(`FAIL: ${m}`);
  process.exitCode = 1;
};
const ok = (m) => console.log(`OK: ${m}`);

const HOME_TITLE = "مجالس العلم — منصة علمية شاملة";

function titleOf(html) {
  return (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
}

// 1) لا «المصدر: رابط القراءة»
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(ent.name)) continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|mjs|html|json)$/.test(ent.name)) out.push(p);
  }
  return out;
}
let bad = 0;
for (const base of ["src", "scripts", "seo-prerender", "public/data"]) {
  for (const file of walk(join(root, base))) {
    if (file.endsWith("test-final-site-closure.mjs")) continue;
    const t = readFileSync(file, "utf8");
    if (t.includes("المصدر: رابط القراءة") || /المصدر:\s*<a[^>]*>\s*رابط القراءة\s*<\/a>/i.test(t)) {
      console.error(" ", file);
      bad++;
    }
  }
}
if (bad) fail(`وجد «المصدر: رابط القراءة» في ${bad} ملف`);
else ok("لا مصدر: رابط القراءة");

// 2) /fiqh لا يدعي موثّقة بالأدلة
const fiqhHub = readFileSync(join(root, "src/lib/fiqh-hub-topics.ts"), "utf8");
const fiqhPrerender = join(root, "seo-prerender/fiqh/index.html");
if (/موثّقة بالأدلة|موثقة بالأدلة/.test(fiqhHub)) fail("fiqh-hub-topics ما زال يدعي موثّقة بالأدلة");
else ok("fiqh hub wording");
if (existsSync(fiqhPrerender)) {
  const html = readFileSync(fiqhPrerender, "utf8");
  if (/مسائل موثّقة بالأدلة|موثّقة بالأدلة/.test(html)) fail("seo-prerender/fiqh ما زال يدعي موثّقة بالأدلة");
  else ok("fiqh prerender wording");
}

// 3) nations / quran people ليست homepage
const critical = [
  "/nations",
  "/nations/aad",
  "/nations/thamud",
  "/quran/people",
  "/quran/people/azar",
  "/quran/people/dhul-kifl",
  "/quran/people/maryam",
];
for (const route of critical) {
  const file =
    route === "/nations"
      ? join(root, "seo-prerender/nations/index.html")
      : route === "/quran/people"
        ? join(root, "seo-prerender/quran/people/index.html")
        : join(root, `seo-prerender${route}/index.html`);
  if (!existsSync(file)) {
    fail(`missing prerender ${route}`);
    continue;
  }
  const title = titleOf(readFileSync(file, "utf8"));
  if (!title || title === HOME_TITLE || title.startsWith("مجالس العلم — منصة")) {
    fail(`${route} homepage title fallback: ${title}`);
  } else ok(`prerender ${route} — ${title}`);
}

// 4) آزر
const people = JSON.parse(
  readFileSync(join(root, "public/data/quran-people/people.json"), "utf8"),
).people;
const azar = people.find((p) => p.slug === "azar");
if (!azar) fail("آزر غير موجود في people.json");
else {
  assert.ok(azar.occurrences?.some((o) => o.surah === 6 && o.ayah === 74));
  ok("آزر موجود (الأنعام 6:74)");
}

// 5) ذو الكفل caution
const dk = people.find((p) => p.slug === "dhul-kifl");
if (!dk?.cautionNote?.includes("وقع خلاف")) fail("ذو الكفل بلا cautionNote للخلاف");
else ok("ذو الكفل cautionNote");

// 6) قصص الأنبياء — بوابة الحشو موجودة وتُمرَّر عبر الاختبار المخصص
const prophetsTest = join(root, "src/lib/__tests__/prophets-content-quality.test.ts");
if (!existsSync(prophetsTest)) fail("اختبار جودة الأنبياء مفقود");
else ok("بوابة جودة الأنبياء موجودة");

// 7) methodology meta بلا حكم عام
const meth = readFileSync(join(root, "src/views/MethodologyPage.tsx"), "utf8");
const meta = meth.match(/applyPageSeo\(\{[\s\S]*?\}\);/);
if (meta && /قيد المراجعة الشرعية/.test(meta[0])) {
  fail("methodology meta/JSON-LD يحتوي قيد المراجعة الشرعية كحكم صفحة");
} else ok("methodology meta خالٍ من الحكم العام");

if (process.exitCode) {
  console.error("\nfinal-site-closure: FAILED");
  process.exit(1);
}
console.log("\nfinal-site-closure: PASSED");
