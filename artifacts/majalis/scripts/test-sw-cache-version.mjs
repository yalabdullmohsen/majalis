#!/usr/bin/env node
/**
 * بوابة: SW cache rotation
 * - تفشل إن وجد caches تحمل suffix "unversioned"
 * - وتتأكد أن controller موجود (SW مسيطر)
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
  const port = 24216 + 63;
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
    let pathName = decodeURIComponent(url.pathname);
    if (pathName === "/") pathName = "/index.html";
    const file = join(dist, pathName);
    if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("not found");
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
    console.log("test-sw-cache-version: skip (dist مفقود)");
    return;
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ar-KW" });
  const page = await context.newPage();

  try {
    await page.goto(`${base}/`, { waitUntil: "load", timeout: 60_000 });

    // Register directly to avoid relying on app-specific SW timing.
    const didRegister = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      try {
        await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        return true;
      } catch {
        return false;
      }
    });
    assert.equal(didRegister, true, "SW لم تُسجَّل عبر register('/sw.js')");

    const swInfo = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return { hasActive: Boolean(reg && reg.active) };
    });
    assert.equal(swInfo.hasActive, true, "SW registration.active غير موجود");

    // Trigger DATA_CACHE usage by requesting a stable JSON served from SW.
    await page.evaluate(async () => {
      try {
        const r = await fetch("/data/graph/links.json", { cache: "no-store" });
        return r.ok;
      } catch {
        return false;
      }
    });

    const caches = await page.evaluate(async () => {
      const keys = await caches.keys();
      return keys;
    });

    const hasUnversioned = caches.some((k) => k.includes("unversioned"));
    if (hasUnversioned) {
      throw new Error(`وجدت caches unversioned: ${caches.filter((k) => k.includes("unversioned")).join(",")}`);
    }

    const offlineCaches = caches.filter((k) => k.startsWith("majalis-offline-"));
    const dataCaches = caches.filter((k) => k.startsWith("majalis-data-"));
    assert.ok(offlineCaches.length >= 1, "majalis-offline-* غير موجود");
    assert.ok(dataCaches.length >= 1, "majalis-data-* غير موجود");
  } finally {
    await browser.close();
    await stop();
  }

  console.log("test-sw-cache-version: ok");
}

main().catch((e) => {
  console.error("test-sw-cache-version: FAILED");
  console.error(e);
  process.exit(1);
});

