/**
 * بوابة: مظهر المصحف يزامن Status Bar (ورقي=أيقونات داكنة / ليلي=فاتحة).
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-status-bar-sync-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const prefs = read("src/lib/mushaf-v2/appearance-prefs.ts");
const chrome = read("src/lib/apply-page-chrome.ts");
const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
const pageChrome = read("src/lib/page-chrome.ts");

assert.match(prefs, /applyMushafThemeChrome/);
assert.match(prefs, /resolveMushafAppearance/);
assert.match(prefs, /saveMushafAppearanceMode[\s\S]*applyMushafAppearanceMode/);
assert.match(chrome, /apple-mobile-web-app-status-bar-style/);
assert.match(chrome, /iconStyle === "dark" \? "default" : "black-translucent"/);
assert.match(reader, /prefers-color-scheme/);
assert.match(reader, /applyMushafAppearanceMode\(appearance\)/);
assert.match(pageChrome, /statusBarStyle:\s*"dark"/);
assert.match(pageChrome, /resolveMushafThemeChrome[\s\S]*night[\s\S]*statusBarStyle:\s*"light"/);

console.log("mushaf-status-bar-sync-gate.test.ts: ok");
