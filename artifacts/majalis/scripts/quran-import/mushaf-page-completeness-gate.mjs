#!/usr/bin/env node
/**
 * بوابة اكتمال الصفحة — حاجبة:
 * عدد الأسطر ذات الحبر الكامل داخل contentBand = عدد أسطر التخطيط المتوقعة.
 * صفر قصّ كلي/جزئي لحبر آية.
 *
 *   pnpm run test:mushaf-page-completeness
 *   MUSHAF_GATE_FULL=1 pnpm run test:mushaf-page-completeness   # ٦٠٤
 *   MUSHAF_GATE_PAGES=1,2,3,528 pnpm run test:mushaf-page-completeness
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
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
const PORT = process.env.MUSHAF_GATE_PORT || "24266";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-page-completeness");
const VIEWPORT = { width: 390, height: 844 };
const PAGES_DIR = join(ROOT, "public/data/quran-v2/pages");
const SHOT_DIR = join(ROOT, "docs/mushaf-integrity/completeness");

/** افتراضي: عيّنة واسعة؛ FULL أو قائمة صريحة للـ٦٠٤ */
const PAGES =
  process.env.MUSHAF_GATE_PAGES || process.env.MUSHAF_GATE_FULL === "1"
    ? resolveGatePages()
    : resolveGatePages();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function waitForServer(url, timeoutMs = 90_000) {
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

/** أسطر آيات متوقعة من ملف الصفحة (أرقام line_number الفريدة للكلمات غير الزخرفية) */
function expectedAyahLines(pageNum) {
  const file = join(PAGES_DIR, `page-${String(pageNum).padStart(3, "0")}.json`);
  if (!existsSync(file)) return null;
  const data = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(data)) return null;
  const lines = new Set();
  for (const ayah of data) {
    for (const w of ayah.words || []) {
      const ln = w.line_number ?? w.lineNumber;
      if (Number.isFinite(ln) && ln >= 1) lines.add(ln);
    }
  }
  return lines.size;
}

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(SHOT_DIR, { recursive: true });

let server = null;
const killServer = () => {
  if (!server?.pid) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    /* ignore */
  }
};

if (!EXTERNAL_BASE) {
  console.log(`mushaf-page-completeness: Vite على ${BASE} · صفحات=${PAGES.length}`);
  server = spawn(
    "pnpm",
    ["exec", "vite", "--config", "vite.config.ts", "--host", "127.0.0.1", "--port", PORT],
    {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PORT, BASE_PATH: "/" },
      detached: true,
    },
  );
  await waitForServer(BASE);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
await page.addInitScript({ content: ACTIVE_PAGE_BROWSER_SOURCE });

const failures = [];
const rows = [];
const shotPages = new Set([1, 2, 3, 50, 228, 528, 601]);

