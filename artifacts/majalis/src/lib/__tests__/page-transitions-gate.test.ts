/**
 * بوابة انتقالات الصفحات — تلاشي سريع بلا وميض سطح، مع احترام تقليل الحركة.
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

assert.match(native, /mj-route-brand-wash/, "غطاء سطح أثناء الدخول");
assert.match(native, /background:\s*var\(--mj-bg/, "غطاء بنفس سطح الصفحة — بلا وميض لون");
assert.doesNotMatch(
  native.slice(native.indexOf("@keyframes mj-route-brand-wash"), native.indexOf("/* سحب حافة")),
  /linear-gradient/,
  "غطاء الانتقال بلا تدرج لوني يسبب وميضًا",
);
assert.doesNotMatch(native, /filter:\s*saturate/, "لا تشبع لوني أثناء الدخول");

const ms = [...spatial.matchAll(/push:\s*(\d+)/g)].map((m) => Number(m[1]));
assert.ok(ms[0] >= 120 && ms[0] <= 180, `push duration ضمن 120–180ms (وجد ${ms[0]})`);
const cssMs = [...native.matchAll(/mj-route-brand-fade\s+(\d+)ms/g)].map((m) => Number(m[1]));
assert.ok(
  cssMs.every((n) => n <= 220),
  `مدة CSS ≤220ms (وجد ${cssMs.join(",")})`,
);
const washMs = [...native.matchAll(/mj-route-brand-wash\s+(\d+)ms/g)].map((m) => Number(m[1]));
assert.ok(
  washMs.every((n) => n <= 220),
  `مدة الغطاء ≤220ms (وجد ${washMs.join(",")})`,
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
