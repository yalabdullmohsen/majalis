#!/usr/bin/env node
/**
 * بوابة: مسار جديد → أعلى الصفحة (نافذة + حاويات داخلية).
 * تشغيل: node scripts/scroll-top-gate.mjs
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = join(root, "docs/scroll-gates");
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

const ROUTES = [
  "/",
  "/fiqh",
  "/fiqh/usul",
  "/fiqh/books/taharah",
  "/fiqh/books/taharah/lessons/taharah-miyah-aqsam",
  "/fiqh-council",
  "/fiqh-council/issues",
  "/hadith",
  "/seerah",
  "/tawhid",
  "/lessons",
  "/lessons/archive",
  "/quran-hub",
  "/quran-knowledge",
  "/tafsir",
  "/quran-hub/tajweed",
  "/quran-hub/qiraat",
  "/quran/people",
  "/quran/surah-stories",
  "/nations",
  "/tarikh-islami",
  "/library",
  "/academic-research",
  "/islamic-glossary",
  "/universities",
  "/discover-islam",
  "/sections",
  "/calendar",
  "/prophets",
  "/adhkar",
  "/scholars",
];

async function ensureBase() {
  if (process.env.SCROLL_GATE_BASE_URL) {
    return { base: process.env.SCROLL_GATE_BASE_URL.replace(/\/$/, ""), stop: async () => {} };
  }
  const dist = join(root, "dist");
  if (!existsSync(join(dist, "index.html"))) throw new Error("dist مفقود — ابنِ الحزمة أولًا");
  const port = 24216 + 7;
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
  if (ROUTES.length < 30) throw new Error(`المسارات ${ROUTES.length} < 30`);
  const { base, stop } = await ensureBase();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ar-KW" });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("majalis.onboarding.onboarding_seen", "1");
      localStorage.setItem("majalis.onboarding.onboarding_major_version", "1");
    } catch { /* ignore */ }
  });
  const page = await context.newPage();
  const rows = [];
  const failures = [];

  for (const route of ROUTES) {
    await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(500);
    const y = await page.evaluate(() => {
      const roots = [".app-shell", "main#main-content", "[data-scroll-root]"];
      let max = window.scrollY;
      for (const sel of roots) {
        const el = document.querySelector(sel);
        if (el) max = Math.max(max, el.scrollTop);
      }
      return Math.round(max);
    });
    rows.push({ route, scrollY: y });
    if (y > 4) failures.push(`${route} scrollY=${y}`);
  }

  writeFileSync(join(outDir, "scroll-top-report.json"), JSON.stringify({ rows, failures }, null, 2));
  await browser.close();
  await stop();

  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log(`✓ test:scroll-top ok (${ROUTES.length} مسارًا، كلها scrollY≤4)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
