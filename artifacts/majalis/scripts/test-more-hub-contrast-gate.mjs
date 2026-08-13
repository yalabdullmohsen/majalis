#!/usr/bin/env node
/**
 * بوابة شيت «المزيد»: تباين حقيقي + لا أبيض على أبيض + سطح علامة على السبعة
 * + قياس أثناء ذروة اللمعة + عدم اقتطاع على 320/390/430.
 *
 *   pnpm run test:more-hub-contrast
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const EXTERNAL = process.env.MORE_HUB_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MORE_HUB_GATE_PORT || process.env.PORT || "24246";
const BASE = EXTERNAL || `http://127.0.0.1:${PORT}`;
const OUT = process.env.MORE_HUB_GATE_OUT || join(ROOT, ".local/more-hub-contrast");
const VIEWPORTS = [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

function waitForServer(url, timeoutMs = 90_000) {
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

function relLuma({ r, g, b }) {
  const f = (c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrastRatio(a, b) {
  const L1 = relLuma(a);
  const L2 = relLuma(b);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

function isLight(rgb) {
  return relLuma(rgb) > relLuma({ r: 0xe5, g: 0xe5, b: 0xe5 });
}

function isVeryLight(rgb) {
  return relLuma(rgb) > relLuma({ r: 0xcc, g: 0xcc, b: 0xcc });
}

function isBrandGreen(rgb) {
  if (!rgb) return false;
  if (isVeryLight(rgb)) return false;
  return rgb.g > rgb.r + 8 && rgb.g > rgb.b + 8 && relLuma(rgb) < 0.45;
}

async function openMoreSheet(page) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(500);
  const moreTab = page.locator('[aria-label="المزيد"]').first();
  await moreTab.click({ timeout: 15_000 });
  await page.waitForSelector(".more-sheet-item--featured.surface-brand", { timeout: 15_000 });
  await page.waitForTimeout(400);
}

function measureInPage(peakShimmer) {
  const parseRgb = (str) => {
    if (!str) return null;
    const m = String(str).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] == null ? 1 : +m[4] };
  };
  const blend = (fg, bg) => {
    const a = fg.a ?? 1;
    if (a >= 0.999) return { r: fg.r, g: fg.g, b: fg.b };
    return {
      r: Math.round(fg.r * a + bg.r * (1 - a)),
      g: Math.round(fg.g * a + bg.g * (1 - a)),
      b: Math.round(fg.b * a + bg.b * (1 - a)),
    };
  };
  const effectiveBg = (el) => {
    let node = el;
    let acc = { r: 255, g: 255, b: 255 };
    const stack = [];
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node);
      const bg = parseRgb(cs.backgroundColor);
      if (bg && bg.a > 0.01) stack.push(bg);
      /* التدرّج لا يظهر في backgroundColor — إن وُجد solid تحتها يكفي */
      node = node.parentElement;
    }
    for (let i = stack.length - 1; i >= 0; i--) acc = blend(stack[i], acc);
    return acc;
  };
  const clipped = (el) => {
    if (!el) return false;
    if (el.scrollHeight > el.clientHeight + 1) return true;
    const cs = getComputedStyle(el);
    const maxH = parseFloat(cs.maxHeight);
    if (Number.isFinite(maxH) && maxH > 0 && el.scrollHeight > maxH + 1) return true;
    return false;
  };

  if (peakShimmer) {
    document.querySelectorAll(".more-sheet-item__shimmer").forEach((s) => {
      s.style.animation = "none";
      s.style.transform = "translate3d(0,0,0)";
      s.style.opacity = "1";
    });
  }

  const tiles = [...document.querySelectorAll(".more-sheet-item--featured")];
  const quickLabels = [...document.querySelectorAll(".more-sheet-item--quick .more-sheet-item__label")];
  const closeBtn = document.querySelector(
    ".app-sheet.bottom-sheet--services .app-sheet__close, .bottom-sheet--services .app-sheet__close",
  );
  const footer = closeBtn?.closest(".app-sheet__footer");
  let footerGap = null;
  if (footer && closeBtn) {
    footerGap = footer.getBoundingClientRect().bottom - closeBtn.getBoundingClientRect().bottom;
  }

  const tileReports = tiles.map((tile) => {
    const label = tile.querySelector(".more-sheet-item__label");
    const meta = tile.querySelector(".more-sheet-item__meta");
    const icon = tile.querySelector(".more-sheet-item__icon");
    const name = (label?.textContent || "").trim();
    const bg = effectiveBg(label || tile);
    const fg = parseRgb(getComputedStyle(label || tile).color);
    const metaFg = meta ? parseRgb(getComputedStyle(meta).color) : null;
    const iconFg = icon ? parseRgb(getComputedStyle(icon).color) : null;
    const tileBg = effectiveBg(tile);
    const cs = getComputedStyle(tile);
    return {
      name,
      hasSurfaceBrand: tile.classList.contains("surface-brand"),
      bg,
      tileBg,
      fg,
      metaFg,
      iconFg,
      bgImage: cs.backgroundImage,
      bgColor: cs.backgroundColor,
      labelClipped: clipped(label),
      metaClipped: clipped(meta),
    };
  });

  return {
    tileCount: tiles.length,
    tileReports,
    quickClipped: quickLabels.filter((el) => clipped(el)).map((el) => (el.textContent || "").trim()),
    footerGap,
  };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const failures = [];
  const samples = [];

  const cssPath = join(ROOT, "src/styles/components/more-bottom-sheet.css");
  const css = existsSync(cssPath) ? readFileSync(cssPath, "utf8") : "";
  if (!/more-sheet-item--featured\.surface-brand/.test(css)) {
    failures.push({ gate: "static", reason: "قواعد featured.surface-brand مفقودة" });
  }
  if (!/background-color:\s*var\(--surface-brand-solid(?:,\s*var\(--mj-brand\))?\)/.test(css)) {
    failures.push({ gate: "static", reason: "خلفية صلبة احتياطية مفقودة" });
  }
  const tokens = readFileSync(join(ROOT, "src/styles/tokens.css"), "utf8");
  if (!/:root\s*\{[\s\S]*?--surface-brand-solid:/.test(tokens)) {
    failures.push({ gate: "static", reason: "--surface-brand-solid غير معرّف على :root" });
  }
  const shimmerBlock = css.match(/more-sheet-item__shimmer\s*\{[\s\S]*?\n\}/)?.[0] || "";
  if (/rgba\(255,\s*255,\s*255,\s*0\.(1[9]|[2-9]\d)/.test(shimmerBlock)) {
    failures.push({ gate: "static", reason: "ذروة اللمعة > 0.18" });
  }
  if (!/more-sheet-item--quick[\s\S]*?-webkit-line-clamp:\s*2/.test(css)) {
    failures.push({ gate: "static", reason: "line-clamp:2 لبطاقات المميزات مفقود" });
  }

  const tsx = readFileSync(join(ROOT, "src/components/MoreBottomSheet.tsx"), "utf8");
  if (!/surface-brand/.test(tsx)) {
    failures.push({ gate: "static", reason: "MoreBottomSheet بلا surface-brand" });
  }

  let child = null;
  if (!EXTERNAL) {
    const distOk = existsSync(join(ROOT, "dist/index.html"));
    if (!distOk) {
      console.error("test:more-hub-contrast: ابنِ الحزمة أولًا (pnpm run build)");
      process.exit(1);
    }
    child = spawn("pnpm", ["run", "start"], {
      cwd: ROOT,
      env: { ...process.env, PORT, BASE_PATH: "/" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    await waitForServer(`${BASE}/`);
  }

  const browser = await chromium.launch({ headless: true });
  try {
    for (const theme of ["light", "dark"]) {
      for (const vp of VIEWPORTS) {
        const page = await browser.newPage({
          viewport: vp,
          colorScheme: theme === "dark" ? "dark" : "light",
          locale: "ar",
        });
        if (theme === "dark") {
          await page.addInitScript(() => {
            document.documentElement.dataset.theme = "dark";
            document.documentElement.classList.add("dark");
            try {
              localStorage.setItem("mj-theme-preference", "dark");
            } catch {
              /* ignore */
            }
          });
        }
        await openMoreSheet(page);

        for (const peak of [false, true]) {
          const report = await page.evaluate(measureInPage, peak);

          if (report.tileCount !== 7) {
            failures.push({
              gate: "surface",
              theme,
              vp: `${vp.width}x${vp.height}`,
              peak,
              reason: `عدد المربعات ${report.tileCount} ≠ 7`,
            });
          }

          for (const t of report.tileReports) {
            if (!t.hasSurfaceBrand) {
              failures.push({ gate: "surface", theme, tile: t.name, reason: "بلا surface-brand" });
            }
            if (!isBrandGreen(t.tileBg)) {
              failures.push({
                gate: "surface",
                theme,
                tile: t.name,
                peak,
                reason: `خلفية غير brand rgb(${t.tileBg.r},${t.tileBg.g},${t.tileBg.b})`,
              });
            }
            if (t.fg && isLight(t.fg) && isVeryLight(t.bg)) {
              failures.push({
                gate: "white-on-white",
                theme,
                tile: t.name,
                peak,
                reason: "أبيض على أبيض",
                fg: t.fg,
                bg: t.bg,
              });
            }
            if (t.fg) {
              const ratio = contrastRatio(t.fg, t.bg);
              samples.push({
                tile: t.name,
                theme,
                vp: vp.width,
                peak,
                ratio: Number(ratio.toFixed(2)),
              });
              if (ratio < 4.5) {
                failures.push({
                  gate: "contrast",
                  theme,
                  tile: t.name,
                  peak,
                  reason: `تباين نص ${ratio.toFixed(2)} < 4.5`,
                  fg: t.fg,
                  bg: t.bg,
                });
              }
            }
            if (t.metaFg && contrastRatio(t.metaFg, t.bg) < 3) {
              failures.push({
                gate: "contrast-meta",
                theme,
                tile: t.name,
                peak,
                reason: `تباين وصف ${contrastRatio(t.metaFg, t.bg).toFixed(2)} < 3`,
              });
            }
            if (t.iconFg && contrastRatio(t.iconFg, t.bg) < 3) {
              failures.push({
                gate: "contrast-icon",
                theme,
                tile: t.name,
                peak,
                reason: `تباين أيقونة ${contrastRatio(t.iconFg, t.bg).toFixed(2)} < 3`,
              });
            }
            if (t.labelClipped || t.metaClipped) {
              failures.push({
                gate: "clip",
                theme,
                tile: t.name,
                vp: vp.width,
                reason: "نص مقصوص في مربع مميز",
              });
            }
          }

          for (const q of report.quickClipped) {
            failures.push({
              gate: "clip-quick",
              theme,
              vp: vp.width,
              reason: `عنوان مميزات مقصوص: ${q}`,
            });
          }

          if (report.footerGap != null && report.footerGap > 28) {
            failures.push({
              gate: "footer-gap",
              theme,
              vp: vp.width,
              reason: `فراغ تحت إغلاق ${report.footerGap.toFixed(1)}px > 28`,
            });
          }
        }

        await page.screenshot({
          path: join(OUT, `more-${theme}-${vp.width}.png`),
          fullPage: false,
        });
        await page.close();
      }
    }
  } finally {
    await browser.close();
    if (child) {
      child.kill("SIGTERM");
    }
  }

  writeFileSync(join(OUT, "report.json"), JSON.stringify({ failures, samples }, null, 2));

  if (failures.length) {
    console.error("test:more-hub-contrast: FAIL");
    for (const f of failures.slice(0, 50)) console.error("-", JSON.stringify(f));
    process.exit(1);
  }
  const minRatio = samples.length ? Math.min(...samples.map((x) => x.ratio)) : 0;
  console.log("test:more-hub-contrast: ok", { samples: samples.length, minRatio });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
