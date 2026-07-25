#!/usr/bin/env node
/**
 * يفحص كل <button> مُصيَّر فعليًا على عيّنة صفحات: هل له اسم يسهل الوصول
 * إليه (نص ظاهر، أو aria-label، أو title)؟ فحص حي على DOM بعد التصيير —
 * أدق من regex ثابت على JSX مصدري (لا يتأثر بمحتوى شرطي {a ? b : c}).
 *
 * التشغيل: node scripts/audit-aria-labels.mjs <baseUrl> <routesFile> [outJson]
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const baseUrl = process.argv[2] || "http://localhost:5178";
const routesFile = process.argv[3];
const outJson = process.argv[4] || "/tmp/aria-audit.json";

const routes = readFileSync(routesFile, "utf8").split("\n").map((l) => l.trim()).filter(Boolean);

const SCAN_FN = `() => {
  const results = [];
  document.querySelectorAll("button, a[role=button], [role=button]").forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return;
    const text = (el.textContent || "").trim();
    const ariaLabel = el.getAttribute("aria-label");
    const ariaLabelledby = el.getAttribute("aria-labelledby");
    const title = el.getAttribute("title");
    const hasName = text.length > 0 || !!ariaLabel || !!ariaLabelledby || !!title;
    if (!hasName) {
      results.push({
        cls: (el.className || "").toString().split(" ")[0],
        outerHTMLSnippet: el.outerHTML.slice(0, 150),
      });
    }
  });
  return results;
}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const byRoute = {};
let i = 0;
for (const route of routes) {
  i++;
  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(500);
    const found = await page.evaluate(`(${SCAN_FN})()`);
    if (found.length > 0) byRoute[route] = found;
  } catch (e) {
    // ignore nav errors here, already covered by other audits
  }
  if (i % 15 === 0) console.error(`... ${i}/${routes.length}`);
}

await browser.close();

const totalIssues = Object.values(byRoute).reduce((n, arr) => n + arr.length, 0);
writeFileSync(outJson, JSON.stringify({ routesWithIssues: Object.keys(byRoute).length, totalIssues, byRoute }, null, 2));
console.error(`\nصفحات فيها أزرار بلا اسم وصول: ${Object.keys(byRoute).length} — إجمالي الأزرار المخالفة: ${totalIssues}`);
console.error(`التقرير: ${outJson}`);
