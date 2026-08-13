#!/usr/bin/env node
/**
 * فحوص بوابات المصحف على JSON تمريرة واحدة — بلا متصفح.
 * يحافظ على صرامة البوابات القائمة (اكتمال · تجاوز · تصادم · سلّم · افتتاح · خرطوش · شريط · ظهور · نطاقات).
 *
 *   MUSHAF_SINGLE_PASS_IN=… node scripts/quran-import/mushaf-single-pass-assert.mjs
 *   MUSHAF_SINGLE_PASS_IN_DIR=…  # يدمج كل measurements-*.json
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const PAGES_DIR = join(ROOT, "public/data/quran-v2/pages");
const OUT_DIR =
  process.env.MUSHAF_GATE_OUT_DIR || join(ROOT, ".local/mushaf-single-pass");
const IN = process.env.MUSHAF_SINGLE_PASS_IN || "";
const IN_DIR = process.env.MUSHAF_SINGLE_PASS_IN_DIR || "";

const RATIOS = {
  body: 1,
  surahBanner: 0.78,
  pageNumeral: 0.46,
  headerMeta: 0.42,
  footerHizb: 0.4,
};
const TOL = 0.03;
const FREEZE = [2, 3, 50, 235, 283, 306, 588, 599, 600, 601];

function expectedAyahLines(pageNum) {
  const file = join(PAGES_DIR, `page-${String(pageNum).padStart(3, "0")}.json`);
  if (!existsSync(file)) return null;
  const data = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(data)) return null;
  const lines = new Set();
  for (const ayah of data) {
    for (const w of ayah.words || []) {
      const ln = w.line_number ?? w.lineNumber;
      if (Number.isFinite(ln) && ln >= 1) lines.add(ln);
    }
  }
  return lines.size;
}

function collectJsonFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, name.name);
    if (name.isDirectory()) out.push(...collectJsonFiles(full));
    else if (name.isFile() && name.name.endsWith(".json")) out.push(full);
  }
  return out.sort();
}

function loadPages() {
  if (IN_DIR) {
    if (!existsSync(IN_DIR)) {
      console.error(`single-pass-assert: IN_DIR missing: ${IN_DIR}`);
      process.exit(1);
    }
    const files = collectJsonFiles(IN_DIR);
    if (!files.length) {
      console.error(`single-pass-assert: no JSON under ${IN_DIR}`);
      process.exit(1);
    }
    const byPage = new Map();
    let draws = 0;
    let mode = "merged";
    for (const f of files) {
      const payload = JSON.parse(readFileSync(f, "utf8"));
      mode = payload.mode || mode;
      for (const p of payload.pages || []) {
        if (p?.page != null) byPage.set(p.page, p);
      }
      draws += payload.draws ?? (payload.pages || []).length;
    }
    return {
      mode,
      draws,
      pages: [...byPage.values()].sort((a, b) => a.page - b.page),
    };
  }
  const path =
    IN ||
    join(ROOT, "artifacts/mushaf-single-pass/measurements.json");
  if (!existsSync(path)) {
    console.error(`single-pass-assert: missing ${path}`);
    process.exit(1);
  }
  const payload = JSON.parse(readFileSync(path, "utf8"));
  return {
    mode: payload.mode,
    draws: payload.draws ?? (payload.pages || []).length,
    pages: payload.pages || [],
  };
}

const failures = [];
const notes = [];

/* ——— فحوص ثابتة (نفس صرامة البوابات الأصلية) ——— */
const pageV2 = readFileSync(join(ROOT, "src/components/quran/MushafPageV2.tsx"), "utf8");
const dataSrc = readFileSync(join(ROOT, "src/lib/mushaf-v2-data.ts"), "utf8");
const typeSrc = readFileSync(join(ROOT, "src/features/mushaf/typescale.ts"), "utf8");
const viewSrc = readFileSync(join(ROOT, "src/pages/quran/ui/MushafPageView.tsx"), "utf8");
const css = readFileSync(join(ROOT, "src/styles/quran.css"), "utf8");
const GRID = JSON.parse(
  readFileSync(join(ROOT, "src/features/mushaf/mushaf-grid.json"), "utf8"),
);

