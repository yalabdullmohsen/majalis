/**
 * بوابة: Hadith Experience Redesign — Design Language + Discover + Reader.
 * node --import tsx src/lib/__tests__/hadith-experience-redesign-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const card = read("src/components/hadith/HadithCard.tsx");
const view = read("src/pages/hadith/ui/HadithView.tsx");
const guide = read("src/pages/hadith/ui/HadithClassGuide.tsx");
const byId = read("src/pages/hadith/ui/HadithByIdView.tsx");
const css = read("src/styles/pages/hadith-design-language.css");
const faq = read("src/components/hadith/HadithFaq.tsx");
const source = read("src/components/hadith/HadithSourceBlock.tsx");
const reader = read("src/components/hadith/HadithReaderSection.tsx");
const sahihPage = read("src/pages/hadith/HadithSahihPage.tsx");

console.log("=== Hadith Design Language ===");
assert.match(css, /--hdl-matn/);
assert.match(css, /hdl-role--matn/);
assert.match(card, /hdl-card/);
assert.match(card, /hdl-role--matn|hdl-card__matn/);
assert.match(card, /قراءة المزيد/);
assert.match(card, /soft-card/);
assert.match(card, /soft-card--on-light/);
assert.match(card, /hdl-card__footer/);

console.log("=== Discover: تبسيط الفلاتر ===");
assert.match(view, /hdl-discover/);
assert.doesNotMatch(view, /ds-filters-panel--desktop/);
assert.match(view, /FilterBottomSheet/);
assert.match(view, /العقيدة والإيمان/);
assert.match(view, /العبادات/);
assert.match(view, /الأخلاق/);
assert.doesNotMatch(view, /الزهد والرقائق/);
assert.doesNotMatch(view, /hadith-quick-cats/);
assert.match(view, /omitHeader/);

console.log("=== Reader + FAQ + Source ===");
assert.match(reader, /HadithInfoHero/);
assert.match(reader, /HadithReaderSection/);
assert.match(guide, /HadithInfoHero/);
assert.match(guide, /HadithReaderSection/);
assert.match(guide, /HadithFaq/);
assert.match(faq, /Accordion/);
assert.match(source, /hdl-source-block/);
assert.match(byId, /HadithSourceBlock/);
assert.match(byId, /hdl-role--matn/);
assert.match(sahihPage, /omitHeader/);

console.log("=== CSS wired ===");
assert.match(view, /hadith-design-language\.css/);
assert.match(guide, /hadith-design-language\.css/);

console.log("hadith-experience-redesign-gate.test.ts: ok");
