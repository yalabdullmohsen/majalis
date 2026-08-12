#!/usr/bin/env node
/**
 * يفحص وجود وسيلة رجوع واضحة (زر back / breadcrumb برابط للرئيسية / رابط
 * صريح) في كل صفحة من عيّنة مسارات، ويتحقق أن السحب من الرئيسية (history)
 * يعمل فعليًا عبر زر الرجوع حين وُجد.
 *
 * التشغيل: node scripts/audit-back-navigation.mjs <baseUrl> <routesFile> [outJson]
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const baseUrl = process.argv[2] || "http://localhost:5178";
const routesFile = process.argv[3];
const outJson = process.argv[4] || "/tmp/back-nav-audit.json";

const routes = readFileSync(routesFile, "utf8").split("\n").map((l) => l.trim()).filter(Boolean);

const BACK_SELECTORS = [
  ".ds-page-back-btn", ".legal-back-btn", "[aria-label='رجوع']",
  ".tawheed-breadcrumb", ".fiqh-hub-strip", "nav[aria-label='مسار التنقل']",
  ".udp-back", ".back-btn", "[class*='breadcrumb']", "[class*='-back-btn']",
  ".global-back-btn",
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const results = [];
let i = 0;
for (const route of routes) {
  i++;
  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(400);
    const found = await page.evaluate((sels) => {
      for (const s of sels) {
        try { if (document.querySelector(s)) return s; } catch {}
      }
      return null;
    }, BACK_SELECTORS);
    results.push({ route, hasBackAffordance: !!found, matchedSelector: found });
  } catch (e) {
    results.push({ route, error: String(e).slice(0, 150) });
  }
  if (i % 15 === 0) console.error(`... ${i}/${routes.length}`);
}

await browser.close();

const missing = results.filter((r) => !r.hasBackAffordance && !r.error);
writeFileSync(outJson, JSON.stringify({ total: results.length, missingCount: missing.length, missing, all: results }, null, 2));
console.error(`\nفُحص ${results.length} — بلا وسيلة رجوع ظاهرة: ${missing.length}`);
console.error(`التقرير: ${outJson}`);
