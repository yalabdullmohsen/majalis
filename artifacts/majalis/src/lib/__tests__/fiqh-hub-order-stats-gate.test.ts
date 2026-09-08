/**
 * بوابة: ترتيب أبواب الفقه + الإحصاءات من البيانات لا أرقام يدوية.
 * Run: node --import tsx src/lib/__tests__/fiqh-hub-order-stats-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FIQH_HUB_DOOR_ORDER } from "../fiqh/fiqhNormalize.ts";
import { FIQH_HUB_STATS } from "../fiqh-hub-stats.ts";
import { getAllFiqhBooks, fiqhBookCounts } from "../fiqh-books.ts";

const expectedPrefix = [
  "tahara",
  "salah",
  "zakat",
  "sawm",
  "itikaf",
  "hajj",
  "janaza",
  "muamalat",
] as const;

assert.deepEqual(FIQH_HUB_DOOR_ORDER.slice(0, expectedPrefix.length), [...expectedPrefix]);

/** ترتيب بطاقات FIQH_HUB_TOPICS للأبواب الأساسية */
{
  const topicsSrc = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../fiqh-hub-topics.ts"), "utf8");
  const ids = [...topicsSrc.matchAll(/id:\s*"(tahara|salah|zakat|sawm|itikaf|hajj|janaza|muamalat)"/g)].map(
    (m) => m[1],
  );
  const firstEight = [];
  for (const id of ids) {
    if (firstEight.includes(id)) continue;
    firstEight.push(id);
    if (firstEight.length >= 8) break;
  }
  assert.deepEqual(firstEight, [...expectedPrefix], "FIQH_HUB_TOPICS: ترتيب الأبواب الثمانية");
}

const books = getAllFiqhBooks();
let chapters = 0;
let lessons = 0;
for (const b of books) {
  const c = fiqhBookCounts(b);
  chapters += c.chapters;
  lessons += c.lessons;
}
assert.equal(FIQH_HUB_STATS.books, books.length);
assert.equal(FIQH_HUB_STATS.chapters, chapters);
assert.equal(FIQH_HUB_STATS.lessons, lessons);
assert.ok(FIQH_HUB_STATS.books > 0);

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const statsSrc = readFileSync(resolve(root, "src/lib/fiqh-hub-stats.ts"), "utf8");
assert.doesNotMatch(statsSrc, /books:\s*\d+/);

console.log("fiqh-hub-order-stats-gate: ok", FIQH_HUB_STATS);