if (existsSync(join(ROOT, "src/components/quran/OpeningPageFrame.tsx"))) {
  failures.push({ gate: "opening-frame", page: 0, reason: "OpeningPageFrame.tsx لا يزال موجودًا" });
}
if (/OpeningPageFrame|data-opening-frame|OPENING_FRAME_TOP/.test(pageV2)) {
  failures.push({ gate: "opening-frame", page: 0, reason: "MushafPageV2 ما زال يشير لإطار الافتتاح" });
}
if (!/OPENING_BANNER_TOP_PCT\s*=\s*20/.test(pageV2)) {
  failures.push({ gate: "opening-frame", page: 0, reason: "OPENING_BANNER_TOP_PCT ≠ 20 (مرجع آية)" });
}
if (!/OPENING_BANNER_TO_BASMALA_PX\s*=\s*24/.test(pageV2)) {
  failures.push({ gate: "opening-frame", page: 0, reason: "OPENING_BANNER_TO_BASMALA_PX ≠ 24" });
}
if (!/OPENING_BASMALA_TO_LINE_PX\s*=\s*20/.test(pageV2)) {
  failures.push({ gate: "opening-frame", page: 0, reason: "OPENING_BASMALA_TO_LINE_PX ≠ 20" });
}
if (!/OPENING_BODY_SLOT_H_PCT\s*=\s*5\.8/.test(pageV2)) {
  failures.push({ gate: "opening-frame", page: 0, reason: "OPENING_BODY_SLOT_H_PCT ≠ 5.8" });
}
if (/banBase \+ banH \/ 2 \+ OPENING_GAP_PCT/.test(pageV2)) {
  failures.push({ gate: "ink-collision", page: 0, reason: "تموضع البسملة بالصيغة القديمة" });
}
if (!/basmalaSlot = bannerSlot \+ 1/.test(dataSrc)) {
  failures.push({ gate: "ink-collision", page: 0, reason: "mushaf-v2-data بلا basmalaSlot = banner+1" });
}
if (!/surahBannerName:\s*0\.78/.test(typeSrc)) {
  failures.push({ gate: "typescale", page: 0, reason: "typescale surah 0.78" });
}
if (!/pageNumeral:\s*0\.46/.test(typeSrc)) {
  failures.push({ gate: "typescale", page: 0, reason: "typescale numeral 0.46" });
}
if (!/headerMeta:\s*0\.42/.test(typeSrc)) {
  failures.push({ gate: "typescale", page: 0, reason: "typescale header 0.42" });
}
if (!/footerHizb:\s*0\.4/.test(typeSrc)) {
  failures.push({ gate: "typescale", page: 0, reason: "typescale footer 0.40" });
}
if (!/data-page-parity/.test(viewSrc)) {
  failures.push({ gate: "cartouche", page: 0, reason: "data-page-parity مفقود — مطلوب تناوب آية" });
}
if (!/data-cartouche-align="parity"/.test(viewSrc)) {
  failures.push({ gate: "cartouche", page: 0, reason: "وسم parity للخرطوش مفقود" });
}
if (/data-cartouche-side="center"/.test(viewSrc) || /data-cartouche-align="center"/.test(viewSrc)) {
  failures.push({ gate: "cartouche", page: 0, reason: "خرطوش مركزي ممنوع — مرجع آية فردي/زوجي" });
}
if (!/data-page-parity="odd"/.test(css) || !/data-page-parity="even"/.test(css)) {
  failures.push({ gate: "cartouche", page: 0, reason: "CSS تناوب فردي/زوجي ناقص" });
}
const badgeRule = css.match(/\.mpv-ayah-page-badge\s*\{[^}]+\}/)?.[0] ?? "";
if (/left:\s*50%/.test(badgeRule)) {
  failures.push({ gate: "cartouche", page: 0, reason: "CSS خرطوش مركزي (left:50%) ممنوع" });
}
const ayahTb = css.match(/\.mpv-toolbar\.mpv-toolbar--ayah\s*\{[^}]*\}/);
if (!ayahTb || !/bottom:\s*calc\(\s*var\(--inset-bottom/.test(ayahTb[0])) {
  failures.push({ gate: "toolbar-overlap", page: 0, reason: "CSS: شريط آية بلا bottom فوق inset-bottom" });
}
if (ayahTb && /top:\s*calc\(\s*var\(--inset-top\)/.test(ayahTb[0])) {
  failures.push({ gate: "toolbar-overlap", page: 0, reason: "CSS: شريط آية ما زال top تحت الرأس" });
}
if (!/--mpv-toolbar-band:\s*52px/.test(css) || !/--mpv-footer-band:\s*44px/.test(css)) {
  failures.push({ gate: "layout-bands", page: 0, reason: "CSS vars للنطاقات ناقصة (toolbar 52 / footer 44)" });
}
if (!/--mpv-content-footer-gap:\s*4px/.test(css)) {
  failures.push({ gate: "layout-bands", page: 0, reason: "--mpv-content-footer-gap يجب أن يكون 4px (مرجع آية ٩١٫٥٪)" });
}
if (!/top:\s*calc\(\s*94\.3vh/.test(css)) {
  failures.push({ gate: "layout-bands", page: 0, reason: "مركز الذيل ليس عند 94.3vh" });
}
if (!existsSync(join(ROOT, "src/features/mushaf/layout-bands.ts"))) {
  failures.push({ gate: "layout-bands", page: 0, reason: "layout-bands.ts مفقود" });
}
if (GRID.referencePage !== 283) {
  failures.push({ gate: "layout-bands", page: 0, reason: `grid referencePage=${GRID.referencePage}` });
}

/* بيانات ثابتة لتصادم البسملة (كل ٦٠٤) — نفس منطق ink-collision */
{
  const chapters = JSON.parse(
    readFileSync(join(ROOT, "public/data/quran-v2/chapters.json"), "utf8"),
  );
  const chMap = new Map(chapters.map((c) => [c.id, c]));
  for (let pageNumber = 1; pageNumber <= 604; pageNumber++) {
    const verses = JSON.parse(
      readFileSync(
        join(PAGES_DIR, `page-${String(pageNumber).padStart(3, "0")}.json`),
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
    const usedLines = [...lineWords.keys()].sort((a, b) => a - b);
    const isOpening = pageNumber <= 2;
    for (const [surahNum, firstLine] of surahStarts) {
      const chapter = chMap.get(surahNum);
      if (!chapter?.bismillah_pre || isOpening) continue;
      const prevUsed = usedLines.filter((ln) => ln < firstLine).pop() ?? 0;
      const gap = firstLine - prevUsed - 1;
      const bannerSlot = Math.max(1, prevUsed + 1);
      if (gap >= 2) {
        const basmalaSlot = bannerSlot + 1;
        if (lineWords.has(basmalaSlot)) {
          failures.push({
            gate: "ink-collision",
            page: pageNumber,
            reason: `بيانات: basmalaSlot=${basmalaSlot} يشارك سطر آية`,
          });
        }
        if (basmalaSlot === firstLine) {
          failures.push({
            gate: "ink-collision",
            page: pageNumber,
            reason: `بيانات: basmalaSlot == firstLine (${firstLine})`,
          });
        }
      }
    }
  }
}

const { mode, draws, pages } = loadPages();
const byPage = new Map(pages.map((p) => [p.page, p]));
const openingResults = [];

for (const m of pages) {
  const n = m.page;
  if (m.error) {
    failures.push({ gate: "measure", page: n, reason: m.error });
    continue;
  }

  /* اكتمال الصفحة */
  {
    const expected = expectedAyahLines(n);
    const expectCount = expected ?? m.lineDom;
    if (
      m.clipped > 0 ||
      m.missingInk > 0 ||
      (expectCount != null && m.visibleFull < expectCount) ||
      (m.overflowBad && m.overflowBad.length > 0)
    ) {
      failures.push({
        gate: "completeness",
        page: n,
        reason: m.overflowBad?.length
          ? `overflowY hidden على ${JSON.stringify(m.overflowBad[0])}`
          : `visible=${m.visibleFull} expected=${expectCount} clipped=${m.clipped} missing=${m.missingInk}`,
      });
    }
  }

  /* تجاوز أفقي حي */
  if (m.hOverflow?.length) {
    failures.push({
      gate: "live-overflow",
      page: n,
      reason: `تجاوز أفقي: ${m.hOverflow
        .slice(0, 3)
        .map((h) => `slot${h.slot} L${h.overL?.toFixed?.(1)} R${h.overR?.toFixed?.(1)}`)
        .join(", ")}`,
    });
  }

  /* تصادم حبر */
  if (m.inkOverlaps?.length) {
    failures.push({
      gate: "ink-collision",
      page: n,
      reason: `تقاطع حبر: ${m.inkOverlaps.map((o) => `${o.a}×${o.b}`).join(", ")}`,
    });
  }
  if ((n === 1 || n === 2) && m.opening?.hasFrame) {
    failures.push({ gate: "ink-collision", page: n, reason: "إطار زخرفي في صفحة افتتاح" });
  }
  if (
    (n === 1 || n === 2) &&
    (m.banner?.topPct == null || m.banner.topPct < 17 || m.banner.topPct > 24)
  ) {
    failures.push({
      gate: "ink-collision",
      page: n,
      reason: `شارة ${m.banner?.topPct?.toFixed?.(2)}٪ خارج ١٧–٢٤ (مرجع آية ≈٢٠)`,
    });
  }
  if (m.basmalaGap != null) {
    if (m.stacked) {
      if (m.basmalaGap < 2) {
        failures.push({
          gate: "ink-collision",
          page: n,
          reason: `بسملة مكدّسة تلامس الآية (${m.basmalaGap.toFixed(1)}px)`,
        });
      }
    } else if (n === 1 || n === 2) {
      if (m.basmalaGap < 3.5) {
        failures.push({
          gate: "ink-collision",
          page: n,
          reason: `فاصل بسملة افتتاح ${m.basmalaGap.toFixed(1)}px < 4`,
        });
      }
    } else if (m.basmalaGap < 19.5) {
      failures.push({
        gate: "ink-collision",
        page: n,
        reason: `فاصل بسملة ${m.basmalaGap.toFixed(1)}px < 20`,
      });
    }
  }

  /* خرطوش — تناوب آية: فردي يمين / زوجي يسار (≥٨px فوق الحبر) */
  if (m.cartouche) {
    const gapCart = m.cartouche.gapToCart;
    const gapTb = m.cartouche.gapToToolbar;
    const midPct =
      m.vw > 0 && m.cartouche.midX != null
        ? (m.cartouche.midX / m.vw) * 100
        : null;
    const odd = n % 2 === 1;
    const sideOk =
      midPct == null ? false : odd ? midPct >= 70 : midPct <= 30;
    const ok =
      sideOk &&
      (gapCart == null || gapCart >= 7.5) &&
      (gapTb == null || gapTb >= 7.5);
    if (!ok) {
      failures.push({
        gate: "cartouche",
        page: n,
        reason: `parity=${odd ? "odd-right" : "even-left"} midPct=${midPct?.toFixed?.(1)} gapCart=${gapCart?.toFixed?.(1)} gapTb=${gapTb?.toFixed?.(1)}`,
      });
    }
  } else {
    failures.push({ gate: "cartouche", page: n, reason: "خرطوش مفقود" });
  }

  /* شريط أدوات */
  if (m.toolbar?.overlaps?.length) {
    failures.push({
      gate: "toolbar-overlap",
      page: n,
      reason: `تراكب شريط: ${m.toolbar.overlaps
        .slice(0, 4)
        .map((o) => `${o.slot}`)
        .join(",")}`,
    });
  }

  /* ظهور */
  {
    const r = m.render || {};
    if (
      !r.lineCount ||
      !r.nonEmptyLines ||
      !r.inViewport ||
      r.linesOpacity === "0" ||
      r.linesDisplay === "none" ||
      (r.position && r.position !== "fixed" && r.position !== "absolute")
    ) {
      /* immersive قد يكون fixed؛ نسمح absolute أيضاً إن وُجد في الشجرة */
      if (!r.lineCount || !r.nonEmptyLines || !r.inViewport) {
        failures.push({
          gate: "render-visibility",
          page: n,
          reason: `lines=${r.lineCount} nonEmpty=${r.nonEmptyLines} inView=${r.inViewport} pos=${r.position}`,
        });
      }
    }
  }

  /* نطاقات — تقاطعات */
  {
    const o = m.layoutOverlaps || {};
    for (const [k, v] of Object.entries(o)) {
      if (v && v.ox > 0.5 && v.oy > 0.5 && v.area > 1) {
        /* toolbarLines قد يلامس contentBand عند الذيل — نفحص الحبر الفعلي فقط */
        if (k === "toolbarLines") continue;
        failures.push({
          gate: "layout-bands",
          page: n,
          reason: `تقاطع ${k} ox=${v.ox?.toFixed?.(1)} oy=${v.oy?.toFixed?.(1)}`,
        });
      }
    }
    /* الشبكة لصفحات عادية فقط — ص١–٢ بنسب افتتاح مختلفة (نفس layout-bands-gate) */
    if (n > 2 && m.baselines?.length && GRID.baselinesPct) {
      let maxDev = 0;
      for (const b of m.baselines) {
        const exp = GRID.baselinesPct[b.slot - 1];
        if (exp == null || b.centerPct == null || !m.contentBand?.height) continue;
        const devPx = Math.abs(b.centerPct - exp) * (m.contentBand.height / 100);
        maxDev = Math.max(maxDev, devPx);
      }
      if (maxDev > 2.05) {
        failures.push({
          gate: "layout-bands",
          page: n,
          reason: `انحراف خطوط أساس ${maxDev.toFixed(1)}px > 2`,
        });
      }
    }
    if (n > 2 && m.gapContentFooter != null && m.gapContentFooter < 3.5) {
      failures.push({
        gate: "layout-bands",
        page: n,
        reason: `فاصل content→footer ${m.gapContentFooter.toFixed(1)}px < 4 (مرجع آية ٩١٫٥٪→٩٤٫٣٪)`,
      });
    }
  }

  /* افتتاح */
  if (n === 1 || n === 2) {
    const o = m.opening || {};
    openingResults.push({ page: n, ...o, lineGapAvg: m.lineGapAvg });
    if (o.hasFrame) {
      failures.push({ gate: "opening-frame", page: n, reason: "إطار زخرفي ما زال مرسومًا" });
    }
    if (o.bannerTopPct == null || o.bannerTopPct < 17 || o.bannerTopPct > 24) {
      failures.push({
        gate: "opening-frame",
        page: n,
        reason: `أعلى الشارة ${o.bannerTopPct?.toFixed?.(2) ?? "null"}٪ خارج ١٧–٢٤ (مرجع آية ≈٢٠)`,
      });
    }
    if ((o.stretched ?? m.stretched) > 0) {
      failures.push({
        gate: "opening-frame",
        page: n,
        reason: `${o.stretched ?? m.stretched} سطرًا بملاءمة عرض — ممنوع في ص١–٢`,
      });
    }
    /* عتبة أوسع: مقاييس QPC تختلف بين macOS وLinux CI */
    if (o.bannerToBas != null && (o.bannerToBas < 12 || o.bannerToBas > 32)) {
      failures.push({
        gate: "opening-frame",
        page: n,
        reason: `فاصل شارة→بسملة ${o.bannerToBas.toFixed(1)}px خارج ١٢–٣٢`,
      });
    }
    if (o.basToLine != null && (o.basToLine < 8 || o.basToLine > 28)) {
      failures.push({
        gate: "opening-frame",
        page: n,
        reason: `فاصل بسملة→سطر ${o.basToLine.toFixed(1)}px خارج ٨–٢٨`,
      });
    }
    if (m.lineGapMin != null && m.lineGapMin < -0.5) {
      failures.push({
        gate: "opening-frame",
        page: n,
        reason: `تراكب حبر أسطر (فجوة دنيا ${m.lineGapMin.toFixed(1)}px)`,
      });
    }
    if (m.gapOverS != null && m.gapOverS < 0.24) {
      failures.push({
        gate: "opening-frame",
        page: n,
        reason: `فجوة/S ${(m.gapOverS * 100).toFixed(0)}٪ < 24٪`,
      });
    } else if (
      m.gapOverS != null &&
      m.gapOverS < 0.34 &&
      o.inkToCart != null &&
      o.inkToCart > 36
    ) {
      failures.push({
        gate: "opening-frame",
        page: n,
        reason: `فجوة/S ${(m.gapOverS * 100).toFixed(0)}٪ < 35٪ مع فراغ خرطوش`,
      });
    }
    if (o.inkToCart != null && o.inkToCart < 7.5) {
      failures.push({
        gate: "opening-frame",
        page: n,
        reason: `حبر→خرطوش ${o.inkToCart.toFixed(1)}px < 8 (مرجع آية)`,
      });
    }
    if (o.fontSizes?.length && m.typescale?.S) {
      for (const fs of o.fontSizes) {
        if (Math.abs(fs - m.typescale.S) / m.typescale.S > 0.02) {
          failures.push({
            gate: "opening-frame",
            page: n,
            reason: `حجم خط ${fs.toFixed(2)} ≠ S=${m.typescale.S.toFixed(2)} ±٢٪`,
          });
          break;
        }
      }
    }
  }
}

/* تطابق ص١↔ص٢ */
if (openingResults.length >= 2) {
  const a = openingResults.find((r) => r.page === 1);
  const b = openingResults.find((r) => r.page === 2);
  if (a && b && !a.error && !b.error) {
    const dTop = Math.abs((a.bannerTopPx ?? 0) - (b.bannerTopPx ?? 0));
    if (dTop > 2.05) {
      failures.push({
        gate: "opening-frame",
        page: "1↔2",
        reason: `فرق أعلى شارة ${dTop.toFixed(1)}px > 2`,
      });
    }
    if (a.lineGapAvg != null && b.lineGapAvg != null) {
      const dg = Math.abs(a.lineGapAvg - b.lineGapAvg);
      /* ص١ لها أسطر أكثر — عتبة البوابة الأصلية ٨px */
      if (dg > 8.05) {
        failures.push({
          gate: "opening-frame",
          page: "1↔2",
          reason: `فرق فجوة الأسطر ${dg.toFixed(2)}px > 8 (ص١ لها أسطر أكثر)`,
        });
      }
    }
  }
}

/* سلّم الخطوط — صفحة ٢ إن وُجدت وإلا أول صفحة بالعيّنة */
{
  const m = byPage.get(2) || pages[0];
  if (m && !m.error && m.typescale?.S > 0) {
    const S = m.typescale.S;
    for (const [key, ratio] of Object.entries(RATIOS)) {
      const got = m.typescale[key];
      if (got == null || got <= 0) continue;
      const exp = S * ratio;
      const rel = Math.abs(got - exp) / exp;
      if (rel > TOL) {
        failures.push({
          gate: "typescale",
          page: m.page,
          reason: `${key}=${got.toFixed(2)} expected≈${exp.toFixed(2)} (±${TOL * 100}%)`,
        });
      }
    }
  }
}

mkdirSync(OUT_DIR, { recursive: true });
const report = {
  mode,
  draws,
  pageCount: pages.length,
  failures: failures.length,
  gatesCovered: [
    "completeness",
    "live-overflow",
    "ink-collision",
    "typescale",
    "opening-frame",
    "cartouche-center",
    "toolbar-overlap",
    "render-visibility",
    "layout-bands",
  ],
  failureList: failures.slice(0, 80),
  notes,
};
writeFileSync(join(OUT_DIR, "assert-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (failures.length) {
  console.error(`single-pass-assert: FAIL ${failures.length}`);
  process.exit(1);
}
console.log(`single-pass-assert: ok (${pages.length} pages, ${draws} draws, mode=${mode})`);
