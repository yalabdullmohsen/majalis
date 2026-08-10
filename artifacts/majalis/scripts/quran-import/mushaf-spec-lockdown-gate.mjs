#!/usr/bin/env node
/**
 * بوابة تثبيت مواصفة المصحف (١٥ بندًا) — حاجبة في test:mushaf-gates.
 *
 * - دائمًا: فحوص ثابتة على الشيفرة/البيانات (لا تعتمد على لقطة حية).
 * - حيّ: إن وُجد MUSHAF_GATE_BASE_URL أو عند غيابها يُشغَّل Vite محليًا
 *   لقياس الإطار من كتلة الصفحة والشبكة على عيّنة صفحات.
 *
 *   pnpm run test:mushaf-spec-lockdown
 *   MUSHAF_GATE_BASE_URL=http://127.0.0.1:24216 pnpm run test:mushaf-spec-lockdown
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-spec-lockdown");
const EXTERNAL_BASE = process.env.MUSHAF_GATE_BASE_URL?.replace(/\/$/, "") || "";
const PORT = process.env.MUSHAF_GATE_PORT || "24229";
const BASE = EXTERNAL_BASE || `http://127.0.0.1:${PORT}`;
const VIEWPORT = { width: 390, height: 844 };
const SKIP_LIVE = process.env.MUSHAF_GATE_SKIP_LIVE === "1";
const EXPECTED_AYAHS = 6236;
const EXPECTED_WORDS = 83665;

const failures = [];
const gateStatus = {};

function fail(gate, reason) {
  failures.push({ gate, reason });
  gateStatus[gate] = { ok: false, reason };
}

function pass(gate, detail) {
  gateStatus[gate] = { ok: true, detail: detail || null };
}

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
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Server did not respond at ${url}`));
          } else setTimeout(tryOnce, 400);
        });
    };
    tryOnce();
  });
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

/* ───────────── فحوص ثابتة ───────────── */
function runStatic() {
  const grid = JSON.parse(read("src/features/mushaf/mushaf-grid.json"));
  const baseline = JSON.parse(read("src/features/mushaf/mushaf-baseline.json"));
  const pageV2 = read("src/components/quran/MushafPageV2.tsx");
  const frameCss = read("src/styles/mushaf-v2.css");
  const banner = read("src/components/quran/SurahBanner.tsx");
  const openingGone = !existsSync(join(ROOT, "src/components/quran/OpeningPageFrame.tsx"));
  const opening = openingGone ? "" : read("src/components/quran/OpeningPageFrame.tsx");
  const specPath = join(ROOT, "docs/MUSHAF_SPEC.md");

  /* ١ — سلامة النص */
  const pagesDir = join(ROOT, "public/data/quran-v2/pages");
  const pageFiles = readdirSync(pagesDir)
    .filter((f) => /^page-\d+\.json$/.test(f))
    .sort();
  let ayahs = 0;
  let words = 0;
  let ends = 0;
  const digests = [];
  for (const f of pageFiles) {
    const raw = readFileSync(join(pagesDir, f));
    digests.push(createHash("sha256").update(raw).digest("hex"));
    const verses = JSON.parse(raw.toString("utf8"));
    for (const v of verses) {
      ayahs += 1;
      for (const w of v.words ?? []) {
        words += 1;
        const isEnd =
          w.char_type_name === "end" ||
          /^[٠-٩]{1,3}$/u.test(String(w.text_uthmani ?? "").trim());
        if (isEnd && String(w.code_v2 || w.text_uthmani || "").trim()) ends += 1;
      }
    }
  }
  const textFp = createHash("sha256").update(digests.join("\n")).digest("hex");
  if (ayahs !== EXPECTED_AYAHS) {
    fail(1, `آيات ${ayahs} ≠ ${EXPECTED_AYAHS}`);
  } else if (words !== EXPECTED_WORDS) {
    fail(1, `كلمات ${words} ≠ ${EXPECTED_WORDS}`);
  } else {
    pass(1, { ayahs, words, textFp: textFp.slice(0, 16) });
  }

  /* ٢ — أرقام الآيات (مجسمات نهاية) */
  if (ends !== EXPECTED_AYAHS) fail(2, `ميداليات نهاية ${ends} ≠ ${EXPECTED_AYAHS}`);
  else if (!/function defaultRenderWord[\s\S]*?charType === "end"[\s\S]*?\{w\.glyphText\}/.test(pageV2)) {
    fail(2, "مسار QPC لا يعرض glyphText لنهاية الآية");
  } else pass(2, { ends });

  /* ٣ — عدم الاقتطاع (سياسة CSS/مكون) */
  const basmalaBlock = (frameCss.match(/\.mf2-bismillah\s*\{[^}]*\}/) || [""])[0];
  const linesOverflowY = /\.mf2-lines[^{]*\{[^}]*overflow(?:-y)?:\s*hidden/.test(frameCss);
  if (linesOverflowY) fail(3, ".mf2-lines عليها overflow رأسي hidden");
  else if (/overflow:\s*hidden/.test(basmalaBlock)) fail(3, "البسملة overflow:hidden");
  else pass(3, "سياسة عدم القص الرأسي مثبتة في CSS");

  /* ٤ — التجاوز الأفقي: بوابة drawn-overflow موجودة */
  if (!/test:mushaf-drawn-overflow/.test(read("package.json"))) {
    fail(4, "بوابة التجاوز الأفقي غير مربوطة");
  } else pass(4, "test:mushaf-drawn-overflow ضمن البوابات");

  /* ٥ — شبكة خطوط الأساس */
  if (grid.referencePage !== 283) fail(5, `referencePage=${grid.referencePage}`);
  else if (!Array.isArray(grid.baselinesPct) || grid.baselinesPct.length !== 15) {
    fail(5, "baselinesPct ليست ١٥");
  } else if (Math.abs(grid.baselinesPct[0] - 4) > 0.05 || Math.abs(grid.baselinesPct[14] - 96) > 0.05) {
    fail(5, `حدود الشبكة ${grid.baselinesPct[0]}…${grid.baselinesPct[14]}`);
  } else if (!/MUSHAF_GRID\.baselinesPct/.test(pageV2)) {
    fail(5, "التموضع لا يستخدم MUSHAF_GRID.baselinesPct");
  } else if (/justifyContent:\s*["']space-between|justify-content:\s*space-between/.test(pageV2)) {
    fail(5, "space-between على حاوية الأسطر");
  } else pass(5, { baselines: grid.baselinesPct, slotHeightPct: grid.slotHeightPct });

  /* ٦ — فراغ ميت ≤٦٪ — ثابت في ink-clip */
  const inkClip = read("scripts/quran-import/mushaf-ink-clip-gate.mjs");
  if (!/MAX_DEAD_GAP_PCT\s*=\s*6/.test(inkClip)) fail(6, "MAX_DEAD_GAP_PCT ≠ 6");
  else pass(6, "MAX_DEAD_GAP_PCT=6 في ink-clip");

  /* ٧ — كثافة الجناح */
  if (!/data-wing-density-target="22-38"/.test(banner)) fail(7, "هدف الكثافة غير مثبت");
  else if (!/DENSITY_MIN\s*=\s*0\.22/.test(read("scripts/quran-import/mushaf-banner-density-gate.mjs"))) {
    fail(7, "بوابة الكثافة بلا ٠٫٢٢");
  } else pass(7, "٢٢٪–٣٨٪");

  /* ٨ — عناصر الجناح */
  if (!/data-wing-part="medallion"/.test(banner) || !/data-wing-part="knot"/.test(banner)) {
    fail(8, "ميدالية/عقدة مفقودة");
  } else if (/<pattern[\s>]/.test(banner) || /url\(#.*pattern/.test(banner)) {
    fail(8, "موتيف pattern مكرر مرفوض");
  } else pass(8, "medallion+mesh+knot بلا pattern");

  /* ٩ — آخر سطر سورة */
  if (!/mf2-line--surah-end/.test(pageV2) || !/mf2-line--surah-end/.test(frameCss)) {
    fail(9, "علامة آخر سطر سورة مفقودة");
  } else pass(9, "no-stretch لآخر سطر سورة");

  /* ١٠ — البسملة */
  if (!/(?:^|\n)\.mf2-bismillah\s*\{[^}]*font-size:\s*1em/.test(frameCss)) {
    fail(10, "بسملة ليست 1em");
  } else if (!/BANNER_BASMALA_MIN_GAP_PX\s*=\s*22/.test(pageV2)) {
    fail(10, "فاصل البسملة العادي غير ٢٢px");
  } else if (!/OPENING_BANNER_TO_BASMALA_PX\s*=\s*24/.test(pageV2)) {
    fail(10, "فاصل افتتاح شارة→بسملة غير ٢٤px");
  } else pass(10, "1em + فواصل ٢٠/٢٢/٢٤");

  /* ١١ — الرأس: سور تبدأ في الصفحة */
  const pageView = read("src/pages/quran/ui/MushafPageView.tsx");
  if (!/surahsStartingOnPage/.test(pageView) || !/headerSurahNames/.test(pageView)) {
    fail(11, "الرأس لا يستخدم surahsStartingOnPage");
  } else pass(11, "headerSurahNames ← surahsStartingOnPage");

  /* ١٢ — خرطوش الصفحة مركزي (±2px) — أُلغي التناوب */
  if (/data-page-parity/.test(pageView)) {
    fail(12, "تناوب خرطوش الصفحة ما زال موجودًا");
  } else if (!/data-cartouche-align="center"|data-cartouche-side="center"/.test(pageView)) {
    fail(12, "مركزية الخرطوش غير مثبتة");
  } else pass(12, "خرطوش مركزي (بلا تناوب)");

  /* ١٣ — ص١–٢ بلا إطار · شارة عند ٣٨٪ */
  if (existsSync(join(ROOT, "src/components/quran/OpeningPageFrame.tsx"))) {
    fail(13, "OpeningPageFrame.tsx ما زال موجودًا");
  } else if (!/OPENING_BANNER_TOP_PCT\s*=\s*38/.test(pageV2)) {
    fail(13, "OPENING_BANNER_TOP_PCT ≠ 38");
  } else if (!/mpv-toolbar-band|MUSHAF_LAYOUT_BANDS/.test(pageV2 + read("src/styles/quran.css"))) {
    fail(13, "نطاقات التخطيط غير مثبتة");
  } else pass(13, "بلا إطار + شارة ٣٨٪ + نطاقات");

  /* ١٤ — التباين */
  if (!/test:color-contrast-gate/.test(read("package.json"))) {
    fail(14, "بوابة التباين غير مربوطة");
  } else pass(14, "test:color-contrast-gate");

  /* ١٥ — تجميد المراجع */
  if (baseline.referencePage !== 283) fail(15, "baseline ليست صفحة ٢٨٣");
  else if (!existsSync(specPath)) fail(15, "docs/MUSHAF_SPEC.md مفقود");
  else pass(15, "مواصفة + مرجع ص٢٨٣");

  /* محظورات د — ثابتة */
  if (/space-between/.test(pageV2) && /mf2-lines/.test(pageV2)) {
    /* already covered */
  }
  if (!existsSync(specPath) || !/محظورات/.test(readFileSync(specPath, "utf8"))) {
    fail("D", "قسم المحظورات مفقود من MUSHAF_SPEC.md");
  } else {
    gateStatus.D = { ok: true };
  }

  return { grid, textFp, ayahs, words };
}

async function measureLive(page, pageNum) {
  await page.goto(`${BASE}/mushaf/page/${pageNum}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector(".mf2-lines", { timeout: 45_000 });
  await sleep(pageNum <= 2 ? 1200 : 700);
  await page.addStyleTag({
    content: `.mpv-toolbar,.mpv-navbar,.mpv-resume-banner,.qs-toast{display:none!important}`,
  });
  await sleep(60);

  const measured = await page.evaluate((baselinesPct) => {
    const root = document.querySelector(".mf2-lines");
    const body =
      document.querySelector(".mpv-body--ayah") ||
      document.querySelector(".qs-mushaf-body--ayah") ||
      root?.parentElement;
    if (!root || !body) return { error: "missing" };
    const lr = root.getBoundingClientRect();
    const br = body.getBoundingClientRect();
    const out = {
      bodyH: br.height,
      linesH: lr.height,
      frameTopBodyPct: null,
      frameBotBodyPct: null,
      maxDevPx: 0,
      lineDevs: [],
      firstInkPct: null,
      lastInkPct: null,
      cartoucheCenterDx: null,
    };

    const frame = root.querySelector("[data-opening-frame]");
    if (frame) {
      const fr = frame.getBoundingClientRect();
      /* نسب الإطار من contentBand (.mf2-lines) */
      out.frameTopBodyPct = ((fr.top - lr.top) / lr.height) * 100;
      out.frameBotBodyPct = ((fr.bottom - lr.top) / lr.height) * 100;
    }

    for (const el of root.querySelectorAll(".mf2-grid-slot--line[data-grid-slot]")) {
      const slot = Number(el.getAttribute("data-grid-slot"));
      const expected = baselinesPct[slot - 1];
      if (expected == null) continue;
      const r = el.getBoundingClientRect();
      const actualPct = ((r.top + r.height / 2 - lr.top) / lr.height) * 100;
      const devPx = Math.abs(actualPct - expected) * (lr.height / 100);
      out.maxDevPx = Math.max(out.maxDevPx, devPx);
      out.lineDevs.push({ slot, expected, actualPct, devPx });
      const topPct = ((r.top - lr.top) / lr.height) * 100;
      const botPct = ((r.bottom - lr.top) / lr.height) * 100;
      if (out.firstInkPct == null || topPct < out.firstInkPct) out.firstInkPct = topPct;
      if (out.lastInkPct == null || botPct > out.lastInkPct) out.lastInkPct = botPct;
    }

    const cart =
      document.querySelector(".mf2-surah-header__cartouche") ||
      document.querySelector(".mpv-ayah-page-badge__cartouche") ||
      document.querySelector("[data-cartouche]");
    if (cart) {
      const cr = cart.getBoundingClientRect();
      const mid = br.left + br.width / 2;
      out.cartoucheCenterDx = Math.abs(cr.left + cr.width / 2 - mid);
    }
    return out;
  }, JSON.parse(read("src/features/mushaf/mushaf-grid.json")).baselinesPct);

  mkdirSync(OUT_DIR, { recursive: true });
  const shot = join(OUT_DIR, `page-${String(pageNum).padStart(3, "0")}.png`);
  await page.locator(".mpv-body--ayah, .mf2-lines").first().screenshot({ path: shot });
  return { ...measured, shot };
}

async function runLive() {
  let server = null;
  let serverOutput = "";
  const killServer = () => {
    if (!server?.pid) return;
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      /* ignore */
    }
  };

  if (!EXTERNAL_BASE) {
    console.log(`mushaf-spec-lockdown: تشغيل Vite على ${BASE}`);
    server = spawn(
      "pnpm",
      ["exec", "vite", "--config", "vite.config.ts", "--host", "127.0.0.1", "--port", PORT],
      {
        cwd: ROOT,
        env: {
          ...process.env,
          PORT,
          BASE_PATH: process.env.BASE_PATH || "/",
          HOST: "127.0.0.1",
        },
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
      await waitForServer(BASE, 60_000);
    } catch (e) {
      console.error(serverOutput.slice(-2000));
      killServer();
      fail("live", `تعذّر تشغيل الخادم: ${e.message}`);
      return { live: null };
    }
  }

  let browser;
  const live = {};
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: VIEWPORT });

    for (const n of [1, 2, 3, 7, 601]) {
      try {
        live[n] = await measureLive(page, n);
      } catch (e) {
        live[n] = { error: String(e?.message || e) };
        fail("live", `p${n}: ${live[n].error}`);
      }
    }

    for (const n of [1, 2]) {
      const r = live[n];
      if (!r || r.error) continue;
      if (r.frameTopBodyPct != null) {
        fail(13, `ص${n}: إطار ما زال مرسومًا`);
      } else {
        const prev = gateStatus[13];
        gateStatus[13] = {
          ok: true,
          detail: {
            ...(prev?.detail && typeof prev.detail === "object" ? prev.detail : {}),
            [`p${n}`]: { noFrame: true },
          },
        };
      }
    }

    for (const n of [3, 7]) {
      const r = live[n];
      if (!r || r.error) continue;
      if (r.maxDevPx > 2) fail(5, `ص${n}: انحراف شبكة ${r.maxDevPx.toFixed(2)}px`);
      else {
        const prev = gateStatus[5];
        gateStatus[5] = {
          ok: true,
          detail: {
            ...(prev?.detail && typeof prev.detail === "object" ? prev.detail : {}),
            [`p${n}MaxDevPx`]: +r.maxDevPx.toFixed(3),
            [`p${n}Ink`]: {
              first: r.firstInkPct != null ? +r.firstInkPct.toFixed(2) : null,
              last: r.lastInkPct != null ? +r.lastInkPct.toFixed(2) : null,
            },
          },
        };
      }
    }

    if (live[601]?.cartoucheCenterDx != null && live[601].cartoucheCenterDx > 2) {
      fail(12, `ص٦٠١: مركز الخرطوش انحراف ${live[601].cartoucheCenterDx.toFixed(1)}px`);
    } else if (live[601]?.cartoucheCenterDx != null) {
      gateStatus[12] = {
        ok: true,
        detail: { p601Dx: +live[601].cartoucheCenterDx.toFixed(2) },
      };
    }

    await browser.close();
  } catch (e) {
    fail("live", String(e?.message || e));
  } finally {
    killServer();
  }
  return { live };
}

const staticResult = runStatic();
let liveResult = { live: null };
if (!SKIP_LIVE) {
  liveResult = await runLive();
} else {
  console.log("mushaf-spec-lockdown: تخطّي الحيّ (MUSHAF_GATE_SKIP_LIVE=1)");
}

mkdirSync(OUT_DIR, { recursive: true });
const report = {
  base: BASE,
  skipLive: SKIP_LIVE,
  gateStatus,
  failures,
  static: {
    ayahs: staticResult.ayahs,
    words: staticResult.words,
    textFp: staticResult.textFp,
    grid: staticResult.grid,
  },
  live: liveResult.live,
};
writeFileSync(join(OUT_DIR, "gate-result.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  process.exit(1);
}
console.log("mushaf-spec-lockdown-gate: ok");
