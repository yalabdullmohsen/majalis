/**
 * بوابة: التمرير لأعلى عند مسار جديد؛ استعادة فقط عند الرجوع.
 * تشغيل: node --import tsx src/lib/__tests__/scroll-reset-on-nav.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const appSrc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../App.tsx"),
  "utf8",
);

assert.match(appSrc, /function ScrollResetOnNav/);
assert.match(appSrc, /useLayoutEffect/);
assert.match(appSrc, /scrollPosByPath/);
assert.match(appSrc, /scrollRestoration\s*=\s*["']manual["']/);
assert.match(appSrc, /isPop/);
assert.doesNotMatch(
  appSrc,
  /SECTION_BAR_PATHS/,
  "شريط الأقسام لا يستعيد التمرير عند الدخول — أعلى الصفحة دائمًا",
);
assert.doesNotMatch(
  appSrc,
  /scroll-pos:/,
  "المواضع في خريطة ذاكرة لا sessionStorage",
);

console.log("scroll-reset-on-nav.test.ts: ok");
