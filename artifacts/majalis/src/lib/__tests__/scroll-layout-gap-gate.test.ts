/**
 * بوابة: لا فراغ علوي عند إخفاء الكروم، وتمرير وثيقة واحد على الجوال.
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

assert.match(
  chrome,
  /\.app-shell\.app-chrome-hidden\s+\.app-top-chrome[\s\S]*?height:\s*0\s*!important/,
  "إخفاء الكروم ينهي حجز الارتفاع (لا فراغ منتصف الشاشة)",
);
assert.match(
  chrome,
  /\.app-shell\.app-chrome-hidden\s+\.app-top-chrome[\s\S]*?min-height:\s*0\s*!important/,
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
  finalCss,
  /@media\s*\(max-width:\s*879px\)[\s\S]*?\.app-shell\s*\{[\s\S]*?overflow:\s*visible\s*!important/,
);
assert.match(
  finalCss,
  /padding-bottom:\s*calc\(\s*var\(--bottom-nav-height,\s*84px\)\s*\+\s*var\(--inset-bottom/,
);
assert.doesNotMatch(
  finalCss.replace(/html\.pts-immersive[\s\S]*?(?=@media|$)/g, ""),
  /@media\s*\(max-width:\s*879px\)[\s\S]*?\.app-shell\s*\{[^}]*overflow:\s*hidden\s*!important/,
  "لا overflow:hidden على صدفة الجوال العامة",
);

console.log("scroll-layout-gap-gate.test.ts: ok");
