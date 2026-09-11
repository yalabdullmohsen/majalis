/**
 * بوابة: هيروات أقسام المحتوى (صيام/صحابة/علامات/آداب/خريطة/معجم) = soft-card لا شريط أخضر ممتد.
 * node --import tsx src/lib/__tests__/soft-section-heroes-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const shell = read("src/styles/components/modern-section-shell.css");
for (const hero of [".sw-hero", ".sb-hero", ".as-hero", ".atl-hero", ".sm-hero", ".gl-hero"]) {
  assert.match(shell, new RegExp(hero.replace(".", "\\.")), `modern-section-shell يشمل ${hero}`);
}
assert.match(shell, /--mss-section-hero-bg/, "سطح soft-hero مفعّل");
assert.match(
  shell,
  /\.sw-hero[\s\S]{0,400}?background-image:\s*none\s*!important/,
  "هيرو الصيام بلا تدرّج خلفية ممتد",
);
assert.match(
  shell,
  /\.sw-hero\s+\.sw-hero__title[\s\S]{0,500}?--mss-on-hero/,
  "عنوان soft-hero بحبر ثابت",
);

const dark = read("src/styles/dark-mode-surfaces.css");
assert.doesNotMatch(
  dark,
  /:where\([^)]*\.sw-hero[^)]*\)\s*\{[^}]*color:\s*var\(--on-dark/,
  "الوضع الداكن لا يفرض نصًا أبيض على .sw-hero soft",
);

for (const [file, banned] of [
  ["src/styles/pages/sawm.css", /\.sw-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/sahabah.css", /\.sb-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/alamat-saah.css", /\.as-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/adab-talab-ilm.css", /\.atl-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/sitemap.css", /\.sm-hero\s*\{[^}]*linear-gradient/s],
] as const) {
  const css = read(file);
  assert.doesNotMatch(css, banned, `${file}: لا تدرّج أخضر على جذر الهيرو`);
}

console.log("soft-section-heroes-gate.test.ts: ok");
