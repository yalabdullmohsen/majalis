/**
 * بوابة: الجنة/النار والملائكة تُصيَّر عبر TopicPage؛ الشرائح ARIA صحيحة.
 * node --import tsx src/lib/__tests__/topic-page-shell-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const topicPage = readFileSync(resolve(root, "src/components/topic/TopicPage.tsx"), "utf8");
const janna = readFileSync(resolve(root, "src/views/JannaNaarPage.tsx"), "utf8");
const malaika = readFileSync(resolve(root, "src/views/MalaikaPage.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/styles/components/topic-page.css"), "utf8");
const theme = readFileSync(resolve(root, "src/app/styles/theme.css"), "utf8");

assert.ok(topicPage.includes('role="tablist"'), "TopicPage: tablist");
assert.ok(topicPage.includes('role="tab"'), "TopicPage: tab");
assert.ok(topicPage.includes('role="tabpanel"'), "TopicPage: tabpanel");
assert.ok(topicPage.includes("aria-selected={selected}"), "TopicPage: aria-selected على التبويب");
assert.ok(topicPage.includes("aria-controls={panelId}"), "TopicPage: aria-controls");
assert.ok(/className="topic-page__hero on-dark(?:\s+safe-hero)?"/.test(topicPage), "TopicPage: hero on-dark");
assert.ok(topicPage.includes("syncTabParam"), "TopicPage: مزامنة ?tab=");

assert.ok(janna.includes('from "@/components/topic/TopicPage"'), "JannaNaar: يستورد TopicPage");
assert.ok(janna.includes("<TopicPage"), "JannaNaar: يصيّر TopicPage");
assert.ok(!janna.includes("jn-hero"), "JannaNaar: بلا hero قديم");
assert.ok(malaika.includes('from "@/components/topic/TopicPage"'), "Malaika: يستورد TopicPage");
assert.ok(malaika.includes("<TopicPage"), "Malaika: يصيّر TopicPage");
assert.ok(!malaika.includes("mk-hero"), "Malaika: بلا hero قديم");
assert.ok(!malaika.includes("mk-tabs"), "Malaika: بلا tabs قديمة");

assert.ok(css.includes("padding-bottom: calc(var(--nav-h"), "CSS: نطاق سفلي للـfab");
assert.ok(css.includes("--inset-top") || css.includes("inset-top"), "CSS: safe-area علوي عبر الفتات");
assert.ok(/mask-image|webkit-mask/.test(css), "CSS: تلاشٍ طرفي للشرائح");

assert.ok(/\.on-dark\s*\{[\s\S]*--foreground:\s*var\(--on-dark/.test(theme), "theme: .on-dark يعيد --foreground");
assert.ok(/\.on-dark\s*\{[\s\S]*--text:\s*var\(--on-dark/.test(theme), "theme: .on-dark يعيد --text");

console.log("topic-page-shell-gate.test.ts: ok");
