#!/usr/bin/env node
/**
 * بوابة: زر رجوع في المسارات الداخلية؛ جذور التبويب بلا عائم، وموضعه موحّد داخل قالب اللوبي.
 * تشغيل: node scripts/section-back-button-gate.mjs
 * بلا dist: يتخطى التصفح ويكتفي بفحص المصدر (يُشغَّل مع الاختبار الثابت).
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const TAB_ROOTS = ["/fiqh", "/quran-hub", "/lessons", "/sections"];
const SECTION_PATHS = [
  ...TAB_ROOTS,
  "/hadith",
  "/seerah",
  "/tawhid",
  "/tafsir",
  "/quran-knowledge",
  "/ulum-quran",
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
];

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
  if (process.env.SCROLL_GATE_BASE_URL || process.env.BACK_GATE_BASE_URL) {
    const raw = process.env.BACK_GATE_BASE_URL || process.env.SCROLL_GATE_BASE_URL;
    return { base: raw.replace(/\/$/, ""), stop: async () => {} };
  }
  const dist = join(root, "dist");
  if (!existsSync(join(dist, "index.html"))) {
    return { base: null, stop: async () => {} };
  }
  const port = 24216 + 11;
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
    console.log("section-back-button-gate: skip playwright (dist مفقود) — المصدر يُفحص في الاختبار الثابت");
    return;
  }
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ar-KW" });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("majalis.onboarding.onboarding_seen", "1");
      localStorage.setItem("majalis.onboarding.onboarding_major_version", "1");
    } catch { /* ignore */ }
  });
  const page = await context.newPage();
  const failures = [];
  let lobbyTop = null;
  let lobbyStart = null;

  for (const route of SECTION_PATHS) {
    await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(400);
    const box = await page.evaluate(() => {
      const lobby = document.querySelector("[data-section-back]");
      const global = document.querySelector(".global-back-btn, [aria-label='رجوع']");
      const el = lobby || global;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        kind: lobby ? "lobby" : "global",
        top: Math.round(r.top),
        start: Math.round(r.right),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });
    if (TAB_ROOTS.includes(route)) {
      if (box) failures.push(`${route}: جذر تبويب — يُتوقَّع بلا زر رجوع عائم`);
      continue;
    }
    if (!box) {
      failures.push(`${route}: بلا زر رجوع`);
      continue;
    }
    if (box.w < 44 || box.h < 44) failures.push(`${route}: منطقة لمس ${box.w}×${box.h} < 44`);
    /* المسارات الداخلية قد تستخدم GlobalBack أو قالب اللوبي — لا نفرض النوع */
    if (box.kind === "lobby") {
      if (lobbyTop == null) {
        lobbyTop = box.top;
        lobbyStart = box.start;
      } else if (Math.abs(box.top - lobbyTop) > 8 || Math.abs(box.start - lobbyStart) > 12) {
        failures.push(`${route}: موضع لوبي مختلف (top ${box.top} vs ${lobbyTop})`);
      }
    }
  }

  await browser.close();
  await stop();
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log(`✓ test:section-back-button ok (${SECTION_PATHS.length} مسارًا)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
