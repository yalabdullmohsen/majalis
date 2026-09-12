/**
 * بوابة: الرجوع الهيدري في اللوبي/الهيرو؛ العائم ملغى.
 * تشغيل: node --import tsx src/lib/__tests__/section-back-button.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const lobby = read("src/components/lobby/SectionLobby.tsx");
assert.match(lobby, /AppBackButton|data-section-back/, "اللوبي يستخدم رجوعًا هيدريًا");
assert.match(lobby, /data-section-back/);

const appBack = read("src/components/common/AppBackButton.tsx");
assert.match(appBack, /goBackOrFallback|goBackOrFallback/);
assert.match(appBack, /onPointerDown/);
assert.match(appBack, /رجوع/);

const fab = read("src/components/FloatingBackButton.tsx");
assert.match(fab, /FLOATING_BACK_DISABLED/, "العائم الدائري ملغى");
assert.match(fab, /FIXED_BACK_BAR_ENABLED|variant="bar"/, "شريط ثابت بديلًا");

const hero = read("src/components/topic/SectionHero.tsx");
assert.match(hero, /AppBackButton|section-hero__back|goBackOrFallback/, "الهيرو يعرض رجوعًا");

const gate = read("scripts/section-back-button-gate.mjs");
assert.match(gate, /\/fiqh/);

const pages: Array<[string, string]> = [
  ["quran", "src/pages/quran/ui/QuranHubView.tsx"],
  ["lessons", "src/pages/lessons/ui/LessonsView.tsx"],
  ["sections", "src/features/more/MoreHubFromRegistry.tsx"],
];

for (const [id, rel] of pages) {
  const src = read(rel);
  assert.match(src, /SectionLobby/, `${id}: يستهلك قالب اللوبي`);
}

const fiqh = read("src/pages/fiqh/ui/FiqhView.tsx");
assert.match(fiqh, /publishedBooks/, "الفقه: شبكة كتب منشورة");
assert.match(fiqh, /SectionTemplatePage/, "الفقه: قالب القسم");

console.log("section-back-button.test.ts: ok");
