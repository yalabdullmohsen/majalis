/**
 * بوابة إعلان المنصة: banner داخل الهيدر — بلا شريط فوق Status Bar.
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
const css = read("src/styles/components/header-ad-slot.css");

assert.doesNotMatch(app, /HomepageAdBar/);
assert.doesNotMatch(app, /homeAdSlot/);
assert.doesNotMatch(app, /TopSponsorBanner/);
assert.doesNotMatch(app, /PartnershipAdModal/);
assert.match(app, /app-top-chrome/);

assert.match(nav, /HeaderAdSlot/);
assert.match(nav, /shouldShowHeaderAd/);
assert.match(nav, /navbar-v3__ad-row/);
assert.doesNotMatch(nav, /MajlisWordmark/);
assert.doesNotMatch(nav, /navbar-v3__tagline/);

assert.match(cfg, /headerAdConfig/);
assert.match(cfg, /export const headerAd\b/);
assert.match(cfg, /enabled:\s*true/);
assert.match(cfg, /placement:\s*"header"/);
assert.match(cfg, /shouldShowHeaderAd/);
assert.match(cfg, /Google Ads/);
assert.match(cfg, /ctaUrl:\s*"\/support"/);
assert.match(cfg, /شركة العبد المحسن للحج/);
assert.match(cfg, /الثقة/);
assert.match(cfg, /badgeLabel:\s*"شريك المجلس العلمي"/);
assert.match(cfg, /sponsorUrl:\s*"https:\/\/instagram\.com\/Al_abdalmhsn"/);
assert.match(cfg, /sponsorAriaLabel:\s*"فتح حساب شركة العبد المحسن للحج في إنستقرام"/);
assert.match(cfg, /ctaLabel:\s*"تواصل عبر إنستقرام"/);
assert.doesNotMatch(cfg, /advertiseWithUsLabel/);
assert.doesNotMatch(cfg, /للإعلان معنا/);

assert.match(slot, /headerAdConfig/);
assert.match(slot, /HeaderAdBanner/);
assert.match(slot, /openExternalUrl/);
assert.match(slot, /sponsorUrl/);
assert.match(slot, /header-ad-slot__banner/);
assert.match(slot, /target="_blank"/);
assert.match(slot, /rel="noopener noreferrer"/);
assert.doesNotMatch(slot, /advertise-link|advertiseWithUsLabel|cfg\.ctaUrl/);
assert.doesNotMatch(slot, /googlesyndication|adsbygoogle|gtag/i);
assert.doesNotMatch(slot, /<img\b/);
assert.doesNotMatch(slot, /openPartnershipAdModal/);

assert.match(css, /--header-ad-h:/);
assert.match(css, /navbar-v3__ad-row/);
assert.match(css, /header-ad-slot__banner/);

const apply = read("src/lib/apply-page-chrome.ts");
assert.match(apply, /TOP_SPONSOR_STATUS/);

console.log("\nheader-ad-gate.test.ts: ok");
