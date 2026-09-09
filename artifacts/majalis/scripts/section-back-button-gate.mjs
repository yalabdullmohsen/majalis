#!/usr/bin/env node
/**
 * بوابة: زر رجوع عائم واحد في المسارات الداخلية؛ بلا رجوع مكرر؛ لا يظهر في /.
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
  "/academic-research",
  "/islamic-glossary",
  "/universities",
  "/discover-islam",
  "/akhlaq",
  "/stories",
  "/islamic-sects",
  "/miracles",
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

function collectVisibleBacks() {
  const nodes = [
    ...document.querySelectorAll(
      '[data-floating-back], .floating-back-btn, .global-back-btn, [data-app-back="1"], [data-section-back], [aria-label="رجوع"]',
    ),
  ];
  const visible = [];
  for (const el of nodes) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
    if (r.width < 24 || r.height < 24) continue;
    if (r.bottom < 0 || r.top > window.innerHeight) continue;
    visible.push({
      floating: el.hasAttribute("data-floating-back") || el.classList.contains("floating-back-btn"),
      position: cs.position,
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      right: Math.round(r.right),
      w: Math.round(r.width),
      h: Math.round(r.height),
    });
  }
  return visible;
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
    } catch {
      /* ignore */
    }
  });
  const page = await context.newPage();
  const failures = [];

  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(400);
  const homeBacks = await page.evaluate(collectVisibleBacks);
  if (homeBacks.length) failures.push(`/: ظهر زر رجوع (${homeBacks.length}) — متوقع إخفاء`);

  for (const route of SECTION_PATHS) {
    await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page
      .waitForSelector("[data-floating-back], .floating-back-btn, .global-back-btn", {
        timeout: 12_000,
        state: "attached",
      })
      .catch(() => null);
    await page.waitForTimeout(350);
    const visible = await page.evaluate(collectVisibleBacks);
    if (!visible.length) {
      failures.push(`${route}: بلا زر رجوع عائم`);
      continue;
    }
    if (visible.length > 1) {
      failures.push(`${route}: أكثر من زر رجوع ظاهر (${visible.length})`);
    }
    const fab = visible.find((v) => v.floating && v.position === "fixed") || visible[0];
    if (!fab.floating || fab.position !== "fixed") {
      failures.push(`${route}: الرجوع ليس عائمًا ثابتًا`);
    }
    if (fab.w < 44 || fab.h < 44) failures.push(`${route}: منطقة لمس ${fab.w}×${fab.h} < 44`);
    if (fab.top < 400) failures.push(`${route}: العائم أعلى من المتوقع (top ${fab.top})`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) failures.push(`${route}: overflow أفقي`);

    // سرعة الاستجابة: history.back / navigate يُستدعى خلال <100ms من pointerdown
    const latency = await page.evaluate(async () => {
      const btn = document.querySelector("[data-floating-back], .floating-back-btn");
      if (!btn) return -1;
      const t0 = performance.now();
      let fired = false;
      const origBack = window.history.back.bind(window.history);
      window.history.back = () => {
        fired = true;
        window.__backLatency = performance.now() - t0;
      };
      btn.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "touch" }));
      await new Promise((r) => requestAnimationFrame(r));
      window.history.back = origBack;
      return fired ? window.__backLatency : performance.now() - t0;
    });
    if (latency >= 0 && latency > 100) {
      failures.push(`${route}: رجوع بطيء ${Math.round(latency)}ms (>100ms)`);
    }
  }

  await browser.close();
  await stop();
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log(`✓ test:section-back-button ok (${SECTION_PATHS.length} مسارًا + فحص الرئيسية)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
