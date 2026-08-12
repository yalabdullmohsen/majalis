#!/usr/bin/env node
/**
 * لقطات صفحات المصحف للمقارنة البصرية.
 *   node scripts/quran-import/screenshot-mushaf-pages.mjs --base https://www.majlisilm.com --pages 283,1,2 --out .local/mushaf/shots/prod
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "../..");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const base = (arg("base", "https://www.majlisilm.com") || "").replace(/\/$/, "");
const pages = (arg("pages", "283") || "283").split(",").map(Number).filter(Boolean);
const outDir = path.resolve(APP_ROOT, arg("out", ".local/mushaf/shots"));

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: "ar",
  });
  const page = await context.newPage();

  for (const n of pages) {
    const url = `${base}/mushaf/page/${n}`;
    console.log("goto", url);
    await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
    // أخفِ الشريط إن ظهر، وانتظر ظهور أسطر QPC
    await page.waitForSelector(".mf2-lines, .mf2-line, .qs-mushaf-body", { timeout: 60_000 }).catch(() => {});
    await page.waitForTimeout(1800);
    // أخفِ أدوات القراءة إن ظهرت فوق الصفحة
    await page.evaluate(() => {
      document.querySelectorAll(".mpv-toolbar, .mpv-resume-banner, .assistant-fab, .bottom-nav, .navbar-v3").forEach((el) => {
        el.style.visibility = "hidden";
      });
    }).catch(() => {});
    const target = await page.$(".qs-mushaf-body-inner, .mf2-page, .qs-mushaf-frame, .mpv-body--ayah");
    const out = path.join(outDir, `page-${String(n).padStart(3, "0")}.png`);
    if (target) await target.screenshot({ path: out });
    else await page.screenshot({ path: out, fullPage: false });
    console.log("wrote", out);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
