/**
 * scripts/verify-seo-prerender-coverage.mjs
 *
 * يضمن أن كل مسار في seo-routes.json (عدا "/") له ملف
 * seo-prerender/<path>/index.html — يمنع تسرب قالب الرئيسية في الإنتاج.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const seo = JSON.parse(readFileSync(resolve(root, "src/lib/seo-routes.json"), "utf8"));

const missing = [];
for (const route of seo.routes || []) {
  const path = route.path;
  if (!path || path === "/") continue;
  const file = resolve(root, "seo-prerender", path.replace(/^\//, ""), "index.html");
  if (!existsSync(file)) missing.push(path);
}

if (missing.length) {
  console.error(`❌ ناقص seo-prerender لـ ${missing.length} مسارًا:`);
  for (const p of missing.slice(0, 40)) console.error(`  - ${p}`);
  if (missing.length > 40) console.error(`  … و${missing.length - 40} أخرى`);
  console.error("شغّل: pnpm run generate:seo (أو node --import tsx scripts/generate-seo.mjs) ثم ارفع الملفات الناقصة.");
  process.exit(1);
}

console.log(`✓ تغطية seo-prerender كاملة لـ ${(seo.routes || []).length} مسارًا في seo-routes.json`);
