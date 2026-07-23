/**
 * اختبار وحدة لمنطق لعبة الاختبارات النقي (src/data/islamicQuizData.ts) —
 * بلا قاعدة بيانات، يغطي: تكامل بيانات الأسئلة (لا تكرار معرّفات، حقول
 * عربية غير فارغة)، تناسق الفلاتر/التصنيفات مع بيانات الأسئلة، اختيار
 * سؤال بلا تكرار (pickQuestion)، حالة عدم وجود أسئلة (تفريغ المجموعة)،
 * ودمج أسئلة Supabase (mergeSupabaseQuestions) بلا تكرار معرّفات ولا فقدان
 * صامت عند فئة/مستوى غير معروف.
 *
 * تُشغَّل عبر: npx tsx src/lib/__tests__/quiz-game-integrity.test.ts
 */
import {
  ALL_QUESTIONS, GAME_CATEGORIES, pickQuestion, getRandomQuestions,
  mergeSupabaseQuestions, type PointValue,
} from "../../data/islamicQuizData";

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ FAIL: ${label}`); failed++; }
}

const POINT_TIERS: PointValue[] = [200, 400, 600];
const ARABIC_RE = /[؀-ۿ]/;

console.log("\n=== تكامل بيانات الأسئلة — لا تكرار في المعرّفات ===");
{
  const allIds: string[] = [];
  for (const levels of Object.values(ALL_QUESTIONS)) {
    for (const tier of POINT_TIERS) {
      for (const q of levels[tier]) allIds.push(q.id);
    }
  }
  const uniqueIds = new Set(allIds);
  assert(allIds.length > 0, `يوجد أسئلة فعلية في ALL_QUESTIONS (${allIds.length} سؤالاً)`);
  assert(uniqueIds.size === allIds.length,
    `كل المعرّفات فريدة (${uniqueIds.size} فريد من ${allIds.length} إجمالي) — لا تكرار أسئلة`);
}

console.log("\n=== تكامل بيانات الأسئلة — حقول عربية غير فارغة ===");
{
  let emptyFields = 0;
  let nonArabicQuestions = 0;
  let total = 0;
  for (const levels of Object.values(ALL_QUESTIONS)) {
    for (const tier of POINT_TIERS) {
      for (const q of levels[tier]) {
        total++;
        if (!q.q.trim() || !q.a.trim()) emptyFields++;
        if (!ARABIC_RE.test(q.q)) nonArabicQuestions++;
      }
    }
  }
  assert(emptyFields === 0, `لا يوجد سؤال أو جواب فارغ (فحص ${total} سؤالاً)`);
  assert(nonArabicQuestions === 0, `كل نصوص الأسئلة تحوي عربية فعلية (دعم RTL/العربية)`);
}

console.log("\n=== تناسق الفلاتر/التصنيفات (GAME_CATEGORIES) مع الأسئلة ===");
{
  for (const cat of GAME_CATEGORIES) {
    assert(cat.id in ALL_QUESTIONS, `تصنيف "${cat.name}" (${cat.id}) له مجموعة أسئلة مقابلة في ALL_QUESTIONS`);
  }
  const categoryIds = new Set(GAME_CATEGORIES.map((c) => c.id));
  for (const catId of Object.keys(ALL_QUESTIONS)) {
    assert(categoryIds.has(catId), `مجموعة الأسئلة "${catId}" لها تصنيف مقابل في GAME_CATEGORIES (لا فئة يتيمة غير قابلة للتصفية)`);
  }
}

console.log("\n=== pickQuestion — الانتقال بين الأسئلة بلا تكرار ===");
{
  const catId = GAME_CATEGORIES[0].id;
  const used = new Set<string>();
  const drawn: string[] = [];
  const poolSize = ALL_QUESTIONS[catId][200].length;
  assert(poolSize > 0, `فئة "${catId}" تحوي أسئلة بمستوى 200 نقطة للاختبار (${poolSize})`);

  for (let i = 0; i < poolSize; i++) {
    const q = pickQuestion(catId, 200, used);
    assert(q !== null, `سحب السؤال رقم ${i + 1}/${poolSize} نجح (لم تُستنفد المجموعة قبل أوانها)`);
    if (q) {
      assert(!used.has(q.id), `السؤال المسحوب (${q.id}) لم يُسحب من قبل`);
      used.add(q.id);
      drawn.push(q.id);
    }
  }
  assert(new Set(drawn).size === drawn.length, "كل الأسئلة المسحوبة فريدة عبر الجولة الكاملة");
}

console.log("\n=== pickQuestion — حالة عدم وجود أسئلة (تفريغ المجموعة) ===");
{
  const catId = GAME_CATEGORIES[0].id;
  const allIdsInTier = new Set(ALL_QUESTIONS[catId][200].map((q) => q.id));
  const result = pickQuestion(catId, 200, allIdsInTier);
  assert(result === null, "استنفاد كل الأسئلة في الفئة يُرجع null بدل خطأ أو تكرار — حالة Empty State آمنة");

  const emptyCategoryResult = pickQuestion("لا-توجد-فئة-كهذه", 200, new Set());
  assert(emptyCategoryResult === null, "فئة غير موجودة أصلاً تُرجع null بأمان (لا استثناء غير معالَج)");
}

console.log("\n=== getRandomQuestions — لا يتجاوز العدد المطلوب ولا يكرر ===");
{
  const catId = GAME_CATEGORIES[0].id;
  const requested = 5;
  const result = getRandomQuestions(catId, 200, requested);
  assert(result.length <= requested, `لا يُرجع أكثر من العدد المطلوب (${result.length} ≤ ${requested})`);
  assert(new Set(result.map((q) => q.id)).size === result.length, "لا تكرار داخل نفس مجموعة الأسئلة العشوائية المسحوبة");

  const emptyResult = getRandomQuestions("فئة-وهمية", 200, 5);
  assert(Array.isArray(emptyResult) && emptyResult.length === 0, "فئة غير موجودة تُرجع مصفوفة فارغة بأمان — لا خطأ");
}

console.log("\n=== mergeSupabaseQuestions — دمج بلا تكرار معرّفات ولا فقدان صامت ===");
{
  const existingId = ALL_QUESTIONS[GAME_CATEGORIES[0].id][200][0]?.id;
  const before = JSON.parse(JSON.stringify(ALL_QUESTIONS[GAME_CATEGORIES[0].id][200].length));

  const merged = mergeSupabaseQuestions([
    // معرّف مكرَّر لسؤال موجود أصلاً — يجب تجاهله لا إضافته مجدَّدًا
    { id: existingId, section: "القرآن الكريم", level: "أساسي", question: "سؤال مكرر", answer: "تجاهل" },
    // سؤال جديد صحيح بفئة عربية معروفة (يجب أن يُدمَج فعليًا)
    { id: "new-test-q-1", section: "الفقه", level: "متوسط", question: "سؤال اختباري جديد؟", answer: "جواب اختباري" },
    // فئة غير معروفة — يجب تجاهلها بأمان بلا رمي استثناء
    { id: "unknown-cat-q", section: "فئة غير معروفة تمامًا", level: "أساسي", question: "سؤال", answer: "جواب" },
    // بلا إجابة — يجب تجاهله (لا سؤال بلا جواب موثوق)
    { id: "no-answer-q", section: "الفقه", level: "أساسي", question: "سؤال بلا جواب", answer: "" },
  ]);

  assert(merged[GAME_CATEGORIES[0].id][200].length === before,
    "سؤال بمعرّف مكرَّر لم يُضَف مرة ثانية (لا تكرار بعد الدمج)");
  const fiqhIds = merged["fiqh"][400].map((q) => q.id);
  assert(fiqhIds.includes("new-test-q-1"), "سؤال جديد صحيح بفئة معروفة (الفقه) دُمج بنجاح في مستوى النقاط الصحيح (متوسط=400)");
  const allMergedIds = Object.values(merged).flatMap((lv) => POINT_TIERS.flatMap((t) => lv[t].map((q) => q.id)));
  assert(!allMergedIds.includes("unknown-cat-q"), "سؤال بفئة غير معروفة لم يُدمَج (لا فئة يتيمة تُفسد الفلاتر)");
  assert(!allMergedIds.includes("no-answer-q"), "سؤال بلا إجابة لم يُدمَج (لا سؤال بلا جواب موثوق يظهر للمستخدم)");

  const mergedFromEmpty = mergeSupabaseQuestions([]);
  assert(Object.keys(mergedFromEmpty).length === Object.keys(ALL_QUESTIONS).length,
    "دمج قائمة فارغة يُرجع نفس بنية البيانات المحلية سليمة (Fallback آمن)");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
