/**
 * تقريب عدّادات البطاقات — node --import tsx src/lib/__tests__/format-count-bucket.test.ts
 */
import assert from "node:assert/strict";
import { formatCountBucket } from "../format-count-bucket";
import { pluralArBucket, NOUN_DURUS, NOUN_HALAQAT, NOUN_MUNASABAT, NOUN_MUSABAQAT } from "../arabic-count";

assert.equal(formatCountBucket(0), "٠");
assert.equal(formatCountBucket(9), "٩");
assert.equal(formatCountBucket(10), "١٠+");
assert.equal(formatCountBucket(28), "٢٠+");
assert.equal(formatCountBucket(35), "٣٠+");
assert.equal(formatCountBucket(53), "٥٠+");
assert.equal(formatCountBucket(97), "٩٠+");

assert.equal(pluralArBucket(0, NOUN_MUSABAQAT), "لا مسابقات حالية");
assert.equal(pluralArBucket(0, NOUN_DURUS), "لا دروس");
assert.equal(pluralArBucket(1, NOUN_DURUS), "درس");
assert.equal(pluralArBucket(2, NOUN_HALAQAT), "حلقتان");
assert.equal(pluralArBucket(5, NOUN_DURUS), "٥ دروس");
assert.equal(pluralArBucket(28, NOUN_HALAQAT), "٢٠+ حلقة");
assert.equal(pluralArBucket(35, NOUN_MUNASABAT), "٣٠+ مناسبة");
assert.equal(pluralArBucket(97, NOUN_DURUS), "٩٠+ درساً");

console.log("format-count-bucket.test.ts: ok");
