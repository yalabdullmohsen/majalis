/**
 * سكربت تدقيق — يمنع عودة الأخطاء الشرعية/العلمية المُصحَّحة في مراجعة
 * قسمي السيرة النبوية وقصص الأنبياء (2026-07-24). يفحص العبارات الخطرة
 * المحدَّدة فقط، ولا يبت في محتوى شرعي بنفسه — كل عبارة هنا نتيجة تصحيح
 * صريح طلبه المالك بنص محدد (قبل/بعد)، لا اجتهاد ذاتي من النموذج.
 *
 * تُشغَّل عبر: npx tsx src/lib/__tests__/scholarly-content-guard.test.ts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.error(`  ✗ FAIL: ${label}`); failed++; }
}

function readSrc(relPath: string): string {
  return readFileSync(resolve(appRoot, relPath), "utf-8");
}

console.log("\n=== تاريخ الطبري — لا وصف مبالَغ فيه بالوثوقية المطلقة ===");
{
  const src = readSrc("src/lib/library-catalog.ts");
  assert(!/أوثق كتب التاريخ|أمُّ كتب التاريخ.*أوثقها|جميع ما فيه صحيح/.test(src),
    "لا عبارة \"أوثق كتب التاريخ\"/\"أمّ الكتب وأوثقها\" في وصف كتاب الطبري");
  // كان هذا الفحصُ معقودًا على لفظٍ حرفيٍّ واحدٍ في `description` («تحتاج رواياته
  // إلى دراسة أسانيدها»)، فلمّا نُقل التنبيهُ في ج-٢٨٠ إلى حقل `caution` — وهو
  // موضعُه الصحيحُ لأنّ الواجهةَ تطبعُه شارةَ تحذيرٍ لا نثرًا في الوصف — وأُعيدت
  // صياغتُه، سقط الفحصُ مع أنّ المعنى المحروسَ قائمٌ بل صار أظهرَ للزائر. فرُبط
  // الآن بسجلِّ الطبريِّ نفسِه وبالمعنى لا باللفظ: يسقطُ إن غاب التنبيهُ عن
  // السجلِّ أو خلا من الحضِّ على دراسة الأسانيد، ولا يسقطُ لمجرّدِ إعادةِ صياغة.
  const tabari = src.slice(src.indexOf('id: "book-tarikh-tabari"'));
  const record = tabari.slice(0, tabari.indexOf("\n  },"));
  const caution = record.match(/caution:\s*\n?\s*"([^"]+)"/)?.[1] ?? "";
  assert(
    /أسانيد/.test(caution) && /دراسة|تمحيص|تحقيق/.test(caution),
    "سجلُّ الطبريِّ يحمل تنبيهًا يوضّح الحاجة لدراسة الأسانيد قبل الاعتماد"
  );
}

console.log("\n=== عدد الأنبياء — لا صياغة توهم أن كل الأنبياء 25 ===");
{
  const filesWithProphetCount = [
    "src/pages/account/ui/HomeView.tsx",
    "src/pages/account/ui/HomeBelowFold.tsx",
    "src/components/SideNavDrawer.tsx",
    "src/pages/account/ui/SiteMapView.tsx",
    "src/components/home/HomeInterestingTopics.tsx",
    "src/views/ProphetsFamilyTreePage.tsx",
  ];
  for (const rel of filesWithProphetCount) {
    const src = readSrc(rel);
    const bareCountMatch = src.match(/٢٥ نبي(اً|ا)(?!.{0,20}(مذكور|في القرآن))/);
    assert(!bareCountMatch, `${rel.split("/").pop()}: أي ذكر لـ"٢٥ نبياً" مُقيَّد بـ"مذكورًا/في القرآن" (لا يوهم أنه العدد الكلي)`);
  }
  const heroSrc = readSrc("src/views/ProphetStoriesPage.tsx");
  assert(heroSrc.includes("لَّمْ نَقْصُصْهُمْ عَلَيْكَ"), "صفحة قصص الأنبياء تتضمّن تنبيهًا قرآنيًا أن هناك رسلاً لم يُقصّوا علينا");
  assert(!/١٢٤٫٠٠٠ نبي \(حديث\)(?!\s*<)/.test(heroSrc) || heroSrc.includes("لا يصح سنده"),
    "إحصائية 124,000 نبي (إن وُجدت) مُقيَّدة بأنها من حديث لا يصح سنده");
}

console.log("\n=== موسى عليه السلام — إلقاء الألواح لا رميها ===");
{
  const quizSrc = readSrc("src/data/islamicQuizData.ts");
  assert(!quizSrc.includes("رمى موسى عليه السلام الألواح"), "لا صياغة \"رمى الألواح\" في بنك الأسئلة");
  assert(quizSrc.includes("لماذا ألقى موسى عليه السلام الألواح عند رجوعه إلى قومه؟"),
    "صياغة السؤال تستخدم لفظ \"إلقاء الألواح\" القرآني");
  const updatesSrc = readSrc("src/lib/updates-seed.ts");
  assert(!updatesSrc.includes("سبب رمي الألواح") && !updatesSrc.includes("تميّز موسى بالكلام المباشر لله"),
    "سجل التحديثات لا يحوي الصياغتين القديمتين (رمي الألواح / تميّز موسى بالكلام المباشر)");
}

console.log("\n=== تاريخ مولد النبي ﷺ — لا جزم بيوم وشهر محددين دون بيان الخلاف ===");
{
  const seerahSrc = readSrc("src/views/SeerahPage.tsx");
  assert(!seerahSrc.includes("مولده ﷺ في الثاني عشر من ربيع الأول عام الفيل"),
    "لا جزم قديم بتاريخ المولد دون تحفّظ");
  assert(seerahSrc.includes("واختلف أهل السيرة في تحديد يوم وشهر مولده"),
    "النص الحالي يذكر اختلاف أهل السيرة في تحديد يوم وشهر المولد صراحة");
}

console.log("\n=== الإسراء والمعراج — لا جزم بليلة 27 رجب كحقيقة ثابتة ===");
{
  const occasionsSrc = readSrc("src/lib/islamic-occasions-seed.ts");
  // المعرّف كان "rajab-twenty-seven" ثم دُمج في "isra-miraj" (دفعة إزالة
  // التكرار 49a87e90، 39→36 مناسبة). الدمج نفسه صحيح، لكنه أسقط التحفّظ
  // العلمي الذي أقرّته المراجعة الموجَّهة 58be7603 — فأُعيد إلى السجل الباقي،
  // والحارس صار يفحص المعرّف الحيّ حتى لا يمرّ الفحص صامتًا على سجل محذوف.
  const rajabEntry = occasionsSrc.match(/id: "isra-miraj"[\s\S]{0,600}/)?.[0] ?? "";
  assert(rajabEntry !== "", "سجل ليلة الإسراء والمعراج (isra-miraj) ما زال موجودًا في الملف");
  assert(rajabEntry.includes("قيل إن الإسراء والمعراج"), "مناسبة 27 رجب تستخدم صيغة \"قيل\" غير الجازمة لربطها بالإسراء والمعراج");
  assert(!/ثبت أن الإسراء والمعراج.{0,20}27 رجب|الإسراء والمعراج.{0,20}كان (بالتأكيد|قطعًا) ليلة 27 رجب/.test(occasionsSrc),
    "لا صياغة جازمة تُثبت وقوع الإسراء والمعراج ليلة 27 رجب تحديدًا");
}

console.log("\n=== عمر خديجة رضي الله عنها عند الزواج — لا جزم بأربعين سنة دون بيان الخلاف ===");
{
  const seerahStoryJson = readSrc("public/data/stories/سيرة-019.json");
  assert(!seerahStoryJson.includes("بلغت خديجة الأربعين وكان محمد ﷺ يومها خمسة وعشرين"),
    "لا جزم قديم بعمر خديجة الأربعين في قصة السيرة (JSON)");
  assert(
    seerahStoryJson.includes("ولا يثبت تحديد") && seerahStoryJson.includes("حديث صحيح"),
    "قصة السيرة تحفظ بتحفّظ في عمر خديجة",
  );

  const seerahSrc = readSrc("src/views/SeerahPage.tsx");
  assert(!seerahSrc.includes("تزوج خديجة بنت خويلد وعمره 25 وهي 40، عشا معاً 25 عاماً"),
    "لا جزم قديم بعمرها 40 دون تحفّظ (الخط الزمني)");
  assert(seerahSrc.includes("والمشهور أنها كانت في الأربعين وقيل دون ذلك"),
    "الخط الزمني الحالي يذكر أن سن الأربعين هو \"المشهور\" لا حقيقة قطعية");
}

console.log("\n=== الادعاءات المضللة — لا عبارات إطلاقية عن اكتمال/صحة المحتوى ===");
{
  const prophetSrc = readSrc("src/views/ProphetStoriesPage.tsx");
  assert(!prophetSrc.includes(">القصة الكاملة<"), "عنوان \"القصة الكاملة\" (يوهم اكتمالًا/صحة مطلقة) استُبدل بصياغة أدق");
}

console.log("\n=== بنية التوثيق العلمي (ScholarlyTrustBadge) — مُفعَّلة على صفحات الأنبياء ===");
{
  const prophetSrc = readSrc("src/views/ProphetStoriesPage.tsx");
  assert(prophetSrc.includes("ScholarlyTrustBadge"), "صفحة قصص الأنبياء تستخدم مكوّن شارة التوثيق العلمي الموجود أصلاً (لا مكوّن جديد مكرَّر)");
  const badgeSrc = readSrc("src/components/ScholarlyTrustBadge.tsx");
  assert(badgeSrc.includes("hasKhilaf"), "الشارة تدعم عرض \"توجد أقوال فقهية أخرى\" (الخلاف العلمي) بالفعل");
  assert(badgeSrc.includes("isScholarlyVerified"),
    "شارة \"محتوى موثّق\" مشروطة بدالة isScholarlyVerified (مصدر/مرجع) لا تُعرض اعتباطًا");
  assert(!badgeSrc.includes("قيد المراجعة الشرعية"),
    "لا وسم «قيد المراجعة الشرعية» في واجهة المستخدم");
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
