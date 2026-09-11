/**
 * بوابة: القصص / أسئلة التعريف بالإسلام / فهرس السور / الخزنة — keep-previous.
 * node --import tsx src/lib/__tests__/stories-vault-keep-previous-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const stories = read("src/views/IslamicStoriesPage.tsx");
assert.match(stories, /getIslamicStoriesCached/, "Stories: بذرة كاش عند الإقلاع");
assert.match(
  stories,
  /loading\s*&&\s*stories\.length\s*===\s*0/,
  "Stories: هيكل فقط بلا قصص سابقة",
);
assert.match(stories, /aria-busy=\{loading\}/, "Stories: aria-busy أثناء التحديث");
assert.match(
  stories,
  /error\s*&&\s*stories\.length\s*===\s*0/,
  "Stories: خطأ كامل فقط بلا محتوى سابق",
);

const discover = read("src/views/DiscoverIslamQuestionsPage.tsx");
assert.match(discover, /STATIC_DAWAH_QUESTIONS/, "DiscoverQuestions: بذرة ثابتة");
assert.match(
  discover,
  /loading\s*&&\s*items\.length\s*===\s*0/,
  "DiscoverQuestions: هيكل فقط بلا عناصر سابقة",
);
assert.match(discover, /aria-busy=\{loading\}/, "DiscoverQuestions: aria-busy");

const surahIndex = read("src/pages/quran/ui/SurahIndexView.tsx");
assert.match(surahIndex, /seedSurahIndex/, "SurahIndex: بذرة محلية");
assert.match(
  surahIndex,
  /loading\s*&&\s*surahs\.length\s*===\s*0/,
  "SurahIndex: هيكل فقط بلا سور سابقة",
);
assert.match(surahIndex, /aria-busy=\{loading\}/, "SurahIndex: aria-busy");
assert.match(
  surahIndex,
  /loadError\s*&&\s*surahs\.length\s*===\s*0/,
  "SurahIndex: خطأ كامل فقط بلا سور سابقة",
);

const vault = read("src/views/VaultPage.tsx");
assert.match(vault, /hasVaultContent/, "Vault: تمييز وجود محتوى سابق");
assert.match(
  vault,
  /loading\s*&&\s*!hasVaultContent/,
  "Vault: مؤشر تحميل فقط بلا محتوى سابق",
);
assert.match(vault, /aria-busy=\{loading\}/, "Vault: aria-busy أثناء التحديث");

console.log("stories-vault-keep-previous-gate.test.ts: ok");
