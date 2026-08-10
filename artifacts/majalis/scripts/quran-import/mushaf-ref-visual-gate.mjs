#!/usr/bin/env node
/**
 * بوابة مطابقة المرجع ≤٢٪ فرق بكسل لص١–٢–٣ مقابل docs/mushaf-reference/
 * المقارنة داخل Playwright (بلا تبعيات صورة إضافية).
 *
 *   pnpm run test:mushaf-ref-visual
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
const PAGES = [1, 2, 3];
const MAX_DIFF = Number(process.env.MUSHAF_REF_MAX_DIFF || "0.02");

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
for (const n of PAGES) {
  const ref = join(REF_DIR, `page-${String(n).padStart(3, "0")}.png`);
  if (!existsSync(ref)) failures.push({ page: n, reason: `مرجع مفقود ${ref}` });
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
      await page.goto(`${BASE}/mushaf/page/${n}`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      // لا نلتقط قبل جاهزية QPC — التراجع لـ Amiri يُفسد المقارنة (~٢٠٪ على ص٣).
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
      await sleep(600);
      await page.addStyleTag({
        content: `.mpv-toolbar--ayah,.mpv-ayah-header,.mpv-ayah-footer,.mpv-curl-underlay,.mpv-curl-shade{display:none!important}`,
      });
      const shotPath = join(OUT_DIR, `gen-${String(n).padStart(3, "0")}.png`);
      await page.screenshot({ path: shotPath });
      const genB64 = readFileSync(shotPath).toString("base64");
      const refB64 = readFileSync(
        join(REF_DIR, `page-${String(n).padStart(3, "0")}.png`),
      ).toString("base64");

      // مقارنة بعد تصغير ٢× لامتصاص اختلاف تنعيم الحواف بين macOS/Linux Chromium.
      const cmp = await page.evaluate(
        async ({ genB64, refB64, aaSum }) => {
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
          const scale = 2;
          const w = Math.max(1, Math.floor(fullW / scale));
          const h = Math.max(1, Math.floor(fullH / scale));
          const c1 = document.createElement("canvas");
          const c2 = document.createElement("canvas");
          c1.width = w;
          c1.height = h;
          c2.width = w;
          c2.height = h;
          const g1 = c1.getContext("2d");
          const g2 = c2.getContext("2d");
          g1.imageSmoothingEnabled = true;
          g2.imageSmoothingEnabled = true;
          g1.drawImage(gen, 0, 0, w, h);
          g2.drawImage(ref, 0, 0, w, h);
          const a = g1.getImageData(0, 0, w, h).data;
          const b = g2.getImageData(0, 0, w, h).data;
          let mismatched = 0;
          for (let i = 0; i < a.length; i += 4) {
            const dr = Math.abs(a[i] - b[i]);
            const dg = Math.abs(a[i + 1] - b[i + 1]);
            const db = Math.abs(a[i + 2] - b[i + 2]);
            if (dr + dg + db > aaSum) mismatched++;
          }
          return { ratio: mismatched / (w * h), mismatched, w, h, fullW, fullH };
        },
        { genB64, refB64, aaSum: 72 },
      );

      results.push({ page: n, ...cmp });
      if (cmp.ratio > MAX_DIFF) {
        failures.push({
          page: n,
          reason: `فرق بصري ${(cmp.ratio * 100).toFixed(2)}٪ > ${(MAX_DIFF * 100).toFixed(0)}٪`,
        });
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
