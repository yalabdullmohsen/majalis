/**
 * بوابة: زر الرجوع العائم العام عبر AppBackButton؛ شبكات الأقسام متمركزة.
 * تشغيل: node --import tsx src/lib/__tests__/floating-back-button.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const fab = read("src/components/FloatingBackButton.tsx");
assert.match(fab, /variant="floating"/);
assert.match(fab, /AppBackButton/);
assert.doesNotMatch(fab, /return null/);
assert.doesNotMatch(fab, /ChevronUp/);

const appBack = read("src/components/common/AppBackButton.tsx");
assert.match(appBack, /goBackOrFallback/);
assert.match(appBack, /getPreviousInternalRoute/);
assert.match(appBack, /sectionAwareFallback/);
assert.match(appBack, /data-floating-back=\{variant === "floating" \? "1" : undefined\}/);

const legacy = read("src/components/GlobalBackButton.tsx");
assert.match(legacy, /FloatingBackButton/);

const app = read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx");
assert.match(app, /FloatingBackButton|GlobalBackButton/);

const polish = read("src/styles/sections-calm-polish.css");
assert.match(polish, /right:\s*calc\(var\(--inset-right/);
assert.match(polish, /display:\s*flex\s*!important/);
assert.match(polish, /\.scroll-to-top[\s\S]*?inset-inline-end/);

const hub = read("src/styles/components/hub-card.css");
assert.match(hub, /margin-inline:\s*auto/);
assert.match(hub, /justify-content:\s*center/);
assert.doesNotMatch(hub, /padding-inline-start:\s*3\.25rem/);

const hero = read("src/components/topic/SectionHero.tsx");
assert.match(hero, /AppBackButton/);
assert.match(hero, /section-hero__back/);

console.log("floating-back-button.test.ts: ok");
