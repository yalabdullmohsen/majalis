#!/usr/bin/env node
/**
 * content-guard.mjs — بوابة جودة المحتوى (تقرير المراجعة الموحّد).
 * يفشل بـ exit 1 عند أي عيب معروف يمنع الإطلاق.
 *
 * Usage: node scripts/content-guard.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const errors = [];

function fail(msg) {
  errors.push(msg);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

/** 1) لا حشو بنقاط ≥ 4 في بذور المحتوى */
for (const rel of [
  "src/lib/scholars-data.ts",
  "src/lib/sheikhs-seed.ts",
  "src/lib/library-catalog.ts",
]) {
  const text = read(rel);
  const dots = text.match(/\.{4,}/g) || [];
  if (dots.length) fail(`${rel}: وُجد ${dots.length} تسلسل نقاط (≥4) — الحشو ممنوع`);
}

/** 2) لا ذيول قوالب معروفة */
const BANNED_PHRASES = [
  "بلا غلو في الأشخاص",
  "مرجع معتمد في تخصصه عند أهل العلم",
  "من مراجع المكتبة الإسلامية يُنصح به لطالب العلم",
  "مع التمييز بين ما ثبت من الشرع وما هو تاريخي أو اجتهادي",
  "يُنصح به لطالب العلم؛ من مراجع",
];
for (const rel of [
  "src/lib/scholars-data.ts",
  "src/lib/sheikhs-seed.ts",
  "src/lib/library-catalog.ts",
]) {
  const text = read(rel);
  for (const phrase of BANNED_PHRASES) {
    if (text.includes(phrase)) fail(`${rel}: ذيل قالبي محظور: «${phrase}»`);
  }
}

/** 2ب) ذيول حشو خاصة ببذرة المجمع الفقهي (نُظِّفت في تدقيق ٢٠٢٦-٠٧-٢٧) */
const FIQH_COUNCIL_BANNED_TAILS = [
  "ويُراجع النص الكامل عند الحاجة إلى التفصيل",
  "وتُعرض للتوثيق التعليمي مع الإحالة إلى المصدر الرسمي",
  "مع بيان حدود الاعتماد دون اختزال مخلّ",
];
{
  const rel = "src/lib/fiqh-council-seed.ts";
  const text = read(rel);
  for (const phrase of FIQH_COUNCIL_BANNED_TAILS) {
    if (text.includes(phrase)) fail(`${rel}: ذيل قالبي محظور: «${phrase}»`);
  }
}

/** 3) لا catch-all يعيد index.html للمسارات المجهولة */
const vercel = read("vercel.json");
if (/destination"\s*:\s*"\/index\.html"[\s\S]{0,80}\(\(\?!api/.test(vercel)
  || /"source"\s*:\s*"\/\(\(\?!api/.test(vercel)) {
  fail("vercel.json: ما زالت قاعدة catch-all → /index.html موجودة");
}
if (!/"source"\s*:\s*"\/muezzins"/.test(vercel)) {
  fail("vercel.json: مفقود تحويل /muezzins");
}

/** 4) أوصاف SEO ≤ 160 حرفًا للعلماء (عيّنة من generate عند البناء؛ هنا نفحص البذرة) */
{
  // نفحص أن applyPageSeo في ScholarProfile يقطع — والـguard يرفض bios تُستخدم كما هي بدون قطع في ملفات SEO الثابتة إن وُجدت
  const seoScholarsDir = path.join(ROOT, "seo-prerender/scholars");
  if (fs.existsSync(seoScholarsDir)) {
    const walk = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p);
        else if (ent.name === "index.html") {
          const html = fs.readFileSync(p, "utf8");
          const m = html.match(/<meta name="description" content="([^"]*)"/);
          if (m && m[1].length > 160) {
            fail(`${path.relative(ROOT, p)}: meta description ${m[1].length} > 160`);
          }
          if (/\.{4,}/.test(html)) fail(`${path.relative(ROOT, p)}: نقاط حشو في prerender`);
          if (html.includes("بلا غلو في الأشخاص")) fail(`${path.relative(ROOT, p)}: ذيل قالبي في prerender`);
        }
      }
    };
    walk(seoScholarsDir);
  }
}

/** 5) الصفحات القانونية يجب أن تحتوي نصًا جوهريًا في prerender */
for (const page of ["privacy", "terms", "account-deletion"]) {
  const file = path.join(ROOT, "seo-prerender", page, "index.html");
  if (!fs.existsSync(file)) {
    fail(`seo-prerender/${page}/index.html مفقود`);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const main = (html.match(/<main[\s\S]*?<\/main>/i) || [""])[0];
  const textLen = main.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
  if (textLen < 400) {
    fail(`seo-prerender/${page}: محتوى main قصير جدًا (${textLen} حرفًا) — يلزم نص قانوني كامل بلا JS`);
  }
}

/** 6) padToNeed يجب ألا يكمّل بالنقاط */
{
  const scriptsDir = path.join(ROOT, "scripts");
  for (const name of fs.readdirSync(scriptsDir)) {
    if (!/\.(mjs|js)$/.test(name)) continue;
    const t = fs.readFileSync(path.join(scriptsDir, name), "utf8");
    if (/while\s*\(\s*out\.length\s*<\s*need\s*\)\s*out\s*\+=\s*["']\.["']/.test(t)) {
      fail(`scripts/${name}: ما زال padToNeed يكمّل بالنقاط`);
    }
  }
}

if (errors.length) {
  console.error("content-guard FAILED:\n" + errors.map((e) => `✗ ${e}`).join("\n"));
  process.exit(1);
}
console.log("content-guard OK — لا عيوب مكتشفة في البذور/التوجيه/السكربتات المفحوصة.");
