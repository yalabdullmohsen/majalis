#!/usr/bin/env node
/**
 * انحدار: HTML مسار اختبار التلاوة يجب ألا يطابق الرئيسية أبدًا،
 * ويجب أن يحتوي عناصر القبول (title، H1، خطوات، ميكروفون، خصوصية، canonical).
 * يُشغَّل بعد البناء على dist/ وseo-prerender/.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function sha(text) {
  return createHash("sha256").update(text).digest("hex");
}

function mustInclude(html, label, re) {
  if (!re.test(html)) failures.push(`ناقص في HTML التلاوة: ${label}`);
}

const candidates = [
  resolve(appRoot, "seo-prerender/quran/recitation-test-ai/index.html"),
  resolve(appRoot, "dist/quran/recitation-test-ai/index.html"),
];
const homeCandidates = [
  resolve(appRoot, "seo-prerender/index.html"),
  resolve(appRoot, "dist/index.html"),
];

const recFile = candidates.find((f) => existsSync(f));
const homeFile = homeCandidates.find((f) => existsSync(f));

if (!recFile) {
  failures.push("ملف HTML لاختبار التلاوة غير موجود في seo-prerender/ أو dist/");
} else if (!homeFile) {
  failures.push("ملف الرئيسية غير موجود للمقارنة");
} else {
  const rec = readFileSync(recFile, "utf8");
  const home = readFileSync(homeFile, "utf8");
  const recHash = sha(rec);
  const homeHash = sha(home);

  if (rec === home || recHash === homeHash) {
    failures.push("HTML اختبار التلاوة مطابق حرفيًا للرئيسية — تسرّب SPA/fallback");
  }

  // إن وُجدت نسختا dist وseo-prerender للتلاوة، يجب ألا تطابق dist الرئيسية أيضًا
  const distRec = resolve(appRoot, "dist/quran/recitation-test-ai/index.html");
  const distHome = resolve(appRoot, "dist/index.html");
  if (existsSync(distRec) && existsSync(distHome)) {
    const dRec = readFileSync(distRec, "utf8");
    const dHome = readFileSync(distHome, "utf8");
    if (dRec === dHome || sha(dRec) === sha(dHome)) {
      failures.push("dist: HTML التلاوة مطابق للرئيسية");
    }
    if (!/اختبار التلاو/u.test(dRec)) {
      failures.push("dist: عنوان/محتوى التلاوة مفقود");
    }
  }

  const recTitle = (rec.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
  const homeTitle = (home.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
  if (recTitle && homeTitle && recTitle === homeTitle) {
    failures.push(`عنوان التلاوة يطابق الرئيسية: "${recTitle}"`);
  }

  mustInclude(rec, "title خاص بالتلاوة", /اختبار التلاو[ةة]/u);
  mustInclude(rec, "H1 واحد للتلاوة", /<h1[^>]*>[\s\S]*?اختبار التلاو/u);
  mustInclude(rec, "وصف الميزة", /ميكروفون|تعرّف صوت|تسميع/u);
  mustInclude(rec, "خطوات الاستخدام", /خطوات الاستخدام/u);
  mustInclude(rec, "توضيح إذن الميكروفون", /إذن الميكروفون/u);
  mustInclude(rec, "توضيح مكان المعالجة", /تُعالَج|معالج|Groq|الجهاز/u);
  mustInclude(rec, "رابط سياسة الخصوصية", /\/privacy|سياسة الخصوصية/u);
  mustInclude(rec, "canonical صحيح", /rel="canonical"[^>]+recitation-test-ai/u);
  mustInclude(rec, "Open Graph", /og:title/u);

  // لا يُسمح بـ rewrite catch-all لـ /quran → index.html في vercel.json
  const vercel = readFileSync(resolve(appRoot, "vercel.json"), "utf8");
  if (/\"source\"\s*:\s*\"\/quran\/:path\*\"[\s\S]*?\"destination\"\s*:\s*\"\/index\.html\"/.test(vercel)) {
    failures.push("vercel.json ما زال يعيد كتابة /quran/:path* إلى /index.html — سبب تسرّب الرئيسية");
  }

  console.log(`file=${recFile.slice(appRoot.length + 1)} rec hash=${recHash.slice(0, 16)} home hash=${homeHash.slice(0, 16)}`);
}

if (failures.length) {
  console.error(`❌ فشل تدقيق HTML التلاوة (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("✓ HTML اختبار التلاوة متميز عن الرئيسية ويحتوي عناصر القبول.");
