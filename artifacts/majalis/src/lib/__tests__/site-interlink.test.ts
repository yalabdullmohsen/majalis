/**
 * حارس الربط الداخلي: الروابط العميقة لا تسقط المعرّف، والصفحات الميتة السابقة
 * تحمل شبكة «استكشف أيضًا».
 * التشغيل: npx tsx src/lib/__tests__/site-interlink.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTENT_TYPE_HREF } from "../recommendation-service";
import { getNodeHref, type KnNode } from "../knowledge-graph-service";

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

console.log("\n=== روابط التوصيات تحتفظ بالمعرّف ===");
{
  assert(CONTENT_TYPE_HREF.lesson("abc") === "/lessons/abc", "lesson → /lessons/:id");
  assert(CONTENT_TYPE_HREF.book("b1") === "/library/b1", "book → /library/:id");
  assert(CONTENT_TYPE_HREF.scholar("s1") === "/scholars/s1", "scholar → /scholars/:id");
  assert(CONTENT_TYPE_HREF.benefit("f1") === "/fawaid#f1", "benefit → /fawaid#id");
  assert(CONTENT_TYPE_HREF.qa("q1") === "/qa?id=q1", "qa → /qa?id=");
  assert(CONTENT_TYPE_HREF.scholar("") === "/scholars", "scholar بلا id → القائمة");
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

console.log("\n=== صفحات كانت ميتة تحمل ExploreAlso / Related ===");
{
  const scholar = readFileSync(resolve(srcRoot, "views/ScholarProfilePage.tsx"), "utf8");
  assert(scholar.includes("KnowledgeRelatedItems"), "ملف العالِم يركّب KnowledgeRelatedItems");
  assert(scholar.includes("ExploreAlsoNav"), "ملف العالِم يركّب ExploreAlsoNav");

  const topic = readFileSync(resolve(srcRoot, "views/FiqhTopicPage.tsx"), "utf8");
  assert(topic.includes("RelatedKnowledge"), "صفحة باب الفقه تركّب RelatedKnowledge");

  const home = readFileSync(resolve(srcRoot, "components/home/HomeStartHereSection.tsx"), "utf8");
  assert(home.includes('href: "/adab-talab-ilm"'), "ابدأ من هنا → دليل طالب العلم");

  const accordion = readFileSync(resolve(srcRoot, "components/SectionAccordionLayout.tsx"), "utf8");
  assert(accordion.includes("relatedLinks"), "التخطيط الأكورديوني يدعم relatedLinks");

  const maqasid = readFileSync(resolve(srcRoot, "views/MaqasidShariaPage.tsx"), "utf8");
  assert(maqasid.includes("relatedLinks"), "مقاصد الشريعة مربوطة بصفحات أخرى");
}

console.log(`\n=== النتيجة: ${passed} نجاح، ${failed} فشل ===`);
if (failed > 0) process.exit(1);
