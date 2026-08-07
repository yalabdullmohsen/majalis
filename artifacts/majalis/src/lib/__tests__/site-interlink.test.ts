/**
 * حارس الربط الداخلي والتنظيف: مصدر روابط موحّد + صفحات مربوطة.
 * التشغيل: npx tsx src/lib/__tests__/site-interlink.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTENT_TYPE_HREF } from "../recommendation-service";
import { getNodeHref, type KnNode } from "../knowledge-graph-service";
import {
  hrefLessons,
  hrefScholars,
  hrefFawaid,
  hrefQa,
  hrefRulingsFilter,
  KNOWLEDGE_RELATED_HREF,
} from "../content-href";
import { ACCORDION_EXPLORE_LINKS, PAGE_EXPLORE_LINKS } from "../explore-links";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcRoot = resolve(__dirname, "../..");

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

console.log("\n=== content-href الموحّد ===");
{
  assert(hrefLessons("abc") === "/lessons/abc", "hrefLessons");
  assert(hrefScholars("s1") === "/scholars/s1", "hrefScholars");
  assert(hrefFawaid("f1") === "/fawaid#f1", "hrefFawaid");
  assert(hrefQa("q1") === "/qa?id=q1", "hrefQa");
  assert(
    hrefRulingsFilter("الأسرة") === `/rulings?category=${encodeURIComponent("الأسرة")}`,
    "hrefRulingsFilter",
  );
  assert(KNOWLEDGE_RELATED_HREF.question("q") === "/qa?id=q", "KNOWLEDGE_RELATED_HREF.question");
}

console.log("\n=== روابط التوصيات تحتفظ بالمعرّف (إعادة تصدير) ===");
{
  assert(CONTENT_TYPE_HREF.lesson("abc") === "/lessons/abc", "lesson → /lessons/:id");
  assert(CONTENT_TYPE_HREF.book("b1") === "/library/b1", "book → /library/:id");
  assert(CONTENT_TYPE_HREF.scholar("s1") === "/scholars/s1", "scholar → /scholars/:id");
  assert(CONTENT_TYPE_HREF.benefit("f1") === "/fawaid#f1", "benefit → /fawaid#id");
  assert(CONTENT_TYPE_HREF.qa("q1") === "/qa?id=q1", "qa → /qa?id=");
  assert(CONTENT_TYPE_HREF.scholar("") === "/scholars", "scholar بلا id → القائمة");
  assert(CONTENT_TYPE_HREF.story("omar") === "/stories?slug=omar", "story → /stories?slug=");
  assert(CONTENT_TYPE_HREF.miracle("m1") === "/miracles#m1", "miracle → /miracles#id");
  assert(CONTENT_TYPE_HREF.hadith("h1") === "/hadith#h1", "hadith → /hadith#id");
  assert(CONTENT_TYPE_HREF.dhikr("adh-morning") === "/adhkar/morning", "dhikr → /adhkar/:slug");
}

console.log("\n=== روابط الرسم المعرفي تحتفظ بالمعرّف ===");
{
  const base = { id: "n1", title: "عقدة", created_at: "" };
  assert(
    getNodeHref({ ...base, node_type: "scholar", reference_id: "ibn-taymiyyah" } as KnNode)
      === "/scholars/ibn-taymiyyah",
    "scholar node → /scholars/:ref",
  );
  assert(
    getNodeHref({ ...base, node_type: "benefit", reference_id: "ben-1" } as KnNode)
      === "/fawaid#ben-1",
    "benefit node → /fawaid#ref",
  );
}

console.log("\n=== explore-links المركزي ===");
{
  assert(ACCORDION_EXPLORE_LINKS.maqasid.length >= 4, "مقاصد: روابط كافية");
  assert(PAGE_EXPLORE_LINKS.scholar.length >= 4, "عالِم: روابط كافية");
  assert(PAGE_EXPLORE_LINKS.adabTalabIlm.some((l) => l.href === "/fiqh/topics/usul-fiqh"),
    "آداب طالب العلم ترتبط بأصول الفقه");
}

console.log("\n=== صفحات كانت ميتة تحمل ExploreAlso / Related ===");
{
  const scholar = readFileSync(resolve(srcRoot, "views/ScholarProfilePage.tsx"), "utf8");
  assert(scholar.includes("KnowledgeRelatedItems"), "ملف العالِم يركّب KnowledgeRelatedItems");
  assert(scholar.includes("PAGE_EXPLORE_LINKS"), "ملف العالِم يستورد PAGE_EXPLORE_LINKS");

  const topic = readFileSync(resolve(srcRoot, "views/FiqhTopicPage.tsx"), "utf8");
  assert(topic.includes("RelatedKnowledge"), "صفحة باب الفقه تركّب RelatedKnowledge");
  assert(topic.includes("hrefRulingsFilter"), "صفحة الباب تستخدم hrefRulingsFilter");
  assert(!topic.includes("style={{ marginTop"), "لا هوامش مضمنة في صفحة الباب");

  const home = readFileSync(resolve(srcRoot, "components/home/HomeStartHereSection.tsx"), "utf8");
  assert(home.includes('href: "/adab-talab-ilm"'), "ابدأ من هنا → دليل طالب العلم");

  const accordion = readFileSync(resolve(srcRoot, "components/SectionAccordionLayout.tsx"), "utf8");
  assert(accordion.includes("relatedLinks"), "التخطيط الأكورديوني يدعم relatedLinks");

  const maqasid = readFileSync(resolve(srcRoot, "views/MaqasidShariaPage.tsx"), "utf8");
  assert(maqasid.includes("accordionExploreLinks"), "مقاصد تستورد الروابط المركزية");

  const kri = readFileSync(resolve(srcRoot, "components/knowledge/KnowledgeRelatedItems.tsx"), "utf8");
  assert(kri.includes("KNOWLEDGE_RELATED_HREF"), "KnowledgeRelatedItems من content-href");
  assert(!kri.includes("كان سيُنتج صفحة نتائج فارغة"), "أُزيلت تعليقات TYPE_HREF المطوّلة");

  const stories = readFileSync(resolve(srcRoot, "views/IslamicStoriesPage.tsx"), "utf8");
  assert(stories.includes("?slug="), "القصص الإسلامية تدعم ?slug= للمشاركة");
  assert(stories.includes("ExploreAlsoNav"), "صفحة القصص تركّب ExploreAlsoNav");

  const surah = readFileSync(resolve(srcRoot, "pages/quran/ui/SurahStoriesView.tsx"), "utf8");
  assert(surah.includes("ExploreAlsoNav"), "قصص السور تركّب ExploreAlsoNav");
  assert(surah.includes("path: \"/quran/surah-stories\""), "SEO قصص السور على المسار الصحيح");

  const search = readFileSync(resolve(srcRoot, "views/SearchPage.tsx"), "utf8");
  assert(search.includes("/qa?id="), "نتائج البحث تربط الأسئلة بـ ?id=");
  assert(search.includes("/fawaid#"), "نتائج البحث تربط الفوائد بـ #id");
  assert(search.includes("القرآن وعلومه") || search.includes("علوم القرآن"), "تسمية علوم القرآن صحيحة في البحث");

  const localSearch = readFileSync(resolve(srcRoot, "lib/local-search-ext.ts"), "utf8");
  assert(localSearch.includes("/quran/surah-stories/"), "البحث المحلي لقصص السور على المسار الصحيح");
  assert(localSearch.includes("/stories?slug="), "البحث المحلي للقصص عبر ?slug=");
}

console.log(`\n=== النتيجة: ${passed} نجاح، ${failed} فشل ===`);
if (failed > 0) process.exit(1);
