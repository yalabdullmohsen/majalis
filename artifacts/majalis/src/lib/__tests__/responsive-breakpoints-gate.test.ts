/**
 * بوابة ثابتة: سلّم نقاط التوقّف موحّد ومستورَد.
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

assert.match(css, /--bp-xs:\s*320px/);
assert.match(css, /--bp-sm:\s*375px/);
assert.match(css, /--bp-md:\s*390px/);
assert.match(css, /--bp-lg:\s*430px/);
assert.match(css, /--bp-tablet:\s*768px/);
assert.match(css, /--bp-desktop:\s*1024px/);
assert.match(css, /--bp-laptop:\s*1280px/);
assert.match(css, /--bp-wide:\s*1440px/);
assert.match(css, /--bp-ultrawide:\s*1728px/);
assert.match(css, /100dvh/);
assert.match(css, /safe-area-inset/);
assert.match(css, /--touch-min:\s*44px/);
assert.match(css, /mushaf-root/);
assert.match(css, /--content-max/);

assert.match(main, /breakpoints\.css/);
assert.doesNotMatch(css, /\b100vh\b/);

assert.match(pkg, /test:responsive-overflow/);
assert.match(pkg, /test:responsive-breakpoints-gate/);

console.log("responsive-breakpoints-gate.test.ts: ok");
