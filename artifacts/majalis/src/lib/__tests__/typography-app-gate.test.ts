/**
 * بوابة طباعة الواجهة — المصحف/QPC بلا تغيير.
 * node --import tsx src/lib/__tests__/typography-app-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const main = readFileSync(join(root, "main.tsx"), "utf8");
const typoApp = readFileSync(join(root, "styles/typography-app.css"), "utf8");
const mushaf = readFileSync(join(root, "features/mushaf-madinah/mushaf-madinah.css"), "utf8");
const theme = readFileSync(join(root, "app/styles/theme.css"), "utf8");

assert.match(main, /typography-app\.css/);
assert.match(typoApp, /--font-heading/);
assert.match(typoApp, /--font-app/);
assert.match(typoApp, /Amiri/);
assert.match(typoApp, /--type-card-title/);
assert.match(typoApp, /line-clamp: 2/);
assert.match(typoApp, /--text-on-dark-primary/);
assert.doesNotMatch(typoApp, /Noto Naskh Arabic/);
assert.doesNotMatch(typoApp, /--mm-qpc|qpc-v2/);

assert.match(theme, /--font-app: "Amiri"/);
assert.match(theme, /--mj-face: var\(--font-app\)/);
assert.match(mushaf, /--mm-qpc-size/);
assert.match(mushaf, /qpc-v2-p1/);
assert.doesNotMatch(mushaf, /--font-heading/);

console.log("typography-app-gate.test.ts: ok");
