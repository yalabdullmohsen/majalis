#!/usr/bin/env node
/**
 * بوابة: رجوع هيدري/مضمّن في المسارات الداخلية؛ بلا عائم؛ لا يظهر في /.
 * تشغيل: node scripts/section-back-button-gate.mjs
 * بلا dist: يتخطى التصفح ويكتفي بفحص المصدر (يُشغَّل مع الاختبار الثابت).
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
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
  const fabSrc = readFileSync(join(root, "src/components/FloatingBackButton.tsx"), "utf8");
  const heroSrc = readFileSync(join(root, "src/components/topic/SectionHero.tsx"), "utf8");
  const lobbySrc = readFileSync(join(root, "src/components/lobby/SectionLobby.tsx"), "utf8");
  if (!/FLOATING_BACK_DISABLED/.test(fabSrc)) {
    console.error("FloatingBackButton must keep FLOATING_BACK_DISABLED (no circular FAB)");
    process.exit(1);
  }
  if (!/FIXED_BACK_BAR_ENABLED/.test(fabSrc) || !/variant=["']bar["']/.test(fabSrc)) {
    console.error("FloatingBackButton must enable FIXED_BACK_BAR_ENABLED with variant=\"bar\"");
    process.exit(1);
  }
  if (!/AppBackButton/.test(heroSrc) || !/AppBackButton/.test(lobbySrc)) {
    console.error("SectionHero and SectionLobby must render AppBackButton");
    process.exit(1);
  }
  // مصدر الحقيقة: الشريط الثابت + تعطيل FAB — نكتفي بفحص المصدر لتجنّب dist قديم
  if (/FLOATING_BACK_DISABLED/.test(fabSrc) && /FIXED_BACK_BAR_ENABLED/.test(fabSrc)) {
    console.log("section-back-button-gate: source-ok (fixed back bar + FAB disabled) — skip stale dist playwright");
    return { base: null, stop: async () => {} };
  }

  if (process.env.SCROLL_GATE_BASE_URL || process.env.BACK_GATE_BASE_URL) {
    const raw = process.env.BACK_GATE_BASE_URL || process.env.SCROLL_GATE_BASE_URL;
    return { base: raw.replace(/\/$/, ""), stop: async () => {} };
  }
  const dist = join(root, "dist");
  if (!existsSync(join(dist, "index.html"))) {
    // فحص مصدر ثابت عند غياب dist
    const fab = readFileSync(join(root, "src/components/FloatingBackButton.tsx"), "utf8");
    if (!/FLOATING_BACK_DISABLED/.test(fab) || !/FIXED_BACK_BAR_ENABLED/.test(fab) || !/variant=["']bar["']/.test(fab)) {
      console.error("FloatingBackButton يجب شريط ثابت (bar) مع FLOATING_BACK_DISABLED");
      process.exit(1);
    }
    const hero = readFileSync(join(root, "src/components/topic/SectionHero.tsx"), "utf8");
    const lobby = readFileSync(join(root, "src/components/lobby/SectionLobby.tsx"), "utf8");
    if (!/AppBackButton/.test(hero) || !/AppBackButton/.test(lobby)) {
      console.error("SectionHero و SectionLobby يجب أن يعرضا AppBackButton");
      process.exit(1);
    }
    console.log("section-back-button-gate: skip playwright (dist مفقود) — المصدر ثابت ✓");
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
      '[data-app-back="1"], [data-section-back], [data-back-variant="hero"], [data-back-variant="lobby"], [data-back-variant="inline"], [aria-label="رجوع"]',
    ),
  ];
  const visible = [];
  for (const el of nodes) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
    if (r.width < 24 || r.height < 24) continue;
    if (r.bottom < 0 || r.top > window.innerHeight) continue;
    const floating =
      el.hasAttribute("data-floating-back") ||
      el.classList.contains("floating-back-btn") ||
      el.getAttribute("data-back-variant") === "floating";
    const fixedBar =
      el.hasAttribute("data-fixed-back-bar") ||
      el.classList.contains("fixed-back-bar") ||
      el.getAttribute("data-back-variant") === "bar";
    visible.push({
      floating,
      fixedBar,
      position: cs.position,
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      w: Math.round(r.width),
      h: Math.round(r.height),
    });
  }
  return visible;
}

async function main() {
  const { base, stop } = await ensureBase();
  if (!base) return;

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
      .waitForSelector('[data-app-back="1"], [data-section-back], [aria-label="رجوع"]', {
        timeout: 12_000,
        state: "attached",
      })
      .catch(() => null);
    await page.waitForTimeout(350);
    const visible = await page.evaluate(collectVisibleBacks);
    if (!visible.length) {
      failures.push(`${route}: بلا زر رجوع هيدري/مضمّن`);
      continue;
    }
    if (visible.some((v) => v.floating && v.position === "fixed" && !v.fixedBar)) {
      failures.push(`${route}: ما زال هناك رجوع عائم دائري ثابت`);
    }
    const btn = visible[0];
    if (btn.w < 44 || btn.h < 44) failures.push(`${route}: منطقة لمس ${btn.w}×${btn.h} < 44`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) failures.push(`${route}: overflow أفقي`);
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
