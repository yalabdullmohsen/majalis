/**
 * بوابة نظام المجموعات المعرفية L1–L4.
 * node --import tsx src/lib/__tests__/knowledge-collection-l1-l4-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const comps = [
  "CollectionHero.tsx",
  "CategoryCard.tsx",
  "TopicListItem.tsx",
  "TopicReaderPage.tsx",
  "TopicSourceBlock.tsx",
  "PreviousNextNavigation.tsx",
  "KnowledgeCollectionSystem.tsx",
];
for (const f of comps) {
  assert.ok(
    existsSync(resolve(root, `src/components/knowledge-collection/${f}`)),
    `مفقود: ${f}`,
  );
}

const system = read("src/components/knowledge-collection/KnowledgeCollectionSystem.tsx");
const css = read("src/styles/pages/knowledge-collection.css");
const routes = read("src/AppRoutes.tsx");
const shim = read("src/components/SectionAccordionLayout.tsx");

assert.match(system, /data-kc-level="collection"/);
assert.match(system, /data-kc-level="category"/);
assert.match(system, /data-kc-level="reader"/);
assert.doesNotMatch(system, /AppBottomSheet/);
assert.doesNotMatch(system.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*/g, ""), /\bDialog\b|\bModal\b/);
assert.match(shim, /KnowledgeCollectionSystem/);

assert.match(css, /--kc-bg/);
assert.match(css, /repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
assert.match(css, /repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
assert.doesNotMatch(css, /max-width:\s*42rem[\s\S]{0,40}\.kc-category-grid/);

assert.match(routes, /iman-topics\/:categoryId\/:topicId/);
assert.match(routes, /maqasid-sharia\/:categoryId\/:topicId/);
assert.match(routes, /dalail-nubuwwah\/:categoryId\/:topicId/);

console.log("knowledge-collection-l1-l4-gate.test.ts: ok");
