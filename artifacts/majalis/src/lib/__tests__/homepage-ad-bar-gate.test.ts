/**
 * توافق: شريط أعلى الصفحة عبر TopSponsorBanner — لا HomepageAdBar.
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
assert.match(app, /TopSponsorBanner/);
assert.match(nav, /HeaderAdSlot/);
assert.match(nav, /shouldShowHeaderAd/);
assert.doesNotMatch(nav, /MajlisWordmark/);
assert.match(cfg, /headerAdConfig/);
assert.match(cfg, /enabled:\s*true/);
assert.match(cfg, /placement:\s*"both"/);
assert.match(cfg, /شركة العبد المحسن للحج/);
assert.match(cfg, /الثقة/);

console.log("\nhomepage-ad-bar-gate.test.ts: ok (top sponsor in app)");
