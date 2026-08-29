/**
 * حارس الربط الداخلي والتنظيف: مصدر روابط موحّد + صفحات مربوطة.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTENT_TYPE_HREF } from "../recommendation-service";
import { getNodeHref, type KnNode } from "../knowledge-graph-service";
import {
  hrefLessons,
  hrefScholars,
  hrefIslamicHistory,
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
  assert(hrefScholars("tabari") === "/tarikh-islami/abbasid-house-of-wisdom", "hrefScholars legacy → tarikh");
  assert(hrefIslamicHistory("seerah-before") === "/tarikh-islami/seerah-before", "hrefIslamicHistory");
  assert(hrefFawaid("f1") === "/fawaid#f1", "hrefFawaid");
  assert(hrefQa("q1") === "/quiz?qa=q1", "hrefQa → quiz");
  assert(hrefRulingsFilter("الأسرة") === "/fiqh", "hrefRulingsFilter → fiqh (archived)");
  assert(KNOWLEDGE_RELATED_HREF.question("q") === "/quiz?qa=q", "KNOWLEDGE_RELATED_HREF.question → quiz");
}

console.log("\n=== روابط التوصيات تحتفظ بالمعرّف (إعادة تصدير) ===");
{
  assert(CONTENT_TYPE_HREF.lesson("abc") === "/lessons/abc", "lesson → /lessons/:id");
  assert(CONTENT_TYPE_HREF.book("b1") === "/library/b1", "book → /library/:id");
  assert(CONTENT_TYPE_HREF.scholar("pers-al-tabari") === "/library", "scholar قديم → المكتبة");
  assert(CONTENT_TYPE_HREF.benefit("f1") === "/fawaid#f1", "benefit → /fawaid#id");
  assert(CONTENT_TYPE_HREF.qa("q1") === "/quiz?qa=q1", "qa → /quiz?qa=");
  assert(CONTENT_TYPE_HREF.scholar("") === "/tarikh-islami", "scholar بلا id → التاريخ");
  assert(CONTENT_TYPE_HREF.story("omar") === "/stories?slug=omar", "story → /stories?slug=");
  assert(CONTENT_TYPE_HREF.miracle("m1") === "/miracles#m1", "miracle → /miracles#id");
  assert(CONTENT_TYPE_HREF.hadith("h1") === "/hadith#h1", "hadith → /hadith#id");
  assert(CONTENT_TYPE_HREF.dhikr("adh-morning") === "/adhkar/morning", "dhikr → /adhkar/:slug");
}

console.log("\n=== روابط الرسم المعرفي تحتفظ بالمعرّف ===");
{
  const base = { id: "n1", title: "عقدة", created_at: "" };
  assert(
    getNodeHref({ ...base, node_type: "scholar", reference_id: "pers-al-tabari" } as KnNode)
      === "/library",
    "scholar node قديم → المكتبة",
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
  assert(PAGE_EXPLORE_LINKS.historyDetail.length >= 4, "تاريخ: روابط كافية");
  assert(PAGE_EXPLORE_LINKS.adabTalabIlm.some((l) => l.href === "/fiqh/usul"),
    "آداب طالب العلم ترتبط بأصول الفقه");
}

console.log("\n=== صفحات التاريخ الإسلامي ===");
{
  const hub = readFileSync(resolve(srcRoot, "views/TarikhIslamiPage.tsx"), "utf8");
  assert(hub.includes("/tarikh-islami/"), "صفحة التاريخ تربط التفاصيل");
  assert(!hub.includes("/scholars"), "لا روابط علماء في صفحة التاريخ");

  const detail = readFileSync(resolve(srcRoot, "views/TarikhIslamiDetailPage.tsx"), "utf8");
  assert(detail.includes("relatedLinks"), "صفحة التفصيل تعرض روابط ذات صلة");
  assert(detail.includes("sources"), "صفحة التفصيل تعرض المصادر");

  const topic = readFileSync(resolve(srcRoot, "pages/fiqh/ui/FiqhTopicView.tsx"), "utf8");
  assert(topic.includes("Redirect"), "صفحة الباب القديمة تحوّل إلى مسار الكتاب/المساند");
  assert(topic.includes("/fiqh/usul"), "أصول الفقه يحوّل إلى /fiqh/usul");

  const home = readFileSync(resolve(srcRoot, "components/home/HomeStartHereSection.tsx"), "utf8");
  const homeData = readFileSync(resolve(srcRoot, "components/home/home-start-here-data.ts"), "utf8");
  assert(
    home.includes("/adab-talab-ilm") || homeData.includes('href: "/adab-talab-ilm"'),
    "ابدأ من هنا → دليل طالب العلم",
  );

  const kri = readFileSync(resolve(srcRoot, "components/knowledge/KnowledgeRelatedItems.tsx"), "utf8");
  assert(kri.includes("KNOWLEDGE_RELATED_HREF"), "KnowledgeRelatedItems من content-href");

  const search = readFileSync(resolve(srcRoot, "pages/account/ui/SearchView.tsx"), "utf8");
  assert(search.includes("/quiz?qa="), "نتائج البحث تربط الأسئلة بـ /quiz?qa=");
  assert(search.includes("/fawaid#"), "نتائج البحث تربط الفوائد بـ #id");
}

console.log(`\n=== النتيجة: ${passed} نجاح، ${failed} فشل ===`);
if (failed > 0) process.exit(1);
