/**
 * بوابة: زر الرجوع داخل هيدر اللوبي/SectionHero؛ بلا عائم ثابت يغطي المحتوى.
 * تشغيل: node --import tsx src/lib/__tests__/section-back-button.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const lobby = read("src/components/lobby/SectionLobby.tsx");
const css = read("src/components/lobby/section-lobby.css");
assert.match(lobby, /inlineHeaderBack = true/, "اللوبي يظهر رجوع الهيدر افتراضيًا");
assert.doesNotMatch(lobby, /showFloatingBack/, "لا زر عائم مكرر داخل اللوبي");
assert.match(lobby, /section-lobby__back-inline/, "رجوع داخل الهيدر");
assert.match(lobby, /AppBackButton/);
assert.match(css, /\.section-lobby__back-inline[\s\S]*min-height:\s*44px/, "منطقة لمس ≥44px");

const appBack = read("src/components/common/AppBackButton.tsx");
assert.match(appBack, /DirectionalIcon/, "أيقونة الاتجاه في زر الرجوع الموحّد");
assert.match(appBack, /goBackOrFallback/);
assert.match(appBack, /aria-label.*=.*"رجوع"|ariaLabel = "رجوع"/);

const fab = read("src/components/FloatingBackButton.tsx");
assert.match(fab, /return null/, "العائم الثابت مُلغى");

const hero = read("src/components/topic/SectionHero.tsx");
assert.match(hero, /AppBackButton/);
assert.match(hero, /data-section-back/);

const gate = read("scripts/section-back-button-gate.mjs");
assert.match(gate, /\/fiqh/);
assert.match(gate, /data-section-back|data-floating-back|aria-label=['"]رجوع['"]/);

const pages: Array<[string, string]> = [
  ["quran", "src/pages/quran/ui/QuranHubView.tsx"],
  ["lessons", "src/pages/lessons/ui/LessonsView.tsx"],
  ["sections", "src/features/more/MoreHubFromRegistry.tsx"],
];

for (const [id, rel] of pages) {
  const src = read(rel);
  assert.match(src, /SectionLobby/, `${id}: يستهلك القالب — الرجوع من المصدر الواحد`);
  assert.doesNotMatch(src, /data-section-back/, `${id}: لا زر رجوع يدوي في الصفحة`);
}

const fiqh = read("src/pages/fiqh/ui/FiqhView.tsx");
assert.match(fiqh, /publishedBooks/, "الفقه: شبكة كتب منشورة");
assert.match(fiqh, /SectionTemplatePage/, "الفقه: قالب القسم يوفر الكروم/الرجوع");
assert.doesNotMatch(fiqh, /data-section-back/, "الفقه: لا زر رجوع يدوي");

console.log("section-back-button.test.ts: ok");
