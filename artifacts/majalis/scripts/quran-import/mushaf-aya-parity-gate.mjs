#!/usr/bin/env node
/**
 * بوابات انحدار مطابقة آية — مصدر الحقيقة docs/mushaf-ref/aya/
 * تشغيل: pnpm run test:mushaf-aya-parity
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG = join(__dirname, "../..");
const REPO = join(PKG, "../..");
const view = readFileSync(join(PKG, "src/pages/quran/ui/MushafPageView.tsx"), "utf8");
const pageV2 = readFileSync(join(PKG, "src/components/quran/MushafPageV2.tsx"), "utf8");
const layered = readFileSync(join(PKG, "src/features/mushaf/MushafLayeredPage.tsx"), "utf8");
const banner = readFileSync(join(PKG, "src/components/quran/QpcFontPackBanner.tsx"), "utf8");
const bands = readFileSync(join(PKG, "src/features/mushaf/layout-bands.ts"), "utf8");
const flip = readFileSync(join(PKG, "src/hooks/useMushafPageFlip.ts"), "utf8");
const css = readFileSync(join(PKG, "src/styles/quran.css"), "utf8");
const spec = readFileSync(join(PKG, "docs/MUSHAF_SPEC.md"), "utf8");
const refDir = join(REPO, "docs/mushaf-ref/aya");

const fails = [];

function check(cond, msg) {
  if (!cond) fails.push(msg);
}

// ١) مسار رسم واحد + --mushaf-scale
check(/--mushaf-scale/.test(view), "ـmushaf-scale في MushafPageView");
check(/mushafScale/.test(pageV2), "mushafScale في MushafPageV2");
check(/useUnicodeSafe\s*=\s*false/.test(pageV2), "لا مسار عثماني متدفق");
check(!/renderLightWord/.test(view), "renderLightWord محذوف من العرض");
check(/MushafTextLayer/.test(layered), "MushafTextLayer للبحث فقط");
check(/data-layer="visual"[\s\S]*qpc-v2/.test(layered), "طبقة بصرية QPC");

// ٢) شريط الخطوط في الشيت فقط
check(/variant="sheet"/.test(view), "QpcFontPackBanner في الشيت");
check(/variant\s*!==\s*"sheet"/.test(banner) || /variant !== "sheet"/.test(banner), "لا overlay علوي");
check(/qpc-font-pack--sheet/.test(readFileSync(join(PKG, "src/styles/components/qpc-font-pack-banner.css"), "utf8")), "CSS شيت");

// ٣) خرطوش فردي/زوجي
check(/data-page-parity/.test(view), "parity في العرض");
check(/data-page-parity="odd"/.test(css), "CSS فردي");
check(/data-page-parity="even"/.test(css), "CSS زوجي");

// ٤) نطاقات بلا تقاطع
check(/MUSHAF_AYA_BANDS_PCT/.test(bands), "ثوابت آية في layout-bands");
check(/assertMushafBandsDisjoint/.test(bands), "بوابة صفر تقاطع");
check(/contentFillMin:\s*79/.test(bands), "امتلاء ≥٧٩٪");

// ٥) قلب صفحة آية
check(/COMMIT_FRAC\s*=\s*0\.25/.test(flip), "عتبة ٢٥٪");
check(/VELOCITY_PX_MS\s*=\s*0\.5/.test(flip), "سرعة ٠٫٥");
check(/FLIP_EDGE_FRAC\s*=\s*0\.15/.test(flip), "حافة ١٥٪");
check(/SETTLE_MS\s*=\s*320/.test(flip), "settle 320ms");

// ٦) افتتاح
check(/OPENING_BANNER_TOP_PCT\s*=\s*20/.test(pageV2), "شارة افتتاح مرجع آية");

// ٧) مرجع + مواصفة
check(existsSync(refDir), "docs/mushaf-ref/aya موجود");
const refs = existsSync(refDir) ? readdirSync(refDir).filter((f) => f.endsWith(".png")) : [];
check(refs.length >= 5, `لقطات مرجع ≥5 (وجد ${refs.length})`);
check(/مرجع.*آية|آية/.test(spec), "MUSHAF_SPEC يذكر آية");
check(/فردي.*يمين|خرطوش.*فردي/.test(spec), "SPEC خرطوش فردي/زوجي");
check(!/خرطوش.*مركزي أفقياً في كل الصفحات/.test(spec), "SPEC بلا مركزية قديمة ملزمة");

if (fails.length) {
  console.error("mushaf-aya-parity-gate FAIL:\n- " + fails.join("\n- "));
  process.exit(1);
}
console.log("mushaf-aya-parity-gate: ok", { refs: refs.length });
