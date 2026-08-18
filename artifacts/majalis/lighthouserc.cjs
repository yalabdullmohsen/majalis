/**
 * بوابة LHCI — عتبات انحدار واقعية (لا حلم 100).
 * المرجع الرسمي للإعلان = PSI على الإنتاج بعد تأكيد SHA.
 * هذا الملف يقيس بناء CI (أو LHCI_URL) ويمنع الدمج عند الانحدار.
 *
 * خط أساس PSI فحص 10 (2026-08-18 ≈14:05، جوال، majlisilm.com):
 *   أداء 52 · CLS 0.017 · LCP 4.7ث · TBT 1100مل.ث · FCP 3.7ث · حظر عرض 1610مل.ث
 *   a11y = BP = SEO = 100
 *
 * معايرة LHCI↔PSI — الخيار (أ):
 *   throttling أدناه = إعدادات PSI للجوال (Slow 4G simulate).
 *   الخيار (ب) «نصف أرقام PSI» مرفوض: LHCI يقيس LCP ≈7.1ث بينما PSI 4.7ث،
 *   فنصف الهدف (2750ms) سيفشل البوابة دائماً. الفجوة ليست نقص throttling.
 *
 * عتبات حمراء بعد تحصين فحص 10:
 *   warn:  أداء ≥ 0.75
 *   error: CLS ≤ 0.030 · TBT ≤ 900ms · LCP ≤ 8000ms · DOM ≤ 1200
 *          a11y=1 · BP=1 · SEO=1
 *          حظر عرض ≤ 1800ms (سقف انحدار؛ الهدف 300ms بعد إصلاح المسار الحاجب)
 *   warn:  forced-reflow · unused-css/js (مللي ثانية لا KiB)
 * هدف إعلان PSI لـ LCP = 5500ms — لا يُفرض على LHCI قبل أن ينخفض وسيط CI تحت 5500
 * (وسيط LHCI الحالي ≈7120ms؛ 5500 ستفشل Verify build).
 * بعد كل تحسّن مثبت بـPSI تُخفَّض العتبة في نفس الـPR.
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
      // ميزانية JS/CSS بالبايت تبقى في budget.json للتوثيق —
      // تدقيق unused-*-rules يعرّض numericValue بالمللي ثانية (توفير محتمل) لا بالبايت.
      assertions: {
        "categories:performance": ["warn", { minScore: 0.75 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 8000 }],
        "total-blocking-time": ["error", { maxNumericValue: 900 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.03 }],
        "dom-size": ["error", { maxNumericValue: 1200 }],
        // سقف انحدار أحمر فوق انفجار فحص 10 (1610ms). الهدف 300 يتحول لـerror في PR الحظر.
        "render-blocking-resources": ["error", { maxNumericValue: 1800 }],
        // numericValue = overallSavingsMs لا KiB. الهدف المعلن: CSS≤20KiB · JS≤40KiB.
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
