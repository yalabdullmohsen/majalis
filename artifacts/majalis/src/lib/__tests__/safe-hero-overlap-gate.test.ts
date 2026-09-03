/**
 * بوابة — رأس الفقه مضغوط بلا تداخل أيقونة، ووجود قاعدة safe-hero لصفحات المواضيع.
 * Run: node --import tsx src/lib/__tests__/safe-hero-overlap-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const view = read("src/pages/fiqh/ui/FiqhView.tsx");
const compact = read("src/components/ui/CompactSectionHeader.tsx");
const compactCss = read("src/components/ui/compact-section-header.css");
const safe = read("src/styles/components/safe-hero.css");
const topic = read("src/styles/components/topic-page.css");
const topicTsx = read("src/components/topic/TopicPage.tsx");

assert.match(view, /CompactSectionHeader/);
assert.doesNotMatch(view, /FiqhLuxHero|fiqh-lux-hero/);
assert.match(compact, /compact-section-header__icon/);
assert.match(compactCss, /\.compact-section-header__icon[\s\S]*?flex-shrink:\s*0/);
assert.doesNotMatch(
  compactCss,
  /\.compact-section-header__icon\s*\{[^}]*position:\s*absolute/,
  "أيقونة الرأس المضغوط ليست absolute فوق النص",
);

assert.match(safe, /\.safe-hero\s*\{/);
assert.match(safe, /\.safe-hero__body/);
assert.match(safe, /\.safe-hero__decor/);
assert.match(safe, /z-index:\s*2/);
assert.match(safe, /pointer-events:\s*none/);

assert.match(topicTsx, /safe-hero/);
assert.match(topic, /isolation:\s*isolate/);
assert.match(topic, /\.topic-page__eyebrow[\s\S]*?white-space:\s*normal/);

console.log("safe-hero-overlap-gate: ok");
