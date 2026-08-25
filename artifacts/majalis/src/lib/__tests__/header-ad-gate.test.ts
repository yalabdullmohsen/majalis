/**
 * بوابة إعلان المنصة: شريط أعلى الهيدر + كارت بجانب القمر + نافذة الشراكة.
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
const modal = read("src/components/header/PartnershipAdModal.tsx");
const bus = read("src/lib/partnership-ad-bus.ts");
const css = read("src/styles/components/header-ad-slot.css");
const topCss = read("src/styles/components/top-sponsor-banner.css");

assert.doesNotMatch(app, /HomepageAdBar/);
assert.doesNotMatch(app, /homeAdSlot/);
assert.match(app, /TopSponsorBanner/);
assert.match(app, /PartnershipAdModal/);
assert.match(app, /app-top-chrome/);

assert.match(nav, /HeaderAdSlot/);
assert.match(nav, /shouldShowHeaderAd/);
assert.match(nav, /navbar-v3__end/);
assert.doesNotMatch(nav, /MajlisWordmark/);
assert.doesNotMatch(nav, /navbar-v3__tagline/);

assert.match(cfg, /headerAdConfig/);
assert.match(cfg, /export const headerAd\b/);
assert.match(cfg, /enabled:\s*true/);
assert.match(cfg, /placement:\s*"both"/);
assert.match(cfg, /shouldShowHeaderAd/);
assert.match(cfg, /shouldShowTopSponsorBanner/);
assert.match(cfg, /Google Ads/);
assert.match(cfg, /ctaUrl:\s*"\/support"/);
assert.match(cfg, /شركة العبد المحسن للحج/);
assert.match(cfg, /الثقة/);
assert.match(cfg, /badgeLabel:\s*"إعلان شراكة"/);
assert.match(cfg, /sponsorUrl:\s*"https:\/\/instagram\.com\/Al_abdalmhsn"/);
assert.match(cfg, /sponsorAriaLabel:\s*"فتح حساب شركة العبد المحسن في إنستقرام"/);
assert.match(cfg, /TOP_SPONSOR_STATUS/);
assert.match(cfg, /modalTitle/);
assert.match(cfg, /instagramHandle:\s*"@Al_abdalmhsn"/);

assert.match(bus, /openPartnershipAdModal/);
assert.match(bus, /subscribePartnershipAdModal/);

assert.match(slot, /headerAdConfig/);
assert.match(slot, /HeaderAdBanner/);
assert.match(slot, /openPartnershipAdModal/);
assert.match(slot, /PartnerWatchIcon/);
assert.match(slot, /PartnerChargeIcon/);
assert.doesNotMatch(slot, /googlesyndication|adsbygoogle|gtag/i);
assert.doesNotMatch(slot, /<img\b/);
assert.doesNotMatch(slot, /openExternalUrl/);

assert.match(top, /headerAdConfig/);
assert.match(top, /top-sponsor-banner/);
assert.match(top, /placement === "top"/);
assert.match(top, /openPartnershipAdModal/);
assert.match(top, /top-sponsor-banner__partner/);
assert.match(top, /syncSponsorStatusBar|TOP_SPONSOR_STATUS/);
assert.doesNotMatch(top, /navigator\.webdriver/);
assert.doesNotMatch(top, /googlesyndication|adsbygoogle|gtag/i);
assert.doesNotMatch(top, /openExternalUrl/);

assert.match(modal, /PartnershipAdModal/);
assert.match(modal, /openExternalUrl/);
assert.match(modal, /sponsorUrl/);
assert.match(modal, /target="_blank"/);
assert.match(modal, /rel="noopener noreferrer"/);
assert.match(cfg, /instagram\.com\/Al_abdalmhsn/);

assert.match(css, /--header-ad-h:\s*40px/);
assert.match(css, /navbar-v3__end/);
assert.match(topCss, /--top-sponsor-content-h:\s*48px/);
assert.match(topCss, /\.app-top-chrome/);
assert.match(topCss, /background-color:\s*#e8f0ec/);

const apply = read("src/lib/apply-page-chrome.ts");
assert.match(apply, /TOP_SPONSOR_STATUS/);
assert.match(apply, /data-top-sponsor/);

console.log("\nheader-ad-gate.test.ts: ok");
