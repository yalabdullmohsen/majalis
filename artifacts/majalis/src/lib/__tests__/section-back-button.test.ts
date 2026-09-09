/**
 * بوابة: الرجوع العائم العام فقط؛ اللوبي/الهيرو بلا أزرار رجوع داخلية.
 * تشغيل: node --import tsx src/lib/__tests__/section-back-button.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const lobby = read("src/components/lobby/SectionLobby.tsx");
assert.doesNotMatch(lobby, /AppBackButton/, "لا زر رجوع داخل اللوبي");
assert.doesNotMatch(lobby, /section-lobby__back-inline/, "لا رجوع هيدر");
assert.doesNotMatch(lobby, /data-section-back/);

const appBack = read("src/components/common/AppBackButton.tsx");
assert.match(appBack, /DirectionalIcon/, "أيقونة الاتجاه في زر الرجوع الموحّد");
assert.match(appBack, /goBackOrFallback/);
assert.match(appBack, /onPointerDown/);
assert.match(appBack, /aria-label.*=.*"رجوع"|ariaLabel = "رجوع"/);

const fab = read("src/components/FloatingBackButton.tsx");
assert.match(fab, /variant="floating"/, "العائم العام مفعّل عبر AppBackButton");
assert.doesNotMatch(fab, /return null/, "لا يُلغى العائم");

const hero = read("src/components/topic/SectionHero.tsx");
assert.doesNotMatch(hero, /AppBackButton/);
assert.doesNotMatch(hero, /data-section-back/);

const gate = read("scripts/section-back-button-gate.mjs");
assert.match(gate, /\/fiqh/);
assert.match(gate, /data-floating-back/);

const pages: Array<[string, string]> = [
  ["quran", "src/pages/quran/ui/QuranHubView.tsx"],
  ["lessons", "src/pages/lessons/ui/LessonsView.tsx"],
  ["sections", "src/features/more/MoreHubFromRegistry.tsx"],
];

for (const [id, rel] of pages) {
  const src = read(rel);
  assert.match(src, /SectionLobby/, `${id}: يستهلك القالب — الرجوع من العائم العام`);
  assert.doesNotMatch(src, /data-section-back/, `${id}: لا زر رجوع يدوي في الصفحة`);
}

const fiqh = read("src/pages/fiqh/ui/FiqhView.tsx");
assert.match(fiqh, /publishedBooks/, "الفقه: شبكة كتب منشورة");
assert.match(fiqh, /SectionTemplatePage/, "الفقه: قالب القسم يوفر الكروم");
assert.doesNotMatch(fiqh, /data-section-back/, "الفقه: لا زر رجوع يدوي");

console.log("section-back-button.test.ts: ok");
