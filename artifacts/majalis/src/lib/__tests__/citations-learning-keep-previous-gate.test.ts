/**
 * بوابة: اقتباساتي / أشخاص القرآن / تعلّمي / رسم المعرفة / الأربعون في المحبة — keep-previous.
 * node --import tsx src/lib/__tests__/citations-learning-keep-previous-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const citations = read("src/views/MyCitationsPage.tsx");
assert.match(citations, /loading\s*&&\s*saved\.length\s*===\s*0/, "Citations: مؤشر فقط بلا عناصر سابقة");
assert.match(citations, /aria-busy=\{loading\}/, "Citations: aria-busy أثناء التحديث");

const people = read("src/pages/quran/ui/QuranPeopleView.tsx");
assert.match(people, /loading\s*&&\s*people\.length\s*===\s*0/, "QuranPeople: هيكل فقط بلا أسماء سابقة");
assert.match(people, /aria-busy=\{loading\}/, "QuranPeople: aria-busy");

const learning = read("src/pages/lessons/ui/MyLearningView.tsx");
assert.match(learning, /loading\s*&&\s*library\.length\s*===\s*0/, "MyLearning: هيكل فقط بلا مكتبة سابقة");

const graph = read("src/views/KnowledgeGraphPage.tsx");
assert.match(graph, /loading\s*&&\s*gNodes\.length\s*===\s*0/, "KnowledgeGraph: مؤشر فقط بلا عقد سابقة");

const love = read("src/views/ArbaeenLovePage.tsx");
assert.match(love, /loading\s*&&\s*items\.length\s*===\s*0/, "ArbaeenLove: هيكل فقط بلا أحاديث سابقة");
assert.match(love, /aria-busy=\{loading\}/, "ArbaeenLove: aria-busy");

console.log("citations-learning-keep-previous-gate.test.ts: ok");
