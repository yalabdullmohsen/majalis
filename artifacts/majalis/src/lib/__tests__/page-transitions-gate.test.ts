/**
 * بوابة انتقالات الصفحات — استمرارية مكانية بهدوء Apple، بلا شاشة جديدة.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const native = read("src/styles/components/native-feel.css");
const spatial = read("src/lib/spatial-nav.ts");
const motion = read("src/components/motion/RouteEnterMotion.tsx");
const app = read("src/App.tsx");
const lrf = read("src/components/LazyRouteFallback.tsx");
const instant = read("src/styles/components/instant-interaction.css");
const splash = read("src/lib/splash-screen.ts");

assert.match(motion, /classifyNavMotion/, "نظام انتقال واحد على مستوى التطبيق");
assert.match(motion, /reducedMotionPreferred/, "يحترم prefers-reduced-motion");
assert.match(app, /RouteEnterMotion/, "مركّب في App");
assert.match(app, /app-top-chrome/, "كروم علوي ثابت في الشجرة");
assert.match(native, /\.app-top-chrome/, "كروم علوي ثابت أثناء الانتقال");

assert.match(native, /mj-route-push-in/, "دفع مكاني (Apple-like)");
assert.match(native, /mj-route-pop-in/, "رجوع مكاني");
assert.match(native, /mj-route-tab-in/, "تبديل تبويب هادئ");
assert.match(native, /--mj-nav-sign/, "اتجاه انزلاق يحترم RTL");
assert.match(native, /background:\s*var\(--mj-bg/, "سطح الصفحة ثابت — بلا وميض لون");
assert.doesNotMatch(native, /mj-route-brand-wash/, "لا غطاء لوني يقطع الاستمرارية");
assert.doesNotMatch(native, /filter:\s*saturate/, "لا تشبع لوني أثناء الدخول");

const pushBlock = native.slice(
  native.indexOf("@keyframes mj-route-push-in"),
  native.indexOf("@keyframes mj-route-pop-in"),
);
assert.match(pushBlock, /opacity:\s*0\.9[0-9]/, "الدفع لا يخفي المحتوى (استمرارية)");
assert.doesNotMatch(pushBlock, /opacity:\s*0\s*;/, "لا خفوت كامل يشعر بشاشة جديدة");

const ms = [...spatial.matchAll(/push:\s*(\d+)/g)].map((m) => Number(m[1]));
assert.ok(ms[0] >= 120 && ms[0] <= 180, `push duration ضمن 120–180ms (وجد ${ms[0]})`);
const tabMs = [...spatial.matchAll(/tab:\s*(\d+)/g)].map((m) => Number(m[1]));
assert.ok(tabMs[0] > 0 && tabMs[0] <= 120, `tab سريع ≤120ms (وجد ${tabMs[0]})`);

const cssMs = [
  ...native.matchAll(/mj-route-(?:push|pop|tab|modal)-in\s+(\d+)ms/g),
].map((m) => Number(m[1]));
assert.ok(cssMs.length >= 3, "مدد CSS للأنواع الأساسية");
assert.ok(
  cssMs.every((n) => n <= 220),
  `مدة CSS ≤220ms (وجد ${cssMs.join(",")})`,
);

assert.match(lrf, /lrf-wrap--skel/, "هيكل مسار فوري");
assert.match(lrf, /lrf-wrap--lessons/, "هيكل دروس فوري");
assert.match(lrf, /lrf-wrap--prayer/, "هيكل صلاة فوري");
assert.match(lrf, /lrf-wrap--search/, "هيكل بحث فوري");
assert.match(lrf, /lrf-wrap--settings/, "هيكل إعدادات فوري");
assert.match(instant, /\.lrf-wrap--skel[\s\S]*background:\s*var\(--mj-bg/, "هيكل المسار يرث سطح الواجهة");

assert.match(splash, /hideNativeSplash|dismissHtmlLaunchSplash/, "إقلاع splash → قشرة التطبيق");
assert.match(splash, /prefersReducedMotion|prefers-reduced-motion/, "إقلاع يحترم تقليل الحركة");

console.log("page-transitions-gate.test.ts: ok");
