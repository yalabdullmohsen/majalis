/**
 * اختبار اشتقاق نطاقات المصحف نسبيًا من ارتفاع الشاشة.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-multi-viewport-bands.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MUSHAF_LAYOUT_BANDS,
  MUSHAF_LAYOUT_REF_VIEWPORT_H,
  scaleMushafLayoutBands,
  mushafBottomReservePx,
} from "@/features/mushaf/layout-bands";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");

assert.equal(MUSHAF_LAYOUT_REF_VIEWPORT_H, 844);

{
  const ref = scaleMushafLayoutBands(844);
  assert.equal(ref.toolbarBandPx, MUSHAF_LAYOUT_BANDS.toolbarBandPx);
  assert.equal(ref.footerBandPx, MUSHAF_LAYOUT_BANDS.footerBandPx);
}

{
  const se = scaleMushafLayoutBands(667);
  assert.ok(se.toolbarBandPx >= 44, "شريط SE ≥٤٤px للمس");
  assert.ok(se.toolbarBandPx <= MUSHAF_LAYOUT_BANDS.toolbarBandPx);
  assert.ok(se.contentFooterGapPx < MUSHAF_LAYOUT_BANDS.contentFooterGapPx);
  assert.ok(
    mushafBottomReservePx(se) < mushafBottomReservePx(MUSHAF_LAYOUT_BANDS),
    "حجز سفلي أصغر على الشاشة القصيرة يوسّع contentBand",
  );
}

{
  const max = scaleMushafLayoutBands(932);
  assert.equal(max.toolbarBandPx, MUSHAF_LAYOUT_BANDS.toolbarBandPx, "لا تكبير بلا داعٍ فوق المرجع");
}

{
  const ipad = scaleMushafLayoutBands(1133);
  assert.equal(ipad.footerBandPx, MUSHAF_LAYOUT_BANDS.footerBandPx);
}

const pageV2 = readFileSync(resolve(root, "src/components/quran/MushafPageV2.tsx"), "utf8");
assert.match(pageV2, /scaleMushafLayoutBands/);
assert.match(pageV2, /applyMushafLayoutBandCssVars/);
assert.match(pageV2, /availableWidth \/ 358/);

const vp = readFileSync(
  resolve(root, "scripts/quran-import/mushaf-viewports.mjs"),
  "utf8",
);
assert.match(vp, /375/);
assert.match(vp, /390/);
assert.match(vp, /430/);
assert.match(vp, /744/);

const measure = readFileSync(
  resolve(root, "scripts/quran-import/mushaf-single-pass-measure.mjs"),
  "utf8",
);
assert.match(measure, /resolveGateViewport/);

console.log("mushaf-multi-viewport-bands.test.ts: ok");
