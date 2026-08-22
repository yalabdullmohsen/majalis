/**
 * يحرس إصلاح رابط البحث الميت: نتائج البحث تُنتج `/quiz?qa=<id>`، وكان
 * IslamicQuizGame لا يقرأ هذا الباراميتر إطلاقًا — رابط ميت لِـ٧١٪ من
 * فهرس البحث. الإصلاح: DirectQaCard يعرض السؤال المحدَّد مباشرةً.
 *
 * تشغيل: npx tsx src/lib/__tests__/quiz-qa-deeplink.test.ts
 */
import { strict as strictAssert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseCatsFromUrl } from "@/components/quiz-game/IslamicQuizGame";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(__dirname, "..", "..");

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log("\n=== parseCatsFromUrl ===");
strictAssert.deepEqual(parseCatsFromUrl("?cats=quran"), ["quran"]);
strictAssert.deepEqual(parseCatsFromUrl("?cats=quran,hadith"), ["quran", "hadith"]);
strictAssert.deepEqual(parseCatsFromUrl("?cats=invalid,quran"), ["quran"]);
strictAssert.deepEqual(parseCatsFromUrl(""), []);
console.log("  ✓ parseCatsFromUrl يفلتر الفئات الصالحة");

console.log("\n=== DirectQaCard موصول بـ IslamicQuizGame ===");
{
  const game = readFileSync(resolve(srcRoot, "components/quiz-game/IslamicQuizGame.tsx"), "utf8");
  assert(game.includes('import { DirectQaCard } from "./DirectQaCard"'), "يستورد DirectQaCard");
  assert(game.includes('useSearch()'), "يقرأ باراميترات الرابط عبر wouter useSearch");
  assert(game.includes('.get("qa")'), "يستخرج باراميتر qa تحديدًا");
  assert(game.includes('parseCatsFromUrl'), "يقرأ باراميتر cats للمسابقات");
  assert(game.includes('.get("cats")') || game.includes('get("cats")'), "يستخرج باراميتر cats");
  assert(game.includes("directQaId && <DirectQaCard"), "يعرض DirectQaCard عند وجود qa");
}

console.log("\n=== DirectQaCard: مصدر البيانات والسلوك ===");
{
  const card = readFileSync(resolve(srcRoot, "components/quiz-game/DirectQaCard.tsx"), "utf8");
  assert(card.includes('from "@/lib/qa-seed"'), "يقرأ من نفس بذرة الأسئلة التي يُنشئ منها مولّد الفهرس الروابط");
  assert(card.includes("QA_DISCLAIMER"), "يعرض إخلاء المسؤولية الموحّد لمحتوى الأسئلة");
  assert(card.includes("setTimeout"), "يُبطل الإبراز تلقائيًا بعد مهلة (لثوانٍ ثم يختفي)");
  assert(card.includes("not-found") || card.includes("qzg-direct-qa--missing"), "يتعامل مع سؤال غير موجود دون كسر الصفحة");
}

console.log("\n=== توافق تنسيق الرابط مع مولّد الفهرس (غير مُعدَّل عمدًا) ===");
{
  const gen = readFileSync(resolve(srcRoot, "..", "scripts/generate-unified-search-index.mjs"), "utf8");
  assert(gen.includes("`/quiz?qa=${encodeURIComponent(row.id)}`"), "مولّد الفهرس ما زال ينتج /quiz?qa=<id> كما هو (لا نغيّر تنسيق الرابط، بل نجعله يعمل)");
}

console.log(`\n=== النتيجة: ${passed} نجاح، ${failed} فشل ===`);
if (failed > 0) process.exit(1);
