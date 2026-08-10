#!/usr/bin/env node
/**
 * بوابة نطاقات المصحف:
 * 1) صفر تقاطع خرطوش/وصف حزب مع حبر الأسطر
 * 2) صفر تقاطع شريط الأدوات مع نص/شارة/خرطوش/إطار
 * 3) ثبات خطوط الأساس قبل/بعد إظهار الشريط
 *
 *   pnpm run test:mushaf-layout-bands
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const require = createRequire(import.meta.url);
/* bands via JSON-like read from TS source constants — mirror numbers */
const BANDS = {
  toolbarBandPx: 52,
  footerBandPx: 46,
  contentFooterGapPx: 20,
};
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24235";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-layout-bands");
const VIEWPORT = { width: 390, height: 844 };
const TOOLBAR_PAGES = [1, 2, 3, 283, 599, 600, 601];
const FOOTER_PAGES = (process.env.MUSHAF_GATE_PAGES || "1,2,3,4,7,100,283,306,400,500,588,596,599,600,601,604")
  .split(",")
  .map(Number)
  .filter((n) => n >= 1 && n <= 604);
const GRID = JSON.parse(
  readFileSync(join(ROOT, "src/features/mushaf/mushaf-grid.json"), "utf8"),
);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  return new Promise((resolveOk, reject) => {
    const tryOnce = () => {
      fetch(url, { redirect: "manual" })
        .then(() => resolveOk())
        .catch(() => {
          if (Date.now() - start > timeoutMs) reject(new Error(`no server ${url}`));
          else setTimeout(tryOnce, 400);
        });
    };
    tryOnce();
  });
}

const failures = [];
const css = readFileSync(join(ROOT, "src/styles/quran.css"), "utf8");
if (!/--mpv-toolbar-band:\s*52px/.test(css) || !/--mpv-footer-band:\s*46px/.test(css)) {
  failures.push({ page: 0, reason: "CSS vars للنطاقات ناقصة" });
}
if (!/bottom:\s*calc\(\s*var\(--inset-bottom[^)]*\)\s*\+\s*var\(--mpv-toolbar-band/.test(css)) {
  failures.push({ page: 0, reason: "الذيل ليس فوق toolbarBand" });
}
if (!existsSync(join(ROOT, "src/features/mushaf/layout-bands.ts"))) {
  failures.push({ page: 0, reason: "layout-bands.ts مفقود" });
}
if (GRID.referencePage !== 283) {
  failures.push({ page: 0, reason: `grid referencePage=${GRID.referencePage}` });
}

let server = null;
let serverOutput = "";
const killServer = () => {
  if (!server?.pid) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    /* ignore */
  }
};

if (!EXTERNAL_BASE) {
  console.log(`mushaf-layout-bands: Vite على ${BASE}`);
  server = spawn(
    "pnpm",
    ["exec", "vite", "--config", "vite.config.ts", "--host", "127.0.0.1", "--port", PORT],
    {
      cwd: ROOT,
      env: { ...process.env, PORT, BASE_PATH: "/", HOST: "127.0.0.1" },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    },
  );
  server.stdout.on("data", (d) => {
    serverOutput += d.toString();
  });
  server.stderr.on("data", (d) => {
    serverOutput += d.toString();
  });
  try {
    await waitForServer(BASE, 60_000);
  } catch (e) {
    console.error(serverOutput.slice(-1500));
    killServer();
    console.error(e.message);
    process.exit(1);
  }
}

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: VIEWPORT });
const results = { bands: null, pages: {} };

function overlap(a, b) {
  if (!a || !b) return { ox: 0, oy: 0, area: 0 };
  const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return { ox, oy, area: ox * oy };
}

