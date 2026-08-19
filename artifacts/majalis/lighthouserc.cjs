/**
 * بوابة LHCI — عتبات انحدار واقعية (لا حلم 100).
 * المرجع الرسمي للإعلان = PSI على الإنتاج بعد تأكيد SHA.
 * هذا الملف يقيس بناء CI (أو LHCI_URL) ويمنع الدمج عند الانحدار.
 *
 * خط أساس PSI فحص 12 (2026-08-19، جوال، majlisilm.com):
 *   أداء 70 · CLS 0.006 · LCP 5.7ث · TBT 330مل.ث · FCP 2.0ث · SI 2.0ث
 *   a11y = BP = SEO = 100 · حظر عرض PASSED · forced-reflow PASSED
 *
 * معايرة LHCI↔PSI — الخيار (أ):
 *   throttling أدناه = إعدادات PSI للجوال (Slow 4G simulate).
 *
 * عتبات حمراء v3 — تثبيت مكاسب فحص 12:
 *   warn:  أداء ≥ 0.75
 *   error: CLS ≤ 0.020 · TBT ≤ 400ms · FCP ≤ 2200ms · SI ≤ 2500ms · LCP ≤ 6000ms
 *          DOM ≤ 1200 · a11y=1 · BP=1 · SEO=1
 *          حظر عرض ≤ 200ms · forced-reflow warn
 *   LCP ≤ 2500ms — يُخفَّض في perf/lcp-static-shell-v2 بعد PSI
 */
const collectUrl = (process.env.LHCI_URL || "http://127.0.0.1:24216/").replace(/\/?$/, "/");
const chromePath = process.env.CHROME_PATH || undefined;

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
      assertions: {
        "categories:performance": ["warn", { minScore: 0.75 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 6000 }],
        "total-blocking-time": ["error", { maxNumericValue: 400 }],
        "first-contentful-paint": ["error", { maxNumericValue: 2200 }],
        "speed-index": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.02 }],
        "dom-size": ["error", { maxNumericValue: 1200 }],
        "render-blocking-resources": ["error", { maxNumericValue: 200 }],
        "unused-css-rules": ["warn", { maxNumericValue: 80 }],
        "unused-javascript": ["warn", { maxNumericValue: 200 }],
        "forced-reflow-insight": ["warn", { minScore: 1 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./lhci-reports",
    },
  },
};
