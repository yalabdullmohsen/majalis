/**
 * بوابة: لا فراغ عند فتح مسار كسول — هيكل فوري + prefetch من البطاقات.
 * تشغيل: node --import tsx src/lib/__tests__/route-instant-shell-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const fallback = read("src/components/LazyRouteFallback.tsx");
assert.doesNotMatch(fallback, /useDeferredLoading/, "لا تأخير قبل الهيكل");
assert.doesNotMatch(fallback, /return null/, "لا فراغ في fallback المسار");
assert.match(fallback, /data-route-fallback="1"/, "سمة هيكل المسار");
assert.match(fallback, /lrf-wrap--skel/, "هيكل مرئي");
assert.match(fallback, /تجهيز الصفحة/, "رسالة قصيرة");
assert.match(fallback, /export const RouteFallback/, "اسم RouteFallback مستقر");

const app = read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx");
assert.match(app, /fallback=\{<LazyRouteFallback\s*\/>\}/, "Suspense المسارات بهيكل");
assert.doesNotMatch(
  read("src/AppRoutes.tsx"),
  /fallback=\{null\}/,
  "AppRoutes بلا fallback فارغ",
);

const featureCard = read("src/components/design-system/FeatureCard.tsx");
assert.match(featureCard, /usePrefetchRoute/, "بطاقة الميزة تسخّن المسار");

const prefetch = read("src/lib/prefetch-route.ts");
assert.match(prefetch, /HOME_WARM_ROUTES/, "مسارات تسخين الرئيسية");
assert.match(prefetch, /prefetchHomeWarmRoutes/, "دالة تسخين جماعي");
for (const path of [
  "/quran-hub",
  "/prayer-times",
  "/lessons",
  "/sections",
  "/hadith",
  "/fiqh",
  "/tafsir",
  "/tawhid",
]) {
  assert.match(prefetch, new RegExp(`"${path}"`), `CHUNK/تسخين ${path}`);
}

const below = read("src/pages/account/ui/HomeBelowFold.tsx");
assert.match(below, /prefetchHomeWarmRoutes/, "تسخين مبكر تحت الطية");
assert.match(below, /prefetchRoute\(href\)/, "وصول سريع يسخّن عند اللمس");

const guard = read("src/components/PageLoadingGuard.tsx");
assert.doesNotMatch(
  guard,
  /if \(!showSkeleton\) return null/,
  "حارس التحميل لا يفرّغ الشاشة",
);

console.log("route-instant-shell-gate.test.ts: ok");
