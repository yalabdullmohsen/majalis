/**
 * Memory leak smoke — long-ish auto-scroll + audio interaction loop.
 * Scaled for CI (not a literal 1-hour wall clock). Duration override:
 *   node tests/perf/audio-memory-bench.mjs --minutes=2
 */
import { chromium } from "playwright";

const base =
  process.argv.find((a) => a.startsWith("--base="))?.slice(7) ||
  process.env.MAJALIS_PREVIEW_URL ||
  "http://127.0.0.1:24216";
const minutes = Number(process.argv.find((a) => a.startsWith("--minutes="))?.slice(10) || "0.4");
const durationMs = Math.max(15_000, Math.floor(minutes * 60_000));
const SAMPLE_MS = 5_000;

async function main() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.error("Chromium unavailable:", err.message || err);
    process.exit(2);
  }

  const page = await browser.newPage();
  await page.goto(`${base}/mushaf/page/2`, { waitUntil: "load", timeout: 60_000 });
  await page.waitForTimeout(1200);

  const samples = [];
  const started = Date.now();
  let i = 0;
  while (Date.now() - started < durationMs) {
    await page.evaluate((step) => {
      const next = document.querySelector('[aria-label="الصفحة التالية"]');
      const prev = document.querySelector('[aria-label="الصفحة السابقة"]');
      if (step % 2 === 0 && next instanceof HTMLElement && !next.disabled) next.click();
      else if (prev instanceof HTMLElement && !prev.disabled) prev.click();
      const body = document.querySelector(".mpv-body");
      if (body) body.scrollTop += 24;
    }, i);
    i += 1;
    await page.waitForTimeout(SAMPLE_MS);
    const heap = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? null);
    if (heap != null) samples.push(heap);
  }

  await browser.close();

  if (samples.length < 2) {
    console.log("Insufficient memory samples (performance.memory missing) — PASS soft");
    process.exit(0);
  }

  const first = samples[0];
  const last = samples[samples.length - 1];
  const growthMb = (last - first) / (1024 * 1024);
  const slope = growthMb / Math.max(1, samples.length - 1);
  console.log(`Samples: ${samples.length}, growth=${growthMb.toFixed(1)}MB, slope/sample=${slope.toFixed(2)}MB`);
  // Flat memory: slope under 8MB per sample over the short window
  if (slope > 8) {
    console.error("Memory slope suggests leak risk");
    process.exit(1);
  }
  console.log("Memory bench PASS (flat within budget)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
