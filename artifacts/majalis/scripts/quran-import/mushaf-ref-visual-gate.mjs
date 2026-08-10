#!/usr/bin/env node
/**
 * بوابة مطابقة المرجع ≤٢٪ محلياً لص١–٢–٣–٥٠–٢٣٥–٢٨٣–٦٠١.
 *
 * على CI Linux يختلف تنعيم خطوط QPC عن مراجع macOS (~٥–١٨٪ ظلّياً) —
 * لذلك العتبة الافتراضية على CI = ١٨٪ مع بقاء الفحوص الهيكلية حاجبة
 * (انضغاط ص١–٢ · حبر→خرطوش ≥٢٨ · مركزية). لا مخرج يتجاهل الفرق بالكامل.
 *
 *   pnpm run test:mushaf-ref-visual
 *   MUSHAF_REF_MAX_DIFF=0.02 pnpm run test:mushaf-ref-visual   # صارم محلي
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24243";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-ref-visual");
const REF_DIR = join(ROOT, "docs/mushaf-reference");
const VIEWPORT = { width: 390, height: 844 };
const PAGES = (process.env.MUSHAF_REF_PAGES || "1,2,3,50,235,283,601")
  .split(",")
  .map(Number)
  .filter((n) => n >= 1 && n <= 604);
const onCi = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
const MAX_DIFF = Number(
  process.env.MUSHAF_REF_MAX_DIFF || (onCi ? "0.18" : "0.02"),
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

async function settleMushafPage(page, n) {
  await page.goto(`${BASE}/mushaf/page/${n}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector(".mf2-lines--qpc-contiguous", { timeout: 60_000 });
  await page.waitForFunction(
    (pageNum) => {
      const el = document.querySelector(".mf2-lines--qpc-contiguous");
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (Number.parseFloat(cs.opacity || "0") < 0.99) return false;
      if (document.querySelector(".mf2-lines--unicode")) return false;
      const family = `qpc-page-${pageNum}`;
      return document.fonts.check(`24px "${family}"`) || document.fonts.check(`24px ${family}`);
    },
    n,
    { timeout: 60_000 },
  );
  await page.evaluate(() => document.fonts.ready);
  await sleep(500);
}

async function structuralSnapshot(page, n) {
  return page.evaluate((pageNum) => {
    const root = document.querySelector(".mf2-lines");
    if (!root) return { error: "no lines" };
    const lr = root.getBoundingClientRect();
    const frame = document.querySelector("[data-opening-frame], .mf2-opening-frame");
    const banner = document.querySelector(".mf2-grid-slot--banner");
    const br = banner?.getBoundingClientRect();
    const bannerTopPct =
      br && lr.height > 0 ? ((br.top - lr.top) / lr.height) * 100 : null;
    const qpc = Boolean(document.querySelector(".mf2-lines--qpc-contiguous"));
    const unicode = Boolean(document.querySelector(".mf2-lines--unicode"));
    const cart = document.querySelector(
      ".mpv-ayah-page-badge, .mpv-ayah-page-badge__cartouche, [data-cartouche-side]",
    );
    const footer = document.querySelector("[data-cartouche-align], .mpv-ayah-footer");
    const align = footer?.getAttribute("data-cartouche-align") || null;
    let cartDx = null;
    let cartSide = null;
    if (cart) {
      const cr = cart.getBoundingClientRect();
      const midX = window.innerWidth / 2;
      const mid = (cr.left + cr.right) / 2;
      cartDx = Math.abs(mid - midX);
      cartSide = mid < midX - 2 ? "left" : mid > midX + 2 ? "right" : "center";
    }
    const lineEls = [...document.querySelectorAll(".mf2-grid-slot--line .mf2-line")];
    const inkOf = (el) => {
      try {
        const range = document.createRange();
        range.selectNodeContents(el);
        const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
        if (!rects.length) return el.getBoundingClientRect();
        return {
          top: Math.min(...rects.map((r) => r.top)),
          bottom: Math.max(...rects.map((r) => r.bottom)),
        };
      } catch {
        return el.getBoundingClientRect();
      }
    };
    const gaps = [];
    for (let i = 0; i < lineEls.length - 1; i++) {
      const a = inkOf(lineEls[i]);
      const b = inkOf(lineEls[i + 1]);
      gaps.push(b.top - a.bottom);
    }
    const avgH =
      lineEls.length > 0
        ? lineEls.reduce((s, el) => {
            const r = inkOf(el);
            return s + (r.bottom - r.top);
          }, 0) / lineEls.length
        : null;
    const lineGapMin = gaps.length ? Math.min(...gaps) : null;
    const badge = document.querySelector(".mpv-ayah-page-badge");
    let inkToCart = null;
    if (badge && lineEls.length) {
      const last = lineEls[lineEls.length - 1];
      const inkBot = inkOf(last).bottom;
      inkToCart = badge.getBoundingClientRect().top - inkBot;
    }
    const S =
      parseFloat(getComputedStyle(root).getPropertyValue("--mushaf-S")) ||
      parseFloat(getComputedStyle(root).fontSize) ||
      null;
    return {
      hasFrame: Boolean(frame),
      bannerTopPct,
      qpc,
      unicode,
      align,
      cartDx,
      cartSide,
      expectSide: "center",
      lineCount: lineEls.length,
      contentH: lr.height,
      lineGapMin,
      gapOverLh: lineGapMin != null && avgH ? lineGapMin / avgH : null,
      gapOverS: lineGapMin != null && S ? lineGapMin / S : null,
      S,
      inkToCart,
    };
  }, n);
}

const failures = [];
const missingRefs = [];
for (const n of PAGES) {
  const ref = join(REF_DIR, `page-${String(n).padStart(3, "0")}.png`);
  if (!existsSync(ref)) missingRefs.push(n);
}

let server = null;
const killServer = () => {
  if (!server?.pid) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    /* ignore */
  }
};

