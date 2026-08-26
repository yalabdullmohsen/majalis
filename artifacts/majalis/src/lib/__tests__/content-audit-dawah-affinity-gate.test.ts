/**
 * بوابة تدقيق محتوى: مسار المسلم الجديد، أسئلة الدعوة، ملاءمة آيات الأقسام.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-dawah-affinity-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  STATIC_DAWAH_QUESTIONS,
  STATIC_DAWAH_SHUBUHAT,
  STATIC_NEW_MUSLIM_PATH,
} from "../dawah-static-fallback";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("\n=== مسار المسلم الجديد ===");
{
  assert.equal(STATIC_NEW_MUSLIM_PATH.length, 30, "مسار ثابت = ٣٠ يومًا");
  const nums = STATIC_NEW_MUSLIM_PATH.map((d) => d.day_number).sort((a, b) => a - b);
  assert.deepEqual(nums, Array.from({ length: 30 }, (_, i) => i + 1), "أيام ١…٣٠ بلا فجوات");
  for (const d of STATIC_NEW_MUSLIM_PATH) {
    assert.ok(d.title.trim().length >= 4, `عنوان اليوم ${d.day_number}`);
    assert.ok((d.content_ar || "").trim().length >= 40, `متن اليوم ${d.day_number}`);
  }
  const svc = read("src/lib/dawah-service.ts");
  assert.match(svc, /STATIC_NEW_MUSLIM_PATH\.length/, "مسار ناقص من القاعدة → ثابت كامل");
  assert.match(svc, /getShubuhatByCategory[\s\S]*STATIC_DAWAH_SHUBUHAT/, "شبهات: احتياطي ثابت");
  assert.match(svc, /getQuestionsByCategory[\s\S]*STATIC_DAWAH_QUESTIONS/, "أسئلة: احتياطي ثابت");
}

console.log("\n=== أسئلة وشبهات ثابتة ===");
{
  assert.ok(STATIC_DAWAH_QUESTIONS.length >= 6, "≥ ٦ أسئلة ثابتة");
  assert.ok(STATIC_DAWAH_SHUBUHAT.length >= 8, "≥ ٨ شبهات ثابتة");
  for (const q of STATIC_DAWAH_QUESTIONS) {
    assert.ok(q.slug && q.title && q.short_answer, `سؤال مكتمل: ${q.slug}`);
  }
  for (const s of STATIC_DAWAH_SHUBUHAT) {
    assert.ok(s.slug && s.title && s.short_answer, `شبهة مكتملة: ${s.slug}`);
  }
}

console.log("\n=== ملاءمة آيات لوحات الأقسام ===");
{
  const tpl = read("src/config/section-template.ts");
  assert.match(tpl, /"\/quran\/surah-stories"[\s\S]*?يوسف:\s*١١١/, "قصص السور → يوسف ١١١");
  assert.match(tpl, /"\/nations":\s*\{[\s\S]*?العنكبوت:\s*٤٠/, "الأمم → العنكبوت ٤٠");
  assert.match(tpl, /"\/tarikh-islami"[\s\S]*?الحج:\s*٤١/, "التاريخ → الحج ٤١");
  assert.match(tpl, /"\/seerah"[\s\S]*?الأنبياء:\s*١٠٧/, "السيرة → الأنبياء ١٠٧");
  assert.match(tpl, /"\/quran\/people"[\s\S]*?النساء:\s*١٦٤/, "المذكورون → النساء ١٦٤");
  assert.match(tpl, /"\/tafsir":\s*\{[\s\S]*?النحل:\s*٤٤/, "التفسير → النحل ٤٤");
  assert.match(tpl, /"\/ulum-quran":\s*\{[\s\S]*?ص:\s*٢٩/, "علوم القرآن → ص ٢٩");
  assert.doesNotMatch(
    tpl,
    /"\/quran\/surah-stories"[\s\S]{0,200}الحجر:\s*٩/,
    "قصص السور لا تستخدم آية الحفظ العامة",
  );
  assert.doesNotMatch(
    tpl,
    /"\/library"[\s\S]{0,200}العلق:\s*١/,
    "المكتبة لا تستخدم العلق ١ كآية عامة مكررة",
  );
  assert.doesNotMatch(
    tpl,
    /"\/ulum-quran":\s*\{[\s\S]*?الحجر:\s*٩/,
    "علوم القرآن لا تشارك آية الحفظ مع القراءات",
  );
}

console.log("\n=== أدعية بلا خلاف في الثبوت ===");
{
  const duas = read("src/pages/worship/ui/DuasView.tsx");
  assert.doesNotMatch(duas, /وفي ثبوته خلاف/, "لا دعاء معلَّق الثبوت في الواجهة");
  assert.match(duas, /أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ/, "دعاء الطعام الثابت موجود");
}

console.log("\n=== صياغة التعريف بالإسلام ===");
{
  const hub = read("src/views/DiscoverIslamPage.tsx");
  const contact = read("src/views/DiscoverIslamContactPage.tsx");
  assert.doesNotMatch(hub + contact, /داعية أو داعية/, "لا تكرار ركيك «داعية أو داعية»");
  assert.match(hub, /داعٍ أو داعية/, "صيغة داعٍ أو داعية");
  assert.match(hub, /مسار الثلاثين يومًا|الثلاثين يومًا/, "المسار يعدّ بثلاثين يومًا");
  const snr = read("src/views/SinsAndRightsDetailPage.tsx");
  assert.match(snr, /ضعيف\|موضوع\|منكر/, "أدلة الذنوب تستبعد الضعيف من العرض");
}

console.log("\n=== إصلاحات تدقيق الواجهة ===");
{
  const akhlaq = read("src/views/AkhlaqPage.tsx");
  assert.match(
    akhlaq,
    /id:\s*"haya-allah"[\s\S]*?ayahRef:\s*"ق:\s*18"/,
    "الحياء من الله → ق ١٨",
  );
  assert.doesNotMatch(
    akhlaq,
    /id:\s*"haya-allah"[\s\S]*?ayahRef:\s*"البقرة:\s*26"/,
    "الحياء من الله لا يستشهد بالبقرة ٢٦",
  );

  const sunan = read("src/views/SunanYawmiyyaPage.tsx");
  assert.match(
    sunan,
    /قراءة سورة الكهف يوم الجمعة[\s\S]*?حسن، وفي سنده نظر/,
    "حكم الكهف الجمعة موحَّد بحسن/فيه نظر",
  );
  assert.doesNotMatch(
    sunan,
    /قراءة سورة الكهف يوم الجمعة[\s\S]{0,280}رواه الحاكم، صحيح/,
    "الكهف الجمعة ليست «صحيح» قطعي",
  );

  const sitemap = read("src/pages/account/ui/SiteMapView.tsx");
  assert.match(sitemap, /أرسل محتوى/, "همزة «أرسل محتوى»");
  assert.doesNotMatch(sitemap, /ارسل محتوى/, "لا «ارسل» بلا همزة");
  const quizHits = [...sitemap.matchAll(/href:\s*"\/quiz"/g)];
  assert.equal(quizHits.length, 1, "سين جيم مرة واحدة في خريطة الموقع");

  const glossary = read("src/pages/account/ui/IslamicGlossaryView.tsx");
  assert.match(
    glossary,
    /الأنصار والمهاجرون[\s\S]*?يُحِبُّونَ مَنْ هَاجَرَ إِلَيْهِمْ/,
    "آية الحشر للأنصار مكتملة في المعجم",
  );

  const duas = read("src/pages/worship/ui/DuasView.tsx");
  assert.doesNotMatch(
    duas,
    /id:\s*"nawm-6"[\s\S]*?مستدرك الحاكم، صحيح/,
    "nawm-6 بلا وسم صحيح قطعي",
  );

  const research = read("src/pages/library/ui/ScholarlyResearchView.tsx");
  assert.match(research, /جاري التحميل…/, "مكتبة البحث تعرض رسالة تحميل");

  const hajj = read("src/pages/fiqh/ui/HajjView.tsx");
  assert.doesNotMatch(hajj, /طواف الوداع[\s\S]{0,200}— \./, "طواف الوداع بلا ذيل مقطوع");
  assert.match(
    hajj,
    /title:\s*"الترتيب في رمي الجمرات"[\s\S]*?ثم الكبرى/,
    "ترتيب الجمرات مكتمل",
  );
}

console.log("\ncontent-audit-dawah-affinity-gate.test.ts: ok");
