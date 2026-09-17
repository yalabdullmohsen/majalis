/**
 * Wave 11 — عبادة/أذكار عرض + ربط مؤلّفين بملفات العلماء.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave11-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAuthorScholarLink } from "../author-scholar-links";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const adhkar = read("src/pages/worship/ui/AdhkarView.tsx");
assert.match(adhkar, /truncateAtWord/, "SEO الأذكار يقتص عند حدود الكلمة");
assert.doesNotMatch(adhkar, /description\.slice\(0,\s*140\)/, "بلا قطع منتصف الوصف");

const aliases = JSON.parse(read("src/data/islamic-history/author-aliases.json")) as Array<{
  legacyId: string;
  href: string;
}>;
const expected: Record<string, string> = {
  malik: "/scholars/malik",
  nawawi: "/scholars/nawawi",
  "abu-hanifa": "/scholars/abu-hanifa",
  shafi: "/scholars/shafii",
  ahmad: "/scholars/ahmad",
  bukhari: "/scholars/bukhari",
  muslim: "/scholars/muslim",
  "ibn-taymiyya": "/scholars/ibn-taymiyyah",
  "ibn-kathir": "/scholars/ibn-kathir",
};
for (const [id, href] of Object.entries(expected)) {
  const row = aliases.find((a) => a.legacyId === id);
  assert.ok(row, `alias ${id}`);
  assert.equal(row!.href, href, `${id} → scholars`);
}

const malik = resolveAuthorScholarLink("الإمام مالك");
assert.equal(malik.href, "/scholars/malik");
assert.equal(malik.scholarId, "malik");

const unknown = resolveAuthorScholarLink("مؤلف بلا تطابق موثوق xyz");
assert.equal(unknown.href, null, "بلا رابط /search وهمي");

console.log("content-quality-wave11-gate.test.ts: ok");
