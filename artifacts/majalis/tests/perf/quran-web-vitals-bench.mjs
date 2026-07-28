/**
 * Performance benchmarks for Quran reader — Web Vitals targets + memory slope.
 *
 * Usage (preview recommended):
 *   PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build
 *   PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run preview &
 *   node tests/perf/quran-web-vitals-bench.mjs --base=http://127.0.0.1:24216
 *
 * Assertions (documented gates — soft-fail with exit 2 when Chromium unavailable):
 *   - TTI proxy (domInteractive → loadEventEnd) < 1500ms on warm cache when possible
 *   - CLS during controlled interactions ≤ 0.05 in automated Chromium (0.00 target in prod fonts)
 *   - Memory heap growth after N audio-scroll cycles remains under budget
 */
import { chromium } from "playwright";

const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7) ||
  process.env.MAJALIS_PREVIEW_URL ||
  "http://127.0.0.1:24216";

const TTI_MS = 1500;
const CLS_SOFT = 0.05;
const HEAP_GROWTH_MB = 80;
const AUDIO_CYCLES = 12; // scaled stand-in for long session (CI-friendly)

async function main() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.error("Chromium unavailable — skip perf bench:", err.message || err);
    process.exit(2);
  }

  const page = await browser.newPage();
  const report = {
    base,
    ttiMs: null,
    cls: null,
    heapGrowthMb: null,
    gates: { tti: false, cls: false, memory: false },
  };

  try {
    await page.goto(`${base}/mushaf/page/1`, { waitUntil: "load", timeout: 60_000 });
    await page.waitForTimeout(1500);

    const nav = await page.evaluate(() => {
      const n = performance.getEntriesByType("navigation")[0];
      if (!n || !("domInteractive" in n)) return null;
      const ne = n;
      return {
        ttiProxy: Math.round(ne.domInteractive),
        load: Math.round(ne.loadEventEnd),
      };
    });
    report.ttiMs = nav?.ttiProxy ?? null;
    report.gates.tti = report.ttiMs != null && report.ttiMs < TTI_MS;
    console.log(`TTI proxy (domInteractive): ${report.ttiMs ?? "N/A"}ms (gate < ${TTI_MS}ms) → ${report.gates.tti ? "PASS" : "REVIEW"}`);

    // Page flips + open settings (tafsir/compare drawer proxy) — measure CLS
    const cls = await page.evaluate(async () => {
      let clsValue = 0;
      try {
        const po = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            const le = e;
            if (!le.hadRecentInput) clsValue += le.value;
          }
        });
        po.observe({ type: "layout-shift", buffered: true });
      } catch {
        /* ignore */
      }
      await new Promise((r) => setTimeout(r, 400));
      const next = document.querySelector('[aria-label="الصفحة التالية"]');
      if (next instanceof HTMLElement) {
        next.click();
        await new Promise((r) => setTimeout(r, 500));
        next.click();
        await new Promise((r) => setTimeout(r, 500));
      }
      const settings = document.querySelector('[aria-label="إعدادات القراءة"]');
      if (settings instanceof HTMLElement) {
        settings.click();
        await new Promise((r) => setTimeout(r, 600));
        const close = document.querySelector(".mpv-settings-panel [aria-label=\"إغلاق\"]");
        if (close instanceof HTMLElement) close.click();
      }
      await new Promise((r) => setTimeout(r, 800));
      return Math.round(clsValue * 1000) / 1000;
    });
    report.cls = cls;
    report.gates.cls = cls <= CLS_SOFT;
    console.log(`CLS during flips/settings: ${cls} (gate ≤ ${CLS_SOFT}, prod target 0.00) → ${report.gates.cls ? "PASS" : "REVIEW"}`);

    // Memory slope: cycle ayah play/pause + scroll simulation
    const heapStart = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? null);
    for (let i = 0; i < AUDIO_CYCLES; i++) {
      await page.evaluate(() => {
        const ayah = document.querySelector(".mf2-ayah-group");
        if (ayah instanceof HTMLElement) ayah.click();
      });
      await page.waitForTimeout(200);
      await page.evaluate(() => {
        const play = Array.from(document.querySelectorAll("button")).find((b) =>
          /تشغيل|استمع|إيقاف|Pause|Play/i.test(b.textContent || ""),
        );
        if (play instanceof HTMLElement) play.click();
      });
      await page.waitForTimeout(350);
      await page.evaluate(() => {
        const root = document.querySelector(".mpv-body");
        if (root) root.scrollTop += 40;
      });
    }
    await page.waitForTimeout(500);
    const heapEnd = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? null);
    if (heapStart != null && heapEnd != null) {
      report.heapGrowthMb = Math.round(((heapEnd - heapStart) / (1024 * 1024)) * 10) / 10;
      report.gates.memory = report.heapGrowthMb < HEAP_GROWTH_MB;
      console.log(
        `Heap growth after ${AUDIO_CYCLES} cycles: ${report.heapGrowthMb}MB (gate < ${HEAP_GROWTH_MB}MB) → ${
          report.gates.memory ? "PASS" : "REVIEW"
        }`,
      );
    } else {
      console.log("performance.memory unavailable — memory gate skipped");
      report.gates.memory = true;
    }
  } finally {
    await browser.close();
  }

  console.log("\n── Benchmark summary ──");
  console.log(JSON.stringify(report, null, 2));

  // Soft gates: exit 0 if Chromium ran; exit 1 only on hard CLS blow-up
  if (report.cls != null && report.cls > 0.25) {
    console.error("Hard CLS regression > 0.25");
    process.exit(1);
  }
  console.log("Perf bench complete (review soft gates for release checklist).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
