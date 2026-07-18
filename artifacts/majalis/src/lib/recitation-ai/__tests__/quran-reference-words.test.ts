/**
 * اختبارات بناء الكلمات المرجعية — src/lib/recitation-ai/quran-reference-words.ts
 * تُستخدَم بيانات محلية حقيقية من public/data/quran/ (لا بيانات وهمية).
 * تشغيل: npx tsx src/lib/recitation-ai/__tests__/quran-reference-words.test.ts
 */
import { buildReferenceWords } from "../quran-reference-words";
import { loadLocalSurah } from "./test-utils-load-surah";

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg}`); }
}

console.log("═══ buildReferenceWords — الفاتحة (البسملة = الآية 1) ═══");
{
  const fatiha = loadLocalSurah(1);
  const words = buildReferenceWords(1, fatiha.ayahs);
  assert(words[0].raw.includes("بِسْمِ") || words[0].raw === "بِسْمِ", "أول كلمة في الفاتحة هي \"بسم\" (البسملة آية 1 فعليًا)");
  assert(words[0].ayah === 1, "أول كلمة تنتمي للآية 1");
  assert(words.filter((w) => w.ayah === 4)[0].normalized === "مالك", "تصحيح الموضع الفاتحة:4:0 مُطبَّق (مالك لا ملك)");
  const totalWords = fatiha.ayahs.reduce((n, a) => n + a.text.split(/\s+/).filter(Boolean).length, 0);
  assert(words.length === totalWords, `عدد الكلمات = ${totalWords} بلا حذف أي كلمة من الفاتحة`);
}

console.log("═══ buildReferenceWords — الإخلاص (بسملة مدمجة تُفصَل) ═══");
{
  const ikhlas = loadLocalSurah(112);
  const rawAyah1WordCount = ikhlas.ayahs[0].text.split(/\s+/).filter(Boolean).length;
  assert(rawAyah1WordCount > 4, "نص الآية 1 الخام يحوي البسملة + محتوى الآية معًا (تحقَّق من البيانات)");

  const words = buildReferenceWords(112, ikhlas.ayahs);
  const ayah1Words = words.filter((w) => w.ayah === 1);
  assert(ayah1Words[0].raw === "قُلْ", `أول كلمة بعد فصل البسملة = "قُلْ" لا "بِسْمِ" (وجدنا: "${ayah1Words[0].raw}")`);
  assert(ayah1Words.length === rawAyah1WordCount - 4, "عدد كلمات الآية 1 بعد الفصل = العدد الخام ناقص 4 كلمات البسملة");
}

console.log("═══ buildReferenceWords — التوبة (لا بسملة إطلاقًا) ═══");
{
  const tawbah = loadLocalSurah(9);
  const words = buildReferenceWords(9, tawbah.ayahs);
  assert(!words[0].raw.includes("بِسْمِ"), "أول كلمة في التوبة ليست \"بسم\" (لا بسملة أصلاً)");
}

console.log("═══ buildReferenceWords — الناس (مالك/ملك غير مُصحَّحة خارج الفاتحة) ═══");
{
  const nas = loadLocalSurah(114);
  const words = buildReferenceWords(114, nas.ayahs);
  const ayah2 = words.filter((w) => w.ayah === 2);
  assert(ayah2[0].raw === "مَلِكِ", "الناس:2 لم تُمس (لا تصحيح موضع هناك)");
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
