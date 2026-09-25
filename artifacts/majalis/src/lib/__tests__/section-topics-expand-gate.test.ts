/**
 * بوابة: نظام المجموعات المعرفية L1–L4 — بلا شيت مواضيع.
 * node --import tsx src/lib/__tests__/section-topics-expand-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.ok(existsSync(resolve(root, "src/components/knowledge-collection/KnowledgeCollectionSystem.tsx")));
assert.ok(existsSync(resolve(root, "src/components/knowledge-collection/TopicReaderPage.tsx")));
assert.ok(existsSync(resolve(root, "src/styles/pages/knowledge-collection.css")));

const system = read("src/components/knowledge-collection/KnowledgeCollectionSystem.tsx");
const reader = read("src/components/knowledge-collection/TopicReaderPage.tsx");
const layoutShim = read("src/components/SectionAccordionLayout.tsx");
const css = read("src/styles/pages/knowledge-collection.css");
const routes = read("src/AppRoutes.tsx");
const pkg = read("package.json");
const glossary = read("src/pages/account/ui/IslamicGlossaryView.tsx");

/* النظام الجديد: بلا BottomSheet للمواضيع */
assert.match(system, /KnowledgeCollectionSystem/);
assert.match(system, /data-kc-level/);
assert.doesNotMatch(system, /AppBottomSheet/);
assert.doesNotMatch(system, /عرض الموضوعات/);
assert.match(reader, /kc-topic-reader/);
assert.match(layoutShim, /KnowledgeCollectionSystem/);

/* iPad: 3–4 أعمدة */
assert.match(css, /grid-template-columns:\s*repeat\(3/);
assert.match(css, /grid-template-columns:\s*repeat\(4/);
assert.match(css, /max-width:\s*min\(1120px/);

/* مسارات متداخلة */
assert.match(routes, /\/iman-topics\/:categoryId\/:topicId/);
assert.match(routes, /\/tazkiya-topics\/:categoryId\/:topicId/);
assert.match(routes, /\/maqasid-sharia\/:categoryId\/:topicId/);

assert.match(glossary, /بطاقات المراجعة/);
assert.doesNotMatch(glossary, /راجِع بالبطاقات|راجع بالبطاقات/);
assert.match(pkg, /test:section-topics-expand/);

/* العقد القديم تبقى متاحة للتوافق إن وُجدت */
if (existsSync(resolve(root, "src/lib/section-topics-expand.ts"))) {
  const contract = read("src/lib/section-topics-expand.ts");
  assert.match(contract, /INLINE_SECTION_TOPIC_LIMIT/);
}

console.log("section-topics-expand-gate.test.ts: ok");
