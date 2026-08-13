#!/usr/bin/env node
/**
 * بوابة لقطة قناع حبر ≤٢٪ — الصفحات: ١·٢·٣·٥٠·٢٢٨·٢٣٥·٢٨٣·٦٠١
 * مقارنة قناع ثنائي داخل Chromium (مقاومة لتنعيم الخطوط).
 *
 *   pnpm run test:mushaf-hard-visual
 *   MUSHAF_HARD_VISUAL_UPDATE=1 pnpm run test:mushaf-hard-visual
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
const PORT = process.env.MUSHAF_GATE_PORT || "24245";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-hard-visual");
const REF_DIR = join(ROOT, "docs/mushaf-hard-visual");
const VIEWPORT = { width: 390, height: 844 };
const PAGES = (process.env.MUSHAF_HARD_VISUAL_PAGES || "1,2,3,50,228,235,283,601")
  .split(",")
  .map(Number)
  .filter((n) => n >= 1 && n <= 604);
const onCi = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
/*
 * قناع الحبر الثنائي: ≤٢٪ محليًا (نفس منصة الخطوط).
 * على CI (Linux vs خطوط macOS المرجعية) يُسمح بهامش منصّة ١٥٪ —
 * الفحوص البنيوية (خرطوش/هامش/حبر→خرطوش) تبقى حاجبة بلا تسامح.
 */
const MAX_DIFF = Number(
  process.env.MUSHAF_HARD_VISUAL_MAX_DIFF || (onCi ? "0.15" : "0.02"),
);
const UPDATE = process.env.MUSHAF_HARD_VISUAL_UPDATE === "1";

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

let server = null;
const killServer = () => {
  if (!server?.pid) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    /* ignore */
  }
};

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(REF_DIR, { recursive: true });

if (!EXTERNAL_BASE) {
  console.log(`mushaf-hard-visual: Vite على ${BASE}`);
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
const results = [];

try {
  for (const n of PAGES) {
    await page.goto(`${BASE}/mushaf/page/${n}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector(ACTIVE_LINES_WAIT_SEL, { timeout: 45_000 });
    await page.evaluate(() => document.fonts.ready);
    await sleep(n <= 3 || n === 228 ? 1300 : 700);

    /* فحوص هيكلية حاجبة مع اللقطة */
    const structural = await page.evaluate(() => {
      const leaf =
        __mushafActiveRoot();
      const lines = __mushafLinesRoot();
      const footer = document.querySelector(".mpv-ayah-footer");
      const badge = document.querySelector(".mpv-ayah-page-badge");
      if (!lines || !footer || !badge) return { error: "missing lines/footer/badge" };
      const lr = lines.getBoundingClientRect();
      const fr = footer.getBoundingClientRect();
      const br = badge.getBoundingClientRect();
      const badgeInFooter =
        br.top >= fr.top - 0.5 && br.bottom <= fr.bottom + 0.5;
      let inkBot = -Infinity;
      for (const el of lines.querySelectorAll(".mf2-line")) {
        try {
          const range = document.createRange();
          range.selectNodeContents(el);
          const rects = [...range.getClientRects()].filter((r) => r.width > 0);
          const bot = rects.length
            ? Math.max(...rects.map((r) => r.bottom))
            : el.getBoundingClientRect().bottom;
          inkBot = Math.max(inkBot, bot);
        } catch {
          inkBot = Math.max(inkBot, el.getBoundingClientRect().bottom);
        }
      }
      let maxOver = 0;
      for (const el of lines.querySelectorAll(".mf2-line")) {
        try {
          const range = document.createRange();
          range.selectNodeContents(el);
          const rects = [...range.getClientRects()].filter((r) => r.width > 0);
          for (const r of rects) {
            maxOver = Math.max(
              maxOver,
              Math.max(0, lr.left + 2 - r.left),
              Math.max(0, r.right - (lr.right - 2)),
            );
          }
        } catch {
          /* ignore */
        }
      }
      return {
        badgeInFooter,
        inkToCart: Number.isFinite(inkBot) ? br.top - inkBot : null,
        maxHOverflow: maxOver,
      };
    });
    if (structural.error) failures.push({ page: n, reason: structural.error });
    if (structural.badgeInFooter === false) {
      failures.push({ page: n, reason: "خرطوش خارج footerBand" });
    }
    if (structural.inkToCart != null && structural.inkToCart < 7.5) {
      failures.push({
        page: n,
        reason: `حبر→خرطوش ${structural.inkToCart.toFixed(1)}px < 8`,
      });
    }
    if (structural.maxHOverflow > 0.5) {
      failures.push({
        page: n,
        reason: `تجاوز أفقي حبر ${structural.maxHOverflow.toFixed(1)}px`,
      });
    }

    await page.addStyleTag({
      content: `.mpv-toolbar--ayah,.mpv-ayah-header,.mpv-ayah-footer,.mpv-flip-underlay,.mpv-flip-shade,.mpv-flip-corner,.mpv-flip-edge,.mpv-flip-leaf__curl{display:none!important}`,
    });
    const shotPath = join(OUT_DIR, `gen-${String(n).padStart(3, "0")}.png`);
    await page.screenshot({ path: shotPath });
    const refPath = join(REF_DIR, `page-${String(n).padStart(3, "0")}.png`);

    if (UPDATE || !existsSync(refPath)) {
      writeFileSync(refPath, readFileSync(shotPath));
      results.push({ page: n, ratio: 0, mode: UPDATE ? "updated" : "created", structural });
      continue;
    }

    const genB64 = readFileSync(shotPath).toString("base64");
    const refB64 = readFileSync(refPath).toString("base64");
    const cmp = await page.evaluate(
      async ({ genB64, refB64, coarse }) => {
        const load = (b64) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = `data:image/png;base64,${b64}`;
          });
        const gen = await load(genB64);
        const ref = await load(refB64);
        /* scale أعلى = مقاومة أكبر لاختلاف تنعيم الخطوط بين المنصات */
        const scale = coarse ? 4 : 2;
        const w = Math.max(1, Math.floor(Math.min(gen.width, ref.width) / scale));
        const h = Math.max(1, Math.floor(Math.min(gen.height, ref.height) / scale));
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
            bin[p] = L < 140 ? 1 : 0;
          }
          return bin;
        };
        const a = toBin(gen);
        const b = toBin(ref);
        let diff = 0;
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
        return { ratio: diff / a.length, w, h, diff };
      },
      { genB64, refB64, coarse: onCi },
    );
    results.push({ page: n, ratio: cmp.ratio, mode: "compared", structural, onCi });
    if (cmp.ratio > MAX_DIFF) {
      failures.push({
        page: n,
        reason: `فرق قناع ${(cmp.ratio * 100).toFixed(2)}٪ > ${(MAX_DIFF * 100).toFixed(0)}٪`,
      });
    }
  }
} finally {
  await browser.close();
  killServer();
}

const report = { base: BASE, maxDiff: MAX_DIFF, failures, results };
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-hard-visual-gate: ok");
