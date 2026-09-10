/**
 * بوابة: دفعة المكوّنات المشتركة تستخدم SsText بلا نص خام في القوالب.
 * node --import tsx src/lib/__tests__/ssunnah-typography-batch1-shared-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const files = {
  pageHero: "src/components/ui/PageHero.tsx",
  sectionHero: "src/components/topic/SectionHero.tsx",
  topicPage: "src/components/topic/TopicPage.tsx",
  hubCard: "src/components/ui/HubCard.tsx",
  compact: "src/components/ui/CompactSectionHeader.tsx",
  accordion: "src/components/SectionAccordionLayout.tsx",
  api: "src/styles/ssunnah-theme-api.css",
};

for (const [key, rel] of Object.entries(files)) {
  const src = read(rel);
  assert.match(src, /design-system\/text|ss-text/, `${key}: يستورد/يربط نظام النص`);
}

const pageHero = read(files.pageHero);
assert.match(pageHero, /ScreenTitle/);
assert.doesNotMatch(pageHero, /<h1[\s>]/, "PageHero بلا h1 خام");

const sectionHero = read(files.sectionHero);
assert.match(sectionHero, /ScriptureText/);
assert.doesNotMatch(sectionHero, /<h1 className="topic-page__title"/);

const hub = read(files.hubCard);
assert.match(hub, /CardTitle/);
assert.doesNotMatch(hub, /<h3 className="hub-card__title"/);

const accordion = read(files.accordion);
assert.doesNotMatch(accordion, /fontSize:\s*["']0\.95rem["']/);
assert.doesNotMatch(accordion, /#[0-9A-Fa-f]{6}/, "ألوان البطاقات عبر tokens لا هكس");

const api = read(files.api);
assert.match(api, /\.page-hero-mj--bleed \.ss-text/, "جسر لون الهيرو الداكن");

console.log("ssunnah-typography-batch1-shared-gate.test.ts: ok");
