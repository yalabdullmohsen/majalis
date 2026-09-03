#!/usr/bin/env node
/**
 * يحمي 404 الحقيقية لـ/scholars/:id والمسارات المجهولة.
 * المكتبة أُزيلت علنًا → /library و/library/:id تحويل دائم، لا prerender.
 *
 * التشغيل: node --import tsx scripts/test-dynamic-404-safety.mjs
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

const { ISLAMIC_HISTORY_ITEMS } = await importSrc("src/data/islamic-history/index.ts");

for (const item of ISLAMIC_HISTORY_ITEMS) {
  const p = resolve(distDir, "tarikh-islami", item.id, "index.html");
  if (!existsSync(p)) failures.push(`عنصر تاريخ بلا prerender: ${item.id} (سيرجع 404 حقيقية خطأً)`);
}

const vercel = JSON.parse(readFileSync(resolve(appRoot, "vercel.json"), "utf8"));
const redirects = vercel.redirects || [];
const rewrites = vercel.rewrites || [];

const libraryHubRedirect = redirects.some(
  (r) => r.source === "/library" && (r.destination === "/" || r.destination === "/search"),
);
const libraryBookRedirect = redirects.some(
  (r) => typeof r.source === "string" && r.source.startsWith("/library/") && r.permanent === true,
);
if (!libraryHubRedirect) failures.push("vercel.json: مفقود تحويل /library إلى / أو /search");
if (!libraryBookRedirect) failures.push("vercel.json: مفقود تحويل /library/:path* للروابط القديمة");

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
    (r.source.startsWith("/tarikh-islami") || r.source.startsWith("/library")),
);
if (forbiddenSpa.length) {
  failures.push("vercel.json: tarikh-islami/ أو library/ يجب ألا تُعاد كتابتها إلى /index.html");
}

const muezzinsRedirect = redirects.some(
  (r) => typeof r.source === "string" && r.source.startsWith("/muezzins"),
);
if (!muezzinsRedirect) {
  failures.push("vercel.json: مفقود تحويل /muezzins إلى /adhan-settings");
}

if (!existsSync(resolve(distDir, "404.html"))) {
  failures.push("dist/404.html غير موجود — الـslugs غير الصحيحة ستحصل على صفحة 404 فارغة من Vercel بدل الصفحة المصمَّمة.");
}

console.log(`فُحص: ${ISLAMIC_HISTORY_ITEMS.length} عنصر تاريخ + تحويلات المكتبة.`);
console.log(`rewrites إلى /index.html (SPA فقط): ${spaRewrites.length}`);

if (failures.length) {
  console.error(`\n❌ فشل فحص أمان 404 الديناميكية (${failures.length}):`);
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}

console.log("✓ سجلات التاريخ لها prerender، والمكتبة محوّلة علنًا — ولا catch-all يُخفي 404.");
