/**
 * اشتقاق عتبات LHCI للمعاينة من قياس main الشاهد + هامش 10%.
 * لا تُنسخ عتبات FCP/SI من PSI — انظر config/psi-production-targets.json.
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const BASELINE_PATH = path.join(ROOT, "config/lhci-main-baseline.json");
const PSI_TARGETS_PATH = path.join(ROOT, "config/psi-production-targets.json");

/** هامش فوق وسيط main الشاهد — 10% */
const PREVIEW_MARGIN = 0.1;

/** عتبات ثابتة (ليست جزءاً من فجوة LHCI↔PSI) — من فحص 12 */
const FIXED_PREVIEW = {
  tbtMs: 400,
  domSize: 1200,
  renderBlockingMs: 200,
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ceilMs(value) {
  return Math.ceil(value);
}

function ceilFloat(value, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.ceil(value * factor) / factor;
}

function deriveFromBaseline(medianValue, { asFloat = false, decimals = 4 } = {}) {
  const derived = medianValue * (1 + PREVIEW_MARGIN);
  return asFloat ? ceilFloat(derived, decimals) : ceilMs(derived);
}

function loadBaseline() {
  return readJson(BASELINE_PATH);
}

function loadPsiTargets() {
  return readJson(PSI_TARGETS_PATH);
}

/**
 * عتبات LHCI للمعاينة — main الشاهد + 10%.
 * FCP/SI ≈ 4500ms (4100 × 1.1 = 4510 → 4500 خطأ).
 */
function getPreviewThresholds() {
  const { median } = loadBaseline();
  return {
    cls: deriveFromBaseline(median.cls, { asFloat: true }),
    lcpMs: deriveFromBaseline(median.lcpMs),
    fcpMs: deriveFromBaseline(median.fcpMs),
    siMs: deriveFromBaseline(median.siMs),
    ...FIXED_PREVIEW,
    sourceRunId: loadBaseline().sourceRunId,
    margin: PREVIEW_MARGIN,
  };
}

function getPreviewAssertions() {
  const t = getPreviewThresholds();
  return {
    "categories:performance": ["warn", { minScore: 0.75 }],
    "categories:accessibility": ["error", { minScore: 1 }],
    "categories:best-practices": ["error", { minScore: 1 }],
    "categories:seo": ["error", { minScore: 1 }],
    "largest-contentful-paint": ["error", { maxNumericValue: t.lcpMs }],
    "total-blocking-time": ["error", { maxNumericValue: t.tbtMs }],
    "first-contentful-paint": ["error", { maxNumericValue: t.fcpMs }],
    "speed-index": ["error", { maxNumericValue: t.siMs }],
    "cumulative-layout-shift": ["error", { maxNumericValue: t.cls }],
    "dom-size": ["error", { maxNumericValue: t.domSize }],
    "render-blocking-resources": ["error", { maxNumericValue: t.renderBlockingMs }],
    "unused-css-rules": ["warn", { maxNumericValue: 80 }],
    "unused-javascript": ["warn", { maxNumericValue: 200 }],
    "forced-reflow-insight": ["warn", { minScore: 1 }],
  };
}

module.exports = {
  PREVIEW_MARGIN,
  FIXED_PREVIEW,
  BASELINE_PATH,
  PSI_TARGETS_PATH,
  loadBaseline,
  loadPsiTargets,
  deriveFromBaseline,
  getPreviewThresholds,
  getPreviewAssertions,
};
