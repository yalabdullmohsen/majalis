/**
 * بوابة ترتيب بوابة الفقه وتصميم البطاقات.
 * تشغيل: node --import tsx src/lib/__tests__/fiqh-hub-layout-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFiqhDoorSummaries,
  FIQH_HUB_DOOR_ORDER,
  FIQH_START_HERE_DOORS,
  resolveBookDoor,
} from "@/lib/fiqh/fiqhNormalize";
import { getAllFiqhBooks } from "@/lib/fiqh-books";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const view = readFileSync(resolve(root, "src/pages/fiqh/ui/FiqhView.tsx"), "utf8");
const card = readFileSync(resolve(root, "src/components/fiqh/FiqhCategoryCard.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/styles/pages/fiqh-hub.css"), "utf8");

assert.match(view, /أبواب مرتبة للمبتدئ/);
assert.match(view, /hasVerifiedIssueCount && d.issueCount > 0/);
assert.match(view, /ابدأ من هنا/);
assert.match(view, /أبواب الفقه/);
assert.match(view, /مسائل مختارة/);
assert.match(view, /FIQH_START_HERE_DOORS/);
assert.match(card, /سيضاف محتوى هذا الباب قريبًا/);
assert.doesNotMatch(card, /FIQH_STATUS_LABELS/);
assert.match(css, /grid-template-columns:\s*repeat\(2/);
assert.match(css, /fiqh-category-card--ibadat/);
assert.match(css, /fiqh-category-card--muamalat/);
assert.match(css, /fiqh-category-card--usrah/);
assert.match(css, /fiqh-category-card--qada_jinayat/);
assert.match(css, /max-height:\s*7\.5rem/);

assert.deepEqual([...FIQH_START_HERE_DOORS], ["tahara", "salah", "zakat", "sawm", "hajj"]);
assert.deepEqual(
  [...FIQH_HUB_DOOR_ORDER].slice(0, 8),
  ["tahara", "salah", "janaza", "zakat", "sawm", "hajj", "buyu", "nikah"],
);

const books = getAllFiqhBooks();
const byId = Object.fromEntries(books.map((b) => [b.id, b]));
assert.equal(resolveBookDoor(byId.diyat), "diyat");
assert.equal(resolveBookDoor(byId.hudud), "hudud");
assert.equal(resolveBookDoor(byId.jihad), "jihad");
assert.equal(resolveBookDoor(byId.faraid), "faraid");
assert.equal(resolveBookDoor(byId.shahadat), "shahadat");
assert.equal(resolveBookDoor(byId.iqrar), "iqrar");
assert.equal(resolveBookDoor(byId.raja), "iddah_rida");

const summaries = buildFiqhDoorSummaries();
for (const id of FIQH_HUB_DOOR_ORDER) {
  assert.ok(summaries.some((d) => d.id === id), `ملخص الباب موجود: ${id}`);
}

console.log("fiqh-hub-layout-gate.test.ts: ok");
