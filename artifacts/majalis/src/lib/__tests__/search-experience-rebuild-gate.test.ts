/**
 * بوابة تجربة البحث المعاد بناؤها: فهرس نظيف + أقسام + لا عنصر غير موجود.
 * node --import tsx src/lib/__tests__/search-experience-rebuild-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ISLAMIC_HISTORY_ITEMS } from "@/data/islamic-history";
import { PROPHETS } from "@/lib/prophets-data";
import { normalizeArabic } from "@/shared/arabic-normalize";
import {
  groupSearchResultsBySection,
  SEARCH_RESULT_SECTION_LABELS,
} from "@/features/search/search-result-sections";
import {
  sanitizeSearchResults,
  searchDedupKey,
  isUnusableSearchHref,
} from "@/features/search/search-sanitize";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const indexPath = resolve(root, "public/data/search/index.json");
assert.ok(existsSync(indexPath), "فهرس البحث موجود");
const index = JSON.parse(read("public/data/search/index.json")) as {
  docs: { id: string; kind: string; titleAr: string; href: string }[];
};

const histIds = new Set(ISLAMIC_HISTORY_ITEMS.map((i) => i.id));
const prophetSlugs = new Set(PROPHETS.map((p) => p.slug));

const knowledgeProphets = index.docs.filter((d) => (d.href || "").includes("/knowledge/prophets/"));
assert.equal(knowledgeProphets.length, 0, "لا نتائج أنبياء عبر /knowledge/prophets");

const knowledgeNations = index.docs.filter((d) => (d.href || "").includes("/knowledge/nations/"));
assert.equal(knowledgeNations.length, 0, "لا نتائج أمم عبر /knowledge/nations");

assert.equal(
  index.docs.some((d) => (d.href || "").split("?")[0] === "/knowledge/quiz"),
  false,
  "لا فهرسة /knowledge/quiz",
);

assert.equal(
  index.docs.some((d) => normalizeArabic(d.titleAr) === normalizeArabic("علم التفسير")),
  false,
  "لا عنوان مكرر «علم التفسير»",
);

for (const d of index.docs) {
  const href = (d.href || "").split("?")[0].split("#")[0];
  assert.ok(href && href !== "/search", `href صالح: ${d.id}`);
  if (href.startsWith("/tarikh-islami/") && href !== "/tarikh-islami") {
    const id = href.split("/")[2];
    assert.ok(histIds.has(id!), `تاريخ موجود: ${href}`);
  }
  if (href.startsWith("/prophets/") && !href.includes("/tree")) {
    const slug = href.split("/")[2];
    assert.ok(prophetSlugs.has(slug!), `نبي موجود: ${href}`);
  }
}

const prophetDocs = index.docs.filter((d) => d.kind === "prophet" && d.href.startsWith("/prophets/"));
assert.ok(prophetDocs.length >= PROPHETS.length, "كل الأنبياء مفهرسون على /prophets");

const seen = new Set<string>();
for (const d of index.docs) {
  const key = searchDedupKey({ title: d.titleAr, href: d.href, kind: d.kind });
  assert.equal(seen.has(key), false, `تكرار فهرس: ${key}`);
  seen.add(key);
}

const dirty = [
  { id: "a", kind: "tafsir", title: "التفسير", href: "/tafsir" },
  { id: "b", kind: "tafsir", title: "علم التفسير", href: "/tafsir" },
  { id: "c", kind: "tafsir", title: "تفسير", href: "/tafsir" },
  { id: "d", kind: "quiz", title: "بنك", href: "/knowledge/quiz" },
  { id: "e", kind: "prophet", title: "آدم عليه السلام", href: "/prophets/adam" },
];
const cleaned = sanitizeSearchResults(dirty);
assert.equal(cleaned.length, 2);
assert.ok(cleaned.every((x) => !isUnusableSearchHref(x.href)));

const sections = groupSearchResultsBySection(cleaned);
assert.ok(sections.every((s) => s.items.length > 0));
assert.ok(Object.values(SEARCH_RESULT_SECTION_LABELS).includes("الأنبياء"));
assert.equal(SEARCH_RESULT_SECTION_LABELS.history, "التاريخ الإسلامي");

const view = read("src/pages/account/ui/SearchView.tsx");
const cards = read("src/components/search/SearchResultCards.tsx");
const gen = read("scripts/generate-unified-search-index.mjs");
assert.match(view, /srch-hero/);
assert.match(view, /groupSearchResultsBySection/);
assert.match(view, /EMPTY\.searchShort|لا توجد نتائج مطابقة/);
assert.match(view, /EMPTY\.search/);
assert.match(view, /عمليات البحث الأخيرة|موضوعات شائعة/);
assert.match(cards, /ChevronLeft/);
assert.match(cards, /srch-result-card__icon/);
assert.doesNotMatch(cards, /#0A3D2E|#1F5C48|#0066|#0000ff/i);
assert.match(gen, /PROPHETS/);
assert.match(gen, /entityDedupKey|dedupeKeys/);
assert.match(gen, /section === "prophets"/);

assert.doesNotMatch(view + cards + gen, /عنصر غير موجود/);

console.log("search-experience-rebuild-gate.test.ts: ok");
