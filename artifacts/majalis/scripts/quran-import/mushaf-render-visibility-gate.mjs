#!/usr/bin/env node
/**
 * بوابة حجب: المصحف يجب أن يعرض نصاً مرئياً داخل الشاشة — لا يكفي وجود DOM خارج viewport.
 *
 * يفشل إن:
 *  - لا توجد أسطر mf2-line
 *  - الأسطر فارغة نصاً
 *  - غلاف .quran-shell--immersive خارج الشاشة (top ≥ viewportHeight أو bottom ≤ 0)
 *  - opacity:0 أو display:none على كتلة الأسطر
 *  - position ليس fixed (relative على .quran-shell--ayah يلغي immersive)
 *
 * الاستخدام:
 *   pnpm run test:mushaf-render-visibility
 *   MUSHAF_GATE_BASE_URL=http://127.0.0.1:24228 node scripts/quran-import/mushaf-render-visibility-gate.mjs
 *   MUSHAF_GATE_PAGES=1,283,604
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || process.env.PORT || "24228";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const PAGES = (process.env.MUSHAF_GATE_PAGES || "1,283,604")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isFinite(n) && n >= 1 && n <= 604);
const VIEWPORT = { width: 390, height: 844 };

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function waitForServer(url, timeoutMs = 45_000) {
  const start = Date.now();
  return new Promise((resolveOk, reject) => {
    const tryOnce = () => {
      fetch(url, { redirect: "manual" })
        .then(() => resolveOk())
        .catch(() => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Server did not respond at ${url} within ${timeoutMs}ms`));
          } else setTimeout(tryOnce, 400);
        });
    };
    tryOnce();
  });
}

async function probe(page, pageNum) {
  const url = `${BASE}/mushaf/page/${pageNum}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector(".mf2-lines .mf2-line, .quran-shell--ayah", { timeout: 45_000 });
  await sleep(1200);

  return page.evaluate((vh) => {
    const shell = document.querySelector(
      ".quran-shell--immersive.quran-shell--ayah, .quran-shell--ayah",
    );
    const lines = document.querySelector(".mf2-lines");
    const lineEls = [...document.querySelectorAll(".mf2-line")];
    const nonEmpty = lineEls.filter((el) => (el.textContent || "").trim().length > 0);
    const shellRect = shell?.getBoundingClientRect();
    const linesStyle = lines ? getComputedStyle(lines) : null;
    const pos = shell ? getComputedStyle(shell).position : null;
    const inViewport =
      !!shellRect && shellRect.top < vh && shellRect.bottom > 0 && shellRect.height > 40;
    return {
      lineCount: lineEls.length,
      nonEmptyLines: nonEmpty.length,
      sample: nonEmpty[0]?.textContent?.trim().slice(0, 40) || "",
      shellTop: shellRect ? Math.round(shellRect.top) : null,
      shellHeight: shellRect ? Math.round(shellRect.height) : null,
      position: pos,
      linesOpacity: linesStyle?.opacity ?? null,
      linesDisplay: linesStyle?.display ?? null,
      inViewport,
      hasError: !!document.querySelector("[role='alert']"),
    };
  }, VIEWPORT.height);
}

let server = null;
let serverOutput = "";
const killServer = () => {
  if (!server?.pid) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    /* already dead */
  }
};

if (!EXTERNAL_BASE) {
  console.log(`mushaf-render-visibility-gate: تشغيل Vite على ${BASE}`);
  server = spawn(
    "pnpm",
    ["exec", "vite", "--config", "vite.config.ts", "--host", "127.0.0.1", "--port", PORT],
    {
      cwd: appRoot,
      env: { ...process.env, PORT, BASE_PATH: process.env.BASE_PATH || "/", HOST: "127.0.0.1" },
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
    await waitForServer(BASE, 45_000);
  } catch (e) {
    console.error(serverOutput.slice(-2000));
    killServer();
    console.error(`تعذّر تشغيل الخادم: ${e.message}`);
    process.exit(1);
  }
}

let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch (e) {
  killServer();
  console.error("Playwright Chromium غير متاح — pnpm exec playwright install --with-deps chromium");
  console.error(String(e?.message || e).slice(0, 400));
  process.exit(1);
}

const page = await browser.newPage({ viewport: VIEWPORT });
const failures = [];

console.log(`mushaf-render-visibility-gate base=${BASE} pages=${PAGES.join(",")}`);

try {
  for (const n of PAGES) {
    let m;
    try {
      m = await probe(page, n);
    } catch (err) {
      failures.push(`p${n}: exception ${err?.message || err}`);
      console.error(`FAIL p${n}:`, err?.message || err);
      continue;
    }
    const ok =
      m.lineCount > 0 &&
      m.nonEmptyLines > 0 &&
      m.inViewport &&
      m.position === "fixed" &&
      m.linesOpacity !== "0" &&
      m.linesDisplay !== "none" &&
      !m.hasError;
    const line = `p${n}: lines=${m.lineCount} nonEmpty=${m.nonEmptyLines} pos=${m.position} shellTop=${m.shellTop} inView=${m.inViewport} sample="${m.sample}"`;
    if (ok) console.log(`ok ${line}`);
    else {
      console.error(`FAIL ${line}`);
      failures.push(line);
    }
  }
} finally {
  await browser.close();
  killServer();
}

if (failures.length) {
  console.error(`\nmushaf-render-visibility-gate: ${failures.length} فشل`);
  process.exit(1);
}
console.log("mushaf-render-visibility-gate: ok");
