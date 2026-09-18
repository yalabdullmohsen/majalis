/**
 * بوابة انتقالات الصفحات — Fast Fade موحّد 120–180ms، بلا شاشة بيضاء أو انزلاق كبير.
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
const guard = read("src/lib/nav-click-guard.ts");

assert.match(motion, /classifyNavMotion/, "نظام انتقال واحد على مستوى التطبيق");
assert.match(motion, /reducedMotionPreferred/, "يحترم prefers-reduced-motion");
assert.match(app, /RouteEnterMotion/, "مركّب في App");
assert.match(app, /app-top-chrome/, "كروم علوي ثابت في الشجرة");
assert.match(native, /\.app-top-chrome/, "كروم علوي ثابت أثناء الانتقال");

assert.match(native, /mj-route-push-in/, "دخول مسار");
assert.match(native, /mj-route-pop-in/, "رجوع");
assert.match(native, /mj-route-tab-in/, "تبديل تبويب");
assert.match(native, /background:\s*var\(--mj-bg/, "سطح الصفحة ثابت — بلا وميض لون");
assert.doesNotMatch(native, /mj-route-brand-wash/, "لا غطاء لوني يقطع الاستمرارية");
assert.doesNotMatch(native, /filter:\s*saturate/, "لا تشبع لوني أثناء الدخول");

const pushBlock = native.slice(
  native.indexOf("@keyframes mj-route-push-in"),
  native.indexOf("@keyframes mj-route-pop-in"),
);
assert.match(pushBlock, /opacity:\s*0\.9[0-9]/, "الدفع لا يخفي المحتوى (استمرارية)");
assert.doesNotMatch(pushBlock, /opacity:\s*0\s*;/, "لا خفوت كامل يشعر بشاشة جديدة");
assert.doesNotMatch(pushBlock, /translate3d\([^)]*1[6-9]px/, "بلا انزلاق كبير (≥16px)");
assert.doesNotMatch(pushBlock, /translate3d\([^)]*\d{2,}px/, "بلا انزلاق بعشرات البكسل");

const ms = [...spatial.matchAll(/push:\s*(\d+)/g)].map((m) => Number(m[1]));
assert.ok(ms[0] >= 120 && ms[0] <= 180, `push duration ضمن 120–180ms (وجد ${ms[0]})`);
const tabMs = [...spatial.matchAll(/tab:\s*(\d+)/g)].map((m) => Number(m[1]));
assert.ok(tabMs[0] >= 90 && tabMs[0] <= 160, `tab ضمن نافذة سريعة (وجد ${tabMs[0]})`);

const cssMs = [
  ...native.matchAll(/mj-route-(?:push|pop|tab|modal)-in\s+(\d+)ms/g),
].map((m) => Number(m[1]));
assert.ok(cssMs.length >= 3, "مدد CSS للأنواع الأساسية");
assert.ok(
  cssMs.every((n) => n >= 90 && n <= 180),
  `مدة CSS ضمن 90–180ms (وجد ${cssMs.join(",")})`,
);

assert.match(lrf, /lrf-wrap--skel/, "هيكل مسار فوري");
assert.match(lrf, /lrf-wrap--lessons/, "هيكل دروس فوري");
assert.match(lrf, /lrf-wrap--prayer/, "هيكل صلاة فوري");
assert.match(lrf, /lrf-wrap--search/, "هيكل بحث فوري");
assert.match(lrf, /lrf-wrap--settings/, "هيكل إعدادات فوري");
assert.match(instant, /\.lrf-wrap--skel[\s\S]*background:\s*var\(--mj-bg/, "هيكل المسار يرث سطح الواجهة");

assert.match(splash, /hideNativeSplash|dismissHtmlLaunchSplash/, "إقلاع splash → قشرة التطبيق");
assert.match(splash, /prefersReducedMotion|prefers-reduced-motion/, "إقلاع يحترم تقليل الحركة");
assert.match(guard, /lastNavAt|gapMs/, "حارس ضغط متكرر");
assert.match(app, /restoreScrollSnapshot/, "استعادة تمرير عند الرجوع");

console.log("page-transitions-gate.test.ts: ok");
