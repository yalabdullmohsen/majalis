/**
 * SUNNAH VISUAL IDENTITY RESET — PR-2 gate
 * Global header · search icon · daily ticker home-only
 * Run: node --import tsx src/lib/__tests__/sunnah-identity-reset-pr2-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isHomeChromePath,
  isTickerQuietPath,
  shouldShowHeaderSearchRow,
  shouldShowHeaderTicker,
} from "../ticker-quiet-paths.ts";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repoRoot = resolve(majalisRoot, "../..");
const read = (rel: string) => readFileSync(resolve(majalisRoot, rel), "utf8");

console.log("=== path helpers ===");
assert.equal(isHomeChromePath("/"), true);
assert.equal(isHomeChromePath("/quran-hub"), false);
assert.equal(isTickerQuietPath("/"), false);
assert.equal(isTickerQuietPath("/hadith"), true);
assert.equal(shouldShowHeaderTicker("/"), true);
assert.equal(shouldShowHeaderTicker("/lessons"), false);
assert.equal(shouldShowHeaderSearchRow("/"), false);
assert.equal(shouldShowHeaderSearchRow("/search"), false);

console.log("=== NavBar wiring ===");
{
  const nav = read("src/components/NavBar.tsx");
  assert.match(nav, /shouldShowHeaderTicker/);
  assert.match(nav, /shouldShowHeaderSearchRow/);
  assert.match(nav, /navbar-search-toggle/);
  assert.match(nav, /showHeaderTicker/);
  assert.match(nav, /useStackedChrome/);
  // لا صف بحث كامل افتراضيًا على كل المسارات
  assert.match(nav, /showFullSearchRow && useStackedChrome/);
}

console.log("=== App chrome + data-home-chrome ===");
{
  const app = read("src/App.tsx");
  assert.match(app, /data\.homeChrome|dataset\.homeChrome/);
  assert.match(app, /ChromeNavFallback homeChrome/);
  assert.match(app, /isHomeChromePath/);
  assert.doesNotMatch(
    app,
    /ChromeNavFallback[\s\S]{0,400}navbar-v3__search-row/,
    "fallback بلا صف بحث كامل",
  );
}

console.log("=== CSS heights ===");
{
  const critical = read("src/styles/critical-first-paint.css");
  assert.match(critical, /--search-height:\s*0px/);
  assert.match(critical, /data-home-chrome="0"/);
  assert.match(critical, /--ticker-row-h:\s*0px/);
  assert.match(critical, /html\[data-home-chrome="0"\]/);

  const html = read("index.html");
  const htmlOpen = html.slice(html.indexOf("<html"), html.indexOf(">") + 1);
  assert.doesNotMatch(
    htmlOpen,
    /data-home-chrome/,
    "لا data-home-chrome على وسم html الثابت — يحافظ على علامة جاهزية LHCI ضمن 800 بايت",
  );
  assert.ok(html.indexOf("majalis") < 800, "علامة majalis ضمن أول 800 بايت لجاهزية المعاينة");

  const top = read("src/styles/components/top-chrome-layout.css");
  assert.match(top, /navbar-search-toggle[\s\S]{0,80}inline-flex/);
  assert.match(top, /Identity Reset PR-2/);
  assert.doesNotMatch(
    top.replace(/\/\*[\s\S]*?\*\//g, ""),
    /\.navbar-theme-toggle\.navbar-search-toggle\s*\{\s*display:\s*none/,
  );

  const finalCss = read("src/styles/final-release.css");
  assert.match(finalCss, /navbar-search-toggle\{display:inline-flex!important\}/);

  const ir = read("src/styles/sunnah-identity-reset.css");
  assert.match(ir, /PR-2 chrome: top-chrome-layout/);
}

console.log("=== docs + package ===");
{
  const doc = readFileSync(resolve(repoRoot, "docs/design/SUNNAH_VISUAL_IDENTITY_RESET.md"), "utf8");
  assert.match(doc, /PR-2/);
  assert.match(doc, /header|Header|تيكّر|بحث/i);
  const pkg = read("package.json");
  assert.match(pkg, /test:sunnah-identity-reset-pr2/);
}

console.log("sunnah-identity-reset-pr2-gate.test.ts: ok");
