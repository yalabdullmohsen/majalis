/**
 * بوابة LHCI — عتبات انحدار واقعية (لا حلم 100).
 * المرجع الرسمي للإعلان = PSI على الإنتاج بعد تأكيد SHA.
 * هذا الملف يقيس بناء CI (أو LHCI_URL) ويمنع الدمج عند الانحدار.
 *
 * عتبات حمراء مضبوطة على الحالة الراهنة (2026-08-18، إنتاج 9954d5c6):
 *   warn:  أداء ≥ 0.75
 *   error: CLS ≤ 0.08 · TBT ≤ 900ms · LCP ≤ 6000ms · a11y=1 · BP=1 · SEO=1
 * بعد كل تحسّن مثبت بـPSI تُخفَّض العتبة في نفس الـPR.
 */
const collectUrl = (process.env.LHCI_URL || "http://127.0.0.1:24216/").replace(/\/?$/, "/");
const chromePath = process.env.CHROME_PATH || undefined;

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
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        chromeFlags: "--no-sandbox --headless --disable-gpu",
      },
    },
    assert: {
      // ميزانية JS/CSS تبقى في budget.json للتوثيق — ليست خطأ دمج حتى تُثبَّت بـPSI.
      assertions: {
        "categories:performance": ["warn", { minScore: 0.75 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 6000 }],
        "total-blocking-time": ["error", { maxNumericValue: 900 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.08 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouseci",
    },
  },
};
