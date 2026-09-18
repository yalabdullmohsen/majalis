/**
 * Wave 28 — إزالة عبارة SEO المكررة من صفحات عامة إضافية.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave28-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const files = [
  "src/views/CardsPage.tsx",
  "src/views/UniversitiesComparePage.tsx",
  "src/views/HowToBecomeMuslimPage.tsx",
  "src/views/IslamicStoriesPage.tsx",
  "src/views/ProphetsFamilyTreePage.tsx",
  "src/views/PropheticMedicinePage.tsx",
  "src/views/UniversitiesPage.tsx",
  "src/views/MutashabihatPage.tsx",
  "src/views/SinsAndRightsPage.tsx",
  "src/views/OccasionsPage.tsx",
  "src/views/DiscoverIslamDoubtsPage.tsx",
  "src/views/AsmaaHusnaPage.tsx",
  "src/views/KnowledgeGraphPage.tsx",
  "src/views/DiscoverIslamQuestionsPage.tsx",
  "src/views/AmrBilMarufPage.tsx",
  "src/views/IslamicLandmarksPage.tsx",
  "src/views/MindMapPage.tsx",
  "src/pages/quran/QuranMemorizationPlansPage.tsx",
  "src/pages/worship/ui/AdhkarView.tsx",
  "src/pages/worship/ui/DailyWirdView.tsx",
  "src/pages/fiqh/ui/RulingsView.tsx",
  "src/pages/fiqh/ui/MawarithCalculatorView.tsx",
];

for (const rel of files) {
  const src = read(rel);
  assert.ok(!src.includes("محتوى معتمد في منهج سُنّة"), `${rel} بلا عبارة SEO مكررة`);
  assert.doesNotMatch(src, /description:\s*"[^"]*؛"/, `${rel} بلا وصف ينتهي بفاصلة منقوطة`);
}

console.log("content-quality-wave28-gate.test.ts: ok");
