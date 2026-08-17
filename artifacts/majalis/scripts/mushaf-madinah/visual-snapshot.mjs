#!/usr/bin/env node
/**
 * لقطات بصرية للمصحف الجديد — صفحات 1,2,3,4,598,602
 * تشغيل: MUSHAF_GATE_BASE_URL=http://127.0.0.1:24216 node scripts/mushaf-madinah/visual-snapshot.mjs
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const outDir = resolve(root, "docs/mushaf-madinah/snapshots");
const pages = [1, 2, 3, 4, 7, 283, 600, 603];
const viewport = { width: 390, height: 844 };
const baseFromEnv = process.env.MUSHAF_GATE_BASE_URL || process.env.BASE_URL || "";

mkdirSync(outDir, { recursive: true });

function contentType(file) {
  const e = extname(file).toLowerCase();
  if (e === ".html") return "text/html; charset=utf-8";
  if (e === ".js") return "text/javascript; charset=utf-8";
  if (e === ".css") return "text/css; charset=utf-8";
  if (e === ".json") return "application/json";
  if (e === ".woff2") return "font/woff2";
  if (e === ".svg") return "image/svg+xml";
  if (e === ".png") return "image/png";
  return "application/octet-stream";
}

async function ensurePreview() {
  if (baseFromEnv) return { base: baseFromEnv.replace(/\/$/, ""), stop: async () => {} };

  const dist = join(root, "dist");
  if (!existsSync(join(dist, "index.html"))) {
    throw new Error("dist/index.html مفقود — شغّل pnpm build أولًا أو عيّن MUSHAF_GATE_BASE_URL");
  }

  const port = Number(process.env.MUSHAF_SNAPSHOT_PORT || 24217);
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    let path = decodeURIComponent(url.pathname);
    if (path === "/") path = "/index.html";
    const file = join(dist, path);
    if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
      // SPA fallback
      const index = join(dist, "index.html");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      createReadStream(index).pipe(res);
      return;
    }
    res.writeHead(200, { "Content-Type": contentType(file) });
    createReadStream(file).pipe(res);
  });

  await new Promise((resolveP, reject) => {
    server.listen(port, "127.0.0.1", () => resolveP());
    server.on("error", reject);
  });

  return {
    base: `http://127.0.0.1:${port}`,
    stop: () => new Promise((r) => server.close(() => r())),
  };
}

async function main() {
  const { base, stop } = await ensurePreview();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    locale: "ar-SA",
  });
  const page = await context.newPage();
  const report = [];

  try {
    for (const n of pages) {
      const url = `${base}/mushaf?page=${n}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
      await page.waitForSelector('[data-pane="current"] [data-testid="mushaf-page"]', { timeout: 45_000 });
      // أخفِ الأدوات للقطة نظيفة
      await page.evaluate(() => {
        const el = document.querySelector('[data-testid="mushaf-controls"]');
        if (el) el.setAttribute("data-open", "0");
      });
      await page.waitForTimeout(400);
      const file = join(outDir, `page-${String(n).padStart(3, "0")}.png`);
      await page.locator('[data-testid="mushaf-viewport"]').screenshot({ path: file });
      const hasPdf = await page.evaluate(() => !!document.querySelector("embed[type='application/pdf'], iframe[src*='.pdf'], canvas.mm-pdf"));
      const font = await page.evaluate(() => {
        const current = document.querySelector('[data-pane="current"]');
        const line =
          current?.querySelector(".mm-ayah-line") || current?.querySelector(".mm-basmala");
        return line ? getComputedStyle(line).fontFamily : "";
      });
      const lineSlots = await page.locator('[data-pane="current"] .mm-slot .mm-ayah-line').count();
      report.push({
        page: n,
        file: file.replace(root + "/", ""),
        hasPdf,
        fontFamily: font,
        ayahLineCount: lineSlots,
        ok: !hasPdf && /qpc-v2-p/i.test(font) && lineSlots > 0,
      });
      console.log(`✓ snapshot page ${n} → ${file}`);
    }
  } finally {
    await browser.close();
    await stop();
  }

  const failed = report.filter((r) => !r.ok);
  writeFileSync(join(outDir, "report.json"), JSON.stringify({ viewport, report }, null, 2));
  if (failed.length) {
    console.error("فشل التحقق البصري:", failed);
    process.exit(1);
  }
  console.log("✓ mushaf visual-snapshot ok", pages.join(","));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
