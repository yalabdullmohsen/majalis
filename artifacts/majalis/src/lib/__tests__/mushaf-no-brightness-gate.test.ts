/**
 * صفر استدعاء لسطوع الشاشة، وصفر طمس على شيت الآية.
 * تشغيل: node --import tsx src/lib/__tests__/mushaf-no-brightness-gate.test.ts
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

function rg(pattern: string, dir: string): string {
  if (!existsSync(dir)) return "";
  try {
    return execFileSync(
      "rg",
      ["-n", "--glob", "!**/__tests__/**", "--glob", "!**/*.{test,spec}.*", pattern, dir],
      { encoding: "utf8" },
    );
  } catch (err) {
    const e = err as { status?: number; stdout?: string };
    if (e.status === 1) return "";
    throw err;
  }
}

const srcDir = resolve(root, "src");
const iosDir = resolve(root, "ios");
const brightnessHits = [
  rg("ScreenBrightness", srcDir),
  rg("setBrightness", srcDir),
  rg("ScreenBrightness", iosDir),
  rg("setBrightness", iosDir),
].join("");
assert.equal(brightnessHits.trim(), "", `استدعاء سطوع شاشة محظور:\n${brightnessHits}`);

const css = read("src/features/mushaf-madinah/mushaf-madinah.css");
const actions = read("src/features/mushaf-madinah/AyahActionSheet.tsx");
const sheetCss = read("src/styles/components/app-bottom-sheet.css");

assert.doesNotMatch(css, /backdrop-filter:\s*blur\(/);
assert.doesNotMatch(sheetCss, /backdrop-filter:\s*blur\(/);
assert.doesNotMatch(css, /filter:\s*brightness/);
assert.doesNotMatch(actions, /setBrightness|ScreenBrightness/);
assert.match(css, /\.mm-ayah-bar__dismiss\s*\{[^}]*background:\s*rgba\(0,\s*0,\s*0,\s*0\.40\)/);
assert.doesNotMatch(css, /rgba\(0,\s*0,\s*0,\s*0\.(4[1-9]|[5-9]\d|72)\)/);
assert.match(css, /\.ayah-sheet\s*\{[^}]*z-index:\s*50/);
assert.match(css, /\.ayah-sheet__scrim\s*\{[^}]*z-index:\s*49/);

console.log("mushaf-no-brightness-gate.test.ts: ok");
