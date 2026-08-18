/**
 * بوابة: LHCI إلزامي في CI بعتبات انحدار واقعية.
 * تشغيل: node --import tsx src/lib/__tests__/lhci-budget-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repo = resolve(root, "../..");
const rc = readFileSync(resolve(root, "lighthouserc.cjs"), "utf8");
const budget = readFileSync(resolve(root, "budget.json"), "utf8");
const vite = readFileSync(resolve(root, "vite.config.ts"), "utf8");
const pkg = readFileSync(resolve(root, "package.json"), "utf8");
const ci = readFileSync(resolve(repo, ".github/workflows/ci.yml"), "utf8");

assert.match(rc, /LHCI_URL/, "عنوان القياس قابل للضبط");
assert.match(rc, /formFactor:\s*"mobile"/, "قياس جوال");
assert.match(rc, /numberOfRuns:\s*3/, "٣ تشغيلات");
assert.match(rc, /"warn"[\s\S]*minScore:\s*0\.75/, "أداء 0.75 تحذير — ليس 0.99 حلماً");
assert.doesNotMatch(rc, /minScore:\s*0\.99/, "لا عتبة أداء حلم 0.99 تُفشل أو تُضلّل");
assert.match(rc, /categories:accessibility[\s\S]*minScore:\s*1/, "a11y = 1 خطأ");
assert.match(rc, /categories:best-practices[\s\S]*minScore:\s*1/, "BP = 1 خطأ");
assert.match(rc, /categories:seo[\s\S]*minScore:\s*1/, "SEO = 1 خطأ");
assert.match(rc, /largest-contentful-paint[\s\S]*maxNumericValue:\s*8000/, "LCP ≤8000ms خطأ — عتبة CI بعد قياس 7.1ث");
assert.match(rc, /total-blocking-time[\s\S]*maxNumericValue:\s*900/, "TBT ≤900ms خطأ");
assert.match(rc, /cumulative-layout-shift[\s\S]*maxNumericValue:\s*0\.08/, "CLS ≤0.08 خطأ");
assert.doesNotMatch(rc, /budgetFile/, "ميزانية الموارد ليست خطأ دمج في هذه الدفعة");
assert.match(budget, /"budget":\s*150/, "JS موثّق ≤150KiB (غير ملزم بعد)");
assert.match(vite, /sourcemap:\s*"hidden"/, "sourcemap مخفي");
assert.match(pkg, /strip:sourcemaps/, "حذف الخرائط بعد البناء");
assert.match(pkg, /"lighthouse:ci"/, "أمر قياس");
assert.match(pkg, /@lhci\/cli@0\.15\./, "إصدار LHCI منشور على npm");

assert.match(ci, /name: LHCI home \(mobile\)/, "وظيفة LHCI في ci.yml");
assert.match(ci, /lhci-home/, "معرّف الوظيفة lhci-home");
assert.match(
  ci,
  /name: Verify build[\s\S]*- lhci-home/,
  "Verify build ينتظر LHCI — الفحص إلزامي لا اختياري",
);
assert.match(
  ci,
  /check_req "lhci-home" "\$NEED_BUILD"/,
  "Verify build يفشل إن فشل LHCI عند وجود بناء",
);

console.log("lhci-budget-gate.test.ts: ok");
