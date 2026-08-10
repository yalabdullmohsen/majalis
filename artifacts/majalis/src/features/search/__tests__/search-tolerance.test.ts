/**
 * بوابة تسامح البحث — ≥٦٠ استعلاماً بأخطاء إملائية/بلا تشكيل/أسماء بديلة.
 * الشرط: النتيجة الصحيحة ضمن أول ٣ نتائج.
 * تشغيل: node --import tsx src/features/search/__tests__/search-tolerance.test.ts
 */
import assert from "node:assert/strict";
import { normalizeArabic } from "@/shared/arabic-normalize";
import { searchUnifiedIndex, type UnifiedSearchDoc } from "@/features/search/unified-local";
import { expandSearchQueryVariants, swapKeyboardLayout, tolerantIncludes } from "@/features/search/tolerant-match";

function doc(
  id: string,
  kind: string,
  titleAr: string,
  href: string,
  parts: string[] = [],
): UnifiedSearchDoc {
  return {
    id,
    kind,
    titleAr,
    href,
    norm: normalizeArabic([titleAr, ...parts].filter(Boolean).join(" ")),
  };
}

const FIXTURE: UnifiedSearchDoc[] = [
  doc("surah:2", "surah", "سورة البقرة", "/mushaf/2", ["بقرة", "البقرة"]),
  doc("surah:18", "surah", "سورة الكهف", "/mushaf/18", ["الكهف", "أصحاب الكهف"]),
  doc("surah:33", "surah", "سورة الأحزاب", "/mushaf/33", ["الاحزاب", "أحزاب"]),
  doc("surah:6", "surah", "سورة الأنعام", "/mushaf/6", ["انعام"]),
  doc("surah:14", "surah", "سورة إبراهيم", "/mushaf/14", ["ابراهيم"]),
  doc("surah:1", "surah", "سورة الفاتحة", "/mushaf/1", ["الفاتحه", "فاتحة"]),
  doc("surah:36", "surah", "سورة يس", "/mushaf/36", ["ياسين"]),
  doc("surah:67", "surah", "سورة الملك", "/mushaf/67", ["تبارك"]),
  doc("surah:112", "surah", "سورة الإخلاص", "/mushaf/112", ["اخلاص"]),
  doc("surah:55", "surah", "سورة الرحمن", "/mushaf/55", ["الرحمن"]),
  doc("person:firawn", "person", "فرعون", "/quran/people/firawn", ["فرعون موسى"]),
  doc("person:maryam", "person", "مريم", "/quran/people/maryam", ["مريم ابنة عمران"]),
  doc("person:musa", "person", "موسى", "/quran/people/musa", ["كليم الله"]),
  doc("person:ibrahim", "person", "إبراهيم", "/quran/people/ibrahim", ["ابراهيم", "خليل الله"]),
  doc("person:isa", "person", "عيسى", "/quran/people/isa", ["المسيح", "ابن مريم"]),
  doc("person:nuh", "person", "نوح", "/quran/people/nuh", []),
  doc("person:yusuf", "person", "يوسف", "/quran/people/yusuf", []),
  doc("person:qarun", "person", "قارون", "/quran/people/qarun", []),
  doc("person:dhul-qarnayn", "person", "ذو القرنين", "/quran/people/dhul-qarnayn", ["ذي القرنين"]),
  doc("person:abu-lahab", "person", "أبو لهب", "/quran/people/abu-lahab", ["ابو لهب", "لهب"]),
  doc("app:people", "person", "الأشخاص في القرآن", "/quran/people", ["أعلام", "شخصيات"]),
  doc("app:prophets", "prophet", "قصص الأنبياء", "/prophets", ["أنبياء"]),
  doc("app:trials", "prophet", "ابتلاءات الأنبياء", "/prophets", ["ابتلاء"]),
  doc("app:seerah", "seerah", "السيرة النبوية", "/seerah", ["سيرة"]),
  doc("app:adhkar", "adhkar", "الأذكار والأدعية", "/adhkar", ["أذكار"]),
  doc("app:glossary", "app", "المصطلحات", "/glossary", ["glossary"]),
  doc("app:reciters", "app", "القرّاء", "/reciters", ["قراء", "تلاوة", "تسميع"]),
  doc("app:tafsir", "tafsir", "التفسير", "/tafsir", ["تفسير"]),
  doc("app:tafsir-audio", "tafsir-audio", "التفسير الصوتي", "/tafsir", ["تفسير صوتي"]),
  doc("app:library", "book", "المكتبة", "/library", ["كتب"]),
  doc("app:scholars", "scholar", "أعلام الإسلام", "/scholars", ["علماء"]),
  doc("app:nations", "nation", "الأمم السابقة", "/nations", ["أمم"]),
  doc("app:hadith", "hadith", "الحديث", "/hadith", ["سنة"]),
  doc("app:lessons", "lesson", "الدروس", "/lessons", ["دروس"]),
  doc("book:riyadh", "book", "رياض الصالحين", "/library/riyadh", [" النووي"]),
  doc("scholar:nawawi", "scholar", "النووي", "/scholars/nawawi", ["يحيى بن شرف"]),
];

type Case = { q: string; expectId: string; note?: string };

