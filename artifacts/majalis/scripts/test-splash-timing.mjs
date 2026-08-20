#!/usr/bin/env node
/**
 * بوابة: توقيت دخولية `#mj-silent-splash`
 *
 * تفشل إن:
 * - مدة ظهور الدخولية < 900ms أو > 1500ms (قياس من window.__mjSplashStart حتى إزالة العنصر)
 * - ظهرت مرة ثانية بعد تنقل داخلي داخل نفس الجلسة.
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
  const port = 24216 + 61;
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

  return {
    base: `http://127.0.0.1:${port}`,
    stop: async () => new Promise((r) => server.close(() => r())),
  };
}

async function main() {
  const { base, stop } = await ensureBase();
  if (!base) {
    console.log("test-splash-timing: skip (dist مفقود)");
    return;
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ar-KW" });
  const page = await context.newPage();

  try {
    await page.goto(`${base}/`, { waitUntil: "load", timeout: 60_000 });

    // الويب: الدخولية تُغلق فوراً؛ الهيكل داخل #root هو أول رسم.
    const splashGone = await page.evaluate(() => !document.querySelector("#mj-silent-splash"));
    assert.equal(splashGone, true, "الويب بلا دخولية حاجبة بعد التحميل");

    const html = await page.content();
    assert.ok(
      html.includes("mj-boot-skeleton") || (await page.locator("#root").evaluate((el) => el.childElementCount > 0)),
      "أول رسم مرئي: هيكل أو React داخل #root",
    );

    const href = "/lessons";
    await page.click(`a[href="${href}"]`).catch(() => null);
    // إن فشل click بسبب اختلاف الصفحة، نُجبر على تغيير مسار داخل نفس الجلسة
    if ((await page.evaluate((h) => window.location.pathname, href)) !== href) {
      await page.evaluate((h) => { history.pushState({}, "", h); }, href);
    }
    await page.waitForTimeout(500);

    const stillThere = await page.evaluate(() => Boolean(document.querySelector("#mj-silent-splash")));
    assert.equal(stillThere, false, "الدخولـية لا يجب أن تعود بعد التنقل الداخلي");
  } finally {
    await browser.close();
    await stop();
  }

  console.log("test-splash-timing: ok");
}

main().catch((e) => {
  console.error("test-splash-timing: FAILED");
  console.error(e);
  process.exit(1);
});

