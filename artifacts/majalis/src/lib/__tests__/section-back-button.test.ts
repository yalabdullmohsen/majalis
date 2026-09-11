/**
 * بوابة: رجوع مدمج في اللوبي/هيرو القسم (بدل السهم العائم فوق المحتوى).
 * تشغيل: node --import tsx src/lib/__tests__/section-back-button.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const lobby = read("src/components/lobby/SectionLobby.tsx");
assert.match(lobby, /AppBackButton/, "رجوع مدمج في اللوبي");
assert.match(lobby, /section-lobby__back/, "صف رجوع اللوبي");
assert.doesNotMatch(lobby, /FloatingBackButton/);

const appBack = read("src/components/common/AppBackButton.tsx");
assert.match(appBack, /DirectionalIcon|ArrowRight/, "أيقونة الاتجاه في زر الرجوع الموحّد");
assert.match(appBack, /goBackOrFallback/);
assert.match(appBack, /onPointerDown/);
assert.match(appBack, /aria-label.*=.*"رجوع"|ariaLabel = "رجوع"/);

const fab = read("src/components/FloatingBackButton.tsx");
assert.match(fab, /variant="floating"/, "المكوّن العائم ما زال موجودًا للتوافق");
assert.doesNotMatch(fab, /return null/, "لا يُلغى تعريف العائم في المصدر");

const hero = read("src/components/topic/SectionHero.tsx");
assert.match(hero, /AppBackButton/, "رجوع مدمج في هيرو القسم");
assert.match(hero, /section-hero__back/);
assert.doesNotMatch(hero, /FloatingBackButton/);

const polish = read("src/styles/sections-calm-polish.css");
assert.match(polish, /P0: إزالة السهم العائم|floating-back-btn[\s\S]*display:\s*none/);

const pages: Array<[string, string]> = [
  ["quran", "src/pages/quran/ui/QuranHubView.tsx"],
  ["lessons", "src/pages/lessons/ui/LessonsView.tsx"],
  ["sections", "src/features/more/MoreHubFromRegistry.tsx"],
];

for (const [id, rel] of pages) {
  const src = read(rel);
  assert.match(src, /SectionLobby/, `${id}: يستهلك القالب — الرجوع من هيدر اللوبي`);
  assert.doesNotMatch(src, /FloatingBackButton/, `${id}: لا سهم عائم محلي في الصفحة`);
}

const fiqh = read("src/pages/fiqh/ui/FiqhView.tsx");
assert.match(fiqh, /publishedBooks/, "الفقه: شبكة كتب منشورة");
assert.match(fiqh, /SectionTemplatePage/, "الفقه: قالب القسم يوفر الكروم");
assert.doesNotMatch(fiqh, /FloatingBackButton/, "الفقه: لا سهم عائم محلي");

console.log("section-back-button.test.ts: ok");
