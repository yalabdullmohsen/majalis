/**
 * بوابة PR-2: بطاقة معرفة مختصرة + صفحة تفاصيل بلا توسعة داخل القائمة.
 * تشغيل: node --import tsx src/lib/__tests__/knowledge-summary-card-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  hasKnowledgeDetailContent,
  type KnowledgeDetailSection,
} from "../knowledge-detail";
import {
  clearKnowledgeListState,
  loadKnowledgeListState,
  saveKnowledgeListState,
} from "../knowledge-list-scroll";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const card = read("src/components/knowledge/KnowledgeSummaryCard.tsx");
const surface = read("src/components/knowledge/KnowledgeDetailSurface.tsx");
const css = read("src/styles/components/knowledge-summary-card.css");
const sectsList = read("src/views/IslamicSectsPage.tsx");
const sectsDetail = read("src/views/IslamicSectsDetailPage.tsx");
const madhahibList = read("src/views/MadhahibPage.tsx");
const madhahibDetail = read("src/views/MadhahibDetailPage.tsx");
const routes = read("src/AppRoutes.tsx");
const routeRegistry = read("src/app/router/routes.ts");

assert.match(card, /KnowledgeSummaryCard/);
assert.match(card, /عرض التفاصيل/);
assert.doesNotMatch(card, /aria-expanded/);
assert.match(surface, /KnowledgeDetailSurface/);
assert.match(surface, /hasKnowledgeDetailContent/);

assert.match(css, /\.kx-summary-card\s*\{/);
assert.doesNotMatch(css, /border-inline-start:\s*[34]px/);
assert.doesNotMatch(css, /border-inline-start-width:\s*[34]px/);

assert.match(sectsList, /KnowledgeSummaryCard/);
assert.doesNotMatch(sectsList, /sect-card__detail/);
assert.doesNotMatch(sectsList, /aria-expanded/);
assert.match(sectsList, /saveKnowledgeListState/);
assert.match(sectsDetail, /KnowledgeDetailSurface/);
assert.match(sectsDetail, /TopicPage/);
assert.doesNotMatch(sectsDetail, /FloatingBackButton/);

assert.match(madhahibList, /KnowledgeSummaryCard/);
assert.doesNotMatch(madhahibList, /aria-expanded/);
assert.doesNotMatch(madhahibList, /mdb-card__body/);
assert.match(madhahibDetail, /KnowledgeDetailSurface/);

assert.match(routes, /\/islamic-sects\/:id/);
assert.match(routes, /\/madhahib\/:id/);
assert.match(routeRegistry, /\/islamic-sects\/:id/);
assert.match(routeRegistry, /\/madhahib\/:id/);

// لا قسم فارغ
assert.equal(
  hasKnowledgeDetailContent({ id: "x", title: "ت", prose: "" }),
  false,
);
assert.equal(
  hasKnowledgeDetailContent({ id: "x", title: "ت", items: [] }),
  false,
);
assert.equal(
  hasKnowledgeDetailContent({ id: "x", title: "ت", prose: "نص" }),
  true,
);

const emptyFields: KnowledgeDetailSection = {
  id: "f",
  title: "حقول",
  fields: [{ label: "أ", value: "" }],
};
assert.equal(hasKnowledgeDetailContent(emptyFields), false);

// حفظ موضع القائمة (polyfill لـ sessionStorage في بيئة Node)
const mem = new Map<string, string>();
(globalThis as { sessionStorage?: Storage }).sessionStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => {
    mem.set(k, v);
  },
  removeItem: (k: string) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: () => null,
  get length() {
    return mem.size;
  },
} as Storage;

const pathKey = "/islamic-sects-test-gate";
clearKnowledgeListState(pathKey);
saveKnowledgeListState(pathKey, {
  scrollY: 420,
  search: "أشعر",
  category: "مدرسة عقدية",
  status: "قائمة",
});
const loaded = loadKnowledgeListState(pathKey);
assert.ok(loaded);
assert.equal(loaded?.scrollY, 420);
assert.equal(loaded?.search, "أشعر");
assert.equal(loaded?.category, "مدرسة عقدية");
clearKnowledgeListState(pathKey);
assert.equal(loadKnowledgeListState(pathKey), null);

console.log("knowledge-summary-card-gate.test.ts: ok");
