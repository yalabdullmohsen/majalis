/**
 * بوابة: قوائم المجمع الفقهي تُبقي النتائج أثناء إعادة الجلب (بلا وميض هيكل).
 * node --import tsx src/lib/__tests__/fiqh-council-keep-previous-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const views = resolve(root, "src/views");

const targets = readdirSync(views)
  .filter((f) => f.startsWith("FiqhCouncil") && f.endsWith(".tsx"))
  .map((f) => resolve(views, f));

assert.ok(targets.length >= 8, "ملفات المجمع الفقهي موجودة");

const badBareLoading = /\{loading\s*\?\s*(\(|<Skeleton)/;
const goodKeep = /loading\s*&&\s*\w+\.length\s*===\s*0/;

let keepHits = 0;
for (const abs of targets) {
  const src = readFileSync(abs, "utf8");
  const rel = abs.slice(root.length + 1);
  // اسمح بـ loading ? فقط لعناصر غير الهيكل (مثل عدّاد النتائج)
  const skeletonBranches = [...src.matchAll(/\{loading\s*\?[\s\S]{0,80}Skeleton/g)];
  for (const m of skeletonBranches) {
    const snippet = m[0];
    assert.match(
      snippet,
      /loading\s*&&/,
      `${rel}: هيكل التحميل يجب أن يشترط غياب النتائج السابقة`,
    );
  }
  if (goodKeep.test(src)) keepHits += 1;
}

assert.ok(keepHits >= 6, `يُتوقع ≥6 صفحات keep-previous، وُجد ${keepHits}`);
assert.doesNotMatch(
  readFileSync(resolve(views, "FiqhCouncilIssuesPage.tsx"), "utf8"),
  badBareLoading,
  "IssuesPage بلا loading? هيكل عارٍ",
);

console.log(`fiqh-council-keep-previous-gate.test.ts: ok · keep=${keepHits}`);
