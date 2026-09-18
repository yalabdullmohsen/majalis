/**
 * بوابة تخطيط iPad / Split View — منع حشر الهيدر وتفكيك الحروف.
 * Run: node --import tsx src/lib/__tests__/ipad-responsive-layout-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COMPACT_CHROME_MAX_WIDTH,
  MOBILE_NAV_MAX_WIDTH,
  COMPACT_CHROME_MEDIA_QUERY,
  MOBILE_NAV_MEDIA_QUERY,
} from "@/lib/nav-breakpoint";
import { buildPrayerChipCopy } from "@/lib/prayer-ticker-copy";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.equal(MOBILE_NAV_MAX_WIDTH, 879);
assert.equal(COMPACT_CHROME_MAX_WIDTH, 1279);
assert.match(MOBILE_NAV_MEDIA_QUERY, /879/);
assert.match(COMPACT_CHROME_MEDIA_QUERY, /1279/);

const nav = read("src/components/NavBar.tsx");
assert.match(nav, /useCompactChrome/);
assert.match(nav, /useStackedChrome/);
assert.match(nav, /compactText|compact=\{isCompactChrome\}/);
assert.match(nav, /tickerInHeaderEnd/);
assert.match(nav, /ipad-responsive-layout\.css/);
assert.doesNotMatch(
  nav,
  /!isMobile && !isImmersiveChromePath\(location\) && !isCompactHeaderPath\(location\) && <DeferredHeaderTicker/,
);

const css = read("src/styles/components/ipad-responsive-layout.css");
assert.match(css, /max-width:\s*1279px/);
assert.match(css, /min-width:\s*880px/);
assert.match(css, /white-space:\s*nowrap/);
assert.match(css, /navbar-prayer-chip--compact/);
assert.match(css, /--page-width/);
assert.doesNotMatch(css, /overflow:\s*hidden\s*!important[\s\S]{0,80}navbar-v3__end/);

const hub = read("src/styles/components/hub-card.css");
assert.match(hub, /\.navbar-prayer-chip__name[\s\S]{0,120}?white-space:\s*nowrap/);
assert.doesNotMatch(
  hub,
  /\.navbar-prayer-chip__name[\s\S]{0,80}?white-space:\s*normal/,
);

const m2030 = read("src/styles/m2030/navigation.css");
assert.match(m2030, /min-width:\s*880px/);
assert.doesNotMatch(m2030, /@media \(min-width: 768px\)[\s\S]{0,80}?\.bottom-nav/);

const remaining = buildPrayerChipCopy({
  prayerName: "العصر",
  remainingSeconds: 27 * 60,
  sinceSeconds: null,
});
assert.match(remaining.text, /متبقي على العصر/);
assert.match(remaining.compactText, /العصر/);
assert.ok(remaining.compactText.length < remaining.text.length);

const now = buildPrayerChipCopy({
  prayerName: "المغرب",
  remainingSeconds: 0,
  sinceSeconds: 30,
});
assert.match(now.compactText, /حان/);

console.log("ipad-responsive-layout-gate.test.ts: ok");
