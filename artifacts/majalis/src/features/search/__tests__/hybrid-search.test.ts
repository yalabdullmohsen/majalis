/**
 * محرك البحث الهجين — دمج + عناوين مجموعات الإكمال.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeHybridResults } from "@/features/search/hybrid-search";
import {
  AUTOCOMPLETE_GROUP_LABELS,
  runAutocomplete,
  type AutocompleteGroupId,
} from "@/features/search/autocomplete";
import {
  clearUnifiedSearchIndexCache,
  primeUnifiedSearchIndex,
  type UnifiedSearchDoc,
} from "@/features/search/unified-local";
import type { AppSearchResult } from "@/features/search/app-search";

const lexical: AppSearchResult[] = [
  {
    id: "l1",
    kind: "quran",
    title: "آية",
    summary: "صيام",
    href: "/mushaf?ayah=2:183",
    match: { kind: "substring", rank: 2, distance: 0, matchedNorm: "صيام" },
  },
];
const semantic: AppSearchResult[] = [
  {
    id: "s1",
    kind: "hadith",
    title: "حديث",
    summary: "مسافر",
    href: "/hadith/1",
  },
  {
    id: "l1",
    kind: "quran",
    title: "آية",
    summary: "صيام",
    href: "/mushaf?ayah=2:183",
  },
];

const merged = mergeHybridResults(lexical, semantic);
assert.equal(merged.results.length, 2, "دمج بدون تكرار href");
assert.equal(merged.semanticHits, 2, "عدّ النتائج الدلالية");
assert.ok(
  merged.results.some((h) => h.href === "/mushaf?ayah=2:183" && h.match?.rank === 0),
  "رفع ترتيب التقاطع الدلالي",
);
assert.ok(
  merged.results.some((h) => h.href === "/hadith/1"),
  "إضافة نتيجة دلالية جديدة",
);

assert.equal(AUTOCOMPLETE_GROUP_LABELS.quran, "آيات قرآنية");
assert.equal(AUTOCOMPLETE_GROUP_LABELS.hadith, "أحاديث نبوية");
assert.equal(AUTOCOMPLETE_GROUP_LABELS.books, "كتب وفقه");
assert.equal(AUTOCOMPLETE_GROUP_LABELS.scholars, "ترجمة علماء");

const order: AutocompleteGroupId[] = ["quran", "hadith", "books", "scholars"];
assert.deepEqual(Object.keys(AUTOCOMPLETE_GROUP_LABELS), order);

const here = dirname(fileURLToPath(import.meta.url));
const indexPath = resolve(here, "../../../../public/data/search/index.json");
const index = JSON.parse(readFileSync(indexPath, "utf8")) as {
  version: number;
  docs: UnifiedSearchDoc[];
};
clearUnifiedSearchIndexCache();
primeUnifiedSearchIndex(index);

const ac = await runAutocomplete("بقر", { perGroup: 4 });
assert.ok(ac.responseMs < 500, `autocomplete سريع (${ac.responseMs}ms)`);
assert.ok(ac.groups.some((g) => g.items.length > 0), "مجموعات autocomplete غير فارغة");
assert.equal(ac.source, "local-index");

console.log("hybrid-search.test.ts: ok");
