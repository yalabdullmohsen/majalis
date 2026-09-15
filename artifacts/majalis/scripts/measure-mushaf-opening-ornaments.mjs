/**
 * قياس ميدالية الافتتاح عبر viewports — دائرة؟ نقطة حزب مخفية؟
 * تشغيل بعد build: node --import tsx scripts/measure-mushaf-opening-ornaments.mjs
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "test-results/mushaf-opening-ornaments");
mkdirSync(outDir, { recursive: true });

const PORT = process.env.ORNAMENT_PORT || "24421";
const base = `http://127.0.0.1:${PORT}`;

const viewports = [
  { name: "iphone-se", width: 375, height: 667 },
  { name: "iphone-pro-max", width: 430, height: 932 },
  { name: "android-phone", width: 412, height: 915 },
  { name: "ipad", width: 768, height: 1024 },
  { name: "android-tablet", width: 800, height: 1280 },
  { name: "desktop", width: 1280, height: 800 },
  { name: "landscape-phone", width: 844, height: 390 },
];

function startPreview() {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "preview", "--host", "127.0.0.1", "--port", PORT, "--strictPort"],
    { cwd: root, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, PORT } },
  );
  return child;
}

async function waitReady(ms = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const r = await fetch(base);
      if (r.ok || r.status === 404) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("preview not ready");
}

const preview = startPreview();
const rows = [];
try {
  await waitReady();
  const browser = await chromium.launch({ headless: true });
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(`${base}/mushaf?page=1`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForSelector('.nm-page--opening [data-testid="sunnah-fatiha-medallion"]', {
      timeout: 30000,
    });
    await page.waitForTimeout(400);
    const metrics = await page.evaluate(() => {
      const pageEl = document.querySelector(".nm-page--opening");
      const m = pageEl?.querySelector('[data-testid="sunnah-fatiha-medallion"]');
      const stage = pageEl?.querySelector('[data-testid="mushaf-page-frame"]');
      const mark = pageEl?.querySelector(".nm-page__section-mark");
      if (!m || !stage || !pageEl) return null;
      const mr = m.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const ratio = mr.height > 0 ? mr.width / mr.height : 0;
      const cx = mr.left + mr.width / 2;
      const cy = mr.top + mr.height / 2;
      const scx = sr.left + sr.width / 2;
      const scy = sr.top + sr.height / 2;
      return {
        w: +mr.width.toFixed(2),
        h: +mr.height.toFixed(2),
        ratio: +ratio.toFixed(4),
        centerDx: +(cx - scx).toFixed(2),
        centerDy: +(cy - scy).toFixed(2),
        clipped:
          mr.left < sr.left - 1 ||
          mr.right > sr.right + 1 ||
          mr.top < sr.top - 1 ||
          mr.bottom > sr.bottom + 1,
        sectionMarkVisible: !!(mark && getComputedStyle(mark).display !== "none"),
      };
    });
    const shot = resolve(outDir, `after-${vp.name}.png`);
    await page.locator(".nm-page--opening").first().screenshot({ path: shot });
    rows.push({ viewport: vp.name, ...vp, ...metrics, shot });
    await page.close();
  }
  await browser.close();
} finally {
  preview.kill("SIGTERM");
}

writeFileSync(resolve(outDir, "metrics.json"), JSON.stringify(rows, null, 2));
console.log(JSON.stringify(rows, null, 2));

const bad = rows.filter(
  (r) => !r.ratio || Math.abs(r.ratio - 1) > 0.02 || r.clipped || r.sectionMarkVisible,
);
if (bad.length) {
  console.error("FAIL geometry/mark", bad.map((b) => b.viewport));
  process.exit(1);
}
console.log("measure-mushaf-opening-ornaments: ok — all circles within 2%");
