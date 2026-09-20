/**
 * بوابة ثابتة: سلّم نقاط التوقّف موحّد ومستورَد (موجة ١).
 * تشغيل: node --import tsx src/lib/__tests__/responsive-breakpoints-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const css = read("src/styles/breakpoints.css");
const main = read("src/main.tsx");
const pkg = read("package.json");
const overflow = read("tests/responsive-overflow.spec.ts");
const sheet = read("src/styles/components/app-bottom-sheet.css");
const iosEdge = read("src/styles/ios-edge.css");

assert.match(css, /--bp-xs:\s*320px/);
assert.match(css, /--bp-android-sm:\s*360px/);
assert.match(css, /--bp-sm:\s*375px/);
assert.match(css, /--bp-md:\s*390px/);
assert.match(css, /--bp-lg:\s*430px/);
assert.match(css, /--bp-tablet:\s*768px/);
assert.match(css, /--bp-ipad-air:\s*834px/);
assert.match(css, /--bp-desktop:\s*1024px/);
assert.match(css, /--bp-laptop:\s*1280px/);
assert.match(css, /--bp-laptop-wide:\s*1366px/);
assert.match(css, /--bp-wide:\s*1440px/);
assert.match(css, /--bp-ultrawide:\s*1728px/);
assert.match(css, /100dvh/);
assert.match(css, /var\(--inset-/);
assert.match(css, /--touch-min:\s*44px/);
assert.match(css, /mushaf-root/);
assert.match(css, /--content-max/);
assert.match(css, /@media \(min-width:\s*834px\)/);
assert.match(css, /@media \(min-width:\s*1366px\)/);
assert.doesNotMatch(css, /env\(safe-area/);

assert.match(main, /breakpoints\.css/);
assert.doesNotMatch(css, /\b100vh\b/);

assert.match(pkg, /test:responsive-overflow/);
assert.match(pkg, /test:responsive-breakpoints-gate/);

/** مصفوفة القبول في Playwright */
for (const w of [320, 360, 390, 430, 768, 834, 1024, 1366]) {
  assert.match(overflow, new RegExp(`width:\\s*${w}`));
}
assert.match(overflow, /phone-landscape|844,\s*height:\s*390/);
assert.match(overflow, /\/quiz/);
assert.match(overflow, /\/adhkar/);
assert.match(overflow, /\/settings/);

/** شيتات آمنة في الأفق القصير + أسطح تكيّفية مؤجّلة */
assert.match(sheet, /max-height:\s*430px\)\s*and\s*\(orientation:\s*landscape\)/);
assert.match(iosEdge, /max-height:\s*430px\)\s*and\s*\(orientation:\s*landscape\)/);
assert.match(iosEdge, /Adaptive surfaces/);
assert.match(iosEdge, /overflow-wrap:\s*anywhere/);

console.log("responsive-breakpoints-gate.test.ts: ok");
