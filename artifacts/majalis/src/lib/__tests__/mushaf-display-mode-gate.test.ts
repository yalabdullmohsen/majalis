/**
 * بوابة: وضع عرض المصحف SYSTEM / LIGHT / DARK في إعدادات المصحف فقط.
 * node --import tsx src/lib/__tests__/mushaf-display-mode-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyMushafAppearanceMode,
  loadMushafAppearanceMode,
  parseMushafAppearanceMode,
  resolveMushafAppearance,
  saveMushafAppearanceMode,
  MUSHAF_DISPLAY_MODE_OPTIONS,
} from "@/lib/mushaf-v2/appearance-prefs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.deepEqual(
  MUSHAF_DISPLAY_MODE_OPTIONS.map((o) => o.id),
  ["SYSTEM", "LIGHT", "DARK"],
);
assert.equal(parseMushafAppearanceMode("system"), "SYSTEM");
assert.equal(parseMushafAppearanceMode("night"), "DARK");
assert.equal(parseMushafAppearanceMode("paper"), "LIGHT");
assert.equal(parseMushafAppearanceMode("auto"), "SYSTEM");

const mem = new Map<string, string>();
const ls = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => {
    mem.set(k, v);
  },
  removeItem: (k: string) => {
    mem.delete(k);
  },
};
(globalThis as { localStorage?: typeof ls }).localStorage = ls;

saveMushafAppearanceMode("LIGHT");
assert.equal(mem.get("ssunnah-mushaf-appearance-v1"), "LIGHT");
assert.equal(loadMushafAppearanceMode(), "LIGHT");
assert.equal(resolveMushafAppearance("DARK"), "night");
assert.equal(resolveMushafAppearance("LIGHT"), "light");

const prefs = read("src/lib/mushaf-v2/appearance-prefs.ts");
assert.match(prefs, /"SYSTEM" \| "LIGHT" \| "DARK"/);
assert.match(prefs, /MUSHAF_APPEARANCE_CHANGE_EVENT/);
assert.match(prefs, /data-mushaf-appearance/);

const control = read("src/features/mushaf-reader/MushafDisplayModeControl.tsx");
assert.match(control, /وضع عرض المصحف/);
assert.match(control, /mushaf-display-mode/);
assert.match(control, /onPointerDown=\{ \(e\) => e\.stopPropagation\(\) \}|onPointerDown=\{\(e\) => e\.stopPropagation\(\)\}/);
assert.doesNotMatch(control, /<select|<option/);

const cardCss = read("src/features/mushaf-reader/mushaf-display-mode-control.css");
assert.match(cardCss, /\.mushaf-display-mode__card\s*\{[\s\S]*?pointer-events:\s*auto/);
assert.match(cardCss, /width:\s*100%/);

const sheet = read("src/features/mushaf-madinah/MushafSettingsSheet.tsx");
assert.match(sheet, /MushafDisplayModeControl/);
assert.doesNotMatch(sheet, /\["auto", "تلقائي"\]/);

const settings = read("src/pages/account/ui/SettingsView.tsx");
assert.match(settings, /MushafDisplayModeControl/);
assert.match(settings, /يؤثر على المصحف فقط/);

const more = read("src/features/mushaf-reader/MushafControlsLayer.tsx");
assert.match(more, /MushafDisplayModeControl/);
assert.match(more, /إعدادات المصحف/);

const css = read("src/features/mushaf-reader/mushaf-reader.css");
assert.match(css, /html\[data-mushaf-appearance="night"\] \.nm-root/);
assert.match(css, /html\[data-mushaf-appearance="light"\] \.nm-root/);
assert.match(css, /--mm-paper:\s*var\(--mushaf-paper/);
assert.match(css, /\.nm-controls-more\s*\{[\s\S]*?pointer-events:\s*auto/);
assert.match(css, /\.nm-controls-more \.mushaf-display-mode__card\s*\{[\s\S]*?pointer-events:\s*auto/);
assert.doesNotMatch(
  css,
  /html\[data-mushaf-appearance="night"\] \.nm-root,\s*\.nm-root\[data-mushaf-appearance="night"\],\s*html\[data-theme="dark"\] \.nm-root,\s*html\.dark \.nm-root \{/,
);

const madinah = read("src/features/mushaf-madinah/mushaf-madinah.css");
assert.match(madinah, /html\[data-mushaf-appearance="night"\] \.mm-viewport/);
assert.match(madinah, /html\[data-mushaf-appearance="light"\] \.mm-viewport/);
assert.doesNotMatch(
  madinah,
  /html\[data-theme="dark"\] \.mm-viewport,\s*html\.dark \.mm-viewport/,
);

const reader = read("src/features/mushaf-reader/NewMushafReader.tsx");
assert.match(reader, /ssunnah:mushaf-appearance-change/);
assert.match(reader, /"SYSTEM"/);
assert.match(reader, /data-mushaf-appearance=\{mushafAppearanceResolved\}/);
assert.match(reader, /setMushafAppearanceResolved/);
assert.doesNotMatch(reader, /key=\{[^}]*appearance|key=\{[^}]*displayMode/);

assert.ok(existsSync(resolve(root, "src/features/mushaf-reader/mushaf-display-mode-control.css")));

void applyMushafAppearanceMode;

console.log("mushaf-display-mode-gate.test.ts: ok");
