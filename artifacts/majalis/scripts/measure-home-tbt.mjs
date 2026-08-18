/**
 * أطول المهام على الخيط الرئيسي للرئيسية (Playwright).
 * تشغيل: node scripts/measure-home-tbt.mjs [url]
 */
import { chromium, devices } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:24216/";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices["iPhone 13"], locale: "ar-SA" });
const page = await context.newPage();
await page.addInitScript(() => {
  window.__mjLongTasks = [];
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        window.__mjLongTasks.push({
          dur: Math.round(e.duration),
          start: Math.round(e.startTime),
          name: e.name,
        });
      }
    }).observe({ type: "longtask", buffered: true });
  } catch {
    /* unsupported */
  }
});
await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
await page.waitForTimeout(4000);

const data = await page.evaluate(() => {
  const tasks = (window.__mjLongTasks ?? []).sort((a, b) => b.dur - a.dur);
  const entries = performance.getEntriesByType("measure").concat(
    performance.getEntriesByType("function") || [],
  );
  const scripts = performance
    .getEntriesByType("resource")
    .filter((e) => e.initiatorType === "script")
    .map((e) => ({
      name: String(e.name).split("/").pop(),
      dur: Math.round(e.duration),
      size: e.transferSize,
    }))
    .sort((a, b) => b.dur - a.dur)
    .slice(0, 12);
  return {
    tasks: tasks.slice(0, 12),
    taskCount: tasks.length,
    over50: tasks.filter((t) => t.dur > 50).length,
    scripts,
  };
});

console.log(JSON.stringify(data, null, 2));
await browser.close();
