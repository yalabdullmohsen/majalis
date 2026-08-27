/**
 * بوابة صفحة حلقات القرآن — فلاتر حضور + رجوع دائم + شريط لاصق.
 * تشغيل: node --import tsx src/lib/__tests__/quran-circles-ui-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const view = read("src/pages/quran/ui/QuranCirclesView.tsx");
const css = read("src/styles/pages/quran-circles.css");
const fab = read("src/components/FloatingBackButton.tsx");
const chip = read("src/components/filters/FilterChip.tsx");

assert.match(view, /SegmentedFilter/);
assert.match(view, /نوع الحضور/);
assert.match(view, /حضوري/);
assert.match(view, /عن بُعد/);
assert.match(view, /لا توجد حلقات مطابقة لهذا الفلتر حاليًا/);
assert.match(view, /qc-hub-nav/);
assert.match(view, /aria-current="page"/);

assert.match(css, /position:\s*sticky/);
assert.match(css, /var\(--inset-bottom/);
assert.match(css, /padding:[\s\S]*96px/);
assert.match(css, /\.qc-hub-nav__chip\.is-active/);

assert.match(fab, /بدون شرط تمرير/);
assert.doesNotMatch(fab, /deepScroll/);

assert.match(chip, /aria-pressed=\{active\}/);
assert.match(chip, /mj-filter-chip__mark/);

console.log("quran-circles-ui-gate.test.ts: ok");
