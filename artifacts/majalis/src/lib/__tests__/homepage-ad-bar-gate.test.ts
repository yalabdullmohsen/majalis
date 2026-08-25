/**
 * توافق: إعلان داخل الهيدر — لا HomepageAdBar ولا TopSponsorBanner.
 * تشغيل: node --import tsx src/lib/__tests__/homepage-ad-bar-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
const nav = readFileSync(resolve(root, "src/components/NavBar.tsx"), "utf8");
const cfg = readFileSync(resolve(root, "src/config/header-ad.ts"), "utf8");

assert.doesNotMatch(app, /HomepageAdBar|homeAdSlot/);
assert.doesNotMatch(app, /TopSponsorBanner/);
assert.match(nav, /HeaderAdSlot/);
assert.match(nav, /shouldShowHeaderAd/);
assert.match(nav, /navbar-v3__ad-row/);
assert.doesNotMatch(nav, /MajlisWordmark/);
assert.match(cfg, /headerAdConfig/);
assert.match(cfg, /enabled:\s*true/);
assert.match(cfg, /placement:\s*"header"/);
assert.match(cfg, /شركة العبد المحسن للحج/);
assert.match(cfg, /الثقة/);

console.log("\nhomepage-ad-bar-gate.test.ts: ok (header ad in navbar)");