async function probe(n, { showToolbar }) {
  await page.goto(`${BASE}/mushaf/page/${n}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector(".mf2-lines", { timeout: 45_000 });
  await sleep(n <= 3 || n === 283 ? 1100 : 550);
  if (showToolbar) {
    await page.evaluate(() => {
      document.querySelector(".quran-shell--ayah")?.classList.remove("quran-shell--chrome-hidden");
      document.querySelector(".mpv-toolbar--ayah")?.classList.remove("mpv-toolbar--hidden");
    });
  } else {
    await page.addStyleTag({
      content: `.mpv-toolbar--ayah{display:none!important}`,
    });
  }
  await sleep(150);
  return page.evaluate((baselines) => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, h: r.height, w: r.width };
    };
    const ov = (a, b) => {
      if (!a || !b) return { ox: 0, oy: 0, area: 0 };
      const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return { ox, oy, area: ox * oy };
    };
    const header = document.querySelector(".mpv-ayah-header");
    const footer = document.querySelector(".mpv-ayah-footer");
    const badge = document.querySelector(".mpv-ayah-page-badge");
    const meta = document.querySelector(".mpv-ayah-footer__meta");
    const lines = document.querySelector(".mf2-lines");
    const toolbar = document.querySelector(".mpv-toolbar--ayah:not(.mpv-toolbar--hidden)");
    const frame = document.querySelector("[data-opening-frame]");
    const banner = document.querySelector(".mf2-grid-slot--banner");
    const lineEls = [...document.querySelectorAll(".mf2-grid-slot--line .mf2-line")];
    const lastLine = lineEls.at(-1);
    const lr = rect(lines);
    const baselinesPx = [...document.querySelectorAll(".mf2-grid-slot--line[data-grid-slot]")].map(
      (el) => {
        const r = el.getBoundingClientRect();
        const slot = Number(el.getAttribute("data-grid-slot"));
        const mid = r.top + r.height / 2;
        const midPct = lr && lr.h > 0 ? ((mid - lr.top) / lr.h) * 100 : null;
        const exp = baselines[slot - 1];
        const devPx =
          exp != null && midPct != null && lr
            ? Math.abs(midPct - exp) * (lr.h / 100)
            : null;
        return { slot, mid: +mid.toFixed(2), midPct, devPx };
      },
    );
    let maxDev = 0;
    for (const b of baselinesPx) if (b.devPx != null) maxDev = Math.max(maxDev, b.devPx);

    /* ink extents via canvas for last line */
    let lastInk = rect(lastLine);
    if (lastLine) {
      const cs = getComputedStyle(lastLine);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.font = cs.font;
        const m = ctx.measureText((lastLine.textContent || "").trim());
        const ascent =
          m.actualBoundingBoxAscent || m.fontBoundingBoxAscent || parseFloat(cs.fontSize) * 0.95;
        const descent =
          m.actualBoundingBoxDescent ||
          m.fontBoundingBoxDescent ||
          parseFloat(cs.fontSize) * 0.45;
        const box = lastLine.getBoundingClientRect();
        const baselineY = box.top + box.height / 2 + (ascent - descent) / 2;
        lastInk = {
          top: baselineY - ascent,
          bottom: baselineY + descent,
          left: box.left,
          right: box.right,
          h: ascent + descent,
          w: box.width,
        };
      }
    }

    const hr = rect(header);
    const fr = rect(footer);
    const br = rect(badge);
    const tr = rect(toolbar);
    const gapContentFooter =
      fr && lastInk ? fr.top - lastInk.bottom : fr && lr ? fr.top - lr.bottom : null;

    return {
      vh: innerHeight,
      headerH: hr?.h ?? null,
      contentH: lr?.h ?? null,
      footerH: fr?.h ?? null,
      toolbarH: tr?.h ?? null,
      header: hr,
      footer: fr,
      badge: br,
      meta: rect(meta),
      lines: lr,
      toolbar: tr,
      frame: rect(frame),
      banner: rect(banner),
      lastInk,
      gapContentFooter,
      maxDev,
      baselinesPx,
      overlaps: {
        badgeInk: ov(br, lastInk),
        metaInk: ov(rect(meta), lastInk),
        toolbarInk: ov(tr, lastInk),
        toolbarBadge: ov(tr, br),
        toolbarBanner: ov(tr, rect(banner)),
        toolbarFrame: ov(tr, rect(frame)),
        toolbarLines: ov(tr, lr),
      },
      contentBandDataset: lines?.dataset?.mf2ContentBand || null,
    };
  }, GRID.baselinesPct);
}

try {
  /* عيّنة ص٣: ثبات الأسس + لقطات */
  const off = await probe(3, { showToolbar: false });
  const on = await probe(3, { showToolbar: true });
  results.pages[3] = { off, on };
  await page.goto(`${BASE}/mushaf/page/3`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector(".mf2-lines", { timeout: 45_000 });
  await sleep(900);
  await page.addStyleTag({ content: `.mpv-toolbar--ayah{display:none!important}` });
  await page.screenshot({ path: join(OUT_DIR, "p3-toolbar-off.png") });
  await page.evaluate(() => {
    document.querySelector(".quran-shell--ayah")?.classList.remove("quran-shell--chrome-hidden");
    document.querySelector(".mpv-toolbar--ayah")?.classList.remove("mpv-toolbar--hidden");
    document.querySelector(".mpv-toolbar--ayah")?.style.removeProperty("display");
  });
  await sleep(200);
  await page.screenshot({ path: join(OUT_DIR, "p3-toolbar-on.png") });
  /* zoom cartouche */
  const badge = page.locator(".mpv-ayah-page-badge");
  if (await badge.count()) {
    await badge.screenshot({ path: join(OUT_DIR, "p3-cartouche.png") });
  }

  results.bands = {
    viewport: VIEWPORT,
    headerBandPx: off.headerH,
    contentBandPx: off.contentH,
    footerBandPx: off.footerH ?? BANDS.footerBandPx,
    toolbarBandPx: BANDS.toolbarBandPx,
    contentFooterGapPx: BANDS.contentFooterGapPx,
    measuredGapContentFooter: off.gapContentFooter,
    consts: BANDS,
  };

  if (off.gapContentFooter != null && off.gapContentFooter < 11.5) {
    failures.push({
      page: 3,
      reason: `فاصل content→footer ${off.gapContentFooter.toFixed(1)}px < 12`,
    });
  }
  if (off.overlaps.badgeInk.oy > 0.5 || off.overlaps.metaInk.oy > 0.5) {
    failures.push({ page: 3, reason: "تقاطع خرطوش/وصف مع حبر (شريط مخفي)" });
  }
  if (on.overlaps.toolbarInk.oy > 0.5 || on.overlaps.toolbarBadge.oy > 0.5) {
    failures.push({ page: 3, reason: "تقاطع شريط مع نص/خرطوش" });
  }
  /* ثبات الأسس */
  const offMids = off.baselinesPx.map((b) => b.mid);
  const onMids = on.baselinesPx.map((b) => b.mid);
  let maxShift = 0;
  for (let i = 0; i < Math.min(offMids.length, onMids.length); i++) {
    maxShift = Math.max(maxShift, Math.abs(offMids[i] - onMids[i]));
  }
  results.pages[3].baselineShiftPx = maxShift;
  if (maxShift > 0.5) {
    failures.push({ page: 3, reason: `إزاحة خطوط الأساس عند إظهار الشريط ${maxShift.toFixed(2)}px` });
  }

  for (const n of FOOTER_PAGES) {
    if (n === 3) continue;
    const m = await probe(n, { showToolbar: false });
    results.pages[n] = { ...(results.pages[n] || {}), off: m };
    if (m.overlaps.badgeInk.oy > 0.5 || m.overlaps.metaInk.oy > 0.5) {
      failures.push({ page: n, reason: "تقاطع ذيل مع حبر" });
    }
    if (m.gapContentFooter != null && m.gapContentFooter < 11.5) {
      failures.push({
        page: n,
        reason: `فاصل content→footer ${m.gapContentFooter.toFixed(1)}px < 12`,
      });
    }
    /* الشبكة لصفحات عادية فقط — ص١–٢ داخل الإطار بنسب مختلفة */
    if (n > 2 && m.maxDev > 2) {
      failures.push({ page: n, reason: `انحراف شبكة ${m.maxDev.toFixed(2)}px` });
    }
  }

  for (const n of TOOLBAR_PAGES) {
    const m = await probe(n, { showToolbar: true });
    results.pages[n] = { ...(results.pages[n] || {}), on: m };
    const o = m.overlaps;
    if (
      o.toolbarInk.oy > 0.5 ||
      o.toolbarBadge.oy > 0.5 ||
      o.toolbarBanner.oy > 0.5 ||
      o.toolbarFrame.oy > 0.5
    ) {
      failures.push({ page: n, reason: "تقاطع شريط مع محتوى" });
    }
  }
} finally {
  await browser.close();
  killServer();
}

const report = { base: BASE, bands: results.bands, failures, sample: results.pages[3] };
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify({ ...report, pages: results.pages }, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-layout-bands-gate: ok");
