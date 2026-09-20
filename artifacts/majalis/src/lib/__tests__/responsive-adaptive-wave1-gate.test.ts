/**
 * بوابة موجة ١ — تجاوب تكيّفي (Layout / Safe Area / Typography surfaces).
 * تشغيل: node --import tsx src/lib/__tests__/responsive-adaptive-wave1-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const bp = read("src/styles/breakpoints.css");
const sheet = read("src/styles/components/app-bottom-sheet.css");
const ios = read("src/styles/ios-edge.css");
const overflow = read("tests/responsive-overflow.spec.ts");
const hub = read("src/styles/components/hub-card.css");

assert.match(bp, /--bp-ipad-air:\s*834px/);
assert.match(bp, /--bp-laptop-wide:\s*1366px/);
assert.match(bp, /--bp-android-sm:\s*360px/);
assert.match(bp, /@media \(min-width:\s*834px\)/);
assert.match(bp, /@media \(min-width:\s*1366px\)/);
assert.match(bp, /orientation:\s*landscape/);

assert.match(ios, /Adaptive surfaces/);
assert.match(ios, /\.hub-card[\s\S]{0,200}min-width:\s*0/);
assert.match(ios, /\.hub-card__title[\s\S]{0,400}overflow-wrap:\s*anywhere/);

assert.match(hub, /min-width:\s*0/);
assert.match(hub, /overflow-wrap:\s*anywhere/);

assert.match(sheet, /orientation:\s*landscape/);
assert.match(sheet, /inset-bottom/);
assert.match(ios, /orientation:\s*landscape/);
assert.match(ios, /keyboard-inset/);

assert.match(overflow, /iphone-se-320/);
assert.match(overflow, /ipad-air-834/);
assert.match(overflow, /laptop-1366/);
assert.match(overflow, /phone-landscape-844x390/);
assert.match(overflow, /\/quiz/);
assert.match(overflow, /assertNoDocOverflow/);

/** لا مكتبات تجاوب جديدة */
assert.doesNotMatch(read("package.json"), /react-responsive|@container-query/);

console.log("responsive-adaptive-wave1-gate.test.ts: ok");
