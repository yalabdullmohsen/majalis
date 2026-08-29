/**
 * بوابة: LHCI إلزامي في CI بعتبات معاينة مُشتقة من main الشاهد + 10%.
 * أهداف PSI (2200/2500) على الإنتاج فقط — scripts/verify-psi-production-gate.mjs
 * تشغيل: node --import tsx src/lib/__tests__/lhci-budget-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repo = resolve(root, "../..");
const require = createRequire(import.meta.url);

const { getPreviewThresholds, getPreviewAssertions, loadBaseline, loadPsiTargets } = require(
  resolve(root, "scripts/lhci-thresholds.cjs"),
);

const preview = getPreviewThresholds();
const previewAssertions = getPreviewAssertions();
const baseline = loadBaseline();
const psi = loadPsiTargets();
const lhciRc = require(resolve(root, "lighthouserc.cjs"));

const rc = readFileSync(resolve(root, "lighthouserc.cjs"), "utf8");
const budget = readFileSync(resolve(root, "budget.json"), "utf8");
const vite = readFileSync(resolve(root, "vite.config.ts"), "utf8");
const pkg = readFileSync(resolve(root, "package.json"), "utf8");
const ci = readFileSync(resolve(repo, ".github/workflows/ci.yml"), "utf8");
const baselineJson = readFileSync(resolve(root, "config/lhci-main-baseline.json"), "utf8");
const psiJson = readFileSync(resolve(root, "config/psi-production-targets.json"), "utf8");

assert.match(baselineJson, /local-home-post-intro-disable-2026-08-29/, "baseline بعد تعطيل التعريف");
assert.match(rc, /lhci-thresholds\.cjs/, "lighthouserc يشتق العتبات");
assert.match(rc, /lhci-main-baseline/, "مرجع baseline موثّق");

assert.match(rc, /LHCI_URL/, "عنوان القياس قابل للضبط");
assert.match(rc, /formFactor:\s*"mobile"/, "قياس جوال");
assert.match(rc, /numberOfRuns:\s*3/, "٣ تشغيلات");
assert.match(rc, /throttlingMethod:\s*"simulate"/, "simulate كـ PSI");
assert.match(rc, /rttMs:\s*150/, "PSI RTT 150ms");
assert.match(rc, /throughputKbps:\s*1638\.4/, "PSI throughput Slow 4G");
assert.match(rc, /cpuSlowdownMultiplier:\s*4/, "PSI CPU ×4");
assert.match(rc, /getPreviewAssertions\(\)/, "assertions مُشتقة");

const rcAssertions = lhciRc.ci.assert.assertions;
assert.match(JSON.stringify(rcAssertions), /"warn"[\s\S]*"minScore":0\.75/, "أداء 0.75 تحذير");
assert.doesNotMatch(JSON.stringify(rcAssertions), /"minScore":0\.99/, "لا عتبة أداء حلم 0.99");

assert.deepEqual(
  rcAssertions["largest-contentful-paint"],
  previewAssertions["largest-contentful-paint"],
  `LCP ≤${preview.lcpMs}ms — main+10% (شاهد ${baseline.median.lcpMs}ms)`,
);
assert.deepEqual(
  rcAssertions["total-blocking-time"],
  ["error", { maxNumericValue: 1300 }],
  "TBT ≤1300ms — الرئيسية الحقيقية بعد تعطيل التعريف (CI)",
);
assert.deepEqual(
  rcAssertions["first-contentful-paint"],
  previewAssertions["first-contentful-paint"],
  `FCP ≤${preview.fcpMs}ms — main+10% (≈4500، ليس PSI 2200)`,
);
assert.deepEqual(
  rcAssertions["speed-index"],
  previewAssertions["speed-index"],
  `SI ≤${preview.siMs}ms — main+10% (≈4500، ليس PSI 2500)`,
);
assert.deepEqual(
  rcAssertions["cumulative-layout-shift"],
  previewAssertions["cumulative-layout-shift"],
  `CLS ≤${preview.cls} — main+10%`,
);
assert.deepEqual(rcAssertions["dom-size"], ["error", { maxNumericValue: 1200 }], "DOM ≤1200");
assert.deepEqual(
  rcAssertions["render-blocking-resources"],
  ["error", { maxNumericValue: 200 }],
  "حظر عرض ≤200ms",
);
assert.ok(rcAssertions["unused-css-rules"], "unused-css warn");
assert.ok(rcAssertions["unused-javascript"], "unused-js warn");
assert.ok(rcAssertions["forced-reflow-insight"], "forced-reflow warn");
assert.doesNotMatch(rc, /budgetFile/, "ميزانية الموارد ليست خطأ دمج");

assert.equal(preview.fcpMs, 4510, "FCP معاينة = 4100 × 1.1");
assert.equal(preview.siMs, 4510, "SI معاينة = 4100 × 1.1");
assert.notEqual(preview.fcpMs, psi.targets.fcpMs, "FCP LHCI ≠ PSI");
assert.notEqual(preview.siMs, psi.targets.siMs, "SI LHCI ≠ PSI");
assert.match(psiJson, /"fcpMs":\s*2200/, "PSI إنتاج FCP 2200");
assert.match(psiJson, /"siMs":\s*2500/, "PSI إنتاج SI 2500");

assert.match(budget, /"budget":\s*150/, "JS موثّق ≤150KiB");
assert.match(vite, /sourcemap:\s*"hidden"/, "sourcemap مخفي");
assert.match(pkg, /strip:sourcemaps/, "حذف الخرائط بعد البناء");
assert.match(pkg, /"lighthouse:ci"/, "أمر قياس");
assert.match(pkg, /@lhci\/cli@0\.15\./, "إصدار LHCI");
assert.match(pkg, /verify:lhci-threshold-calibration/, "بوابة معايرة LHCI");
assert.match(pkg, /verify:psi-production-gate/, "بوابة PSI إنتاج");

assert.match(ci, /name: LHCI home \(mobile\)/, "وظيفة LHCI في ci.yml");
assert.match(ci, /lhci-home/, "معرّف lhci-home");
assert.match(ci, /name: Verify build[\s\S]*- lhci-home/, "Verify build ينتظر LHCI");
assert.match(ci, /check_req "lhci-home"/, "Verify build يفشل عند فشل LHCI");

console.log(
  `lhci-budget-gate.test.ts: ok — preview FCP/SI=${preview.fcpMs}ms · PSI=${psi.targets.fcpMs}/${psi.targets.siMs}ms`,
);
