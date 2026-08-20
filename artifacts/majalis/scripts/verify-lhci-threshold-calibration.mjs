#!/usr/bin/env node
/**
 * بوابة: أي عتبة LHCI للمعاينة تُشتق من main الشاهد + 10% — لا تُنسخ من PSI.
 * يفشل إن كانت العتبة أشدّ من قياس main الحالي.
 *
 * Usage: node scripts/verify-lhci-threshold-calibration.mjs
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const {
  loadBaseline,
  loadPsiTargets,
  getPreviewThresholds,
  getPreviewAssertions,
  deriveFromBaseline,
} = require("./lhci-thresholds.cjs");

const baseline = loadBaseline();
const psi = loadPsiTargets();
const preview = getPreviewThresholds();
const assertions = getPreviewAssertions();
const lhciRc = require(resolve(ROOT, "lighthouserc.cjs"));

const rc = readFileSync(resolve(ROOT, "lighthouserc.cjs"), "utf8");

/** مقاييس «أقل = أسوأ» — العتبة يجب ألا تكون أشدّ من وسيط main */
const MAX_METRICS = [
  { key: "cls", baselineKey: "cls", previewKey: "cls", audit: "cumulative-layout-shift" },
  { key: "lcpMs", baselineKey: "lcpMs", previewKey: "lcpMs", audit: "largest-contentful-paint" },
  { key: "fcpMs", baselineKey: "fcpMs", previewKey: "fcpMs", audit: "first-contentful-paint" },
  { key: "siMs", baselineKey: "siMs", previewKey: "siMs", audit: "speed-index" },
];

for (const m of MAX_METRICS) {
  const mainMedian = baseline.median[m.baselineKey];
  const expected = deriveFromBaseline(mainMedian, {
    asFloat: m.key === "cls",
  });
  const actual = preview[m.previewKey];

  assert.ok(
    actual >= mainMedian,
    `${m.key}: العتبة ${actual} أشدّ من قياس main ${mainMedian} (run ${baseline.sourceRunId})`,
  );
  assert.equal(
    actual,
    expected,
    `${m.key}: العتبة ${actual} ≠ main+10% (${expected}) — لا تُنسخ يدوياً من PSI`,
  );

  const assertion = assertions[m.audit];
  assert.ok(assertion, `assertion مفقود: ${m.audit}`);
  assert.equal(assertion[0], "error", `${m.audit} يجب أن يكون error لا warn`);
  assert.equal(assertion[1].maxNumericValue, actual, `lighthouserc assertions.${m.audit} غير متزامن`);
}

/** FCP/SI لا تُنسخ من PSI */
assert.notEqual(
  preview.fcpMs,
  psi.targets.fcpMs,
  `FCP LHCI (${preview.fcpMs}) = PSI (${psi.targets.fcpMs}) — ممنوع`,
);
assert.notEqual(
  preview.siMs,
  psi.targets.siMs,
  `SI LHCI (${preview.siMs}) = PSI (${psi.targets.siMs}) — ممنوع`,
);
assert.ok(
  preview.fcpMs > baseline.median.fcpMs,
  "FCP LHCI يجب أن يكون فوق وسيط main (≈4500ms)",
);
assert.ok(
  preview.siMs > baseline.median.siMs,
  "SI LHCI يجب أن يكون فوق وسيط main (≈4500ms)",
);

/** lighthouserc يشتق من lhci-thresholds.cjs */
assert.match(rc, /lhci-thresholds\.cjs/, "lighthouserc يستورد lhci-thresholds.cjs");
assert.match(rc, /getPreviewAssertions\(\)/, "lighthouserc يستخدم getPreviewAssertions()");

for (const m of MAX_METRICS) {
  const fromRc = lhciRc.ci.assert.assertions[m.audit];
  assert.deepEqual(fromRc, assertions[m.audit], `lighthouserc.${m.audit} متزامن`);
}
assert.doesNotMatch(
  rc,
  /first-contentful-paint[\s\S]*maxNumericValue:\s*2200/,
  "لا FCP 2200 في lighthouserc — ذلك لـ PSI الإنتاج",
);
assert.doesNotMatch(
  rc,
  /speed-index[\s\S]*maxNumericValue:\s*2500/,
  "لا SI 2500 في lighthouserc — ذلك لـ PSI الإنتاج",
);

console.log(
  `verify-lhci-threshold-calibration.mjs: ok — run ${baseline.sourceRunId} · FCP/SI=${preview.fcpMs}ms · LCP=${preview.lcpMs}ms · CLS=${preview.cls}`,
);
