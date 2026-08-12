#!/usr/bin/env node
/**
 * بوابة تصادم الحبر: صفر تقاطع بين مستطيلات حبر أي سطرين (خانات grid)
 * على كل صفحات بداية سورة + عيّنة تجميد، مع فحص بيانات ثابت لكل ٦٠٤.
 *
 *   pnpm run test:mushaf-ink-collision
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTIVE_LINES_WAIT_SEL,
  ACTIVE_PAGE_BROWSER_SOURCE,
  resolveGatePages,
} from "./mushaf-gate-active-page.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24244";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-ink-collision");
const VIEWPORT = { width: 390, height: 844 };
const FREEZE = [2, 3, 50, 235, 283, 306, 588, 599, 600, 601];
const OVERLAP_EPS_PX = 1.5;

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
const pageV2 = readFileSync(join(ROOT, "src/components/quran/MushafPageV2.tsx"), "utf8");
const dataSrc = readFileSync(join(ROOT, "src/lib/mushaf-v2-data.ts"), "utf8");

if (/banBase \+ banH \/ 2 \+ OPENING_GAP_PCT/.test(pageV2)) {
  failures.push({
    page: 0,
    reason: "تموضع البسملة ما زال بإزاحة من الشارة (الصيغة القديمة)",
  });
}
if (!/basmalaSlot = bannerSlot \+ 1/.test(dataSrc)) {
  failures.push({ page: 0, reason: "mushaf-v2-data لا يخصص basmalaSlot = banner+1" });
}

const chapters = JSON.parse(
  readFileSync(join(ROOT, "public/data/quran-v2/chapters.json"), "utf8"),
);
const chMap = new Map(chapters.map((c) => [c.id, c]));
const surahStartPages = new Set(FREEZE);
let staticCollisions = 0;
let pagesWithIndependentBasmala = 0;
let pagesGap1Stacked = 0;

for (let pageNumber = 1; pageNumber <= 604; pageNumber++) {
  const verses = JSON.parse(
    readFileSync(
      join(
        ROOT,
        `public/data/quran-v2/pages/page-${String(pageNumber).padStart(3, "0")}.json`,
      ),
      "utf8",
    ),
  );
  const lineWords = new Map();
  for (const v of verses) {
    for (const w of v.words) lineWords.set(w.line_number, true);
  }
  const surahStarts = new Map();
  for (const v of verses) {
    if (v.verse_number !== 1) continue;
    const s = Number(v.verse_key.split(":")[0]);
    if (!surahStarts.has(s)) {
      surahStarts.set(s, Math.min(...v.words.map((w) => w.line_number)));
    }
  }
  if (surahStarts.size) surahStartPages.add(pageNumber);
  const usedLines = [...lineWords.keys()].sort((a, b) => a - b);
  const isOpening = pageNumber <= 2;

  for (const [surahNum, firstLine] of surahStarts) {
    const chapter = chMap.get(surahNum);
    if (!chapter?.bismillah_pre) continue;
    if (isOpening) {
      pagesWithIndependentBasmala++;
      continue;
    }
    const prevUsed = usedLines.filter((ln) => ln < firstLine).pop() ?? 0;
    const gap = firstLine - prevUsed - 1;
    const bannerSlot = Math.max(1, prevUsed + 1);
    if (gap >= 2) {
      const basmalaSlot = bannerSlot + 1;
      pagesWithIndependentBasmala++;
      if (lineWords.has(basmalaSlot)) {
        staticCollisions++;
        failures.push({
          page: pageNumber,
          reason: `بيانات: basmalaSlot=${basmalaSlot} يشارك سطر آية`,
        });
      }
      if (basmalaSlot === firstLine) {
        staticCollisions++;
        failures.push({
          page: pageNumber,
          reason: `بيانات: basmalaSlot == firstLine (${firstLine})`,
        });
      }
    } else if (gap === 1) {
      pagesGap1Stacked++;
    }
  }
}

/* عيّنة PR عبر resolveGatePages؛ المسح الكامل بـ MUSHAF_GATE_FULL=1.
 * محلياً بدون env: FREEZE + بدايات السور + العيّنة (أوسع للتحقق اليدوي).
 * في CI: العيّنة ٢٥ فقط حتى يبقى الجدار ضمن الهدف. */
const samplePages =
  process.env.CI === "true" ||
  process.env.GITHUB_ACTIONS === "true" ||
  process.env.MUSHAF_GATE_PAGES ||
  process.env.MUSHAF_GATE_FULL === "1"
    ? resolveGatePages()
    : [...new Set([...FREEZE, ...surahStartPages, ...resolveGatePages()])].sort(
        (a, b) => a - b,
      );

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
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
await page.addInitScript({ content: ACTIVE_PAGE_BROWSER_SOURCE });

