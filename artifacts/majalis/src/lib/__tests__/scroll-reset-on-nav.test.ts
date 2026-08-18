/**
 * بوابة: التمرير لأعلى عند مسار جديد؛ استعادة فقط عند الرجوع.
 * تشغيل: node --import tsx src/lib/__tests__/scroll-reset-on-nav.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const appSrc = readFileSync(join(dir, "../../App.tsx"), "utf8");
const helper = readFileSync(join(dir, "../scroll-document-top.ts"), "utf8");
const gate = readFileSync(join(dir, "../../../scripts/scroll-top-gate.mjs"), "utf8");

assert.match(appSrc, /function ScrollResetOnNav/);
assert.match(appSrc, /useLayoutEffect/);
assert.match(appSrc, /scrollPosByPath/);
assert.match(appSrc, /scrollDocumentToTop/);
assert.match(appSrc, /data-scroll-root/);
assert.match(appSrc, /captureScrollSnapshot/);
assert.match(appSrc, /restoreScrollSnapshot/);
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

assert.match(helper, /ROOT_SELECTORS/);
assert.doesNotMatch(helper, /scrollHeight/, "لا قراءة scrollHeight — تجنّب إعادة تدفّق قسرية");
assert.match(appSrc, /leavingLocation === location/);
assert.match(gate, /\/fiqh\/books\//);
assert.ok((gate.match(/"[/][^"]+"/g) ?? []).length >= 30, "بوابة ≥ ٣٠ مسارًا");

console.log("scroll-reset-on-nav.test.ts: ok");
