#!/usr/bin/env node
/**
 * تدقيق آلي شامل لكل مسار مُنتَج فعليًا (seo-prerender/**\/index.html) عبر
 * خادم Vite dev محلي: يتحقق أن المسار لا يعرض محتوى الصفحة الرئيسية خطأً،
 * وأن العنوان مطابق للمسار، ويسجل أخطاء الـconsole، ويقيس زمن الاستجابة.
 *
 * التشغيل: node scripts/audit-all-routes.mjs <baseUrl> <routesFile> [outJson]
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const baseUrl = process.argv[2] || "http://localhost:5177";
const routesFile = process.argv[3];
const outJson = process.argv[4] || "/tmp/route-audit-report.json";

const routes = readFileSync(routesFile, "utf8").split("\n").map((l) => l.trim()).filter(Boolean);

function fingerprint(text) {
  return (text || "").replace(/\s+/g, " ").trim().slice(0, 300);
}

const browser = await chromium.launch();
const page = await browser.newPage();

// أولًا: بصمة الصفحة الرئيسية للمقارنة
await page.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
await page.waitForTimeout(600);
const homeFingerprint = fingerprint(await page.evaluate(() => document.querySelector("h1")?.textContent || document.body.innerText.slice(0, 300)));
const homeTitle = await page.title();

const results = [];
let i = 0;
for (const route of routes) {
  i++;
  if (route === "/") continue;
  const consoleErrors = [];
  const errHandler = (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 200)); };
  page.on("console", errHandler);
  const pageErrors = [];
  const pageErrHandler = (err) => pageErrors.push(String(err).slice(0, 200));
  page.on("pageerror", pageErrHandler);

  const t0 = Date.now();
  let status = null;
  try {
    const resp = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 20000 });
    status = resp?.status() ?? null;
    // 500ms كان غير كافٍ لصفحات ثقيلة تعتمد React Query/lazy chunks (اكتُشف
    // فعلياً 2026-07-18: /library, /scholars, /quiz وغيرها أُبلِغت خطأً
    // كصفحات فارغة بينما هي تُحمَّل بنجاح فعلياً بعد مهلة أطول في اختبار
    // preview محلي). رُفعت المهلة الثابتة كتخفيف — تجربة waitForSelector("h1")
    // بديلاً جُرِّبت وتراجعت: صفحات Redirect-only (مثل /fatwa) لا تعرض h1
    // إطلاقاً على مسارها الأصلي فتنتظر كامل المهلة بلا فائدة، ولم تكن أدق.
    // **ملاحظة صادقة**: حتى بعد هذا التخفيف قد تبقى بعض الصفحات الثقيلة
    // تُبلَّغ "فارغة" زوراً في بيئة headless محلية بطيئة — تحقّق يدوياً
    // (Playwright تفاعلي أو المتصفح) قبل اعتبار أي "isBlank" من هذا
    // السكربت عطلاً حقيقياً دون تأكيد.
    await page.waitForTimeout(2500);
  } catch (e) {
    results.push({ route, error: `goto failed: ${String(e).slice(0, 200)}` });
    page.off("console", errHandler);
    page.off("pageerror", pageErrHandler);
    continue;
  }
  const elapsedMs = Date.now() - t0;

  const title = await page.title().catch(() => "");
  const h1 = await page.evaluate(() => document.querySelector("h1")?.textContent || "").catch(() => "");
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300)).catch(() => "");
  const isNotFound = await page.evaluate(() => {
    const t = document.body.innerText;
    return /404|غير موجود|لم يتم العثور/.test(t.slice(0, 500));
  }).catch(() => false);
  const looksLikeHome = fingerprint(h1 || bodyText) === homeFingerprint && title === homeTitle;
  const isBlank = !bodyText || bodyText.trim().length < 5;

  results.push({
    route, status, elapsedMs, title, h1: h1.slice(0, 120),
    looksLikeHome, isBlank, isNotFound,
    consoleErrors: consoleErrors.slice(0, 5),
    pageErrors: pageErrors.slice(0, 5),
  });

  page.off("console", errHandler);
  page.off("pageerror", pageErrHandler);

  if (i % 50 === 0) console.error(`... ${i}/${routes.length}`);
}

await browser.close();

const problems = results.filter((r) => r.error || r.looksLikeHome || r.isBlank || r.pageErrors?.length || (r.consoleErrors?.length));
writeFileSync(outJson, JSON.stringify({ homeTitle, homeFingerprint, total: results.length, problemCount: problems.length, problems, all: results }, null, 2));
console.error(`\nتم فحص ${results.length} مسارًا — مشاكل محتملة: ${problems.length}`);
console.error(`التقرير الكامل: ${outJson}`);
