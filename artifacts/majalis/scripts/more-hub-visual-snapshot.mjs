#!/usr/bin/env node
/**
 * لقطات مرجعية لصفحة/شيت المزيد (390×844) — نهاري وليلي.
 * تشغيل:
 *   MORE_HUB_GATE_BASE_URL=http://127.0.0.1:24216 node scripts/more-hub-visual-snapshot.mjs
 *   UPDATE_SNAPSHOTS=1 … لإعادة كتابة المرجعيات
 */
import { createServer } from "node:http";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  statSync,
} from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "tests/snapshots/more-hub");
const viewport = { width: 390, height: 844 };
const baseFromEnv = process.env.MORE_HUB_GATE_BASE_URL || process.env.MUSHAF_GATE_BASE_URL || process.env.BASE_URL || "";
const update = process.env.UPDATE_SNAPSHOTS === "1";
const themes = ["light", "dark"];

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
    throw new Error("dist/index.html مفقود — شغّل pnpm build أو عيّن MORE_HUB_GATE_BASE_URL");
  }

  const port = Number(process.env.MORE_HUB_SNAPSHOT_PORT || 24218);
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    let pathName = decodeURIComponent(url.pathname);
    if (pathName === "/") pathName = "/index.html";
    const file = join(dist, pathName);
    if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
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

function assertBaseline(theme, buf) {
  const file = join(outDir, `more-hub-${theme}.png`);
  if (update || !existsSync(file)) {
    writeFileSync(file, buf);
    console.log(`  · كتب مرجعية ${theme}: ${file} (${buf.length} بايت)`);
    return;
  }
  const prev = readFileSync(file);
  if (prev.length < 1000) throw new Error(`مرجعية تالفة: ${file}`);
  if (buf.length < 1000) throw new Error(`لقطة فارغة: ${theme}`);
  // مقارنة حجم تقريبية — تغيّر جذري = انهيار رسم
  const ratio = Math.abs(prev.length - buf.length) / Math.max(prev.length, 1);
  if (ratio > 0.35) {
    throw new Error(
      `انحراف حجم لقطة المزيد (${theme}): كان ${prev.length} صار ${buf.length} (±${(ratio * 100).toFixed(1)}%) — راجع بصريًا أو UPDATE_SNAPSHOTS=1`,
    );
  }
  console.log(`  · ${theme}: ok (حجم ${buf.length} ≈ مرجعية ${prev.length})`);
}

async function main() {
  const { base, stop } = await ensurePreview();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    locale: "ar-KW",
  });

  try {
    for (const theme of themes) {
      const page = await context.newPage();
      await page.addInitScript((t) => {
        localStorage.setItem("majalis-theme", t);
      }, theme);
      await page.goto(`${base}/more`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForSelector("[data-more-hub='1']", { timeout: 20_000 });
      const hub = page.locator("[data-more-hub='1']");
      await hub.waitFor({ state: "visible" });

      const cards = await hub.locator("[data-section-card]").count();
      const rows = await hub.locator("[data-section-row]").count();
      if (cards + rows === 0) throw new Error(`${theme}: صفر بطاقات مرسومة`);

      const sample = hub.locator("[data-section-card]").first();
      const styles = await sample.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { radius: parseFloat(cs.borderRadius), bg: cs.backgroundColor };
      });
      if (!(styles.radius >= 12)) throw new Error(`${theme}: border-radius < 12`);
      if (styles.bg === "rgba(0, 0, 0, 0)") throw new Error(`${theme}: خلفية بطاقة شفافة`);

      const buf = await hub.screenshot({ type: "png" });
      assertBaseline(theme, buf);
      await page.close();
    }
    console.log("more-hub-visual-snapshot: OK");
  } finally {
    await browser.close();
    await stop();
  }
}

main().catch((err) => {
  console.error("more-hub-visual-snapshot: FAILED", err);
  process.exit(1);
});
