/**
 * Reference Rebuild PR-1 — ورق عاجي مسطّح + tokens بلا تدرج صفحة.
 * node --import tsx src/lib/__tests__/mushaf-reference-rebuild-pr1-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  mushafInk,
  mushafPaperReadingSurface,
  mushafPaperWarmYellow,
} from "../../features/mushaf-reader/mushaf-warm-yellow-tokens";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const css = readFileSync(resolve(root, "src/features/mushaf-reader/mushaf-reader.css"), "utf8");

assert.equal(mushafPaperWarmYellow.toLowerCase(), "#fffcf7");
assert.equal(mushafPaperReadingSurface.toLowerCase(), "#fffcf7");
assert.equal(mushafInk.toLowerCase(), "#0e0c0c");
assert.match(css, /--mushaf-paper-warm-yellow:\s*#fffcf7/i);
assert.match(css, /--mushaf-ink:\s*#0e0c0c/i);

/** سطح .nm-root مسطّح — لا radial/linear على خلفية الجذر */
const nmRootBlock = css.match(/\.nm-root\s*\{[\s\S]*?\n\}/);
assert.ok(nmRootBlock, ".nm-root block");
assert.match(nmRootBlock[0], /background:\s*var\(--nm-paper\)/);
assert.doesNotMatch(
  nmRootBlock[0],
  /background:\s*[\s\S]*radial-gradient[\s\S]*linear-gradient/,
);
assert.doesNotMatch(css, /--mushaf-paper-warm-yellow:\s*#fcf6e3/i);
assert.doesNotMatch(css, /--mushaf-paper-warm-yellow:\s*#ffffff\b/i);

/** لا مساس بأبعاد العلامة ولا حجم الخط */
assert.match(css, /--mushaf-ayah-mark-size:\s*1\.15em/);
assert.match(css, /--mushaf-font-size:\s*24px/);
assert.match(css, /--mushaf-line-height:\s*1\.85/);

console.log("mushaf-reference-rebuild-pr1-gate.test.ts: ok");
