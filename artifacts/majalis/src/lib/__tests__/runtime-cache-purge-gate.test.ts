/**
 * بوابة: تنظيف كاش العرض عند تغيّر النسخة + SW network-first للبيانات.
 * تشغيل: node --import tsx src/lib/__tests__/runtime-cache-purge-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const purge = read("src/lib/runtime-cache-purge.ts");
const main = read("src/main.tsx");
const sw = read("public/sw.js");
const html = read("index.html");
const staticJson = read("src/lib/static-json-cache.ts");
const vercel = read("vercel.json");

assert.match(purge, /majalis_app_version/);
assert.match(purge, /purgeStaleRuntimeCaches/);
assert.match(purge, /refreshAppAndPurgeCaches/);
assert.match(purge, /__MAJALIS_CLEAR_CACHE__/);
assert.match(purge, /installMajalisClearCacheDebug/);
assert.match(purge, /static-json:/);

assert.match(main, /purgeStaleRuntimeCaches|runBootSequenceBeforeMount/);
assert.match(main, /installMajalisClearCacheDebug/);
assert.doesNotMatch(main, /await\s+purgeStaleRuntimeCaches/);
assert.match(purge, /purgeLegacyColdBootKeysSync/);

assert.match(sw, /networkFirstThenCache/);
assert.match(sw, /pathname === "\/version\.json"/);
assert.match(sw, /pathname === "\/sw-version\.js"/);
{
  const shell = sw.match(/const STATIC_SHELL_ASSETS = \[([\s\S]*?)\];/)?.[1] ?? "";
  assert.doesNotMatch(shell, /sw-version/);
  assert.doesNotMatch(shell, /manifest\.json/);
  assert.doesNotMatch(shell, /version\.json/);
}

assert.match(html, /v11-startup-stable-2026-08|v12-startup-gate-2026-08|v13-startup-shell-stable-2026-09/);
assert.match(html, /majalis_force_cache_purge/);
assert.match(html, /classList\.add\("light"/);
assert.match(html, /storedTheme === "auto"/);
assert.doesNotMatch(
  html,
  /storedTheme === "light" \? "light"\s*: storedTheme === "dark" \? "dark"\s*: \(window\.matchMedia/,
  "لا سقوط إلى prefers-color-scheme عند غياب الاختيار",
);

assert.match(staticJson, /cache:\s*"no-store"/);
assert.match(staticJson, /isLikelyOnline/);

assert.match(vercel, /\/data\/\(\.\*\)[\s\S]*?max-age=0,\s*must-revalidate/);

console.log("\nruntime-cache-purge-gate.test.ts: ok");
