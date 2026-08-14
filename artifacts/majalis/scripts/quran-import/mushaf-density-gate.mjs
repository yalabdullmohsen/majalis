#!/usr/bin/env node
/**
 * بوابة كثافة المصحف — قياسات فعلية من الصفحة المرسومة:
 * تغطية حبر ≥٧٨٪ · فجوة كلمات ≤١٨px · كتلة ١١٫٩±٠٫٥ → ٩١٫١±٠٫٥ · ١٥ سطراً · صفر بتر.
 *
 *   pnpm run test:mushaf-density-gate
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24261";
const BASE = EXTERNAL || `http://127.0.0.1:${PORT}`;
const OUT = process.env.MUSHAF_DENSITY_OUT || join(ROOT, ".local/mushaf-density-gate");
const PAGES = (process.env.MUSHAF_GATE_PAGES || "1,2,3")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter((n) => n >= 1);

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

/* بوابة ثابتة: بسملة واحدة + سقف فجوة */
const failures = [];
const basmalaPath = join(ROOT, "src/components/quran/BasmalaLine.tsx");
if (!existsSync(basmalaPath)) failures.push({ gate: "static", reason: "BasmalaLine.tsx مفقود" });
const pageV2 = readFileSync(join(ROOT, "src/components/quran/MushafPageV2.tsx"), "utf8");
if (!/BasmalaLine/.test(pageV2)) failures.push({ gate: "static", reason: "MushafPageV2 بلا BasmalaLine" });
if (/DRAWN_BASMALA_TEXT/.test(pageV2)) failures.push({ gate: "static", reason: "مسار بسملة Unicode ثانٍ ما زال حيًا" });
if (!/MAX_WORD_GAP_PX\s*=\s*MUSHAF_WORD_GAP_MAX_PX/.test(pageV2) && !/MUSHAF_WORD_GAP_MAX_PX/.test(pageV2)) {
  failures.push({ gate: "static", reason: "سقف فجوة الكلمات غير مربوط بالإعداد المركزي" });
}
const mushafConfig = readFileSync(join(ROOT, "src/features/mushaf/config.ts"), "utf8");
if (!/MUSHAF_WORD_GAP_MAX_PX\s*=\s*7/.test(mushafConfig)) {
  failures.push({ gate: "static", reason: "MUSHAF_WORD_GAP_MAX_PX يجب أن يكون ٧px" });
}
if (/isFatihaBasmala/.test(pageV2)) failures.push({ gate: "static", reason: "مسار استبدال ١:١ بـ BasmalaLine ما زال حيًا" });
const basmalaSrc = readFileSync(basmalaPath, "utf8");
if (!/data-basmala-encoding="code_v2"/.test(basmalaSrc) || /BASMALA_QPC_WORDS = \["ﭑ"/.test(basmalaSrc)) {
  failures.push({ gate: "static", reason: "البسملة ليست بمحارف code_v2" });
}
if (!/0xfc41/.test(basmalaSrc) || /0xfea7/.test(basmalaSrc)) {
  failures.push({ gate: "static", reason: "محرف البسملة الأول يجب أن يكون U+FC41 من page-001" });
}
const quranCss = readFileSync(join(ROOT, "src/styles/quran.css"), "utf8");
if (!/11\.9vh/.test(quranCss) || !/8\.9vh/.test(quranCss)) {
  failures.push({ gate: "static", reason: "نطاق النص ليس ١١٫٩→٩١٫١" });
}

mkdirSync(OUT, { recursive: true });

let child = null;
if (!EXTERNAL) {
  const distOk = existsSync(join(ROOT, "dist/index.html"));
  if (!distOk) {
    console.error("test:mushaf-density-gate: ابنِ الحزمة أولًا (pnpm run build)");
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
const report = { pages: {}, failures };
try {
  for (const n of PAGES) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      locale: "ar",
    });
    await page.goto(`${BASE}/mushaf/page/${n}`, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    await page.waitForSelector(
      '[data-mushaf-active-leaf="1"] .mf2-lines, [data-mushaf-active-leaf="1"] .mf2-line',
      { timeout: 60_000 },
    );
    await page.waitForTimeout(n <= 2 ? 1400 : 900);

    const m = await page.evaluate(() => {
      const leaf = document.querySelector('[data-mushaf-active-leaf="1"]');
      const linesRoot =
        leaf?.querySelector(".mf2-lines") || document.querySelector(".mf2-lines");
      const vh = window.innerHeight || 844;
      const vw = window.innerWidth || 390;
      const lineEls = [
        ...(linesRoot?.querySelectorAll(".mf2-grid-slot--line .mf2-line, .mf2-line[data-sizing-line='ayah']") ||
          []),
      ].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 2 && r.height > 2;
      });
      const inkRects = [];
      for (const el of lineEls) {
        const words = el.querySelectorAll(".mf2-word, .mf2-line__run");
        let left = Infinity;
        let right = -Infinity;
        let top = Infinity;
        let bot = -Infinity;
        for (const w of words) {
          const r = w.getBoundingClientRect();
          if (r.width <= 0 || r.height <= 0) continue;
          left = Math.min(left, r.left);
          right = Math.max(right, r.right);
          top = Math.min(top, r.top);
          bot = Math.max(bot, r.bottom);
        }
        if (!Number.isFinite(left)) {
          const r = el.getBoundingClientRect();
          left = r.left;
          right = r.right;
          top = r.top;
          bot = r.bottom;
        }
        const gaps = [];
        const wordEls = [...el.querySelectorAll(".mf2-word")].filter((w) => {
          const r = w.getBoundingClientRect();
          return r.width > 0;
        });
        for (let i = 0; i < wordEls.length - 1; i++) {
          const a = wordEls[i].getBoundingClientRect();
          const b = wordEls[i + 1].getBoundingClientRect();
          /* RTL: الكلمة التالية على اليسار */
          const gap = a.left - b.right;
          if (gap > 0.5) gaps.push(gap);
        }
        const cssGap = Number.parseFloat(getComputedStyle(el).getPropertyValue("--mf2-word-gap")) || 0;
        const natural =
          el.classList.contains("mf2-line--surah-end") ||
          el.classList.contains("mf2-line--natural") ||
          el.classList.contains("mf2-line--opening-natural") ||
          el.dataset.noStretch === "1";
        inkRects.push({
          left,
          right,
          top,
          bot,
          cover: (right - left) / Math.max(1, linesRoot?.getBoundingClientRect().width || vw),
          maxGap: gaps.length ? Math.max(...gaps) : cssGap,
          medianGap: gaps.length
            ? [...gaps].sort((x, y) => x - y)[Math.floor(gaps.length / 2)]
            : cssGap,
          natural,
          clipped: false, /* القصّ الحقيقي عبر anyOverflowX على الحبر */
          overflowX: (() => {
            const cr = linesRoot?.getBoundingClientRect();
            if (!cr) return false;
            return left < cr.left - 0.75 || right > cr.right + 0.75;
          })(),
        });
      }
      const body = document.querySelector(".mpv-body--ayah") || leaf?.querySelector(".mpv-body");
      let bandTopPct = null;
      let bandBotPct = null;
      if (body) {
        const br = body.getBoundingClientRect();
        const bcs = getComputedStyle(body);
        const padTop = Number.parseFloat(bcs.paddingTop) || 0;
        const padBot = Number.parseFloat(bcs.paddingBottom) || 0;
        bandTopPct = ((br.top + padTop) / vh) * 100;
        bandBotPct = ((br.bottom - padBot) / vh) * 100;
      }
      const first = inkRects[0];
      const last = inkRects[inkRects.length - 1];
      const header = document.querySelector(".mpv-ayah-header");
      const headerBase = header
        ? ((header.getBoundingClientRect().top + header.getBoundingClientRect().height * 0.85) / vh) *
          100
        : null;
      const banner = document.querySelector(
        ".mf2-grid-slot--banner, .mf2-surah-banner, [data-surah-banner]",
      );
      const bannerTop = banner ? (banner.getBoundingClientRect().top / vh) * 100 : null;
      const basmalas = [
        ...(leaf?.querySelectorAll('[data-basmala="unified"]') || []),
      ].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 2 && r.height > 2;
      });
      const gridSlots = new Set(
        [...(linesRoot?.querySelectorAll("[data-grid-slot]") || [])]
          .map((el) => Number(el.getAttribute("data-grid-slot") || 0))
          .filter((n) => n >= 1 && n <= 15),
      );
      const fontSize = lineEls[0]
        ? Number.parseFloat(getComputedStyle(lineEls[0]).fontSize) || 0
        : 0;
      /* ارتفاع المحارف الفعلي (حبر) لا font-size/viewport */
      let inkH = 0;
      for (const r of inkRects) inkH = Math.max(inkH, r.bot - r.top);
      const charH = inkH > 0 ? (inkH / vh) * 100 : fontSize ? (fontSize / vh) * 100 : 0;
      const stretchCovers = inkRects.filter((r) => !r.natural).map((r) => r.cover);

      return {
        lineCount: inkRects.length,
        gridSlotCount: gridSlots.size,
        contentTopPct: bandTopPct,
        contentBotPct: bandBotPct,
        firstInkTopPct: first ? (first.top / vh) * 100 : null,
        lastInkBotPct: last ? (last.bot / vh) * 100 : null,
        headerBasePct: headerBase,
        bannerTopPct: bannerTop,
        fontSizePx: fontSize,
        charHeightPct: charH,
        minCover: stretchCovers.length ? Math.min(...stretchCovers) : inkRects.length ? Math.min(...inkRects.map((r) => r.cover)) : 0,
        medianCover: inkRects.length
          ? [...inkRects.map((r) => r.cover)].sort((a, b) => a - b)[
              Math.floor(inkRects.length / 2)
            ]
          : 0,
        maxWordGap: inkRects.length ? Math.max(...inkRects.map((r) => r.maxGap || 0)) : 0,
        medianWordGap: inkRects.length
          ? [...inkRects.map((r) => r.medianGap || 0)].sort((a, b) => a - b)[
              Math.floor(inkRects.length / 2)
            ]
          : 0,
        anyClipped: inkRects.some((r) => r.clipped),
        anyOverflowX: inkRects.some((r) => r.overflowX),
        basmalaCount: basmalas.length,
        fills: inkRects.map((r) => Number(r.cover.toFixed(3))),
      };
    });

    await page.screenshot({
      path: join(OUT, `page-${String(n).padStart(3, "0")}.png`),
      fullPage: false,
    });
    report.pages[n] = m;

    if (n >= 3) {
      if (m.contentTopPct == null || Math.abs(m.contentTopPct - 11.9) > 0.5) {
        failures.push({
          page: n,
          gate: "band-top",
          reason: `بداية الكتلة ${m.contentTopPct?.toFixed(2)} ≠ 11.9±0.5`,
        });
      }
      if (m.contentBotPct == null || Math.abs(m.contentBotPct - 91.1) > 0.5) {
        failures.push({
          page: n,
          gate: "band-bot",
          reason: `نهاية الكتلة ${m.contentBotPct?.toFixed(2)} ≠ 91.1±0.5`,
        });
      }
      if (m.headerBasePct != null && Math.abs(m.headerBasePct - 8.3) > 1.2) {
        failures.push({
          page: n,
          gate: "header",
          reason: `خط الرأس ${m.headerBasePct.toFixed(2)} بعيد عن 8.3`,
        });
      }
      if (m.minCover < 0.78) {
        failures.push({
          page: n,
          gate: "ink-cover",
          reason: `أدنى تغطية ${(m.minCover * 100).toFixed(1)}% < 78%`,
        });
      }
      if (m.charHeightPct < 4.2) {
        failures.push({
          page: n,
          gate: "char-height",
          reason: `ارتفاع محارف ${m.charHeightPct.toFixed(2)}% < 4.2%`,
        });
      }
      if (m.maxWordGap > 18.5) {
        failures.push({
          page: n,
          gate: "word-gap",
          reason: `أقصى فجوة ${m.maxWordGap.toFixed(1)}px > 18`,
        });
      }
    }
    if (n === 1 || n === 2) {
      if (m.bannerTopPct != null && Math.abs(m.bannerTopPct - 27.7) > 1.5) {
        failures.push({
          page: n,
          gate: "banner",
          reason: `بداية الشارة ${m.bannerTopPct.toFixed(2)} ≠ 27.7±1.5`,
        });
      }
    }
    if (m.lineCount !== 15 && n >= 3 && (m.gridSlotCount ?? 0) < 15) {
      failures.push({
        page: n,
        gate: "lines",
        reason: `خانات الشبكة ${m.gridSlotCount ?? m.lineCount} < 15 (أسطر آية ${m.lineCount})`,
      });
    }
    if (m.anyClipped || m.anyOverflowX) {
      failures.push({
        page: n,
        gate: "clip",
        reason: `بتر أو تجاوز أفقي`,
      });
    }
    /* بسملة زخرفية واحدة لكل سورة ذات bismillah_pre — ص٦٠٠ فيها بسملتان صحيحتان */
    if (m.basmalaCount > 3) {
      failures.push({
        page: n,
        gate: "basmala",
        reason: `بسملات ظاهرة مفرطة (${m.basmalaCount})`,
      });
    }

    await page.close();
  }
} finally {
  await browser.close();
  if (child) child.kill("SIGTERM");
}

report.failures = failures;
writeFileSync(join(OUT, "metrics.json"), JSON.stringify(report, null, 2));
if (failures.length) {
  console.error("test:mushaf-density-gate: FAIL");
  for (const f of failures.slice(0, 40)) console.error("-", JSON.stringify(f));
  process.exit(1);
}
console.log(
  "test:mushaf-density-gate: ok",
  JSON.stringify(
    Object.fromEntries(
      Object.entries(report.pages).map(([k, v]) => [
        k,
        {
          top: v.contentTopPct?.toFixed?.(2),
          bot: v.contentBotPct?.toFixed?.(2),
          cover: (v.minCover * 100).toFixed(1) + "%",
          maxGap: v.maxWordGap?.toFixed?.(1),
          font: v.fontSizePx?.toFixed?.(1),
        },
      ]),
    ),
  ),
);
