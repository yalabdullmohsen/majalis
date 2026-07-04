# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 12-performance.spec.ts >> Performance — الأداء >> [/] Core Web Vitals
- Location: tests/12-performance.spec.ts:43:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * Performance tests — FCP, LCP, CLS for key pages.
  3  |  * Thresholds based on Google "Good" CWV targets (< 0.1 CLS, < 2500ms LCP).
  4  |  *
  5  |  * DEV NOTE: CLS measurements in Playwright run with a clean browser profile
  6  |  * (no cached fonts). Google Fonts loaded via font-display:swap cause reflow
  7  |  * when Amiri Quran / Noto Naskh load. In production with cached fonts,
  8  |  * CLS drops to < 0.05 on most pages. Per-page overrides below reflect
  9  |  * measured dev-environment baselines so the suite stays green.
  10 |  */
  11 | import { test, expect } from "@playwright/test";
  12 | import { measurePerf } from "./helpers";
  13 | 
  14 | const THRESHOLDS = { fcp: 3000, lcp: 5000, cls: 0.25 };
  15 | 
  16 | // Per-page CLS overrides for uncached-font dev environment.
  17 | // Values are generous baselines measured locally — production (cached fonts) would be < 0.1.
  18 | // Keep these high enough to catch real regressions, not to enforce production targets.
  19 | const PAGE_CLS_LIMIT: Record<string, number> = {
  20 |   "/quran":   0.65, // Amiri Quran font swap + async surah list (measured: 0.45-0.48)
  21 |   "/lessons": 0.70, // async lesson data + font swap (measured: 0.34-0.58)
  22 |   "/hadith":  0.30, // async card grid + font swap (measured: 0.18-0.25)
  23 |   "/adhkar":  1.0,  // many Arabic text cards + font swap (measured: 0.64-0.91)
  24 | };
  25 | 
  26 | interface PerfResult {
  27 |   page: string;
  28 |   fcp: number | null;
  29 |   lcp: number | null;
  30 |   cls: number | null;
  31 | }
  32 | 
  33 | const results: PerfResult[] = [];
  34 | 
  35 | const PERF_PAGES = ["/", "/quran", "/hadith", "/lessons", "/adhkar"];
  36 | 
  37 | test.describe.configure({ mode: "serial" });
  38 | 
  39 | test.describe("Performance — الأداء", () => {
  40 |   test.skip(({ browserName }) => browserName !== "chromium", "CWV only measured in Chromium");
  41 | 
  42 |   for (const path of PERF_PAGES) {
  43 |     test(`[${path}] Core Web Vitals`, async ({ page }) => {
> 44 |       await page.goto(path, { waitUntil: "load" });
     |                  ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  45 |       await page.waitForTimeout(1000);
  46 |       const perf = await measurePerf(page);
  47 |       results.push({ page: path, ...perf });
  48 | 
  49 |       const clsLimit = PAGE_CLS_LIMIT[path] ?? THRESHOLDS.cls;
  50 |       console.log(
  51 |         `\n📊 ${path}\n` +
  52 |         `   FCP: ${perf.fcp ?? "N/A"}ms  (هدف: <${THRESHOLDS.fcp}ms)\n` +
  53 |         `   LCP: ${perf.lcp ?? "N/A"}ms  (هدف: <${THRESHOLDS.lcp}ms)\n` +
  54 |         `   CLS: ${perf.cls ?? "N/A"}    (عتبة: <${clsLimit})`,
  55 |       );
  56 | 
  57 |       if (perf.fcp !== null)
  58 |         expect(perf.fcp, `FCP في ${path} بطيء جداً`).toBeLessThan(THRESHOLDS.fcp);
  59 |       if (perf.lcp !== null)
  60 |         expect(perf.lcp, `LCP في ${path} بطيء جداً`).toBeLessThan(THRESHOLDS.lcp);
  61 |       if (perf.cls !== null)
  62 |         expect(perf.cls, `CLS في ${path} مرتفع جداً (عتبة: ${clsLimit})`).toBeLessThan(clsLimit);
  63 |     });
  64 |   }
  65 | 
  66 |   test("summary report", async () => {
  67 |     if (results.length === 0) return;
  68 |     console.log("\n═══════════════════ تقرير الأداء ═══════════════════");
  69 |     console.log(`${"الصفحة".padEnd(25)} ${"FCP".padStart(8)} ${"LCP".padStart(8)} ${"CLS".padStart(8)}`);
  70 |     console.log("─".repeat(55));
  71 |     for (const r of results) {
  72 |       const clsLimit = PAGE_CLS_LIMIT[r.page] ?? THRESHOLDS.cls;
  73 |       const fcpOk = r.fcp == null || r.fcp < THRESHOLDS.fcp;
  74 |       const lcpOk = r.lcp == null || r.lcp < THRESHOLDS.lcp;
  75 |       const clsOk = r.cls == null || r.cls < clsLimit;
  76 |       const status = fcpOk && lcpOk && clsOk ? "✅" : "⚠️ ";
  77 |       console.log(
  78 |         `${status} ${r.page.padEnd(23)}` +
  79 |         ` ${(r.fcp != null ? `${r.fcp}ms` : "N/A").padStart(8)}` +
  80 |         ` ${(r.lcp != null ? `${r.lcp}ms` : "N/A").padStart(8)}` +
  81 |         ` ${(r.cls != null ? `${r.cls}` : "N/A").padStart(8)}`,
  82 |       );
  83 |     }
  84 |     console.log("═".repeat(55));
  85 |     console.log("  * عتبات CLS مُعدَّلة لبيئة التطوير (بدون font cache)");
  86 |     console.log("═".repeat(55));
  87 |   });
  88 | });
  89 | 
```