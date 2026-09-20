/**
 * بوابة: توقيت دخولية MajlisSplash — بلا تأخير اصطناعي (MIN=0) مع تلاشي 160ms.
 * تشغيل: node --import tsx src/lib/__tests__/splash-timing-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const splash = readFileSync(resolve(root, "src/lib/splash-screen.ts"), "utf8");
const cap = readFileSync(resolve(root, "capacitor.config.ts"), "utf8");
const main = readFileSync(resolve(root, "src/main.tsx"), "utf8");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const majlisSplash = readFileSync(resolve(root, "src/lib/majlis-splash.ts"), "utf8");

assert.match(majlisSplash, /SPLASH_MIN_VISIBLE_MS\s*=\s*0/);
assert.match(majlisSplash, /SPLASH_LCP_SOFT_MS\s*=\s*480/);
assert.match(majlisSplash, /SPLASH_MAX_VISIBLE_MS\s*=\s*1_?400|SPLASH_MAX_VISIBLE_MS\s*=\s*1400/);
assert.match(majlisSplash, /SPLASH_FADE_OUT_MS\s*=\s*160/);
assert.match(splash, /SPLASH_MIN_VISIBLE_MS/);
assert.match(splash, /SPLASH_MAX_VISIBLE_MS/);
assert.match(splash, /SPLASH_FADE_OUT_MS/);
assert.match(splash, /mj:shell-stable/);
assert.match(splash, /hideNativeSplash\(false\)/, "السقف الزمني بتلاشي لا فوري");
assert.doesNotMatch(
  splash,
  /setTimeout\(\(\)\s*=>\s*\{\s*void hideNativeSplash\(true\)/,
  "لا إخفاء فوري عند السقف",
);
assert.doesNotMatch(
  splash,
  /SPLASH_MAX_VISIBLE_MS\s*\*\s*2/,
  "لا مؤقّت إخفاء ثانٍ موازٍ",
);
assert.match(cap, /launchAutoHide:\s*false/);
assert.match(main, /armNativeSplashController/);
assert.match(main, /app:first-paint/);
assert.ok(existsSync(resolve(root, "src/components/MajlisSplash.tsx")));
assert.match(html, /id="mj-launch-splash"/);
assert.match(html, /src="\/mj-launch-splash-boot\.js"/);
assert.match(html, /mj-launch-splash__tagline/);
assert.match(html, /mj-launch-splash__progress/);
assert.match(html, /رفيقك في العلم والعمل/);
assert.match(html, /transition:opacity \.16s/);
const boot = readFileSync(resolve(root, "public/mj-launch-splash-boot.js"), "utf8");
assert.match(boot, /MIN_MS\s*=\s*0/);
assert.match(boot, /SOFT_MAX_MS\s*=\s*480/);
assert.match(boot, /MAX_MS\s*=\s*1400/);
assert.match(boot, /EXIT_MS\s*=\s*160/);
assert.match(html, /mj-launch-splash__title/);
assert.match(boot, /splash_timing=1/, "معامل قياس توقيت الدخولية");
assert.doesNotMatch(html, /id="mj-silent-splash"/);
assert.doesNotMatch(html, /id="mj-boot-skeleton"/, "بلا هيكل تحميل كامل");
assert.doesNotMatch(html, /mj-launch-splash__pulse/, "بلا نبض دوّار");
assert.match(splash, /dismissHtmlLaunchSplash/, "React يزيل الدخولية عند حظر CSP");

console.log("splash-timing-gate.test.ts: ok");
