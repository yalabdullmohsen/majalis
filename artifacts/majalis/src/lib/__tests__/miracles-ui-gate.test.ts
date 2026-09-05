/**
 * بوابة — واجهة الإعجاز العلمي: بلا فلاتر مكدّسة، مشاركة مرة في نهاية القسم فقط.
 * Run: node --import tsx src/lib/__tests__/miracles-ui-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const page = read("src/views/MiraclesPage.tsx");
const fab = read("src/components/FloatingBackButton.tsx");
const share = read("src/components/ShareFaida.tsx");
const section = read("src/components/common/SectionShareActions.tsx");

assert.match(page, /mk-search-bar/);
assert.match(page, /ShareButtons/);
assert.match(page, /mk-card__footer/);
assert.match(page, /miracle-ayah/);
assert.match(page, /item\.verse/);
assert.match(page, /tafsir_summary/);
assert.match(page, /miracle-explain/);
assert.match(page, /miracle-detail/);
assert.match(page, /mk-chip/);
assert.match(page, /اقرأ التفصيل العلمي/);
assert.match(page, /مواد ذات صلة \(من نفس القسم\)/);
assert.doesNotMatch(page, /RelatedKnowledge/);
assert.doesNotMatch(page, /GeometricPattern/);
assert.doesNotMatch(page, /mk-cats-bar/);
assert.doesNotMatch(page, /FilterBottomSheet/);
assert.doesNotMatch(page, /ShareFaida/);
assert.doesNotMatch(page, /variant="icons"/);
assert.doesNotMatch(page, /twh-share/);

const css = read("src/styles/pages/miracles.css");
assert.match(css, /\.miracle-ayah__text/);
assert.match(css, /\.miracle-explain__label/);
assert.match(css, /\.mk-chip/);
assert.match(css, /inset-bottom/);
assert.doesNotMatch(css, /\.miracle-item__ref\s*\{/);
assert.doesNotMatch(css, /\.mk-cat--aldam/);

assert.doesNotMatch(fab, /if \(deepScroll\) return null/);
assert.doesNotMatch(fab, /ChevronUp/);
assert.match(fab, /بدون شرط تمرير/);

assert.match(share, /variant === "icons"/);
assert.match(share, /share-faida--icons/);
assert.match(section, /data-section-share-actions/);
assert.match(section, /ShareFaida/);

console.log("miracles-ui-gate: ok");
