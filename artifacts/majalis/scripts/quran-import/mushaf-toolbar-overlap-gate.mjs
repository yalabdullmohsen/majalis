#!/usr/bin/env node
/**
 * بوابة تراكب شريط الأدوات: صفر تقاطع مع الشارة أو أسطر النص.
 * الشريط يجب أن يكون أسفل الشاشة (bottom فوق safe-area).
 *
 *   pnpm run test:mushaf-toolbar-overlap
 *   MUSHAF_GATE_BASE_URL=http://127.0.0.1:24216 pnpm run test:mushaf-toolbar-overlap
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTIVE_LINES_WAIT_SEL,
  ACTIVE_PAGE_BROWSER_SOURCE,
  resolveGatePages,
} from "./mushaf-gate-active-page.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24231";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-toolbar-overlap");
const VIEWPORT = { width: 390, height: 844 };
const PAGES = (process.env.MUSHAF_GATE_PAGES || "1,2,3,283,599,600,601")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => n >= 1 && n <= 604);

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

function rectsOverlap(a, b) {
  const ox = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const oy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return { ox, oy, area: ox * oy };
}

/* ثابت: CSS يضع الشريط أسفلًا */
const css = readFileSync(join(ROOT, "src/styles/quran.css"), "utf8");
const ayahTb = css.match(/\.mpv-toolbar\.mpv-toolbar--ayah\s*\{[^}]*\}/);
const failures = [];
if (!ayahTb || !/top:\s*calc\(\s*94\.3vh/.test(ayahTb[0])) {
  failures.push({ page: 0, reason: "CSS: شريط آية ليس تحت الخرطوش (94.3vh+)" });
}
if (ayahTb && /top:\s*calc\(\s*var\(--inset-top\)/.test(ayahTb[0])) {
  failures.push({ page: 0, reason: "CSS: شريط آية ما زال top تحت الرأس" });
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
  console.log(`mushaf-toolbar-overlap: Vite على ${BASE}`);
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
await page.addInitScript({ content: ACTIVE_PAGE_BROWSER_SOURCE });
const results = [];

try {
  for (const n of PAGES) {
    await page.goto(`${BASE}/mushaf/page/${n}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector(ACTIVE_LINES_WAIT_SEL, { timeout: 45_000 });
    await sleep(n <= 2 ? 1100 : 700);
    await page.evaluate(() => {
      document
        .querySelector(".quran-shell--ayah")
        ?.classList.remove("quran-shell--chrome-hidden");
      document
        .querySelector(".mpv-toolbar--ayah")
        ?.classList.remove("mpv-toolbar--hidden");
    });
    await sleep(200);

    const m = await page.evaluate(() => {
      const toolbar = document.querySelector(
        ".mpv-toolbar--ayah:not(.mpv-toolbar--hidden)",
      );
      const leaf =
        __mushafActiveRoot();
      const root =
        __mushafLinesRoot();
      if (!toolbar || !root) return { error: "missing toolbar/lines" };
      const tr = toolbar.getBoundingClientRect();
      const cs = getComputedStyle(toolbar);
      const hitRect = (r, label) => {
        if (!r || r.width < 2 || r.height < 2) return null;
        const ox = Math.max(0, Math.min(tr.right, r.right) - Math.max(tr.left, r.left));
        const oy = Math.max(0, Math.min(tr.bottom, r.bottom) - Math.max(tr.top, r.top));
        if (ox > 0.5 && oy > 0.5) return { cls: label, ox, oy };
        return null;
      };
      const hit = (el, label) => {
        if (!el) return null;
        return hitRect(el.getBoundingClientRect(), label);
      };
      const hitInk = (el, label) => {
        if (!el) return null;
        try {
          const range = document.createRange();
          range.selectNodeContents(el);
          const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
          for (const r of rects) {
            const o = hitRect(r, label);
            if (o) return o;
          }
        } catch {
          /* fall through */
        }
        return hit(el, label);
      };
      const overlaps = [];
      for (const el of root.querySelectorAll(
        ".mf2-grid-slot--banner, .mf2-grid-slot--basmala, .mf2-grid-slot--line, .mf2-bismillah, .mf2-line",
      )) {
        const o = hitInk(el, el.className?.toString?.().slice(0, 60) || el.tagName);
        if (o) overlaps.push(o);
      }
      for (const [sel, label] of [
        [".mpv-ayah-page-badge", "page-badge"],
        [".mpv-ayah-footer__meta", "footer-meta"],
        [".mpv-ayah-footer", "footer-band"],
        ["[data-opening-frame]", "opening-frame"],
        [".mf2-surah-banner", "surah-banner"],
      ]) {
        const o = hit(document.querySelector(sel), label);
        if (o) overlaps.push(o);
      }
      return {
        toolbar: {
          top: tr.top,
          bottom: tr.bottom,
          left: tr.left,
          right: tr.right,
          h: tr.height,
          cssTop: cs.top,
          cssBottom: cs.bottom,
        },
        overlaps,
        vh: window.innerHeight,
      };
    });

    results.push({ page: n, ...m });
    await page.screenshot({
      path: join(OUT_DIR, `page-${String(n).padStart(3, "0")}-toolbar.png`),
    });

    if (m.error) {
      failures.push({ page: n, reason: m.error });
      continue;
    }
    /* الشريط في النصف السفلي (نطاق toolbarBand) */
    if (m.toolbar.top < m.vh * 0.55) {
      failures.push({
        page: n,
        reason: `الشريط أعلى الشاشة (top=${m.toolbar.top.toFixed(0)}px) — يجب أسفل`,
      });
    }
    if (m.overlaps.length) {
      failures.push({
        page: n,
        reason: `تقاطع مع ${m.overlaps.length} عنصرًا: ${m.overlaps
          .slice(0, 3)
          .map((o) => o.cls)
          .join(", ")}`,
      });
    }
  }
} finally {
  await browser.close();
  killServer();
}

const report = { base: BASE, results, failures };
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-toolbar-overlap-gate: ok");
