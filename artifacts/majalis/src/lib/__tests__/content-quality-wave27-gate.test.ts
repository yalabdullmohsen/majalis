/**
 * Wave 27 — تلميع أوصاف SEO للدروس والفوائد والحفظ وفهرس السور.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave27-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const files = [
  "src/pages/lessons/ui/MyLearningView.tsx",
  "src/pages/quran/ui/SurahStoriesView.tsx",
  "src/pages/quran/ui/SurahIndexView.tsx",
  "src/pages/quran/ui/QuranMemorizationView.tsx",
  "src/pages/account/ui/FawaidView.tsx",
  "src/pages/lessons/ui/LessonsView.tsx",
  "src/pages/lessons/ui/KuwaitLessonsView.tsx",
  "src/views/FamilyModePage.tsx",
];

for (const rel of files) {
  const src = read(rel);
  assert.ok(!src.includes("محتوى معتمد في منهج سُنّة"), `${rel} بلا عبارة SEO مكررة`);
}

assert.match(read("src/pages/quran/ui/SurahIndexView.tsx"), /منهج سُنّة/);
assert.match(read("src/views/FamilyModePage.tsx"), /إدارة الوضع العائلي وضوابط المحتوى/);
assert.match(read("src/pages/lessons/ui/MyLearningView.tsx"), /لوحة تعلّمك الشخصية/);
assert.match(read("src/pages/account/ui/FawaidView.tsx"), /فوائد شرعية قرآنية وحديثية/);

console.log("content-quality-wave27-gate.test.ts: ok");
