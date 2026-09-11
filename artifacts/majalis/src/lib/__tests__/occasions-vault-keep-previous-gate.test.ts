/**
 * بوابة: المناسبات/الخزينة/القصص/الأسرة/المكتبة تُبقي المحتوى أثناء إعادة الجلب.
 * node --import tsx src/lib/__tests__/occasions-vault-keep-previous-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const homeOccasions = read("src/components/home/HomeIslamicOccasions.tsx");
assert.match(
  homeOccasions,
  /loading\s*&&\s*items\.length\s*===\s*0/,
  "HomeIslamicOccasions: هيكل فقط بلا عناصر سابقة",
);
assert.match(homeOccasions, /aria-busy=\{loading\}/, "HomeIslamicOccasions: aria-busy");

const arbaeen = read("src/views/ArbaeenLovePage.tsx");
assert.match(arbaeen, /loading\s*&&\s*items\.length\s*===\s*0/, "ArbaeenLove: keep-previous");
assert.match(arbaeen, /aria-busy=\{loading\}/, "ArbaeenLove: aria-busy");

const stories = read("src/views/IslamicStoriesPage.tsx");
assert.match(stories, /loading\s*&&\s*stories\.length\s*===\s*0/, "IslamicStories: keep-previous");
assert.match(stories, /aria-busy=\{loading\}/, "IslamicStories: aria-busy");
assert.match(
  stories,
  /\(!loading\s*\|\|\s*stories\.length\s*>\s*0\)/,
  "IslamicStories: الضوابط تظهر مع المحتوى السابق",
);

const discoverQ = read("src/views/DiscoverIslamQuestionsPage.tsx");
assert.match(
  discoverQ,
  /loading\s*&&\s*items\.length\s*===\s*0/,
  "DiscoverIslamQuestions: keep-previous",
);
assert.match(discoverQ, /aria-busy=\{loading\}/, "DiscoverIslamQuestions: aria-busy");

const vault = read("src/views/VaultPage.tsx");
assert.match(
  vault,
  /loading\s*&&\s*\n?\s*vaultData\.bookmarks\.length\s*===\s*0/,
  "Vault: هيكل فقط عند فراغ كل الأقسام",
);
assert.match(vault, /aria-busy=\{loading\}/, "Vault: aria-busy");

const family = read("src/views/FamilyModePage.tsx");
assert.match(family, /loading\s*&&\s*links\.length\s*===\s*0/, "FamilyMode: keep-previous");
assert.match(family, /aria-busy=\{loading\}/, "FamilyMode: aria-busy");

const citations = read("src/views/MyCitationsPage.tsx");
assert.match(citations, /loading\s*&&\s*saved\.length\s*===\s*0/, "MyCitations: keep-previous");
assert.match(citations, /aria-busy=\{loading\}/, "MyCitations: aria-busy");

const researcher = read("src/views/ResearcherProfilePage.tsx");
assert.match(researcher, /loading\s*&&\s*!hydrated/, "ResearcherProfile: هيكل أول مرة فقط");
assert.match(researcher, /aria-busy=\{loading\}/, "ResearcherProfile: aria-busy");

const knowledgeGraph = read("src/views/KnowledgeGraphPage.tsx");
assert.match(
  knowledgeGraph,
  /loading\s*&&\s*gNodes\.length\s*===\s*0/,
  "KnowledgeGraph: keep-previous",
);

const myLearning = read("src/pages/lessons/ui/MyLearningView.tsx");
assert.match(
  myLearning,
  /loading\s*&&\s*library\.length\s*===\s*0/,
  "MyLearning: keep-previous",
);
assert.match(myLearning, /aria-busy=\{loading\}/, "MyLearning: aria-busy");

const surahIndex = read("src/pages/quran/ui/SurahIndexView.tsx");
assert.match(surahIndex, /loading\s*&&\s*surahs\.length\s*===\s*0/, "SurahIndex: keep-previous");
assert.match(surahIndex, /aria-busy=\{loading\}/, "SurahIndex: aria-busy");

const quranPeople = read("src/pages/quran/ui/QuranPeopleView.tsx");
assert.match(
  quranPeople,
  /loading\s*&&\s*people\.length\s*===\s*0/,
  "QuranPeople: keep-previous",
);
assert.match(quranPeople, /aria-busy=\{loading\}/, "QuranPeople: aria-busy");

const teachers = read("src/pages/lessons/TeachersIndexPage.tsx");
assert.match(
  teachers,
  /loading\s*&&\s*teachers\.length\s*===\s*0/,
  "TeachersIndex: keep-previous",
);
assert.match(teachers, /soft-card soft-card--on-light/, "TeachersIndex: soft-card");

console.log("occasions-vault-keep-previous-gate.test.ts: ok");
