/**
 * قياس CLS للرئيسية مع تفصيل العناصر المُزيحة — mobile viewport.
 * تشغيل: node scripts/measure-home-cls.mjs [url]
 */
import { chromium, devices } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:24216/";
const runs = Number(process.argv[3] ?? 3);

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

async function measureOnce(browser) {
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    locale: "ar-SA",
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "load", timeout: 60_000 });
  await page.waitForTimeout(3500);

  const data = await page.evaluate(() => {
    const entries = performance.getEntriesByType("layout-shift");
    let cls = 0;
    const byNode = new Map();

    for (const e of entries) {
      const le = e;
      if (le.hadRecentInput) continue;
      cls += le.value;
      for (const s of le.sources ?? []) {
        const node = s.node;
        const key =
          node instanceof Element
            ? `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ""}${node.className ? `.${String(node.className).trim().split(/\s+/).slice(0, 3).join(".")}` : ""}`
            : "unknown";
        const prev = byNode.get(key) ?? 0;
        byNode.set(key, prev + le.value);
      }
    }

    return {
      cls: Math.round(cls * 10000) / 10000,
      shifts: [...byNode.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([el, score]) => ({ el, score: Math.round(score * 10000) / 10000 })),
    };
  });

  await context.close();
  return data;
}

const browser = await chromium.launch({ headless: true });
const results = [];
for (let i = 0; i < runs; i += 1) {
  results.push(await measureOnce(browser));
  console.log(`run ${i + 1}: CLS=${results[i].cls}`);
}
await browser.close();

const clsMed = median(results.map((r) => r.cls));
console.log(`\nmedian CLS (${runs} runs): ${clsMed}`);
console.log("\nTop shift elements (last run):");
for (const row of results.at(-1).shifts) {
  console.log(`  ${row.score.toFixed(4)}  ${row.el}`);
}