try {
  for (const n of samplePages) {
    await page.goto(`${BASE}/mushaf/page/${n}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForSelector(ACTIVE_LINES_WAIT_SEL, {
      timeout: 60_000,
    });
    await page.waitForFunction(() => {
      const leaf =
        __mushafActiveRoot();
      const el = __mushafLinesRoot();
      return el && Number.parseFloat(getComputedStyle(el).opacity || "0") > 0.95;
    }, { timeout: 60_000 }).catch(() => {});
    await sleep(n <= 3 || FREEZE.includes(n) ? 700 : 280);
    await page.addStyleTag({
      content: `.mpv-toolbar--ayah,.mpv-ayah-header,.mpv-ayah-footer,.mpv-curl-underlay,.mpv-curl-shade,.mpv-flip-underlay,.mpv-flip-shade,.mpv-flip-corner,.mpv-flip-edge{display:none!important}`,
    });

    const m = await page.evaluate((eps) => {
      const leaf =
        __mushafActiveRoot();
      const root =
        __mushafLinesRoot();
      if (!root) return { error: "no lines" };
      const slots = [...root.querySelectorAll("[data-grid-slot]")].map((el) => {
        const ink =
          el.querySelector(".mf2-line, .mf2-bismillah, .mf2-surah-header__cartouche, .mf2-surah-header") ||
          el;
        const r = ink.getBoundingClientRect();
        return {
          slot: Number(el.getAttribute("data-grid-slot") || 0),
          kind: el.classList.contains("mf2-grid-slot--basmala")
            ? "basmala"
            : el.classList.contains("mf2-grid-slot--banner")
              ? "banner"
              : "line",
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
          h: r.height,
        };
      }).filter((s) => s.h > 2 && s.bottom > s.top);

      const overlaps = [];
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const a = slots[i];
          const b = slots[j];
          /* تداخل خانات الأسطر/الشارة متوقع (slotH ٧٫٢٪ > خطوة ٦٫٥٧٪) — نتجاهله.
           * البوابة تفشل عند تقاطع بسملة مع شارة أو آية (فاصل الحبر). */
          if (a.kind === "line" && b.kind === "line") continue;
          if (a.kind === "banner" && b.kind === "banner") continue;
          if (
            (a.kind === "banner" && b.kind === "line") ||
            (b.kind === "banner" && a.kind === "line")
          ) {
            continue;
          }
          const critical = a.kind === "basmala" || b.kind === "basmala";
          if (!critical) continue;
          const yOverlap = a.top < b.bottom - eps && a.bottom > b.top + eps;
          const xOverlap = a.left < b.right - eps && a.right > b.left + eps;
          /* تسامح ٢٫٥px لتلامس زخرفة الشارة مع طرف التشكيل */
          const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (yOverlap && xOverlap && overlapY > 2.5) {
            overlaps.push({
              a: `${a.kind}@${a.slot}`,
              b: `${b.kind}@${b.slot}`,
              y: overlapY,
            });
          }
        }
      }

      const banner = root.querySelector(".mf2-grid-slot--banner");
      const basmalaSlotEl = root.querySelector(".mf2-grid-slot--basmala .mf2-bismillah");
      const basmalaStacked = root.querySelector(".mf2-bismillah--stacked");
      const basmala = basmalaSlotEl || basmalaStacked;
      let basmalaGap = null;
      let stacked = false;
      if (banner && basmalaSlotEl) {
        basmalaGap =
          basmalaSlotEl.getBoundingClientRect().top - banner.getBoundingClientRect().bottom;
      } else if (banner && basmalaStacked) {
        stacked = true;
        /* مكدّسة داخل الشارة: الفاصل = أسفل البسملة → أعلى أول سطر آية */
        const nextLine = root.querySelector(".mf2-grid-slot--line .mf2-line");
        if (nextLine) {
          basmalaGap =
            nextLine.getBoundingClientRect().top - basmalaStacked.getBoundingClientRect().bottom;
        }
      }
      const lr = root.getBoundingClientRect();
      const br = banner?.getBoundingClientRect();
      const bannerTopPct =
        br && lr.height > 0 ? ((br.top - lr.top) / lr.height) * 100 : null;

      return {
        slotCount: slots.length,
        overlaps,
        basmalaGap,
        stacked,
        bannerTopPct,
        hasFrame: Boolean(
          document.querySelector("[data-opening-frame], .mf2-opening-frame"),
        ),
      };
    }, OVERLAP_EPS_PX);

    results.push({ page: n, ...m });
    if (m.error) {
      failures.push({ page: n, reason: m.error });
      continue;
    }
    if (m.overlaps?.length) {
      failures.push({
        page: n,
        reason: `تقاطع حبر: ${m.overlaps.map((o) => `${o.a}×${o.b}`).join(", ")}`,
      });
    }
    if ((n === 1 || n === 2) && m.hasFrame) {
      failures.push({ page: n, reason: "إطار زخرفي في صفحة افتتاح" });
    }
    if (
      (n === 1 || n === 2) &&
      (m.bannerTopPct == null || m.bannerTopPct < 14 || m.bannerTopPct > 18)
    ) {
      failures.push({
        page: n,
        reason: `شارة ${m.bannerTopPct?.toFixed?.(2)}٪ خارج ١٤–١٨`,
      });
    }
    if (m.basmalaGap != null) {
      if (m.stacked) {
        if (m.basmalaGap < 2) {
          failures.push({
            page: n,
            reason: `بسملة مكدّسة تلامس الآية (فاصل ${m.basmalaGap.toFixed(1)}px)`,
          });
        }
      } else if (n === 1 || n === 2) {
        /* ص١–٢: الفاصل التشغيلي شارة→بسملة ≥٢٤ حبر؛ الصندوق ≥٤ بعد التصفية */
        if (m.basmalaGap < 3.5) {
          failures.push({
            page: n,
            reason: `فاصل بسملة افتتاح ${m.basmalaGap.toFixed(1)}px < 4`,
          });
        }
      } else if (m.basmalaGap < 19.5) {
        failures.push({
          page: n,
          reason: `فاصل بسملة ${m.basmalaGap.toFixed(1)}px < 20`,
        });
      }
    }

    if (FREEZE.includes(n) || n === 50 || n === 235) {
      await page.screenshot({
        path: join(OUT_DIR, `page-${String(n).padStart(3, "0")}.png`),
      });
    }
  }
} finally {
  await browser.close();
  killServer();
}

const report = {
  base: BASE,
  staticCollisions,
  pagesWithIndependentBasmala,
  pagesGap1Stacked,
  samplePages: samplePages.length,
  results: results.filter((r) => FREEZE.includes(r.page) || r.overlaps?.length),
  failures,
};
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-ink-collision-gate: ok");
