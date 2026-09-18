/**
 * بوابة المرحلة 1 — عقد إقلاع: Fade واحد 120–180ms، مصدر إخفاء واحد، بلا شاشة وسيطة.
 * node --import tsx src/lib/__tests__/product-evolution-p1-startup-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const majlis = read("src/lib/majlis-splash.ts");
const fadeMatch = majlis.match(/SPLASH_FADE_OUT_MS\s*=\s*(\d+)/);
assert.ok(fadeMatch, "ثابت مدة التلاشي");
const fadeMs = Number(fadeMatch![1]);
assert.ok(fadeMs >= 120 && fadeMs <= 180, `Fade يجب 120–180ms، الحالي=${fadeMs}`);

const splash = read("src/lib/splash-screen.ts");
assert.match(splash, /armNativeSplashController/, "منسّق إخفاء واحد");
assert.match(splash, /mj:shell-stable/, "إخفاء بعد استقرار الهيكل");
assert.doesNotMatch(splash, /SPLASH_MAX_VISIBLE_MS\s*\*\s*2/, "بلا سقف مزدوج");
assert.match(splash, /prefersReducedMotion|prefers-reduced-motion/, "احترام تقليل الحركة");

const html = read("index.html");
assert.match(html, /mj-theme-boot/, "ثيم قبل First Paint");
assert.match(html, /app-booting/, "قفل هيكل من أول إطار");
assert.match(html, /MutationObserver/, "جاهزية عبر commit لـ #root");
assert.doesNotMatch(html, /mj:startup-ready|mj:app-shell-ready/, "لا جسور جاهزية موسّعة");
assert.match(html, /transition:opacity \.16s/, "CSS متزامن مع ثابت التلاشي");
assert.doesNotMatch(html, /id="mj-boot-skeleton"/, "بلا شاشة تحميل كاملة بعد Splash");

const boot = read("public/mj-launch-splash-boot.js");
assert.match(boot, /EXIT_MS\s*=\s*160/);
assert.match(boot, /shellStable/, "boot ينتظر shell-stable");

const readiness = read("src/lib/__tests__/startup-readiness-gate.test.ts");
assert.match(readiness, /shell-stable/, "بوابة الجاهزية حية");

console.log("product-evolution-p1-startup-gate.test.ts: ok");
