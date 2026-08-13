#!/usr/bin/env node
/**
 * بوابة أداء التقليب: متوسط ≥52fps · أطول إطار ≤36ms · صفر layout مُجبَر من التطبيق أثناء السحب.
 * عتبات CI أرحب قليلاً من سطح المكتب لأن عدّاد الإطارات في headless على Linux يتأثر بالحمل.
 *
 *   pnpm run test:mushaf-flip-perf
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24246";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-flip-perf");
const VIEWPORT = { width: 390, height: 844 };
const MIN_AVG_FPS = Number(process.env.MUSHAF_FLIP_MIN_AVG_FPS || 52);
const MAX_FRAME_MS = Number(process.env.MUSHAF_FLIP_MAX_FRAME_MS || 36);

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
if (!EXTERNAL_BASE) {
  console.log(`mushaf-flip-perf: Vite على ${BASE}`);
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
const context = await browser.newContext({
  viewport: VIEWPORT,
  hasTouch: true,
  isMobile: true,
});
const page = await context.newPage();
const failures = [];
let metrics = null;

try {
  await page.goto(`${BASE}/mushaf/page/3`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector(".mpv-flip-stage", { timeout: 45_000 });
  await page.evaluate(() => document.fonts.ready);
  await sleep(900);

  metrics = await page.evaluate(async () => {
    const stage = document.querySelector(".mpv-flip-stage");
    if (!stage) return { error: "no stage" };
    const rect = stage.getBoundingClientRect();

    /* عدّ قراءات هندسية من التطبيق فقط أثناء نافذة القياس */
    let counting = false;
    let forcedLayouts = 0;
    const proto = Element.prototype;
    const origGbc = proto.getBoundingClientRect;
    const origOw = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
    const origCw = Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth");
    const bump = () => {
      if (counting) forcedLayouts += 1;
    };
    proto.getBoundingClientRect = function (...args) {
      bump();
      return origGbc.apply(this, args);
    };
    if (origOw?.get) {
      Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
        configurable: true,
        get() {
          bump();
          return origOw.get.call(this);
        },
      });
    }
    if (origCw?.get) {
      Object.defineProperty(Element.prototype, "clientWidth", {
        configurable: true,
        get() {
          bump();
          return origCw.get.call(this);
        },
      });
    }

    const frames = [];
    let last = performance.now();
    let rafId = 0;
    const loop = (t) => {
      if (counting) {
        frames.push(t - last);
        last = t;
      } else {
        last = t;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    const startX = rect.left + rect.width * 0.35;
    const y = rect.top + rect.height * 0.5;
    const fire = (type, x) => {
      stage.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          pointerId: 1,
          pointerType: "touch",
          buttons: type === "pointerup" ? 0 : 1,
        }),
      );
    };

    /* تسخين: pointerdown + تحرّك صغير لإقفال المحور واستقرار الطبقات */
    fire("pointerdown", startX);
    await new Promise((r) => requestAnimationFrame(r));
    fire("pointermove", startX + 12);
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));

    counting = true;
    forcedLayouts = 0;
    frames.length = 0;
    last = performance.now();

    const steps = 36;
    for (let i = 1; i <= steps; i++) {
      const x = startX + 12 + (rect.width * 0.42 * i) / steps;
      fire("pointermove", x);
      await new Promise((r) => requestAnimationFrame(r));
    }

    counting = false;
    fire("pointerup", startX + 12 + rect.width * 0.42);
    cancelAnimationFrame(rafId);

    proto.getBoundingClientRect = origGbc;
    if (origOw) Object.defineProperty(HTMLElement.prototype, "offsetWidth", origOw);
    if (origCw) Object.defineProperty(Element.prototype, "clientWidth", origCw);

    await new Promise((r) => setTimeout(r, 40));

    const sample = frames.slice(1);
    const maxFrame = Math.max(...sample, 0);
    const avgFrame =
      sample.reduce((a, b) => a + b, 0) / Math.max(1, sample.length);
    const avgFps = avgFrame > 0 ? 1000 / avgFrame : 0;
    const flipVar = getComputedStyle(stage).getPropertyValue("--mpv-flip").trim();
    return {
      frames: sample.length,
      avgFrameMs: +avgFrame.toFixed(2),
      maxFrameMs: +maxFrame.toFixed(2),
      avgFps: +avgFps.toFixed(1),
      forcedLayouts,
      flipVar,
      draggingClass:
        stage.classList.contains("mpv-flip-stage--dragging") ||
        stage.classList.contains("mpv-flip-stage--flipping") ||
        stage.classList.contains("mpv-flip-stage--active"),
    };
  });

  if (metrics.error) failures.push({ reason: metrics.error });
  if (metrics.avgFps < MIN_AVG_FPS) {
    failures.push({
      reason: `متوسط fps ${metrics.avgFps} < ${MIN_AVG_FPS}`,
    });
  }
  if (metrics.maxFrameMs > MAX_FRAME_MS) {
    failures.push({
      reason: `أطول إطار ${metrics.maxFrameMs}ms > ${MAX_FRAME_MS}`,
    });
  }
  if ((metrics.forcedLayouts || 0) > 0) {
    failures.push({
      reason: `layout مُجبَر أثناء الحركة: ${metrics.forcedLayouts}`,
    });
  }
} finally {
  await browser.close();
  killServer();
}

const report = {
  base: BASE,
  metrics,
  failures,
  thresholds: { MIN_AVG_FPS, MAX_FRAME_MS, MAX_FORCED_LAYOUTS: 0 },
};
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-flip-perf-gate: ok");
