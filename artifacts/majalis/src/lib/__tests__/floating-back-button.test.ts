/**
 * بوابة: الرجوع العائم الثابت مُلغى؛ الرجوع عبر AppBackButton داخل التدفق.
 * تشغيل: node --import tsx src/lib/__tests__/floating-back-button.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const fab = read("src/components/FloatingBackButton.tsx");
assert.match(fab, /return null/);
assert.match(fab, /أُلغي|ملغى|يغطي المحتوى/);
assert.doesNotMatch(fab, /variant="floating"/);
assert.doesNotMatch(fab, /ChevronUp/);

const appBack = read("src/components/common/AppBackButton.tsx");
assert.match(appBack, /goBackOrFallback/);
assert.match(appBack, /data-floating-back=\{variant === "floating" \? "1" : undefined\}/);

const legacy = read("src/components/GlobalBackButton.tsx");
assert.match(legacy, /FloatingBackButton/);

const app = read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx");
assert.match(app, /FloatingBackButton/);

const polish = read("src/styles/sections-calm-polish.css");
assert.match(polish, /\.floating-back-btn[\s\S]*?display:\s*none/);
assert.match(polish, /\.scroll-to-top[\s\S]*?inset-inline-end/);

const hero = read("src/components/topic/SectionHero.tsx");
assert.match(hero, /AppBackButton/);
assert.match(hero, /section-hero__back/);

console.log("floating-back-button.test.ts: ok");