if (!EXTERNAL_BASE && failures.length === 0) {
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
  try {
    await waitForServer(BASE, 60_000);
  } catch (e) {
    killServer();
    console.error(e.message);
    process.exit(1);
  }
}

mkdirSync(OUT_DIR, { recursive: true });
const results = [];
if (failures.length === 0) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  try {
    for (const n of PAGES) {
      await settleMushafPage(page, n);
      const structural = await structuralSnapshot(page, n);

      if (structural.error) {
        failures.push({ page: n, reason: structural.error });
        results.push({ page: n, structural });
        continue;
      }
      if (structural.unicode || !structural.qpc) {
        failures.push({ page: n, reason: "خط QPC غير جاهز (تراجع Unicode/Amiri)" });
      }
      if (n <= 2) {
        if (structural.hasFrame) {
          failures.push({ page: n, reason: "إطار زخرفي ما زال مرسومًا" });
        }
        if (
          structural.bannerTopPct == null ||
          structural.bannerTopPct < 37.5 ||
          structural.bannerTopPct > 38.5
        ) {
          failures.push({
            page: n,
            reason: `أعلى الشارة ${structural.bannerTopPct?.toFixed?.(2) ?? "null"}٪ خارج ٣٧٫٥–٣٨٫٥`,
          });
        }
        if (structural.lineGapMin != null && structural.lineGapMin < -0.5) {
          failures.push({
            page: n,
            reason: `تراكب أسطر افتتاحية (فجوة ${structural.lineGapMin.toFixed(1)}px)`,
          });
        }
        if (structural.gapOverS != null && structural.gapOverS < 0.24) {
          failures.push({
            page: n,
            reason: `فجوة/S ${((structural.gapOverS) * 100).toFixed(0)}٪ < 24٪`,
          });
        } else if (
          structural.gapOverS != null &&
          structural.gapOverS < 0.34 &&
          structural.inkToCart != null &&
          structural.inkToCart > 36
        ) {
          failures.push({
            page: n,
            reason: `فجوة/S ${((structural.gapOverS) * 100).toFixed(0)}٪ < 35٪ مع فراغ خرطوش`,
          });
        }
      }
      if (structural.cartDx != null && structural.cartDx > 2.05) {
        failures.push({
          page: n,
          reason: `خرطوش غير مركزي dx=${structural.cartDx.toFixed(1)}`,
        });
      }
      if (structural.cartSide && structural.cartSide !== "center") {
        failures.push({
          page: n,
          reason: `خرطوش ${structural.cartSide} متوقع center`,
        });
      }
      if (structural.inkToCart != null && structural.inkToCart < 27.5) {
        failures.push({
          page: n,
          reason: `حبر→خرطوش ${structural.inkToCart.toFixed(1)}px < 28`,
        });
      }

      await page.addStyleTag({
        content: `.mpv-toolbar--ayah,.mpv-ayah-header,.mpv-ayah-footer,.mpv-curl-underlay,.mpv-curl-shade{display:none!important}`,
      });

      const shotPath = join(OUT_DIR, `gen-${String(n).padStart(3, "0")}.png`);
      await page.screenshot({ path: shotPath });
      const refPath = join(REF_DIR, `page-${String(n).padStart(3, "0")}.png`);
      if (!existsSync(refPath)) {
        mkdirSync(REF_DIR, { recursive: true });
        writeFileSync(refPath, readFileSync(shotPath));
        results.push({ page: n, ratio: 0, mode: "baseline-written", structural });
        continue;
      }
      const genB64 = readFileSync(shotPath).toString("base64");
      const refB64 = readFileSync(refPath).toString("base64");

      const cmp = await page.evaluate(
        async ({ genB64, refB64, inkLuma, scale }) => {
          const load = (b64) =>
            new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = `data:image/png;base64,${b64}`;
            });
          const gen = await load(genB64);
          const ref = await load(refB64);
          const fullW = Math.min(gen.width, ref.width);
          const fullH = Math.min(gen.height, ref.height);
          const w = Math.max(1, Math.floor(fullW / scale));
          const h = Math.max(1, Math.floor(fullH / scale));
          const toBin = (img) => {
            const c = document.createElement("canvas");
            c.width = w;
            c.height = h;
            const g = c.getContext("2d");
            g.imageSmoothingEnabled = true;
            g.drawImage(img, 0, 0, w, h);
            const d = g.getImageData(0, 0, w, h).data;
            const bin = new Uint8Array(w * h);
            for (let i = 0, p = 0; i < d.length; i += 4, p++) {
              const L = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
              bin[p] = L < inkLuma ? 1 : 0;
            }
            return bin;
          };
          const a = toBin(gen);
          const b = toBin(ref);
          let mismatched = 0;
          for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) mismatched++;
          return {
            ratio: mismatched / (w * h),
            mismatched,
            w,
            h,
            fullW,
            fullH,
            mode: "silhouette",
          };
        },
        { genB64, refB64, inkLuma: 210, scale: 4 },
      );

      results.push({ page: n, ...cmp, structural });
      if (n <= 2) {
        if (structural.lineGapMin != null && structural.lineGapMin < -0.5) {
          failures.push({
            page: n,
            reason: `تراكب أسطر افتتاحية (فجوة ${structural.lineGapMin.toFixed(1)}px)`,
          });
        }
        if (structural.gapOverS != null && structural.gapOverS < 0.24) {
          failures.push({
            page: n,
            reason: `فجوة/S ${((structural.gapOverS) * 100).toFixed(0)}٪ < 24٪`,
          });
        } else if (
          structural.gapOverS != null &&
          structural.gapOverS < 0.34 &&
          structural.inkToCart != null &&
          structural.inkToCart > 36
        ) {
          failures.push({
            page: n,
            reason: `فجوة/S ${((structural.gapOverS) * 100).toFixed(0)}٪ < 35٪ مع فراغ خرطوش`,
          });
        }
      }
      if (structural.inkToCart != null && structural.inkToCart < 27.5) {
        failures.push({
          page: n,
          reason: `حبر→خرطوش ${structural.inkToCart.toFixed(1)}px < 28`,
        });
      }
      if (cmp.ratio > MAX_DIFF) {
        const updateRefs = process.env.MUSHAF_UPDATE_REFS === "1";
        if (updateRefs) {
          writeFileSync(
            join(REF_DIR, `page-${String(n).padStart(3, "0")}.png`),
            readFileSync(shotPath),
          );
          results[results.length - 1].mode = "baseline-updated";
        } else {
          // كان مخرج CI يتجاهل فرق المرجع ويكتفي باستقرار ذاتي — هذا سبب الارتدادات
          failures.push({
            page: n,
            reason: `فرق ظلّي ${(cmp.ratio * 100).toFixed(2)}٪ > ${(MAX_DIFF * 100).toFixed(0)}٪`,
          });
        }
      }
    }
  } finally {
    await browser.close();
    killServer();
  }
}

const report = { base: BASE, maxDiff: MAX_DIFF, results, failures };
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-ref-visual-gate: ok");
