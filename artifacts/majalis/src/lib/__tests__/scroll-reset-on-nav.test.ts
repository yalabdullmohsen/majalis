/**
 * بوابة: التمرير لأعلى عند مسار جديد؛ استعادة فقط عند الرجوع.
 * تشغيل: node --import tsx src/lib/__tests__/scroll-reset-on-nav.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

const appSrc = read("src/App.tsx");
const scrollSrc = read("src/components/ScrollToTopOnRouteChange.tsx");
const barSrc = read("src/components/TopSectionBar.tsx");

assert.match(appSrc, /ScrollToTopOnRouteChange/);
assert.doesNotMatch(appSrc, /function ScrollResetOnNav/);
assert.match(scrollSrc, /export function ScrollToTopOnRouteChange/);
assert.match(scrollSrc, /useLayoutEffect/);
assert.match(scrollSrc, /scrollRestoration\s*=\s*["']manual["']/);
assert.match(scrollSrc, /isPop/);
assert.match(scrollSrc, /scroll-pos:/);
assert.match(scrollSrc, /sessionStorage/);
assert.match(scrollSrc, /data-scroll-root/);
assert.match(scrollSrc, /\.app-shell/);
assert.match(scrollSrc, /behavior:\s*["']instant["']/);
assert.doesNotMatch(
  appSrc,
  /SECTION_BAR_PATHS/,
  "شريط الأقسام لا يستعيد التمرير عند الدخول — أعلى الصفحة دائمًا",
);
assert.doesNotMatch(
  barSrc,
  /scrollIntoView/,
  "شريط الأقسام يمرّر الحاوية أفقياً بلا scrollIntoView على المستند",
);
assert.match(barSrc, /container\.scrollTo/);

const css = read("src/index.css");
assert.match(css, /scroll-margin-top/);

console.log("scroll-reset-on-nav.test.ts: ok");
