#!/usr/bin/env node
/**
 * يحمي 404 الحقيقية لـ/scholars/:id و/library/:id وللمسارات المجهولة.
 *
 * السياسة (تقرير المراجعة الموحّد):
 *  - لا catch-all يعيد /index.html لأي مسار مجهول (كان يحوّل الأخطاء إلى «نجاح» ظاهري).
 *  - مسارات SPA الديناميكية المعروفة فقط تُعاد كتابتها إلى /index.html.
 *  - scholars/ وlibrary/ بلا rewrite → slug مفقود = 404.html حقيقية.
 *  - كل سجل حي يجب أن يملك ملف prerender مطابق.
 *
 * التشغيل: node --import tsx scripts/test-dynamic-404-safety.mjs
 * أو: pnpm run test:dynamic-404
 *
 * يستورد مصادر TypeScript عبر tsx (بلا registerHooks / strip-types التجريبي).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(appRoot, "dist");

if (!existsSync(distDir)) {
  console.error("❌ dist/ غير موجود — شغّل pnpm run build أولًا.");
  process.exit(1);
}

const failures = [];

/** استيراد مصدر .ts/.js/.mjs/.json بامتداد صريح — يتطلب `node --import tsx`. */
async function importSrc(relPath) {
  if (!/\.(ts|tsx|js|mjs|cjs|json)$/.test(relPath)) {
    throw new Error(`importSrc: explicit extension required — got "${relPath}"`);
  }
  const abs = resolve(appRoot, relPath);
  if (!existsSync(abs)) {
    throw new Error(`importSrc: file not found — ${abs}`);
  }
  try {
    return await import(pathToFileURL(abs).href);
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
    if (code === "ERR_UNKNOWN_FILE_EXTENSION") {
      console.error(
        "❌ تعذّر تحميل TypeScript. شغّل: node --import tsx scripts/test-dynamic-404-safety.mjs",
      );
    }
    throw err;
  }
}

const { SCHOLARS } = await importSrc("src/lib/scholars-data.ts");
const { LIBRARY_CATALOG } = await importSrc("src/lib/library-catalog.ts");

for (const s of SCHOLARS) {
  const p = resolve(distDir, "scholars", s.id, "index.html");
  if (!existsSync(p)) failures.push(`عالِم بلا prerender: ${s.id} (سيرجع 404 حقيقية خطأً)`);
}

for (const b of LIBRARY_CATALOG) {
  const p = resolve(distDir, "library", b.id, "index.html");
  if (!existsSync(p)) failures.push(`كتاب بلا prerender: ${b.id} (سيرجع 404 حقيقية خطأً)`);
}

const vercel = JSON.parse(readFileSync(resolve(appRoot, "vercel.json"), "utf8"));
const rewrites = vercel.rewrites || [];

const catchAll = rewrites.find(
  (r) =>
    typeof r.source === "string" &&
    r.destination === "/index.html" &&
    (r.source.includes("(?!") || r.source === "/:path*" || r.source === "/(.*)"),
);
if (catchAll) {
  failures.push(
    `vercel.json: ما زالت قاعدة catch-all → /index.html (${catchAll.source}) — تُخفي المسارات المجهولة خلف 200.`,
  );
}

const spaRewrites = rewrites.filter((r) => r.destination === "/index.html");
const forbiddenSpa = spaRewrites.filter(
  (r) =>
    typeof r.source === "string" &&
    (r.source.startsWith("/scholars") || r.source.startsWith("/library")),
);
if (forbiddenSpa.length) {
  failures.push("vercel.json: scholars/ أو library/ يجب ألا تُعاد كتابتها إلى /index.html");
}

const muezzinsRedirect = (vercel.redirects || []).some(
  (r) => typeof r.source === "string" && r.source.startsWith("/muezzins"),
);
if (!muezzinsRedirect) {
  failures.push("vercel.json: مفقود تحويل /muezzins إلى /adhan-settings");
}

if (!existsSync(resolve(distDir, "404.html"))) {
  failures.push("dist/404.html غير موجود — الـslugs غير الصحيحة ستحصل على صفحة 404 فارغة من Vercel بدل الصفحة المصمَّمة.");
}

console.log(`فُحص: ${SCHOLARS.length} عالِمًا و${LIBRARY_CATALOG.length} كتابًا.`);
console.log(`rewrites إلى /index.html (SPA فقط): ${spaRewrites.length}`);

if (failures.length) {
  console.error(`\n❌ فشل فحص أمان 404 الديناميكية (${failures.length}):`);
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}

console.log("✓ كل سجل حي (عالِم/كتاب) له prerender مطابق — ولا catch-all يُخفي 404.");
