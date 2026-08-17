#!/usr/bin/env node
/**
 * بوابة: بعد الاستقرار scrollY ≤ 4px على ≥25 مسار قسم/باب.
 * تشغيل: node scripts/verify-scroll-top-gate.mjs
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = process.env.SCROLL_TOP_GATE_PORT || "24392";
const baseUrl = `http://127.0.0.1:${PORT}`;

const ROUTES = [
  "/sections",
  "/tawhid",
  "/fiqh",
  "/hadith",
  "/seerah",
  "/prophets",
  "/nations",
  "/quran-hub",
  "/quran-knowledge",
  "/tafsir",
  "/quran/tajweed",
  "/library",
  "/lessons",
  "/adhkar",
  "/islamic-glossary",
  "/scholars",
  "/discover-islam",
  "/islamic-directory",
  "/universities",
  "/stories",
  "/tarikh-islami",
  "/quran/people",
  "/hadith/sahih",
  "/hadith/daif",
  "/hadith/books",
  "/learn",
];

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((res, rej) => {
    const tryOnce = () => {
      fetch(url)
        .then((r) => res(r.status))
        .catch(() => {
          if (Date.now() - start > timeoutMs) rej(new Error(`Server did not respond at ${url}`));
          else setTimeout(tryOnce, 400);
        });
    };
    tryOnce();
  });
}

async function main() {
  if (ROUTES.length < 25) {
    console.error(`يلزم ≥25 مسارًا، الموجود ${ROUTES.length}`);
    process.exit(1);
  }
  const server = spawn(
    "pnpm",
    ["exec", "vite", "--config", "vite.config.ts", "--host", "127.0.0.1", "--port", PORT],
    {
      cwd: appRoot,
      env: { ...process.env, PORT, BASE_PATH: process.env.BASE_PATH || "/", HOST: "127.0.0.1" },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    },
  );
  const killServer = () => {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      /* already dead */
    }
  };

  try {
    await waitForServer(baseUrl, 45000);
  } catch (e) {
    killServer();
    console.error(e);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const rows = [];
  let failed = 0;

  for (const route of ROUTES) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(450);
    const y = await page.evaluate(() => window.scrollY);
    const ok = y <= 4;
    rows.push({ route, y, ok });
    if (!ok) {
      failed += 1;
      console.error(`  ✗ ${route} scrollY=${y}`);
    } else {
      console.log(`  ✓ ${route} scrollY=${y}`);
    }
  }

  await browser.close();
  killServer();

  console.log(`scroll-top: ${ROUTES.length - failed}/${ROUTES.length} · حد ≤4px`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
