#!/usr/bin/env node
/**
 * يثبت أن قياس الأسطر مقيَّد بالصفحة النشطة وحدها.
 * صفحة عادية → ١٥ سطراً بالضبط. إن ظهر ٤٥ فالاستعلام يلتقط الجيران.
 *
 *   pnpm run test:mushaf-active-page-lines
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTIVE_LINES_WAIT_SEL,
  ACTIVE_PAGE_BROWSER_SOURCE,
} from "./mushaf-gate-active-page.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24255";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
/** صفحة عادية بلا لافتة/بسملة تستهلك خانات — ١٥ سطر آيات (مثل ص٤) */
const PAGE = Number(process.env.MUSHAF_GATE_ACTIVE_LINES_PAGE || 4);
const EXPECTED = 15;

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

if (!EXTERNAL_BASE) {
  console.log(`mushaf-active-page-lines: Vite على ${BASE}`);
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
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript({ content: ACTIVE_PAGE_BROWSER_SOURCE });

try {
  await page.goto(`${BASE}/mushaf/page/${PAGE}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector(ACTIVE_LINES_WAIT_SEL, { timeout: 45_000 });
  await page.evaluate(() => document.fonts.ready);
  await sleep(900);

  const m = await page.evaluate(() => {
    const active = window.__mushafActiveRoot();
    const linesRoot = window.__mushafLinesRoot();
    const gridLines = window.__mushafQueryAll(".mf2-grid-slot--line .mf2-line");
    const scoped = gridLines.length
      ? gridLines
      : window.__mushafQueryAll(".mf2-line");
    const globalAll = [...document.querySelectorAll(".mf2-line")];
    return {
      hasActive: !!active,
      pageState: active?.getAttribute("data-page-state") || null,
      scopedCount: scoped.length,
      globalCount: globalAll.length,
      underlayPresent: !!document.querySelector(
        "[data-mushaf-underlay], [data-page-state='next'], [data-page-state='prev']",
      ),
      sample: scoped[0]?.textContent?.trim().slice(0, 24) || "",
      linesRootOk: !!linesRoot,
    };
  });

  console.log(JSON.stringify({ page: PAGE, expected: EXPECTED, ...m }, null, 2));

  if (!m.hasActive || m.pageState !== "active") {
    console.error("FAIL: لا توجد حاوية data-page-state=active");
    process.exit(1);
  }
  if (m.scopedCount !== EXPECTED) {
    console.error(
      `FAIL: الأسطر المقيسة من الصفحة النشطة = ${m.scopedCount} (المتوقع ${EXPECTED}).` +
        (m.scopedCount >= 40 || m.globalCount >= 40
          ? " الاستعلام يلتقط صفحات الجوار."
          : ""),
    );
    process.exit(1);
  }
  if (m.globalCount > EXPECTED && m.scopedCount === EXPECTED) {
    console.log(
      `OK: عالميًا ${m.globalCount} سطرًا في DOM (جوار)، والمقيس من النشطة = ${EXPECTED}`,
    );
  } else {
    console.log(`OK: ${EXPECTED} سطرًا بالضبط من الصفحة النشطة`);
  }
} finally {
  await browser.close();
  killServer();
}
