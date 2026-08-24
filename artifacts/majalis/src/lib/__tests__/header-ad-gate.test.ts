/**
 * بوابة إعلان منتصف الهيدر.
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

assert.match(nav, /HeaderAdSlot/);
assert.match(nav, /shouldShowHeaderAd/);
assert.match(nav, /MajlisWordmark/);

assert.match(cfg, /headerAdConfig/);
assert.match(cfg, /export const headerAd\b/);
assert.match(cfg, /enabled:\s*true/);
assert.match(cfg, /Majlisilm\.app@gmail\.com/);
assert.match(cfg, /shouldShowHeaderAd/);
assert.match(cfg, /Google Ads/);

assert.match(slot, /headerAdConfig/);
assert.match(slot, /header-ad-slot/);
assert.doesNotMatch(slot, /googlesyndication|adsbygoogle|gtag/i);
assert.doesNotMatch(slot, /<img\b/);

assert.match(cfg, /subtitle:/);
assert.match(slot, /header-ad-slot__subtitle/);

assert.match(css, /--header-ad-h:\s*40px/);
assert.match(css, /max-height:\s*var\(--header-ad-h\)/);
assert.doesNotMatch(css, /position:\s*(fixed|absolute)/i);

console.log("\nheader-ad-gate.test.ts: ok");
