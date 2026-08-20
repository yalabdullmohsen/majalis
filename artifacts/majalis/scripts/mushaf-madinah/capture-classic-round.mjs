#!/usr/bin/env node
/**
 * لقطات دليل جولة المصحف الكلاسيكية.
 * يتطلب dist/ — pnpm exec vite build
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = resolve(root, "artifacts/mushaf-classic-round");
mkdirSync(outDir, { recursive: true });

function contentType(file) {
  const e = extname(file).toLowerCase();
  if (e === ".html") return "text/html; charset=utf-8";
  if (e === ".js") return "text/javascript; charset=utf-8";
  if (e === ".css") return "text/css; charset=utf-8";
  if (e === ".json") return "application/json";
  if (e === ".woff2") return "font/woff2";
  return "application/octet-stream";
}

async function serve() {
  const dist = join(root, "dist");
  if (!existsSync(join(dist, "index.html"))) throw new Error("dist مفقود");
  const port = 24380;
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    let path = decodeURIComponent(url.pathname);
    if (path === "/") path = "/index.html";
    const file = join(dist, path);
    if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      createReadStream(join(dist, "index.html")).pipe(res);
      return;
    }
    res.writeHead(200, { "Content-Type": contentType(file) });
    createReadStream(file).pipe(res);
  });
  await new Promise((r, j) => {
    server.listen(port, "127.0.0.1", () => r());
    server.on("error", j);
  });
  return { base: `http://127.0.0.1:${port}`, stop: () => new Promise((r) => server.close(() => r())) };
}

async function waitPage(page, n) {
  await page.goto(`${page.context()._options?._base || ""}${""}`);
}

async function main() {
  const { base, stop } = await serve();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "ar-KW",
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  async function shot(name, pageNum, { theme = "paper", openAyah = false, openIndex = false } = {}) {
    await page.goto(`${base}/mushaf/page/${pageNum}`, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForSelector('[data-testid="mushaf-page"]', { timeout: 60_000 });
    await page.waitForTimeout(900);
    if (theme === "night") {
      await page.evaluate(() => {
        try {
          localStorage.setItem("majlisilm.mushaf.theme", "night");
        } catch {}
      });
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForSelector('[data-testid="mushaf-page"]', { timeout: 60_000 });
      await page.waitForTimeout(700);
    }
    if (openAyah) {
      const hit = page.locator('[data-testid="mushaf-ayah-hit"]').first();
      await hit.click({ force: true });
      await page.waitForTimeout(600);
    }
    if (openIndex) {
      await page.locator('[data-pane="current"] [data-testid="mushaf-page"]').click({ position: { x: 195, y: 420 } });
      await page.waitForTimeout(400);
      const idx = page.locator('[data-testid="mushaf-controls"] button', { hasText: "فهرس" });
      await idx.click({ force: true });
      await page.waitForTimeout(600);
    }
    const path = join(outDir, `${name}.png`);
    await page.screenshot({ path, fullPage: false });
    console.log("shot", name, "→", path);
  }

  try {
    // ١ — بسملة
    await shot("01-fatiha-p1", 1);
    await shot("02-baqarah-p2", 2);
    await shot("03-imran-p50", 50);
    await shot("04-nisa-p77", 77);
    await shot("05-kahf-p293", 293);
    await shot("06-yasin-p440", 440);
    await shot("07-saffat-p446", 446);
    await shot("08-sad-p453", 453);
    await shot("09-nas-p604", 604);
    await shot("10-tawbah-p187-no-basmala", 187);
    await shot("11-naml-p377", 377);
    await shot("12-naml-p378", 378);

    // ٣ — إطار / فردي زوجي / حزب
    await shot("13-frame-p1-day", 1);
    await shot("14-frame-p2-day", 2);
    await shot("15-frame-p50-day", 50);
    await shot("16-frame-p77-day", 77);
    await shot("17-frame-p1-night", 1, { theme: "night" });
    await shot("18-frame-p2-night", 2, { theme: "night" });
    await shot("19-odd-p3", 3);
    await shot("20-even-p4", 4);

    // ٤ — فواصل
    await shot("21-marks-p2-day", 2);
    await shot("22-marks-p2-night", 2, { theme: "night" });

    // ٥ — لوحة آية
    await shot("23-ayah-panel-day", 2, { openAyah: true });
    await shot("24-ayah-panel-night", 2, { theme: "night", openAyah: true });
    await shot("25-index-sheet", 2, { openIndex: true });

    // ٢ — اتجاه: تسجيل إطارات تنقّل
    await page.goto(`${base}/mushaf/page/10`, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForSelector('[data-testid="mushaf-page"]');
    await page.waitForTimeout(600);
    await page.screenshot({ path: join(outDir, "26-nav-p10.png") });
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, "27-nav-p11.png") });
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, "28-nav-p12.png") });
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(outDir, "29-nav-back-p11.png") });

    writeFileSync(
      join(outDir, "manifest.json"),
      JSON.stringify({ createdAt: new Date().toISOString(), outDir, count: 29 }, null, 2),
    );
    console.log("mushaf-classic-round shots: ok →", outDir);
  } finally {
    await browser.close();
    await stop();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
