#!/usr/bin/env node
/**
 * بوابة السُلّم الطباعي:
 * 1) الرموز في typography-scale.css ضمن الحدود المطلوبة
 * 2) لا font-size صلب < 13px / 0.8125rem خارج المصحف
 * 3) إن وُجد PLAYWRIGHT_BASE_URL: مسح مسارات حيّة (عدا /mushaf)
 *
 * تشغيل: node scripts/verify-typography-scale.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const SCALE = path.join(SRC, "styles/typography-scale.css");
const issues = [];
const notes = [];

const MUSHAF_SKIP =
  /features[\/]mushaf|pages[\/]mushaf|mushaf-v2\.css$|(^|[\/])styles[\/]quran\.css$|public[\/]fonts[\/]qpc/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(css|tsx|ts|jsx|js)$/.test(e.name)) out.push(p);
  }
  return out;
}

function read(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

/* ── 1) الرموز ── */
const scale = read(SCALE);
if (!scale) issues.push("typography-scale.css مفقود");
const need = [
  ["--text-display", /--text-display:\s*clamp\(1\.75rem/],
  ["--text-h1", /--text-h1:\s*clamp\(1\.5rem/],
  ["--text-h2", /--text-h2:\s*clamp\(1\.25rem/],
  ["--text-h3", /--text-h3:\s*clamp\(1\.125rem/],
  ["--text-body-lg", /--text-body-lg:\s*1\.125rem/],
  ["--text-body", /--text-body:\s*1\.0625rem/],
  ["--text-body-sm", /--text-body-sm:\s*0\.9375rem/],
  ["--text-label", /--text-label:\s*0\.875rem/],
  ["--text-caption", /--text-caption:\s*0\.8125rem/],
];
for (const [name, re] of need) {
  if (!re.test(scale)) issues.push(`رمز ناقص/خاطئ: ${name}`);
  else notes.push(`✓ ${name}`);
}

const ds = read(path.join(SRC, "styles/design-system.css"));
if (!/--ds-base:\s*16\.5px/.test(ds)) issues.push("--ds-base يجب أن يكون 16.5px (+10% تقريباً من 15px)");
else notes.push("✓ --ds-base 16.5px");

/* ── 2) أرضية الأحجام في المصدر ── */
const BASE_PX = 16.5;
let tiny = 0;
const tinySamples = [];
for (const f of walk(SRC)) {
  const rel = path.relative(ROOT, f).replace(/\\/g, "/");
  if (MUSHAF_SKIP.test(rel)) continue;
  const s = read(f);
  for (const m of s.matchAll(/font-size:\s*([0-9.]+)(rem|px)\b/gi)) {
    const v = parseFloat(m[1]);
    const u = m[2].toLowerCase();
    const px = u === "px" ? v : v * BASE_PX;
    if (px + 1e-6 < 13) {
      tiny++;
      if (tinySamples.length < 20) tinySamples.push(`${rel}: ${m[0]} (~${px.toFixed(1)}px)`);
    }
  }
  // JSX Tailwind text-[11px]
  for (const m of s.matchAll(/text-\[(\d+)px\]/g)) {
    if (parseInt(m[1], 10) < 13) {
      tiny++;
      if (tinySamples.length < 20) tinySamples.push(`${rel}: ${m[0]}`);
    }
  }
}
if (tiny) {
  issues.push(`${tiny} حجمًا صلبًا تحت 13px`);
  for (const t of tinySamples) issues.push(`  ${t}`);
} else notes.push("✓ لا أحجام صلبة < 13px خارج المصحف");

/* ── 3) Playwright اختياري ── */
const base = process.env.PLAYWRIGHT_BASE_URL || process.env.TYPOGRAPHY_BASE_URL || "";
async function liveScan() {
  if (!base) {
    notes.push("⏭ مسح حي متخطّى (اضبط PLAYWRIGHT_BASE_URL)");
    return;
  }
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    notes.push("⏭ Playwright غير متاح — تخطّي المسح الحي");
    return;
  }
  const routes = ["/", "/more", "/quran-hub", "/prayer-times", "/fiqh", "/lessons", "/prophets", "/nations"];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const report = [];
  for (const route of routes) {
    if (route.includes("mushaf")) continue;
    await page.goto(new URL(route, base).href, { waitUntil: "domcontentloaded", timeout: 45000 });
    const stats = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll("body *"));
      let min = Infinity;
      let max = 0;
      let under = 0;
      let overflowX = 0;
      for (const el of nodes) {
        const st = getComputedStyle(el);
        if (st.display === "none" || st.visibility === "hidden") continue;
        const fs = parseFloat(st.fontSize);
        if (!Number.isFinite(fs) || fs <= 0) continue;
        const text = (el.textContent || "").trim();
        if (!text) continue;
        min = Math.min(min, fs);
        max = Math.max(max, fs);
        if (fs < 13) under++;
        if (el.scrollWidth > el.clientWidth + 1) overflowX++;
      }
      return { min, max, under, overflowX };
    });
    report.push({ route, ...stats });
    if (stats.under > 0) issues.push(`حي ${route}: ${stats.under} عنصرًا < 13px (min=${stats.min})`);
    if (stats.overflowX > 8) issues.push(`حي ${route}: overflow-x على ${stats.overflowX} عنصرًا`);
    notes.push(`حي ${route}: min=${stats.min.toFixed(1)} max=${stats.max.toFixed(1)}`);
  }
  await browser.close();
  const out = path.join(ROOT, "docs/TYPOGRAPHY_SCALE_REPORT.json");
  fs.writeFileSync(out, JSON.stringify({ generated_at: new Date().toISOString(), report }, null, 2));
}

await liveScan();

if (issues.length) {
  console.error("✗ test:typography — فشل");
  for (const i of issues) console.error(" ", i);
  process.exit(1);
}
console.log("✓ test:typography — اجتياز");
for (const n of notes.slice(0, 24)) console.log(" ", n);
