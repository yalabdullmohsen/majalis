/**
 * بوابة: هيدر الجوال بلا فراغ علوي زائد + إعلان مدمج + skip-link مخفي.
 * node --import tsx src/lib/__tests__/mobile-header-gap-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const finalCss = read("src/styles/final-release.css");
const critical = read("src/styles/critical-first-paint.css");
const theme = read("src/app/styles/theme.css");
const adCss = read("src/styles/components/header-ad-slot.css");
const topChrome = read("src/styles/components/top-chrome-layout.css");
const nav = read("src/components/NavBar.tsx");

assert.match(
  finalCss,
  /\.navbar-v3\s*\{[^}]*padding-block-start:\s*max\(\s*var\(--inset-top\),\s*12px\s*\)/s,
);
assert.match(finalCss, /\.navbar-v3\s*\{[^}]*min-height:\s*0/s);
assert.doesNotMatch(
  finalCss.replace(/\/\*[\s\S]*?\*\//g, ""),
  /\.navbar-v3\s*\{[^}]*min-height:\s*var\(--header-h\)/s,
);

assert.match(critical, /\.skip-link/);
assert.match(critical, /padding-block-start:\s*max\(\s*var\(--inset-top,\s*0px\),\s*12px\s*\)/);
assert.match(critical, /\.app-top-chrome\s*\{[^}]*min-height:\s*0/s);
assert.match(critical, /--ad-banner-height:\s*0px/);

assert.match(theme, /:focus-visible[\s\S]*?clip:\s*auto/);
assert.match(theme, /--ad-banner-height:\s*0px/);
assert.doesNotMatch(
  theme.replace(/\/\*[\s\S]*?\*\//g, ""),
  /\.skip-link\.mj-skip-link:focus\s*,/,
);

assert.match(adCss, /border-radius:\s*999px/);
assert.match(adCss, /flex:\s*1\s+1\s+auto/);
assert.match(adCss, /\.navbar-v3__ad-row[\s\S]*?display:\s*none/);
assert.doesNotMatch(adCss, /padding:\s*12px\s+0\s+14px/);

assert.match(topChrome, /max-height:\s*56px/);
assert.match(topChrome, /gap:\s*8px/);
assert.match(nav, /header-ad-slot\.css/);
assert.doesNotMatch(nav, /navbar-v3__ad-row/);
assert.match(nav, /shouldShowHeaderAd\(location\)\s*\?\s*\(\s*<HeaderAdSlot/);

console.log("mobile-header-gap-gate.test.ts: ok");