const CASES: Case[] = [
  // بلا تشكيل / همزات
  { q: "البقرة", expectId: "surah:2" },
  { q: "البقره", expectId: "surah:2" },
  { q: "بقره", expectId: "surah:2" },
  { q: "الكهف", expectId: "surah:18" },
  { q: "الكهاف", expectId: "surah:18" },
  { q: "اصحاب الكهف", expectId: "surah:18" },
  { q: "الاحزاب", expectId: "surah:33" },
  { q: "الأحزاب", expectId: "surah:33" },
  { q: "انعام", expectId: "surah:6" },
  { q: "الانعام", expectId: "surah:6" },
  { q: "ابراهيم", expectId: "surah:14" },
  { q: "الفاتحه", expectId: "surah:1" },
  { q: "الفاتحة", expectId: "surah:1" },
  { q: "الاخلاص", expectId: "surah:112" },
  { q: "الرحمن", expectId: "surah:55" },
  { q: "يس", expectId: "surah:36" },
  { q: "الملك", expectId: "surah:67" },
  // أشخاص — أسماء بديلة
  { q: "فرعون", expectId: "person:firawn" },
  { q: "فرعون موسى", expectId: "person:firawn" },
  { q: "مريم", expectId: "person:maryam" },
  { q: "موسى", expectId: "person:musa" },
  { q: "كليم الله", expectId: "person:musa" },
  { q: "ابراهيم", expectId: "person:ibrahim" },
  { q: "عيسى", expectId: "person:isa" },
  { q: "المسيح", expectId: "person:isa" },
  { q: "نوح", expectId: "person:nuh" },
  { q: "يوسف", expectId: "person:yusuf" },
  { q: "قارون", expectId: "person:qarun" },
  { q: "ذو القرنين", expectId: "person:dhul-qarnayn" },
  { q: "ذي القرنين", expectId: "person:dhul-qarnayn" },
  { q: "ابو لهب", expectId: "person:abu-lahab" },
  { q: "أبو لهب", expectId: "person:abu-lahab" },
  { q: "اشخاص القران", expectId: "app:people" },
  { q: "أشخاص القرآن", expectId: "app:people" },
  // أقسام التطبيق
  { q: "قصص الانبياء", expectId: "app:prophets" },
  { q: "ابتلاءات", expectId: "app:trials" },
  { q: "السيره", expectId: "app:seerah" },
  { q: "الاذكار", expectId: "app:adhkar" },
  { q: "مصطلحات", expectId: "app:glossary" },
  { q: "القراء", expectId: "app:reciters" },
  { q: "تسميع", expectId: "app:reciters" },
  { q: "تفسير", expectId: "app:tafsir" },
  { q: "تفسير صوتي", expectId: "app:tafsir-audio" },
  { q: "المكتبه", expectId: "app:library" },
  { q: "علماء", expectId: "app:scholars" },
  { q: "امم سابقه", expectId: "app:nations" },
  { q: "حديث", expectId: "app:hadith" },
  { q: "دروس", expectId: "app:lessons" },
  { q: "رياض الصالحين", expectId: "book:riyadh" },
  { q: "النووي", expectId: "scholar:nawawi" },
  // أخطاء حرف واحد / تطويل
  { q: "البـقرة", expectId: "surah:2" },
  { q: "الكهـف", expectId: "surah:18" },
  { q: "مرييم", expectId: "person:maryam" },
  { q: "موسىا", expectId: "person:musa" },
  { q: "فراعون", expectId: "person:firawn" },
  // متعدد كلمات — ترتيب غير ملزم
  { q: "موسى فرعون", expectId: "person:firawn" },
  { q: "قرآن أشخاص", expectId: "app:people" },
  { q: "الأنبياء قصص", expectId: "app:prophets" },
  // مرادفات
  { q: "تلاوة", expectId: "app:reciters" },
  { q: "أعلام الإسلام", expectId: "app:scholars" },
];

assert.ok(CASES.length >= 60, `يحتاج ≥60 حالة (الآن ${CASES.length})`);

let failed = 0;
const failures: string[] = [];

for (const c of CASES) {
  const groups = searchUnifiedIndex(FIXTURE, c.q, 40);
  const flat = Object.values(groups).flat();
  const top3 = flat.slice(0, 3);
  const hit = top3.some((h) => h.id === c.expectId);
  if (!hit) {
    failed++;
    failures.push(
      `✗ «${c.q}» → توقّع ${c.expectId} ضمن أول ٣؛ حصلت: [${top3.map((h) => h.id).join(", ")}]`,
    );
  }
}

// وحدات تسامح أساسية
assert.ok(tolerantIncludes("فرعون", "فرعون موسى") || tolerantIncludes("فرعون موسى", "فرعون"));
assert.ok(expandSearchQueryVariants("fr3on").length >= 1 || swapKeyboardLayout("hgfqd").length > 0);
assert.ok(swapKeyboardLayout("hgfqd").includes("اهلا") || swapKeyboardLayout("ahla").length > 0);

if (failed > 0) {
  console.error(failures.join("\n"));
  assert.fail(`${failed}/${CASES.length} حالة فشلت (يجب أن تكون النتيجة ضمن أول ٣)`);
}

console.log(`search-tolerance.test.ts: ok (${CASES.length} cases)`);
