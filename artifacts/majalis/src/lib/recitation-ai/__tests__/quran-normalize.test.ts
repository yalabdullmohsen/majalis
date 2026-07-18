/**
 * اختبارات التطبيع القرآني المتخصص — src/lib/recitation-ai/quran-normalize.ts
 * تشغيل: npx tsx src/lib/recitation-ai/__tests__/quran-normalize.test.ts
 */
import { normalizeQuranWord, normalizeQuranText, isBismillahPhrase, WORD_POSITION_OVERRIDES, positionKey } from "../quran-normalize";

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.log(`  ✗ ${msg}`); }
}

console.log("═══ normalizeQuranWord — مرادفات الرسم العثماني ═══");
{
  assert(normalizeQuranWord("الصلوة") === normalizeQuranWord("الصلاة"), "الصلوة = الصلاة");
  assert(normalizeQuranWord("الزكوة") === normalizeQuranWord("الزكاة"), "الزكوة = الزكاة");
  assert(normalizeQuranWord("الحيوة") === normalizeQuranWord("الحياة"), "الحيوة = الحياة");
  assert(normalizeQuranWord("مشكوة") === normalizeQuranWord("مشكاة"), "مشكوة = مشكاة");
  assert(normalizeQuranWord("إِبْرَٰهِيمَ") === normalizeQuranWord("إبراهيم"), "إبرٰهيم (ألف خنجرية) = إبراهيم");
  assert(normalizeQuranWord("إِسْحَٰقَ") === normalizeQuranWord("إسحاق"), "إسحٰق = إسحاق");
  // "ملك"/"مالك" عمومًا: يجب ألا تتوحَّدا كمرادف عام (تُخفي خلطًا حقيقيًا
  // شائعًا بين الفاتحة:4 "مَٰلِكِ" والناس:2 "مَلِكِ" — كلاهما يُطبَّعان لنفس
  // السلسلة "ملك" أصلاً لأن التشكيل (بما فيه الألف الخنجرية) يُحذَف بالكامل،
  // فلا فرق قابل للتمييز على مستوى الكلمة المعزولة بلا سياق الموضع.
  assert(normalizeQuranWord("مَلِكِ") === normalizeQuranWord("مَٰلِكِ"), "ملك وماك بلا سياق موضع يتطابقان نصيًا بعد التطبيع (متوقَّع، ليس خطأ)");
  assert(WORD_POSITION_OVERRIDES[positionKey(1, 4, 0)] === "مالك", "تصحيح الموضع الفاتحة:4:0 مسجَّل بدقة");
  assert(WORD_POSITION_OVERRIDES[positionKey(114, 2, 0)] === undefined, "لا تصحيح عام لكل \"ملك\" — الناس:2 غير متأثرة");
}

console.log("═══ normalizeQuranText ═══");
{
  const words = normalizeQuranText("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ");
  assert(words.length === 4, "البسملة 4 كلمات بعد التقسيم");
}

console.log("═══ isBismillahPhrase ═══");
{
  const bismillahWords = normalizeQuranText("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ");
  assert(isBismillahPhrase(bismillahWords), "البسملة الكاملة تُكتشَف");

  const notBismillah = normalizeQuranText("الحمد لله رب العالمين");
  assert(!isBismillahPhrase(notBismillah), "الحمد لله ليست بسملة");

  assert(!isBismillahPhrase(["كلمة"]), "كلمة واحدة قصيرة جدًا ← ليست بسملة");
}

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
