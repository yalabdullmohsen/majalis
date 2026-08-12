#!/usr/bin/env node
/**
 * فحوص بوابات المصحف على JSON تمريرة واحدة — بلا متصفح.
 * النموذج البسيط: flow grid · ثابت S · بلا خرطوش/إطار · أرقام عربية · صفر تقاطع حبر/شارة.
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
const BASELINE = JSON.parse(
  readFileSync(join(ROOT, "src/features/mushaf/mushaf-baseline.json"), "utf8"),
);

const RATIOS = {
  body: 1,
  surahBanner: 0.78,
  pageNumeral: 0.46,
  headerMeta: 0.42,
  footerHizb: 0.4,
};
const TOL = 0.03;

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

/* ——— فحوص ثابتة ——— */
const pageV2 = readFileSync(join(ROOT, "src/components/quran/MushafPageV2.tsx"), "utf8");
const dataSrc = readFileSync(join(ROOT, "src/lib/mushaf-v2-data.ts"), "utf8");
const typeSrc = readFileSync(join(ROOT, "src/features/mushaf/typescale.ts"), "utf8");
const viewSrc = readFileSync(join(ROOT, "src/pages/quran/ui/MushafPageView.tsx"), "utf8");
const css = readFileSync(join(ROOT, "src/styles/quran.css"), "utf8");
const mushafCss = readFileSync(join(ROOT, "src/styles/mushaf-v2.css"), "utf8");
const bannerSrc = readFileSync(join(ROOT, "src/components/quran/SurahBanner.tsx"), "utf8");
const GRID = JSON.parse(
  readFileSync(join(ROOT, "src/features/mushaf/mushaf-grid.json"), "utf8"),
);

