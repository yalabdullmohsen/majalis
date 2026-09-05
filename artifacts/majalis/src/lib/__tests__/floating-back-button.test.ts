/**
 * بوابة: زر الرجوع العائم العالمي (FloatingBackButton) يمر عبر AppBackButton الموحّد.
 * تشغيل: node --import tsx src/lib/__tests__/floating-back-button.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const fab = read("src/components/FloatingBackButton.tsx");
assert.match(fab, /AppBackButton/);
assert.match(fab, /variant="floating"/);
assert.match(fab, /autoHideFloating/);
assert.match(fab, /بدون شرط تمرير/);
assert.doesNotMatch(fab, /if \(deepScroll\) return null/);
assert.doesNotMatch(fab, /DEEP_SCROLL_PX/);
assert.doesNotMatch(fab, /ChevronUp/);
assert.doesNotMatch(fab, /goBackOrFallback\(/, "المنطق في AppBackButton فقط");

const appBack = read("src/components/common/AppBackButton.tsx");
assert.match(appBack, /data-floating-back=\{variant === "floating" \? "1" : undefined\}/);
assert.match(appBack, /goBackOrFallback/);
assert.match(appBack, /path === "\/support"/);
assert.match(appBack, /path === "\/contact"/);
assert.doesNotMatch(appBack, /\/prophets/, "قصص الأنبياء مشمولة في الزر العائم");

const legacy = read("src/components/GlobalBackButton.tsx");
assert.match(legacy, /FloatingBackButton/);

const app = read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx");
assert.match(app, /FloatingBackButton/);

const css = read("src/styles/final-release.css");
assert.match(css, /\.floating-back-btn[\s\S]*min-width:\s*44px/);
assert.match(css, /\.floating-back-btn[\s\S]*min-height:\s*44px/);
assert.match(css, /var\(--inset-bottom/);
assert.match(css, /translateZ\(0\)/);

console.log("floating-back-button.test.ts: ok");
