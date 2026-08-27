/**
 * بوابة — لا أيقونة absolute فوق شارة/نص هيرو الفقه، ووجود قاعدة safe-hero.
 * Run: node --import tsx src/lib/__tests__/safe-hero-overlap-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const view = read("src/pages/fiqh/ui/FiqhView.tsx");
const fiqhCss = read("src/styles/pages/fiqh-hub.css");
const safe = read("src/styles/components/safe-hero.css");
const topic = read("src/styles/components/topic-page.css");
const topicTsx = read("src/components/topic/TopicPage.tsx");

assert.match(view, /safe-hero/);
assert.match(view, /fiqh-lux-hero__lead/);
assert.match(view, /safe-hero__badge/);
assert.doesNotMatch(
  fiqhCss,
  /\.fiqh-lux-hero__icon\s*\{[^}]*position:\s*absolute/,
  "أيقونة هيرو الفقه ليست absolute فوق النص",
);
assert.match(fiqhCss, /\.fiqh-lux-hero__icon\s*\{[\s\S]*?position:\s*static/);
assert.match(fiqhCss, /\.fiqh-lux-hero__badge\s*\{[\s\S]*?white-space:\s*normal/);
assert.match(fiqhCss, /padding-inline-end:\s*2\.85rem/);
assert.match(fiqhCss, /padding:\s*1rem 1rem 2\.85rem/);

assert.match(safe, /\.safe-hero\s*\{/);
assert.match(safe, /\.safe-hero__body/);
assert.match(safe, /\.safe-hero__decor/);
assert.match(safe, /z-index:\s*2/);
assert.match(safe, /pointer-events:\s*none/);

assert.match(topicTsx, /safe-hero/);
assert.match(topic, /isolation:\s*isolate/);
assert.match(topic, /\.topic-page__eyebrow[\s\S]*?white-space:\s*normal/);

console.log("safe-hero-overlap-gate: ok");
