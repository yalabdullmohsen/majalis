/**
 * بوابة: سطح تشغيل سُنّة واحد — native-load-error بهوية الدخولية نفسها.
 * Run: node --import tsx src/lib/__tests__/startup-surface-unify-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const indexHtml = read("index.html");
const splashBoot = read("public/mj-launch-splash-boot.js");
const native = read("public/native-load-error.html");
const lazy = read("src/components/LazyRouteFallback.tsx");
const sectsCss = read("src/styles/pages/islamic-sects.css");
const sectsPage = read("src/views/IslamicSectsPage.tsx");

assert.match(indexHtml, /id="mj-launch-splash"/);
assert.match(indexHtml, /رفيقك في العلم والعمل/);
assert.match(indexHtml, /#F7F3EB|#f7f3eb/i);
assert.match(splashBoot, /mj-launch-splash/);

/* مسار الخطأ الأصلي: نفس خلفية الدخولية + شعار — بلا شاشة رمادية ثانية */
assert.match(native, /#F7F3EB|#f7f3eb/i, "startup-background-flash: native-load-error must use splash beige");
assert.match(native, /رفيقك في العلم والعمل/, "native-load-error must reuse Sunnah tagline");
assert.match(native, /data-startup-surface="sunnah"/);
assert.match(native, /\.progress|class="progress"|mj-launch-splash__progress|\.pulse|class="pulse"/, "خط تقدّم خطي مثل الدخولية");
assert.doesNotMatch(
  native,
  /background:\s*#f2f4f3/i,
  "duplicate-full-screen-startup-loader: forbid gray recovery background",
);
assert.match(native, /جاري تجهيز الصفحة/, "soft recovery copy retained for silent retry path");
assert.match(native, /mj\.native-load-retry/);
assert.match(native, /attempts < 2/);

/* بعد App Shell: لا شاشة كاملة «جاري تجهيز الصفحة» من React */
assert.doesNotMatch(lazy, /جاري تجهيز الصفحة/);
assert.match(lazy, /lrf-wrap--silent|data-route-fallback/);

/* بطاقات الفرق: عرض كامل على الجوال */
assert.match(sectsCss, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
assert.doesNotMatch(
  sectsCss,
  /\.sect-hub__grid\s*>\s*:last-child:nth-child\(odd\)[\s\S]{0,160}?max-width:\s*calc\(\(100%/,
  "narrow-detail-card",
);
assert.doesNotMatch(sectsCss, /word-break:\s*break-all/);
assert.match(sectsPage, /KnowledgeSummaryCard/);
assert.match(sectsPage, /عرض التفاصيل|onNavigate/);
assert.match(
  sectsPage + read("src/components/knowledge/KnowledgeSummaryCard.tsx"),
  /needs_specialist_review/,
);
assert.doesNotMatch(sectsPage, /keyScholars\.join\([`'"]،[`'"]\)/);
assert.doesNotMatch(sectsPage, /sect-card__detail|aria-expanded/);
assert.match(read("src/views/IslamicSectsDetailPage.tsx"), /KnowledgeDetailSurface/);

console.log("startup-surface-unify-gate: ok");
