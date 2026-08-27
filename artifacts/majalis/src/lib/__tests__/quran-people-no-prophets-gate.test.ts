/**
 * بوابة: الذين ذكروا في القرآن بلا أنبياء (قسم /prophets مستقل).
 * تشغيل: node --import tsx src/lib/__tests__/quran-people-no-prophets-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const types = read("src/features/quran-people/types.ts");
const view = read("src/pages/quran/ui/QuranPeopleView.tsx");
const detail = read("src/pages/quran/ui/QuranPersonDetailView.tsx");
const seo = read("scripts/generate-seo.mjs");
const search = read("scripts/generate-unified-search-index.mjs");

assert.match(types, /category !== "prophet"|!isProphetPerson/);
assert.match(types, /LISTABLE_PERSON_CATEGORIES/);
assert.doesNotMatch(
  types,
  /LISTABLE_PERSON_CATEGORIES:\s*PersonCategory\[\]\s*=\s*\[[^\]]*"prophet"/,
);
assert.match(view, /LISTABLE_PERSON_CATEGORIES/);
assert.match(view, /من غير الأنبياء/);
assert.match(detail, /getProphetPeopleRedirect/);
assert.match(detail, /Redirect/);
assert.match(seo, /category !== "prophet"/);
assert.match(search, /category === "prophet"/);

console.log("quran-people-no-prophets-gate.test.ts: ok");
