module.exports = {
  ci: {
    collect: {
      url: ["https://majlisilm.com/"],
      numberOfRuns: 3,
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
      },
    },
    assert: {
      budgetFile: "./budget.json",
      assertions: {
        "categories:performance": ["error", { minScore: 0.99 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 1300 }],
        "total-blocking-time": ["error", { maxNumericValue: 150 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
