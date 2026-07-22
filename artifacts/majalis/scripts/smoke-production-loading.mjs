#!/usr/bin/env node
/**
 * Production smoke: public routes must not show "جارٍ التحميل" after PAGE_LOAD_TIMEOUT.
 *
 * Usage:
 *   node scripts/smoke-production-loading.mjs
 *   node scripts/smoke-production-loading.mjs --base=https://majlisilm.com
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "https://majlisilm.com";

const ROUTES = ["/", "/lessons", "/courses", "/qa", "/adhkar", "/library", "/admin"];

const runner = `
import { chromium } from "playwright";

const base = ${JSON.stringify(base)};
const routes = ${JSON.stringify(ROUTES)};
const LOADING_RE = /جار[ٍِ]?\\s*التحميل|جارٍ\\s*التحميل/i;
const WAIT_MS = 9000;

let failed = 0;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent: "MajalisSmoke/1.0",
  locale: "ar-KW",
});
const page = await context.newPage();

for (const route of routes) {
  const url = new URL(route, base).toString();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(WAIT_MS);
    const bodyText = await page.locator("body").innerText();
    const stillLoading = LOADING_RE.test(bodyText);
    const hasMain = await page.locator("#main-content").count();
    if (stillLoading) {
      console.error("✗ " + route + " — still showing loading text after " + WAIT_MS + "ms");
      failed++;
    } else if (!hasMain) {
      console.error("✗ " + route + " — missing #main-content");
      failed++;
    } else {
      console.log("✓ " + route + " — rendered (no infinite loading)");
    }
  } catch (err) {
    console.error("✗ " + route + " — " + String(err.message || err));
    failed++;
  }
}

await browser.close();
console.log("\\nProduction loading smoke: " + (failed ? "FAILED (" + failed + ")" : "PASSED"));
process.exit(failed ? 1 : 0);
`;

const install = spawnSync("npx", ["--yes", "playwright", "install", "chromium"], {
  stdio: "inherit",
  env: process.env,
});
if (install.status !== 0) process.exit(install.status ?? 1);

const run = spawnSync("node", ["--input-type=module", "-e", runner], {
  stdio: "inherit",
  env: process.env,
  cwd: join(__dirname, ".."),
});
process.exit(run.status ?? 1);
