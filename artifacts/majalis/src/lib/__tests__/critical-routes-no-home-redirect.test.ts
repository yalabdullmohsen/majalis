/**
 * بوابة: مسارات حرجة لا تُحوَّل للرئيسية بلا قصد.
 * تشغيل: node --import tsx src/lib/__tests__/critical-routes-no-home-redirect.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");

function routeBlock(path: string): string {
  const re = new RegExp(`<Route\\s+path="${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>[\\s\\S]*?</Route>`, "m");
  const m = app.match(re);
  assert.ok(m, `مسار ناقص: ${path}`);
  return m[0];
}

for (const path of ["/library", "/updates", "/knowledge-graph", "/more"]) {
  const block = routeBlock(path);
  assert.equal(
    /Redirect\s+to=["']\/["']/.test(block),
    false,
    `${path} لا يجوز أن يحوّل إلى /`,
  );
  assert.match(block, /SafeLazyRoute|component=/, `${path} يجب أن يعرض صفحة`);
}

assert.match(app, /path="\/prayer"[^>]*>\s*<Redirect\s+to="\/prayer-times"/);
assert.match(app, /path="\/quran\/mushaf"[^>]*>\s*<Redirect\s+to="\/mushaf"/);
assert.match(app, /LibraryPage/);
assert.match(app, /MorePage/);
assert.match(app, /UpdatesPage/);
assert.match(app, /KnowledgeGraphPage/);

const vercel = readFileSync(resolve(root, "vercel.json"), "utf8");
for (const path of ["/library", "/updates", "/knowledge-graph"]) {
  assert.equal(
    new RegExp(
      `"source"\\s*:\\s*"${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[\\s\\S]{0,120}"destination"\\s*:\\s*"/"`,
    ).test(vercel),
    false,
    `vercel.json لا يجوز أن يحوّل ${path} إلى /`,
  );
}

console.log("critical-routes-no-home-redirect.test.ts: ok");
