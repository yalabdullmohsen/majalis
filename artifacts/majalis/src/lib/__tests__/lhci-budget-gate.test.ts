/**
 * بوابة: وجود LHCI + ميزانية الإقلاع (لا تشغيل Lighthouse هنا).
 * تشغيل: node --import tsx src/lib/__tests__/lhci-budget-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const rc = readFileSync(resolve(root, "lighthouserc.cjs"), "utf8");
const budget = readFileSync(resolve(root, "budget.json"), "utf8");
const vite = readFileSync(resolve(root, "vite.config.ts"), "utf8");
const pkg = readFileSync(resolve(root, "package.json"), "utf8");

assert.match(rc, /budgetFile:\s*"\.\/budget.json"/, "ملف الميزانية مربوط");
assert.match(rc, /"warn"[\s\S]*minScore:\s*0\.99/, "أداء 0.99 تحذير حتى يعود 67");
assert.match(rc, /categories:accessibility[\s\S]*minScore:\s*1/, "a11y = 1");
assert.match(rc, /categories:best-practices[\s\S]*minScore:\s*1/, "BP = 1");
assert.match(rc, /categories:seo[\s\S]*minScore:\s*1/, "SEO = 1");
assert.match(rc, /maxNumericValue:\s*1300/, "LCP ≤1300ms");
assert.match(rc, /maxNumericValue:\s*400/, "TBT سقف انحدار ≤400ms");
assert.match(rc, /maxNumericValue:\s*0\.05/, "CLS ≤0.05 يفشل الدمج");
assert.match(rc, /formFactor:\s*"mobile"/, "قياس جوال");
assert.match(rc, /numberOfRuns:\s*3/, "٣ تشغيلات");
assert.match(budget, /"budget":\s*150/, "JS إقلاع ≤150KiB");
assert.match(budget, /"budget":\s*20/, "CSS ≤20KiB");
assert.match(budget, /"budget":\s*25/, "طلبات الشاشة الأولى ≤25");
assert.match(vite, /sourcemap:\s*"hidden"/, "sourcemap مخفي");
assert.match(pkg, /strip:sourcemaps/, "حذف الخرائط بعد البناء");
assert.match(pkg, /"lighthouse:ci"/, "أمر قياس محلي");

console.log("lhci-budget-gate.test.ts: ok");