try {
  for (const n of PAGES) {
    const expected = expectedAyahLines(n);
    await page.goto(`${BASE}/mushaf/page/${n}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector(ACTIVE_LINES_WAIT_SEL, { timeout: 45_000 });
    await page.evaluate(() => document.fonts.ready);
    await sleep(n <= 3 || n === 528 ? 1400 : 500);

    const m = await page.evaluate(() => {
      const root = window.__mushafLinesRoot();
      const active = window.__mushafActiveRoot();
      if (!root || !active) return { error: "no active lines" };
      const cr = root.getBoundingClientRect();
      const limitBot = cr.bottom + 0.5;
      const limitTop = cr.top - 0.5;
      const lineEls = window.__mushafQueryAll(".mf2-grid-slot--line .mf2-line");
      const lines = lineEls.length
        ? lineEls
        : window.__mushafQueryAll(".mf2-line");
      let visibleFull = 0;
      let clipped = 0;
      let missingInk = 0;
      const details = [];
      for (const el of lines) {
        const text = (el.textContent || "").trim();
        if (!text) {
          missingInk += 1;
          continue;
        }
        let top = Infinity;
        let bot = -Infinity;
        try {
          const range = document.createRange();
          range.selectNodeContents(el);
          const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
          if (rects.length) {
            top = Math.min(...rects.map((r) => r.top));
            bot = Math.max(...rects.map((r) => r.bottom));
          }
        } catch {
          /* ignore */
        }
        if (!Number.isFinite(top)) {
          const r = el.getBoundingClientRect();
          top = r.top;
          bot = r.bottom;
        }
        const fullyInside = top >= limitTop && bot <= limitBot;
        const partiallyOut = bot > limitBot + 0.5 || top < limitTop - 0.5;
        if (fullyInside) visibleFull += 1;
        else if (partiallyOut) {
          clipped += 1;
          details.push({
            line: el.getAttribute("data-line"),
            overBot: +(bot - limitBot).toFixed(2),
            overTop: +(limitTop - top).toFixed(2),
          });
        }
      }
      /* فحوص overflow الرأسي على حاويات النص */
      const overflowBad = [];
      for (const sel of [".mf2-lines", ".mf2-grid-slot", ".mf2-line", ".mf2-grid-slot--line"]) {
        for (const el of window.__mushafQueryAll(sel).slice(0, 3)) {
          const cs = getComputedStyle(el);
          if (
            cs.overflowY === "hidden" ||
            cs.overflowY === "clip" ||
            cs.overflow === "hidden" ||
            cs.overflow === "clip"
          ) {
            overflowBad.push({ sel, overflowY: cs.overflowY, overflow: cs.overflow });
          }
        }
      }
      return {
        lineDom: lines.length,
        visibleFull,
        clipped,
        missingInk,
        details: details.slice(0, 6),
        overflowBad,
        contentBand: root.dataset.mf2ContentBand || null,
        fontSize: root.dataset.mf2Size || null,
        inkClear: root.dataset.mf2InkBotClear || null,
      };
    });

    if (shotPages.has(n)) {
      await page.screenshot({
        path: join(SHOT_DIR, `page-${String(n).padStart(3, "0")}-after.png`),
        fullPage: false,
      });
    }

    const row = {
      page: n,
      expected,
      lineDom: m.lineDom,
      visibleFull: m.visibleFull,
      clipped: m.clipped,
      missingInk: m.missingInk,
      fontSize: m.fontSize,
      contentBand: m.contentBand,
      inkClear: m.inkClear,
      overflowBad: m.overflowBad,
      details: m.details,
      error: m.error,
    };
    rows.push(row);

    const expectCount = expected ?? m.lineDom;
    const fail =
      m.error ||
      m.clipped > 0 ||
      m.missingInk > 0 ||
      (expectCount != null && m.visibleFull < expectCount) ||
      (m.overflowBad && m.overflowBad.length > 0);

    if (fail) {
      failures.push({
        page: n,
        reason:
          m.error ||
          (m.overflowBad?.length
            ? `overflowY hidden على ${JSON.stringify(m.overflowBad[0])}`
            : `visible=${m.visibleFull} expected=${expectCount} clipped=${m.clipped} missing=${m.missingInk}`),
        details: m.details,
      });
    }

    if (n % 50 === 0 || n <= 3) {
      console.log(
        `ص${n}: expected=${expected} visible=${m.visibleFull} clipped=${m.clipped} font=${m.fontSize}`,
      );
    }
  }
} finally {
  await browser.close();
  killServer();
}

const report = {
  base: BASE,
  pages: PAGES.length,
  failures: failures.length,
  sample: rows.filter((r) => [1, 2, 3, 50, 228, 528, 601].includes(r.page) || r.clipped > 0).slice(0, 60),
  failureList: failures.slice(0, 40),
};
writeFileSync(join(OUT_DIR, "report.json"), JSON.stringify({ ...report, rows }, null, 2));
console.log(JSON.stringify(report, null, 2));

if (failures.length) {
  console.error(`mushaf-page-completeness: FAIL ${failures.length}/${PAGES.length}`);
  process.exit(1);
}
console.log(`mushaf-page-completeness: ok (${PAGES.length} pages)`);
