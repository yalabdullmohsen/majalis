#!/usr/bin/env node
/**
 * Playwright smoke test for detail routes — ensures ErrorBoundary never appears.
 * Usage: node scripts/smoke-detail-routes.mjs [--base=http://127.0.0.1:24216]
 */
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";

const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "http://127.0.0.1:24216";

const install = spawnSync("npx", ["--yes", "playwright", "install", "chromium"], {
  stdio: "inherit",
  env: process.env,
});
if (install.status !== 0) {
  console.error("Failed to install Playwright chromium.");
  process.exit(1);
}

const ERROR_TEXT = "تعذر عرض هذه الصفحة";

const STATIC_ROUTES = [
  "/lessons/kuwait-lessons:7b923f5b0be018325687e73a1d9abc",
  `/lessons/${encodeURIComponent("kuwait-lessons:7b923f5b0be018325687e73a1d9abc")}`,
  "/lessons/a1b2c3d4-e5f6-4789-a012-3456789abcde",
  "/lessons/kw-salem-0",
  "/search/سالم",
  "/search/درس",
  "/library",
  "/fatwa",
  "/rulings",
  "/qa",
  "/annual-courses",
  "/quran-scientific-circles",
  "/sheikhs",
  "/calendar",
  "/lessons",
];

async function collectLessonLinks(page) {
  await page.goto(new URL("/lessons", base).toString(), { waitUntil: "networkidle", timeout: 45_000 });
  return page.evaluate(() => {
    const links = new Set();
    for (const el of document.querySelectorAll('a[href*="/lessons/"]')) {
      const href = el.getAttribute("href");
      if (href && href.startsWith("/lessons/") && href !== "/lessons") links.add(href);
    }
    return [...links].slice(0, 15);
  });
}

let failed = 0;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ locale: "ar-KW" });
const page = await context.newPage();

console.log(`Detail route smoke — base ${base}\n`);

let dynamicLinks = [];
try {
  dynamicLinks = await collectLessonLinks(page);
  console.log(`Collected ${dynamicLinks.length} lesson links from /lessons`);
} catch (err) {
  console.warn(`Could not collect dynamic lesson links: ${err instanceof Error ? err.message : String(err)}`);
}

const DETAIL_ROUTES = [...new Set([...STATIC_ROUTES, ...dynamicLinks])];

for (const path of DETAIL_ROUTES) {
  const url = new URL(path, base).toString();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
    await page.waitForTimeout(400);
    const bodyText = await page.locator("body").innerText();
    if (bodyText.includes(ERROR_TEXT)) {
      console.error(`✗ ${path} → Error Boundary visible`);
      failed += 1;
      continue;
    }
    console.log(`✓ ${path}`);
  } catch (err) {
    console.error(`✗ ${path} → ${err instanceof Error ? err.message : String(err)}`);
    failed += 1;
  }
}

await browser.close();

if (failed) {
  console.error(`\n${failed} route(s) failed detail smoke test.`);
  process.exit(1);
}

console.log(`\nAll ${DETAIL_ROUTES.length} detail routes passed smoke test.`);
