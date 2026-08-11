/**
 * Guards for Phase A tactile / contrast preferences + haptic catalog.
 * npx tsx src/lib/__tests__/phase-a-tactile.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "../../..");

const prefsSrc = readFileSync(join(appRoot, "src/lib/user-preferences.ts"), "utf8");
assert.match(prefsSrc, /hapticsEnabled/, "haptics preference");
assert.match(prefsSrc, /highContrast/, "high contrast preference");
assert.match(prefsSrc, /dataset\.contrast/, "applies contrast dataset");

const hapticsSrc = readFileSync(join(appRoot, "src/lib/haptics.ts"), "utf8");
assert.match(hapticsSrc, /selection/, "selection pattern");
assert.match(hapticsSrc, /success/, "success pattern");
assert.match(hapticsSrc, /navigator\.vibrate/, "uses Vibration API");
assert.match(hapticsSrc, /capacitor-utils|@capacitor\/haptics/, "native Capacitor path");

const themeSrc = readFileSync(join(appRoot, "src/app/styles/theme.css"), "utf8");
assert.match(themeSrc, /--mj-touch-min:\s*48px/, "48px touch token");
assert.match(themeSrc, /--mj-ease-spring/, "spring easing");
assert.match(themeSrc, /--mj-elev-2/, "elevation tokens");
assert.match(themeSrc, /data-contrast="high"/, "high contrast selector");
assert.match(themeSrc, /prefers-contrast:\s*more/, "system contrast");

const thumbSrc = readFileSync(join(appRoot, "src/styles/components/thumb-zone.css"), "utf8");
assert.match(thumbSrc, /mj-thumb-zone/, "thumb zone class");
assert.match(thumbSrc, /--mj-touch-min/, "uses touch token");

const navSrc = readFileSync(join(appRoot, "src/components/BottomNavBar.tsx"), "utf8");
assert.match(navSrc, /haptics\.selection/, "nav haptic");

console.log("phase-a-tactile: OK");
