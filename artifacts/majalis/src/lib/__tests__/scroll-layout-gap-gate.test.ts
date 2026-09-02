/**
 * بوابة: لا فراغ علوي عند إخفاء الكروم، وتمرير وثيقة واحد على الجوال،
 * وحجز سفلي على #main-content حتى لا يدخل المحتوى خلف الشريط.
 * تشغيل: node --import tsx src/lib/__tests__/scroll-layout-gap-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const chrome = readFileSync(resolve(root, "src/styles/components/app-chrome-scroll.css"), "utf8");
const top = readFileSync(resolve(root, "src/styles/components/top-chrome-layout.css"), "utf8");
const finalCss = readFileSync(resolve(root, "src/styles/final-release.css"), "utf8");
const authCss = readFileSync(resolve(root, "src/styles/pages/auth.css"), "utf8");
const lessonsCss = readFileSync(resolve(root, "src/styles/pages/lessons.css"), "utf8");

assert.match(
  chrome,
  /\.app-shell\.app-chrome-hidden\s+\.app-top-chrome[\s\S]*?transform:\s*translateY\(calc\(-100%\s*-\s*4px\)\)/,
  "إخفاء الكروم تدريجي عبر transform (لا height:0 فجائي)",
);
assert.match(
  chrome,
  /\.app-shell\.app-chrome-hidden\s+\.app-top-chrome[\s\S]*?opacity:\s*0/,
  "تلاشي تدريجي للشريط العلوي",
);

assert.match(
  top,
  /@media\s*\(max-width:\s*879px\)[\s\S]*?\.app-shell\s*\{[\s\S]*?overflow:\s*visible/,
  "الصدفة لا تقفل overflow على الجوال",
);
assert.match(
  top,
  /@media\s*\(max-width:\s*879px\)[\s\S]*?#main-content\.app-main[\s\S]*?overflow-y:\s*visible/,
  "المحتوى بلا تمرير داخلي على الجوال",
);
assert.match(
  top,
  /#main-content\.app-main[\s\S]*?padding-block-end:\s*var\(--content-pb/,
  "حجز سفلي على المحتوى عبر --content-pb",
);
assert.match(
  top,
  /--bottom-nav-height:\s*64px/,
  "ارتفاع الشريط السفلي موحّد 84px على الجوال",
);

assert.match(
  finalCss,
  /@media\s*\(max-width:\s*879px\)[\s\S]*?\.app-shell\s*\{[\s\S]*?overflow:\s*visible\s*!important/,
);
assert.match(
  finalCss,
  /#main-content\.app-main[\s\S]*?padding-block-end:\s*calc\(\s*var\(--bottom-nav-height,\s*64px\)\s*\+\s*var\(--inset-bottom/,
  "حجز سفلي صريح على #main-content",
);
assert.doesNotMatch(
  finalCss.replace(/html\.pts-immersive[\s\S]*?(?=@media|$)/g, ""),
  /@media\s*\(max-width:\s*879px\)[\s\S]*?\.app-shell\s*\{[^}]*overflow:\s*hidden\s*!important/,
  "لا overflow:hidden على صدفة الجوال العامة",
);

assert.doesNotMatch(
  authCss,
  /\.login-page[\s\S]*?overflow-y:\s*auto/,
  "صفحة الدخول بلا تمرير داخلي — وثيقة واحدة",
);
assert.match(
  authCss,
  /\.app-main:has\(\.login-page\)/,
  "صفحة الدخول تلغي حجز الشريط السفلي من app-main",
);

assert.match(
  lessonsCss,
  /\.lessons-v3-sticky[\s\S]*?top:\s*var\(--sticky-below-chrome/,
  "شريط تصفية الدروس تحت الكروم العلوي",
);
assert.doesNotMatch(
  lessonsCss,
  /\.lessons-page-v2(?:\.lessons-page-v3)?\s*,[\s\S]*?padding-bottom:\s*calc\(\s*var\(--bottom-nav-height/,
  "قائمة الدروس بلا حجز سفلي مضاعف",
);

console.log("scroll-layout-gap-gate.test.ts: ok");
