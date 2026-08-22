#!/usr/bin/env node
/**
 * بوابة: لا وميض دخولية “قديمة” خلال أول 2500ms.
 *
 * تفشل إن:
 * - ظهرت طبقة إطلاق ثانية (غير #mj-launch-splash)
 * - أو ظهرت دخولية قديمة (#mj-silent-splash / #mj-boot-splash)
 * - أو تغيّر `dataset.theme`/`dataset.font` بشكل متكرر خلال نافذة القياس
 *
 * تشغيل: node scripts/test-no-legacy-flash.mjs
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

    const splashStart = await page.evaluate(() => window.__mjSplashStart);
    assert.equal(typeof splashStart, "number");

    const stateHistory = [];
    const samples = 25; // 25 * 100ms = 2500ms
    for (let i = 0; i < samples; i++) {
      await page.waitForTimeout(100);
      const s = await page.evaluate(() => {
        const splash = document.querySelector("#mj-launch-splash");
        const legacySilent = document.querySelector("#mj-silent-splash");
        const theme = document.documentElement.dataset.theme || "";
        const font = document.documentElement.dataset.font || "";
        const splashCount = document.querySelectorAll("#mj-launch-splash").length;
        const legacySplashCount =
          document.querySelectorAll("#mj-boot-splash, #mj-splash-boot, #mj-silent-splash").length +
          document.querySelectorAll("[data-launch-splash='1']").length;
        return {
          splashPresent: Boolean(splash),
          legacySilentPresent: Boolean(legacySilent),
          splashCount,
          legacySplashCount,
          theme,
          font,
        };
      });
      stateHistory.push(s);

      // Structural checks while splash might still be present.
      if (s.legacySplashCount > 0 || s.legacySilentPresent) {
        throw new Error(`legacy splash at sample=${i}: legacy=${s.legacySplashCount} silent=${s.legacySilentPresent}`);
      }
      if (s.splashCount > 1) {
        throw new Error(`multiple splashes at sample=${i}: splashCount=${s.splashCount}`);
      }
    }

    // Theme/font must not flap repeatedly in first 2.5s.
    const themes = new Set(stateHistory.map((x) => x.theme).filter(Boolean));
    const fonts = new Set(stateHistory.map((x) => x.font).filter(Boolean));
    if (themes.size > 2) throw new Error(`theme flapped too much: ${[...themes].join(",")}`);
    if (fonts.size > 2) throw new Error(`font flapped too much: ${[...fonts].join(",")}`);
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

