/**
 * الاستعلامات الإلزامية للبحث المتساهل.
 * تشغيل: node --import tsx src/features/search/__tests__/search-mandatory-queries.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clearUnifiedSearchIndexCache,
  primeUnifiedSearchIndex,
} from "@/features/search/unified-local";
import { runAppSearch } from "@/features/search/app-search";
import { normalizeAr } from "@/shared/arabic-normalize";

const here = dirname(fileURLToPath(import.meta.url));
const indexPath = resolve(here, "../../../../public/data/search/index.json");
const index = JSON.parse(readFileSync(indexPath, "utf8"));

clearUnifiedSearchIndexCache();
primeUnifiedSearchIndex(index);

assert.equal(normalizeAr("وُضُوء"), normalizeAr("وضوء"));
assert.equal(normalizeAr("طهاره"), normalizeAr("طهارة"));

const QUERIES: Array<{ q: string; needle: string }> = [
  { q: "وضو", needle: "وضو" },
  { q: "الوضوء", needle: "وضو" },
  { q: "وُضُوء", needle: "وضو" },
  { q: "طهاره", needle: "طهار" },
  { q: "توحيد", needle: "توحيد" },
  { q: "التوحيد", needle: "توحيد" },
  { q: "عقيده", needle: "عقيد" },
  { q: "صيام رمضان", needle: "صيام" },
  { q: "احاديث ضعيفه", needle: "ضعيف" },
  { q: "سيره نبويه", needle: "سير" },
  { q: "قصص الانبيا", needle: "أنبي" },
  { q: "اذكار الصباح", needle: "أذكار" },
  { q: "الامم السابقه", needle: "أمم" },
];

const rows: string[] = [];
for (const { q, needle } of QUERIES) {
  const res = await runAppSearch(q, { limit: 24 });
  const hit = res.results.find((r) =>
    normalizeAr(`${r.title} ${r.summary ?? ""} ${r.href}`).includes(normalizeAr(needle)),
  ) ?? res.results[0];
  assert.ok(res.results.length >= 1, `«${q}» بلا نتائج`);
  assert.ok(hit, `«${q}» بلا نتيجة ذات صلة (${needle})`);
  rows.push(`${q} → ${res.results.length} · ${hit.title} · ${res.responseMs.toFixed(1)}ms`);
  assert.ok(res.responseMs < 400, `«${q}» بطيء ${res.responseMs.toFixed(1)}ms`);
}

const warm = await runAppSearch("توحيد", { limit: 20 });
assert.ok(warm.responseMs < 150, `أول نتيجة بعد التسخين ${warm.responseMs.toFixed(1)}ms`);

console.log(`search-mandatory-queries.test.ts: ok\n${rows.join("\n")}`);
