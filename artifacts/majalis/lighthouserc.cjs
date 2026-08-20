/**
 * بوابة LHCI — بيئة المعاينة (CI / vite preview).
 *
 * عتبات FCP/SI/LCP/CLS تُشتق من main الشاهد + 10% — انظر:
 *   config/lhci-main-baseline.json (run 32307284830)
 *   scripts/lhci-thresholds.cjs
 *
 * أهداف PSI الحقيقية (FCP 2200 / SI 2500) — بوابة إنتاج فقط:
 *   config/psi-production-targets.json
 *   scripts/verify-psi-production-gate.mjs
 */
const { getPreviewAssertions, getPreviewThresholds } = require("./scripts/lhci-thresholds.cjs");

const collectUrl = (process.env.LHCI_URL || "http://127.0.0.1:24216/").replace(/\/?$/, "/");
const chromePath = process.env.CHROME_PATH || undefined;

const preview = getPreviewThresholds();

/** PSI / Lighthouse Slow 4G — يجب أن يبقى مطابقاً لثوابت lighthouse core/config/constants.js */
const PSI_MOBILE_THROTTLING = {
  rttMs: 150,
  throughputKbps: 1638.4,
  requestLatencyMs: 562.5,
  downloadThroughputKbps: 1638.4,
  uploadThroughputKbps: 750,
  cpuSlowdownMultiplier: 4,
};

module.exports = {
  ci: {
    collect: {
      url: [collectUrl],
      numberOfRuns: 3,
      ...(chromePath ? { chromePath } : {}),
      settings: {
        formFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 412,
          height: 823,
          deviceScaleFactor: 1.75,
          disabled: false,
        },
        throttlingMethod: "simulate",
        throttling: PSI_MOBILE_THROTTLING,
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        chromeFlags: "--no-sandbox --headless --disable-gpu",
      },
    },
    assert: {
      assertions: getPreviewAssertions(),
    },
    upload: {
      target: "filesystem",
      outputDir: "./lhci-reports",
    },
  },
  /** للتشخيص — lhci-thresholds.cjs */
  _previewThresholds: preview,
};
