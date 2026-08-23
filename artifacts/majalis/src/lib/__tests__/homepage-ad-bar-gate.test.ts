/**
 * بوابة شريط إعلان الرئيسية.
 * تشغيل: node --import tsx src/lib/__tests__/homepage-ad-bar-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");

const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
const cfg = readFileSync(resolve(root, "src/config/homepage-ad.ts"), "utf8");
const bar = readFileSync(resolve(root, "src/components/home/HomepageAdBar.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/styles/components/homepage-ad-bar.css"), "utf8");
const dismiss = readFileSync(resolve(root, "src/lib/homepage-ad-dismiss.ts"), "utf8");

assert.match(app, /HomepageAdBar/);
assert.match(app, /homeAdSlot/);
assert.match(app, /navigator\.webdriver/);
assert.doesNotMatch(app, /<HomepageAdBar[\s\S]*mushaf/i);

assert.match(cfg, /homepageAdConfig/);
assert.match(cfg, /enabled:\s*true/);
assert.match(cfg, /Majlisilm\.app@gmail\.com/);
assert.match(cfg, /لا إعلانات عشوائية/);
assert.match(cfg, /Google Ads/);

assert.match(bar, /homepageAdConfig/);
assert.match(bar, /isHomepageAdDismissed/);
assert.match(bar, /dismissHomepageAd/);
assert.match(bar, /navigator\.webdriver/);
assert.match(bar, /loading="lazy"/);
assert.doesNotMatch(bar, /googlesyndication|adsbygoogle|gtag/i);

assert.match(css, /--homepage-ad-bar-h/);
assert.match(css, /max-height:\s*var\(--homepage-ad-bar-h\)/);
assert.doesNotMatch(css, /position:\s*fixed/i);

assert.match(dismiss, /24 \* 60 \* 60 \* 1000/);

console.log("\nhomepage-ad-bar-gate.test.ts: ok");
