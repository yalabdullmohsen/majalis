/**
 * قياس صفحات الافتتاح Content Driven — بلا قوس؛ محتوى يملأ المتن عبر viewports.
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
  { name: "iphone", width: 390, height: 844 },
  { name: "iphone-pro-max", width: 430, height: 932 },
  { name: "ipad", width: 768, height: 1024 },
  { name: "ipad-landscape", width: 1024, height: 768 },
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
    await page.waitForSelector(".nm-page--opening .nm-page__body", { timeout: 30000 });
    await page.waitForTimeout(400);
    const metrics = await page.evaluate(() => {
      const pageEl = document.querySelector(".nm-page--opening");
      const body = pageEl?.querySelector(".nm-page__body");
      const medallion = pageEl?.querySelector(
        '[data-testid="sunnah-fatiha-medallion"], .nm-page__fatiha-medallion',
      );
      const frame = pageEl?.querySelector(
        '[data-testid="authentic-mushaf-page-frame"], .nm-page__ornament-frame',
      );
      const slots = pageEl ? [...pageEl.querySelectorAll(".nm-slot")] : [];
      const filled = slots.filter((s) => s.getAttribute("data-kind") !== "empty");
      const empty = slots.filter((s) => s.getAttribute("data-kind") === "empty");
      const br = body?.getBoundingClientRect();
      const last = filled[filled.length - 1]?.getBoundingClientRect();
      const fillRatio =
        br && last && br.height > 0 ? (last.bottom - (br.top || 0)) / br.height : 0;
      return {
        hasMedallion: !!medallion,
        hasFrame: !!frame,
        slotCount: slots.length,
        filledCount: filled.length,
        emptyVisible: empty.filter((s) => getComputedStyle(s).display !== "none").length,
        contentRows: body?.getAttribute("data-content-rows") || "",
        fillRatio: +fillRatio.toFixed(3),
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
  (r) =>
    r.hasMedallion ||
    r.hasFrame ||
    r.emptyVisible > 0 ||
    r.filledCount < 3 ||
    r.fillRatio < 0.55,
);
if (bad.length) {
  console.error("FAIL content-driven opening", bad.map((b) => b.viewport));
  process.exit(1);
}
console.log("measure-mushaf-opening-ornaments: ok — content-driven, no medallion/frame");
