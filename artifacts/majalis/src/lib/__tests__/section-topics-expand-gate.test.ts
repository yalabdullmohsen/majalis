/**
 * بوابة: توسيع موضوعات الأقسام بلا تمدد فارغ / بلا متن كامل داخل البطاقة.
 * node --import tsx src/lib/__tests__/section-topics-expand-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.ok(existsSync(resolve(root, "src/lib/section-topics-expand.ts")));

const contract = read("src/lib/section-topics-expand.ts");
const layout = read("src/components/SectionAccordionLayout.tsx");
const css = read("src/styles/pages/section-hub.css");
const glossary = read("src/pages/account/ui/IslamicGlossaryView.tsx");
const pkg = read("package.json");

assert.match(contract, /INLINE_SECTION_TOPIC_LIMIT\s*=\s*8/);
assert.match(contract, /shouldInlineExpandTopics/);

assert.match(layout, /shouldInlineExpandTopics/);
assert.match(layout, /AppBottomSheet/);
assert.match(layout, /section-hub__topics--compact/);
assert.doesNotMatch(layout, /ابدأ الباب/);
assert.doesNotMatch(layout, /section-hub__cta--ghost/);

/* داخل الأكورديون المضغوط: لا حقن body لكل موضوع */
assert.match(layout, /compact \?[\s\S]*lesson\.summary/);
assert.match(layout, /!compact && lesson\.body/);

assert.match(css, /align-items:\s*start/);
assert.match(css, /min-height:\s*0/);
assert.doesNotMatch(css, /\.section-hub__card\s*\{[^}]*min-height:\s*100%/s);
assert.match(css, /section-hub__topic-summary--clamp/);

assert.match(glossary, /بطاقات المراجعة/);
assert.doesNotMatch(glossary, /راجِع بالبطاقات|راجع بالبطاقات/);

assert.match(pkg, /test:section-topics-expand/);

const {
  shouldInlineExpandTopics,
  INLINE_SECTION_TOPIC_LIMIT,
} = await import("../section-topics-expand.ts");

assert.equal(INLINE_SECTION_TOPIC_LIMIT, 8);
assert.equal(shouldInlineExpandTopics(0), false);
assert.equal(shouldInlineExpandTopics(7), true);
assert.equal(shouldInlineExpandTopics(8), false);
assert.equal(shouldInlineExpandTopics(20), false);

console.log("section-topics-expand-gate.test.ts: ok");
