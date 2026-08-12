#!/usr/bin/env node
/**
 * بوابة تثبيت مواصفة المصحف (١٥ بندًا) — النموذج البسيط (flow · ثابت S · بلا أرابيسك).
 *
 * - دائمًا: فحوص ثابتة على الشيفرة/البيانات.
 * - حيّ: إن وُجد MUSHAF_GATE_BASE_URL أو Vite محلي — عيّنة صفحات.
 *
 *   pnpm run test:mushaf-spec-lockdown
 *   MUSHAF_GATE_SKIP_LIVE=1 pnpm run test:mushaf-spec-lockdown
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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTIVE_LINES_WAIT_SEL,
  ACTIVE_PAGE_BROWSER_SOURCE,
} from "./mushaf-gate-active-page.mjs";

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

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function runStatic() {
  const grid = JSON.parse(read("src/features/mushaf/mushaf-grid.json"));
  const baseline = JSON.parse(read("src/features/mushaf/mushaf-baseline.json"));
  const pageV2 = read("src/components/quran/MushafPageV2.tsx");
  const frameCss = read("src/styles/mushaf-v2.css");
  const banner = read("src/components/quran/SurahBanner.tsx");
  const fontBanner = read("src/components/quran/QpcFontPackBanner.tsx");
  const pageView = read("src/pages/quran/ui/MushafPageView.tsx");
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
  if (ayahs !== EXPECTED_AYAHS) fail(1, `آيات ${ayahs} ≠ ${EXPECTED_AYAHS}`);
  else if (words !== EXPECTED_WORDS) fail(1, `كلمات ${words} ≠ ${EXPECTED_WORDS}`);
  else pass(1, { ayahs, words, textFp: textFp.slice(0, 16) });

  /* ٢ — أرقام الآيات (مجسمات نهاية) */
  if (ends !== EXPECTED_AYAHS) fail(2, `ميداليات نهاية ${ends} ≠ ${EXPECTED_AYAHS}`);
  else if (
    !/function defaultRenderWord[\s\S]*?charType === "end"[\s\S]*?\{w\.glyphText\}/.test(pageV2)
  ) {
    fail(2, "مسار QPC لا يعرض glyphText لنهاية الآية");
  } else pass(2, { ends });

  /* ٣ — عدم الاقتطاع */
  const basmalaBlock = (frameCss.match(/\.mf2-bismillah\s*\{[^}]*\}/) || [""])[0];
  const linesBlock = (frameCss.match(/\.mf2-lines\s*\{[^}]*\}/) || [""])[0]
    .replace(/\/\*[\s\S]*?\*\//g, "");
  if (/overflow(?:-y)?:\s*hidden/.test(linesBlock)) fail(3, ".mf2-lines عليها overflow رأسي hidden");
  else if (/overflow:\s*hidden/.test(basmalaBlock)) fail(3, "البسملة overflow:hidden");
  else if (!/overflow:\s*visible/.test(linesBlock)) {
    fail(3, ".mf2-lines بلا overflow:visible");
  } else pass(3, "سياسة عدم القص الرأسي مثبتة في CSS");

  /* ٤ — التجاوز الأفقي */
  if (!/test:mushaf-drawn-overflow/.test(read("package.json"))) {
    fail(4, "بوابة التجاوز الأفقي غير مربوطة");
  } else pass(4, "test:mushaf-drawn-overflow ضمن البوابات");

  /* ٥ — شبكة تدفق ١٥ صفًا متساويًا */
  if (grid.referencePage !== 283) fail(5, `referencePage=${grid.referencePage}`);
  else if (grid.slotCount !== 15) fail(5, `slotCount=${grid.slotCount}`);
  else if (!/grid-template-rows:\s*repeat\(15/.test(frameCss)) {
    fail(5, "CSS بلا grid-template-rows: repeat(15)");
  } else if (!/data-mushaf-grid="flow"/.test(pageV2)) {
    fail(5, "التموضع لا يستخدم data-mushaf-grid=flow");
  } else if (/justifyContent:\s*["']space-between|justify-content:\s*space-between/.test(pageV2)) {
    fail(5, "space-between على حاوية الأسطر");
  } else if (/position:\s*["']absolute["']/.test(pageV2.match(/slotStyle[\s\S]*?\};/)?.[0] || "")) {
    fail(5, "slotStyle يستخدم position absolute");
  } else pass(5, { slotCount: 15, grid: "flow", board: "1000x1618" });

  /* ٦ — فراغ ميت / تصادم حبر */
  if (!/test:mushaf-ink-collision/.test(read("package.json"))) {
    fail(6, "بوابة تصادم الحبر غير مربوطة");
  } else pass(6, "test:mushaf-ink-collision");

  /* ٧ — شارة بسيطة (بدل كثافة الجناح) */
  if (!/data-ornament="none"/.test(banner)) fail(7, "data-ornament=none مفقود");
  else if (!/data-banner-style="minimal-rule"/.test(banner)) {
    fail(7, "data-banner-style=minimal-rule مفقود");
  } else if (/PetalMedallion|data-wing-part|wing-refined|data-wing-density/.test(banner)) {
    fail(7, "زخرفة جناح ما زالت في SurahBanner");
  } else pass(7, "شارة minimal-rule");

  /* ٨ — بلا أجنحة SVG / أرابيسك */
  if (/data-wing-part=|<pattern[\s>]/.test(banner)) fail(8, "موتيف جناح/pattern في الشارة");
  else if (/arabesque|ArabesqueMesh/i.test(banner + pageV2 + frameCss)) {
    fail(8, "إشارة أرابيسك في شجرة الصفحة");
  } else pass(8, "بلا جناح وبلا أرابيسك");

  /* ٩ — آخر سطر سورة */
  if (!/mf2-line--surah-end/.test(frameCss) || !/lastSurahEndLineNumbers|noStretchLines/.test(pageV2)) {
    fail(9, "علامة آخر سطر سورة مفقودة");
  } else pass(9, "no-stretch لآخر سطر سورة");

  /* ١٠ — البسملة + S ثابت من baseline */
  if (!/(?:^|\n)\.mf2-bismillah\s*\{[^}]*font-size:\s*1em/.test(frameCss)) {
    fail(10, "بسملة ليست 1em");
  } else if (!/MUSHAF_LAYOUT_BASELINE\.fontSizePx/.test(pageV2)) {
    fail(10, "حجم الخط لا يُثبَّت من mushaf-baseline.fontSizePx");
  } else if (/OPENING_BANNER_TOP_PCT/.test(pageV2)) {
    fail(10, "OPENING_BANNER_TOP_PCT ما زال موجودًا");
  } else pass(10, { fontSizePx: baseline.fontSizePx, basmala: "1em" });

  /* ١١ — الرأس: سور تبدأ في الصفحة */
  if (!/surahsStartingOnPage/.test(pageView) || !/headerSurahNames/.test(pageView)) {
    fail(11, "الرأس لا يستخدم surahsStartingOnPage");
  } else pass(11, "headerSurahNames ← surahsStartingOnPage");

  /* ١٢ — رقم صفحة بسيط مركزي (بلا خرطوش مزخرف) */
  if (/data-page-parity/.test(pageView)) {
    fail(12, "تناوب خرطوش الصفحة ما زال موجودًا");
  } else if (!/data-page-chrome="minimal"/.test(pageView)) {
    fail(12, "data-page-chrome=minimal مفقود");
  } else if (!/data-page-numeral="arabic"/.test(pageView)) {
    fail(12, "data-page-numeral=arabic مفقود");
  } else pass(12, "رقم صفحة عربي بسيط مركزي");

  /* ١٣ — ص١–٢ بلا إطار · نفس تدفق الشبكة */
  if (existsSync(join(ROOT, "src/components/quran/OpeningPageFrame.tsx"))) {
    fail(13, "OpeningPageFrame.tsx ما زال موجودًا");
  } else if (/OPENING_BANNER_TOP_PCT/.test(pageV2)) {
    fail(13, "OPENING_BANNER_TOP_PCT ما زال موجودًا");
  } else if (!/data-mushaf-grid="flow"/.test(pageV2)) {
    fail(13, "شبكة التدفق غير مثبتة");
  } else if (!/mpv-toolbar-band|MUSHAF_LAYOUT_BANDS/.test(pageV2 + read("src/styles/quran.css"))) {
    fail(13, "نطاقات التخطيط غير مثبتة");
  } else pass(13, "بلا إطار + flow grid + نطاقات");

  /* ١٤ — التباين */
  if (!/test:color-contrast-gate/.test(read("package.json"))) {
    fail(14, "بوابة التباين غير مربوطة");
  } else pass(14, "test:color-contrast-gate");

  /* ١٥ — تجميد المراجع + ثابت S */
  const freeze = [1, 2, 3, 600, 601, 602, 603];
  if (baseline.referencePage !== 283) fail(15, "baseline ليست صفحة ٢٨٣");
  else if (typeof baseline.fontSizePx !== "number") fail(15, "fontSizePx مفقود من baseline");
  else if (!existsSync(specPath)) fail(15, "docs/MUSHAF_SPEC.md مفقود");
  else if (!/data-font-progress="corner"/.test(fontBanner)) {
    fail(15, "مؤشر الخط ليس corner");
  } else pass(15, { freeze, fontSizePx: baseline.fontSizePx });

  if (!existsSync(specPath) || !/محظورات/.test(readFileSync(specPath, "utf8"))) {
    fail("D", "قسم المحظورات مفقود من MUSHAF_SPEC.md");
  } else {
    gateStatus.D = { ok: true };
  }

  return { grid, baseline, textFp, ayahs, words };
}

async function measureLive(page, pageNum) {
  await page.goto(`${BASE}/mushaf/page/${pageNum}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector(ACTIVE_LINES_WAIT_SEL, { timeout: 45_000 });
  await sleep(pageNum <= 2 ? 1200 : 700);
  await page.addStyleTag({
    content: `.mpv-toolbar,.mpv-navbar,.mpv-resume-banner,.qs-toast{display:none!important}`,
  });
  await sleep(60);

  const measured = await page.evaluate(() => {
    const root = __mushafLinesRoot();
    if (!root) return { error: "missing" };
    const out = {
      gridMode: root.getAttribute("data-mushaf-grid"),
      board: root.getAttribute("data-board"),
      hasFrame: Boolean(
        document.querySelector("[data-opening-frame], .mf2-opening-frame"),
      ),
      ornament: root.querySelector(".mf2-surah-banner")?.getAttribute("data-ornament") || null,
      absSlots: [...root.querySelectorAll(".mf2-grid-slot, .mf2-line")].filter(
        (el) => getComputedStyle(el).position === "absolute",
      ).length,
      S:
        parseFloat(getComputedStyle(root).getPropertyValue("--mushaf-S")) ||
        parseFloat(getComputedStyle(root).fontSize) ||
        0,
      pageChrome: document.querySelector(".mpv-ayah-footer")?.getAttribute("data-page-chrome"),
      numeralDx: null,
    };
    const badge = document.querySelector(".mpv-ayah-page-badge");
    if (badge) {
      const br = badge.getBoundingClientRect();
      out.numeralDx = Math.abs(br.left + br.width / 2 - window.innerWidth / 2);
    }
    return out;
  });

  mkdirSync(OUT_DIR, { recursive: true });
  const shot = join(OUT_DIR, `page-${String(pageNum).padStart(3, "0")}.png`);
  await page.locator(".mpv-body--ayah, .mf2-lines").first().screenshot({ path: shot });
  return { ...measured, shot };
}

async function runLive(baseline) {
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
    await page.addInitScript({ content: ACTIVE_PAGE_BROWSER_SOURCE });

    for (const n of [1, 2, 3, 600, 601, 602, 603]) {
      try {
        live[n] = await measureLive(page, n);
      } catch (e) {
        live[n] = { error: String(e?.message || e) };
        fail("live", `p${n}: ${live[n].error}`);
      }
    }

    for (const n of [1, 2, 3, 600, 601, 602, 603]) {
      const r = live[n];
      if (!r || r.error) continue;
      if (r.hasFrame) fail(13, `ص${n}: إطار ما زال مرسومًا`);
      if (r.gridMode !== "flow") fail(5, `ص${n}: grid=${r.gridMode}`);
      if (r.absSlots > 0) fail(5, `ص${n}: ${r.absSlots} absolute slots`);
      if (r.ornament != null && r.ornament !== "none") fail(7, `ص${n}: ornament=${r.ornament}`);
      if (r.S > 0) {
        const rel = Math.abs(r.S - baseline.fontSizePx) / baseline.fontSizePx;
        if (rel > 0.05) fail(10, `ص${n}: S=${r.S.toFixed(2)} ≠ ${baseline.fontSizePx}`);
      }
      if (r.pageChrome !== "minimal") fail(12, `ص${n}: chrome=${r.pageChrome}`);
      if (r.numeralDx != null && r.numeralDx > 2.05) {
        fail(12, `ص${n}: رقم الصفحة غير مركزي dx=${r.numeralDx.toFixed(1)}`);
      }
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
  liveResult = await runLive(staticResult.baseline);
} else {
  console.log("mushaf-spec-lockdown: تخطّي الحيّ (MUSHAF_GATE_SKIP_LIVE=1)");
}

mkdirSync(OUT_DIR, { recursive: true });
const report = {
  base: BASE,
  skipLive: SKIP_LIVE,
  model: "minimal-flow",
  gateStatus,
  failures,
  static: {
    ayahs: staticResult.ayahs,
    words: staticResult.words,
    textFp: staticResult.textFp,
    grid: staticResult.grid,
    fontSizePx: staticResult.baseline.fontSizePx,
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
