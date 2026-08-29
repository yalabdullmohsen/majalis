/**
 * scripts/verify-seo-prerender-coverage.mjs
 *
 * يضمن أن كل مسار عام في seo-routes.json (عدا "/" والمسارات الخاصة)
 * له ملف seo-prerender/<path>/index.html — يمنع تسرب قالب الرئيسية في الإنتاج.
 * مسارات /admin و/dashboard لا تُصيَّر علنًا (middleware → 404 للعامة).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isPrivateSeoPath } from "./seo-path-class.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const seo = JSON.parse(readFileSync(resolve(root, "src/lib/seo-routes.json"), "utf8"));

const missing = [];
let skippedPrivate = 0;
for (const route of seo.routes || []) {
  const path = route.path;
  if (!path || path === "/") continue;
  if (isPrivateSeoPath(path)) {
    skippedPrivate += 1;
    continue;
  }
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

console.log(
  `✓ تغطية seo-prerender كاملة للمسارات العامة (${(seo.routes || []).length} في seo-routes، تُجاهل ${skippedPrivate} خاصة)`,
);
