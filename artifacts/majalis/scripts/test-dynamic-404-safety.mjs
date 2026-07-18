#!/usr/bin/env node
/**
 * يحمي 404 الحقيقية لـ/scholars/:id و/library/:id من التحول إلى تعطيل صفحات صحيحة.
 *
 * السياق: vercel.json يستثني scholars/ وlibrary/ من rewrite الالتقاط العام حتى تسقط
 * الـslugs غير الموجودة على 404.html حقيقية بدل SPA fallback. هذا آمن فقط إذا كان
 * كل سجل حي له ملف prerender مطابق تمامًا — فجوة واحدة تعني صفحة صحيحة تُصبح 404 حقيقية.
 *
 * يفشل إذا:
 *  1. أي سجل في scholars-data.ts أو library-catalog.ts بلا dist/<type>/<id>/index.html.
 *  2. vercel.json لم يعد يستثني scholars/ أو library/ من rewrite الالتقاط العام.
 *  3. dist/404.html غير موجود.
 *
 * التشغيل بعد pnpm run build: node scripts/test-dynamic-404-safety.mjs
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

const { SCHOLARS } = await import(pathToFileURL(resolve(appRoot, "src/lib/scholars-data.ts")).href);
const { LIBRARY_CATALOG } = await import(pathToFileURL(resolve(appRoot, "src/lib/library-catalog.ts")).href);

for (const s of SCHOLARS) {
  const p = resolve(distDir, "scholars", s.id, "index.html");
  if (!existsSync(p)) failures.push(`عالِم بلا prerender: ${s.id} (سيرجع 404 حقيقية خطأً)`);
}

for (const b of LIBRARY_CATALOG) {
  const p = resolve(distDir, "library", b.id, "index.html");
  if (!existsSync(p)) failures.push(`كتاب بلا prerender: ${b.id} (سيرجع 404 حقيقية خطأً)`);
}

const vercelConfig = readFileSync(resolve(appRoot, "vercel.json"), "utf8");
const catchAll = JSON.parse(vercelConfig).rewrites?.find((r) => r.destination === "/index.html");
if (!catchAll || !catchAll.source.includes("scholars/") || !catchAll.source.includes("library/")) {
  failures.push("vercel.json: rewrite الالتقاط العام لم يعد يستثني scholars/ أو library/ — الـ404 الحقيقية معطّلة.");
}

if (!existsSync(resolve(distDir, "404.html"))) {
  failures.push("dist/404.html غير موجود — الـslugs غير الصحيحة ستحصل على صفحة 404 فارغة من Vercel بدل الصفحة المصمَّمة.");
}

console.log(`فُحص: ${SCHOLARS.length} عالِمًا و${LIBRARY_CATALOG.length} كتابًا.`);

if (failures.length) {
  console.error(`\n❌ فشل فحص أمان 404 الديناميكية (${failures.length}):`);
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}

console.log("✓ كل سجل حي (عالِم/كتاب) له prerender مطابق — 404 الحقيقية آمنة.");
