/**
 * بوابة إعلان المنصة: شريط أعلى الهيدر (التطبيق) + كبسولة اختيارية.
 * تشغيل: node --import tsx src/lib/__tests__/header-ad-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const app = read("src/App.tsx");
const nav = read("src/components/NavBar.tsx");
const cfg = read("src/config/header-ad.ts");
const slot = read("src/components/header/HeaderAdSlot.tsx");
const top = read("src/components/header/TopSponsorBanner.tsx");
const css = read("src/styles/components/header-ad-slot.css");
const topCss = read("src/styles/components/top-sponsor-banner.css");

assert.doesNotMatch(app, /HomepageAdBar/);
assert.doesNotMatch(app, /homeAdSlot/);
assert.match(app, /TopSponsorBanner/);
assert.match(app, /app-top-chrome/);

assert.match(nav, /HeaderAdSlot/);
assert.match(nav, /shouldShowHeaderAd/);
assert.doesNotMatch(nav, /MajlisWordmark/);
assert.doesNotMatch(nav, /navbar-v3__tagline/);

assert.match(cfg, /headerAdConfig/);
assert.match(cfg, /export const headerAd\b/);
assert.match(cfg, /enabled:\s*true/);
assert.match(cfg, /placement:\s*"top"/);
assert.match(cfg, /shouldShowHeaderAd/);
assert.match(cfg, /shouldShowTopSponsorBanner/);
assert.match(cfg, /Google Ads/);
assert.match(cfg, /ctaUrl:\s*"\/support"/);
assert.match(cfg, /شركة العبد المحسن للحج/);
assert.match(cfg, /الثقة/);
assert.match(cfg, /badgeLabel:\s*"شريك"/);

assert.match(slot, /headerAdConfig/);
assert.match(slot, /HeaderAdBanner/);
assert.doesNotMatch(slot, /googlesyndication|adsbygoogle|gtag/i);
assert.doesNotMatch(slot, /<img\b/);

assert.match(top, /headerAdConfig/);
assert.match(top, /top-sponsor-banner/);
assert.match(top, /placement === "top"/);
assert.doesNotMatch(top, /navigator\.webdriver/);
assert.doesNotMatch(top, /googlesyndication|adsbygoogle|gtag/i);

assert.match(css, /--header-ad-h:\s*40px/);
assert.match(topCss, /--top-sponsor-content-h:\s*40px/);
assert.match(topCss, /\.app-top-chrome/);

console.log("\nheader-ad-gate.test.ts: ok");