if (existsSync(join(ROOT, "src/components/quran/OpeningPageFrame.tsx"))) {
  failures.push({ gate: "opening-frame", page: 0, reason: "OpeningPageFrame.tsx لا يزال موجودًا" });
}
if (/OpeningPageFrame|data-opening-frame|OPENING_FRAME_TOP|OPENING_BANNER_TOP_PCT/.test(pageV2)) {
  failures.push({ gate: "opening-frame", page: 0, reason: "مراجع إطار/شارة افتتاح قديمة في MushafPageV2" });
}
if (!/data-mushaf-grid="flow"/.test(pageV2)) {
  failures.push({ gate: "flow-grid", page: 0, reason: "بلا data-mushaf-grid=flow" });
}
if (!/data-board="1000x1618"/.test(pageV2)) {
  failures.push({ gate: "flow-grid", page: 0, reason: "بلا data-board=1000x1618" });
}
if (!/grid-template-rows:\s*repeat\(15/.test(mushafCss)) {
  failures.push({ gate: "flow-grid", page: 0, reason: "CSS بلا repeat(15)" });
}
const slotStyleBlock = pageV2.match(/const slotStyle[\s\S]*?return \{[\s\S]*?\};/)?.[0] || "";
if (/position:\s*["']absolute["']/.test(slotStyleBlock)) {
  failures.push({ gate: "flow-grid", page: 0, reason: "slotStyle absolute" });
}
if (!/MUSHAF_LAYOUT_BASELINE\.fontSizePx/.test(pageV2)) {
  failures.push({ gate: "fixed-S", page: 0, reason: "بلا fontSizePx من baseline" });
}
if (!/data-ornament="none"/.test(bannerSrc)) {
  failures.push({ gate: "minimal-banner", page: 0, reason: "SurahBanner بلا ornament=none" });
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
if (/data-page-parity/.test(viewSrc)) {
  failures.push({ gate: "page-numeral", page: 0, reason: "data-page-parity ما زال موجودًا" });
}
if (!/data-page-chrome="minimal"/.test(viewSrc)) {
  failures.push({ gate: "page-numeral", page: 0, reason: "data-page-chrome=minimal مفقود" });
}
if (!/data-page-numeral="arabic"/.test(viewSrc)) {
  failures.push({ gate: "page-numeral", page: 0, reason: "data-page-numeral=arabic مفقود" });
}
if (!/left:\s*50%/.test(css) || !/translateX\(-50%\)/.test(css)) {
  failures.push({ gate: "page-numeral", page: 0, reason: "CSS توسيط رقم الصفحة ناقص" });
}
const ayahTb = css.match(/\.mpv-toolbar\.mpv-toolbar--ayah\s*\{[^}]*\}/);
if (!ayahTb || !/bottom:\s*calc\(\s*var\(--inset-bottom/.test(ayahTb[0])) {
  failures.push({ gate: "toolbar-overlap", page: 0, reason: "CSS: شريط آية بلا bottom فوق inset-bottom" });
}
if (ayahTb && /top:\s*calc\(\s*var\(--inset-top\)/.test(ayahTb[0])) {
  failures.push({ gate: "toolbar-overlap", page: 0, reason: "CSS: شريط آية ما زال top تحت الرأس" });
}
if (!/--mpv-toolbar-band:\s*52px/.test(css) || !/--mpv-footer-band:\s*46px/.test(css)) {
  failures.push({ gate: "layout-bands", page: 0, reason: "CSS vars للنطاقات ناقصة" });
}
if (!/--mpv-content-footer-gap:\s*28px/.test(css)) {
  failures.push({ gate: "layout-bands", page: 0, reason: "--mpv-content-footer-gap يجب أن يكون 28px" });
}
if (!existsSync(join(ROOT, "src/features/mushaf/layout-bands.ts"))) {
  failures.push({ gate: "layout-bands", page: 0, reason: "layout-bands.ts مفقود" });
}
if (GRID.referencePage !== 283) {
  failures.push({ gate: "layout-bands", page: 0, reason: `grid referencePage=${GRID.referencePage}` });
}

/* بيانات ثابتة لتصادم البسملة (كل ٦٠٤) */
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

  if (m.inkOverlaps?.length) {
    failures.push({
      gate: "ink-collision",
      page: n,
      reason: `تقاطع حبر: ${m.inkOverlaps.map((o) => `${o.a}×${o.b}`).join(", ")}`,
    });
  }
  if ((n === 1 || n === 2) && m.opening?.hasFrame) {
    failures.push({ gate: "opening-frame", page: n, reason: "إطار زخرفي في صفحة افتتاح" });
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
    } else if (m.basmalaGap < 2) {
      failures.push({
        gate: "ink-collision",
        page: n,
        reason: `فاصل بسملة/شارة ${m.basmalaGap.toFixed(1)}px < 2`,
      });
    }
  }

  /* رقم صفحة بسيط — لا يشترط خرطوش SVG */
  if (m.cartouche || m.pageNumeral) {
    const c = m.cartouche || m.pageNumeral;
    const dx = c.centerDx;
    const gapFoot = c.gapToCart ?? c.gapToFooter;
    const gapTb = c.gapToToolbar;
    const ok =
      (dx == null || dx <= 2.05) &&
      (gapFoot == null || gapFoot >= 7.5) &&
      (gapTb == null || gapTb >= 7.5);
    if (!ok) {
      failures.push({
        gate: "page-numeral",
        page: n,
        reason: `dx=${dx?.toFixed?.(1)} gapFoot=${gapFoot?.toFixed?.(1)} gapTb=${gapTb?.toFixed?.(1)}`,
      });
    }
  }

  if (m.gridMode != null && m.gridMode !== "flow") {
    failures.push({ gate: "flow-grid", page: n, reason: `grid=${m.gridMode}` });
  }
  if (m.absSlots != null && m.absSlots > 0) {
    failures.push({ gate: "flow-grid", page: n, reason: `${m.absSlots} absolute slots` });
  }
  if (m.ornament != null && m.ornament !== "none") {
    failures.push({ gate: "minimal-banner", page: n, reason: `ornament=${m.ornament}` });
  }
  if (m.typescale?.S > 0) {
    const rel = Math.abs(m.typescale.S - BASELINE.fontSizePx) / BASELINE.fontSizePx;
    if (rel > 0.05) {
      failures.push({
        gate: "fixed-S",
        page: n,
        reason: `S=${m.typescale.S.toFixed(2)} ≠ ${BASELINE.fontSizePx}`,
      });
    }
  }

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

  {
    const r = m.render || {};
    if (!r.lineCount || !r.nonEmptyLines || !r.inViewport) {
      failures.push({
        gate: "render-visibility",
        page: n,
        reason: `lines=${r.lineCount} nonEmpty=${r.nonEmptyLines} inView=${r.inViewport} pos=${r.position}`,
      });
    }
  }

  {
    const o = m.layoutOverlaps || {};
    for (const [k, v] of Object.entries(o)) {
      if (v && v.ox > 0.5 && v.oy > 0.5 && v.area > 1) {
        if (k === "toolbarLines") continue;
        failures.push({
          gate: "layout-bands",
          page: n,
          reason: `تقاطع ${k} ox=${v.ox?.toFixed?.(1)} oy=${v.oy?.toFixed?.(1)}`,
        });
      }
    }
    if (n > 2 && m.gapContentFooter != null && m.gapContentFooter < 7) {
      failures.push({
        gate: "layout-bands",
        page: n,
        reason: `فاصل content→footer ${m.gapContentFooter.toFixed(1)}px < 7`,
      });
    }
  }

  if (n === 1 || n === 2) {
    const o = m.opening || {};
    if (o.hasFrame) {
      failures.push({ gate: "opening-frame", page: n, reason: "إطار زخرفي ما زال مرسومًا" });
    }
    if ((o.stretched ?? m.stretched) > 0) {
      failures.push({
        gate: "opening-frame",
        page: n,
        reason: `${o.stretched ?? m.stretched} سطرًا بملاءمة عرض — ممنوع في ص١–٢`,
      });
    }
    if (m.lineGapMin != null && m.lineGapMin < -0.5) {
      failures.push({
        gate: "opening-frame",
        page: n,
        reason: `تراكب حبر أسطر (فجوة دنيا ${m.lineGapMin.toFixed(1)}px)`,
      });
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
  model: "minimal-flow",
  gatesCovered: [
    "completeness",
    "live-overflow",
    "ink-collision",
    "typescale",
    "opening-frame",
    "page-numeral",
    "flow-grid",
    "fixed-S",
    "minimal-banner",
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
