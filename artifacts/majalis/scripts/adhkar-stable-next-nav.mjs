#!/usr/bin/env node
/**
 * قياس موضع زر «التالي» عبر 15 انتقالًا — يفشل إن تحرّك أكثر من 2px.
 * يعمل عند توفر dist أو ADHKAR_NAV_BASE_URL؛ وإلا يتخطى (البوابة الثابتة تغطي المصدر).
 * تشغيل: node scripts/adhkar-stable-next-nav.mjs
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const MAX_DRIFT_PX = 2;
const STEPS = 15;

function contentType(file) {
  const e = extname(file).toLowerCase();
  if (e === ".html") return "text/html; charset=utf-8";
  if (e === ".js") return "text/javascript; charset=utf-8";
  if (e === ".css") return "text/css; charset=utf-8";
  if (e === ".json") return "application/json";
  if (e === ".woff2") return "font/woff2";
  return "application/octet-stream";
}

async function ensureBase() {
  if (process.env.ADHKAR_NAV_BASE_URL || process.env.SCROLL_GATE_BASE_URL) {
    const raw = process.env.ADHKAR_NAV_BASE_URL || process.env.SCROLL_GATE_BASE_URL;
    return { base: raw.replace(/\/$/, ""), stop: async () => {} };
  }
  const dist = join(root, "dist");
  if (!existsSync(join(dist, "index.html"))) {
    return { base: null, stop: async () => {} };
  }
  const port = 24216 + 17;
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
  await new Promise((resolveP, reject) => {
    server.listen(port, "127.0.0.1", () => resolveP());
    server.on("error", reject);
  });
  return { base: `http://127.0.0.1:${port}`, stop: () => new Promise((r) => server.close(() => r())) };
}

async function main() {
  const { base, stop } = await ensureBase();
  if (!base) {
    console.log("adhkar-stable-next-nav: skip playwright (dist مفقود) — المصدر يُفحص في adhkar-stable-nav-gate");
    return;
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "ar-KW",
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("majalis.onboarding.onboarding_seen", "1");
      localStorage.setItem("majalis.onboarding.onboarding_major_version", "1");
    } catch { /* ignore */ }
  });
  const page = await context.newPage();
  await page.goto(`${base}/adhkar`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page
    .waitForSelector("[data-adhkar-next], .adhkar-focus-btn--next", { timeout: 20_000, state: "visible" })
    .catch(() => null);

  const nextSel = "[data-adhkar-next], .adhkar-focus-btn--next";
  await page.locator(nextSel).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);

  const measure = async () =>
    page.evaluate((sel) => {
      const shell = document.querySelector(".adhkar-focus-shell");
      const btn = document.querySelector(sel);
      if (!shell || !btn) return null;
      const s = shell.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      return {
        x: Math.round((b.left - s.left) * 100) / 100,
        y: Math.round((b.top - s.top) * 100) / 100,
        w: Math.round(b.width * 100) / 100,
        h: Math.round(b.height * 100) / 100,
      };
    }, nextSel);

  const box0 = await measure();
  if (!box0) {
    console.error("adhkar-stable-next-nav: زر التالي غير ظاهر");
    await browser.close();
    await stop();
    process.exit(1);
  }

  let maxDrift = 0;
  for (let i = 0; i < STEPS; i++) {
    const btn = page.locator(nextSel).first();
    const disabled = await btn.isDisabled().catch(() => true);
    if (disabled) break;
    await btn.click({ force: false });
    await page.waitForTimeout(150);
    const box = await measure();
    if (!box) continue;
    const drift = Math.max(Math.abs(box.x - box0.x), Math.abs(box.y - box0.y));
    maxDrift = Math.max(maxDrift, drift);
    if (drift > MAX_DRIFT_PX) {
      console.error(
        `adhkar-stable-next-nav: قفزة بعد الانتقال ${i + 1}: drift=${drift.toFixed(2)}px > ${MAX_DRIFT_PX} (y0=${box0.y}, y=${box.y})`,
      );
      await browser.close();
      await stop();
      process.exit(1);
    }
  }

  await browser.close();
  await stop();
  console.log(`✓ adhkar-stable-next-nav ok — ${STEPS} انتقالًا، أقصى انحراف ${maxDrift.toFixed(2)}px`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
