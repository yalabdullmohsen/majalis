/**
 * يضمن توحيد /islamic-history → /tarikh-islami وعدم إعادة توجيه الاستكشاف للرئيسية.
 * تشغيل: node --import tsx src/lib/__tests__/islamic-history-redirect-gate.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const nav = readFileSync(resolve(root, "src/lib/navigation-back.ts"), "utf8");
const routes = readFileSync(resolve(root, "src/AppRoutes.tsx"), "utf8");
const vercel = readFileSync(resolve(root, "vercel.json"), "utf8");

let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    console.error(`  ✗ ${msg}`);
    failed++;
  }
}

assert(
  /islamic-history[\s\S]{0,120}\/tarikh-islami/.test(nav) && !/return "\/islamic-history"/.test(nav),
  "navigation-back يعيد إلى /tarikh-islami",
);
assert(/path="\/islamic-history"/.test(routes) && /Redirect to="\/tarikh-islami"/.test(routes), "AppRoutes يحوّل islamic-history");
assert(/path="\/knowledge-map"[\s\S]{0,80}knowledge-graph/.test(routes), "knowledge-map → knowledge-graph");
assert(/path="\/explore"[\s\S]{0,80}\/sections/.test(routes), "explore → sections");
assert(/"source":\s*"\/islamic-history"[\s\S]{0,80}"destination":\s*"\/tarikh-islami"/.test(vercel), "vercel islamic-history");
assert(/"source":\s*"\/knowledge-map"[\s\S]{0,80}"destination":\s*"\/knowledge-graph"/.test(vercel), "vercel knowledge-map");
assert(/"source":\s*"\/explore"[\s\S]{0,80}"destination":\s*"\/sections"/.test(vercel), "vercel explore");

if (failed > 0) process.exit(1);
console.log("islamic-history-redirect-gate: ok");
