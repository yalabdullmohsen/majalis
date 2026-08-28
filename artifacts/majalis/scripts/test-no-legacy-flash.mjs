#!/usr/bin/env node
/**
 * بوابة: Startup Stabilizer — لا دخولية HTML، أول رسم سريع.
 *
 * تفشل إن:
 * - لم يُركّب React خلال 3s
 * - ظهرت دخولية HTML قديمة
 * - تغيّر theme/font بشكل متكرر خلال 2.5s
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

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
  if (!existsSync(join(root, "dist/index.html"))) return { base: null, stop: async () => {} };
  const dist = join(root, "dist");
  const port = 24216 + 62;
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    let pathName = decodeURIComponent(url.pathname);
    if (pathName === "/") pathName = "/index.html";
    const file = join(dist, pathName);
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
  return { base: `http://127.0.0.1:${port}`, stop: async () => new Promise((r) => server.close(() => r())) };
}

async function main() {
  const { base, stop } = await ensureBase();
  if (!base) {
    console.log("test-no-legacy-flash: skip (dist مفقود)");
    return;
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ar-KW" });
  const page = await context.newPage();

  try {
    await page.goto(`${base}/`, { waitUntil: "load", timeout: 60_000 });

    await page.waitForFunction(
      () => document.querySelector("#root")?.childElementCount > 0,
      null,
      { timeout: 3000 },
    );

    await page.evaluate(
      () =>
        new Promise((resolve) => {
          window.addEventListener("mj:app-painted", () => resolve(), { once: true });
          window.setTimeout(resolve, 2000);
        }),
    );

    const stateHistory = [];
    const samples = 25;
    for (let i = 0; i < samples; i++) {
      await page.waitForTimeout(100);
      const s = await page.evaluate(() => {
        const legacySplashCount =
          document.querySelectorAll("#mj-launch-splash, #mj-boot-splash, #mj-splash-boot, #mj-silent-splash").length +
          document.querySelectorAll("[data-launch-splash='1']").length;
        return {
          legacySplashCount,
          theme: document.documentElement.dataset.theme || "",
          font: document.documentElement.dataset.font || "",
          startupLock: document.documentElement.classList.contains("startup-lock"),
        };
      });
      stateHistory.push(s);
      if (s.legacySplashCount > 0) {
        throw new Error(`legacy splash at sample=${i}: count=${s.legacySplashCount}`);
      }
    }

    const themes = [...new Set(stateHistory.map((s) => s.theme))];
    const fonts = [...new Set(stateHistory.map((s) => s.font))];
    assert.ok(themes.length <= 1, `theme flicker: ${themes.join(",")}`);
    assert.ok(fonts.length <= 1, `font flicker: ${fonts.join(",")}`);
    assert.ok(
      stateHistory.some((s) => !s.startupLock),
      "startup-lock يُرفع بعد mj:app-painted",
    );
  } finally {
    await browser.close();
    await stop();
  }

  console.log("test-no-legacy-flash: ok");
}

main().catch((e) => {
  console.error("test-no-legacy-flash: FAILED");
  console.error(e);
  process.exit(1);
});
