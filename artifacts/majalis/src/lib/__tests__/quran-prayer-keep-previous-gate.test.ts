/**
 * بوابة: ترتيب النزول وحلقات القرآن والمتشابهات — keep-previous بمفاتيح صحيحة.
 * node --import tsx src/lib/__tests__/quran-prayer-keep-previous-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const revelation = read("src/pages/quran/RevelationOrderPage.tsx");
assert.match(
  revelation,
  /loading\s*&&\s*surahs\.length\s*===\s*0/,
  "RevelationOrder: هيكل فقط بلا سور سابقة",
);
assert.match(revelation, /aria-busy=\{loading\}/, "RevelationOrder: aria-busy");
assert.match(revelation, /soft-card soft-card--on-light/, "RevelationOrder: soft-card");

const circles = read("src/pages/quran/ui/QuranCirclesView.tsx");
assert.match(circles, /awaitingFilterResults/, "QuranCircles: تمييز مفتاح الفلتر");
assert.match(
  circles,
  /if \(keyChanged\) setCircles\(\[\]\)/,
  "QuranCircles: تفريغ عند تغيّر مفتاح الفلتر",
);
assert.match(
  circles,
  /filterKeyRef\.current !== requestKey/,
  "QuranCircles: تجاهل استجابة قديمة",
);

const mutashabihat = read("src/views/MutashabihatPage.tsx");
assert.match(mutashabihat, /cancelled/, "Mutashabihat: إلغاء طلب الآية عند تغيّر المفتاح");
assert.match(mutashabihat, /setText\(null\)/, "Mutashabihat: لا نص من سياق آية سابقة");
assert.match(mutashabihat, /loading && !text/, "Mutashabihat: هيكل عند غياب النص فقط");

console.log("quran-prayer-keep-previous-gate.test.ts: ok");
