/**
 * يمنع تكرار عطل توجيه بطاقات الفقه إلى موسوعة الأحكام بالخطأ.
 * التشغيل: npx tsx src/lib/__tests__/fiqh-hub-routing.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FIQH_ENCYCLOPEDIA_HREF,
  FIQH_HUB_TOPICS,
  assertFiqhHubCardHrefsSafe,
  getFiqhHubTopic,
  isRulingsEncyclopediaHref,
} from "../fiqh-hub-topics";

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

console.log("\n=== فقه — معرفات ومسارات فريدة ===");
{
  const ids = FIQH_HUB_TOPICS.map((t) => t.id);
  assert(new Set(ids).size === ids.length, "كل بطاقة لها id فريد");
  const hrefs = FIQH_HUB_TOPICS.map((t) => t.href);
  assert(hrefs.every((h) => h.startsWith("/") && h.length > 1), "كل href مسار مطلق صالح");
  for (const t of FIQH_HUB_TOPICS) {
    assert(Boolean(t.title.trim()), `عنوان غير فارغ: ${t.id}`);
    assert(Boolean(t.desc.trim()), `وصف غير فارغ: ${t.id}`);
  }
}

console.log("\n=== فقه — لا إسقاط للدروس على /rulings بالخطأ ===");
{
  const violations = assertFiqhHubCardHrefsSafe();
  assert(violations.length === 0, `لا بطاقة درس توجّه إلى الموسوعة (المخالفات: ${violations.join(" | ") || "لا شيء"})`);

  const encyclopedia = FIQH_HUB_TOPICS.filter((t) => t.kind === "encyclopedia");
  assert(encyclopedia.length === 1, "بطاقة موسوعة واحدة فقط");
  assert(encyclopedia[0]?.href === FIQH_ENCYCLOPEDIA_HREF, "بطاقة الموسوعة → /rulings حرفيًا");
  assert(encyclopedia[0]?.id === "rulings-encyclopedia", "معرّف بطاقة الموسوعة ثابت");

  const topicCards = FIQH_HUB_TOPICS.filter((t) => t.kind === "topic");
  assert(topicCards.length >= 6, `أبواب موضوعية كافية (الفعلي: ${topicCards.length})`);
  for (const t of topicCards) {
    assert(
      t.href === `/fiqh/topics/${t.id}`,
      `بطاقة ${t.id}: الرابط يطابق /fiqh/topics/${t.id} (الفعلي: ${t.href})`,
    );
    assert(!isRulingsEncyclopediaHref(t.href), `${t.id} ليس مسار موسوعة`);
    assert(Boolean(t.rulingsCategory), `${t.id} مرتبط بتصنيف أحكام للعرض الداخلي`);
  }

  // الحالات التي كانت مكتوبة كـ /rulings?category=… سابقًا
  for (const id of ["muamalat", "atima", "medical", "islamic-finance", "hudud", "patients", "financing", "minorities", "tech-fiqh", "usul-fiqh"]) {
    const t = getFiqhHubTopic(id);
    assert(Boolean(t), `الموضوع ${id} موجود`);
    assert(t!.href === `/fiqh/topics/${id}`, `${id} يفتح صفحته لا الموسوعة`);
    assert(!t!.href.includes("/rulings"), `${id} لا يحتوي /rulings في رابط البطاقة`);
  }

  const usul = getFiqhHubTopic("usul-fiqh");
  assert(Boolean(usul?.relatedGuides?.some((g) => g.href === "/lessons")),
    "أصول الفقه يرتبط بمسار usool-fiqh");
  assert(Boolean(usul?.relatedGuides?.some((g) => g.href === "/fiqh-qawaid")),
    "أصول الفقه يرتبط بالقواعد الفقهية");
}

console.log("\n=== فقه — تطابق رابط البطاقة مع بيانات الدرس في FiqhPage ===");
{
  const pageSrc = readFileSync(resolve(srcRoot, "pages/fiqh/ui/FiqhView.tsx"), "utf8");
  assert(pageSrc.includes('from "@/lib/fiqh-hub-topics"') || pageSrc.includes("from '@/lib/fiqh-hub-topics'"),
    "FiqhPage يستورد FIQH_HUB_TOPICS من المصدر المركزي");
  assert(pageSrc.includes("FIQH_HUB_TOPICS"), "FiqhPage يعرض FIQH_HUB_TOPICS");
  assert(!pageSrc.includes("href: `/rulings?category="),
    "لا مسارات أحكام مكتوبة يدويًا داخل تعريف بطاقات الشبكة");
  assert(pageSrc.includes("key={t.id}"), "مفتاح البطاقة هو id الفريد لا العنوان فقط");
  assert(pageSrc.includes('href="/rulings"'), "رابط عرض الكل للموسوعة يبقى متاحًا في تبويب الأحكام");
}

console.log("\n=== فقه — مسار الصفحة الموضوعية في App ===");
{
  const appSrc = readFileSync(resolve(srcRoot, "App.tsx"), "utf8");
  assert(appSrc.includes('path="/fiqh/topics/:topicId"'), "مسار /fiqh/topics/:topicId مسجّل");
  assert(appSrc.includes("FiqhTopicPage"), "FiqhTopicPage موصول بالمسار");
  assert(
    !appSrc.includes('<Route path="/fatwa/:id"><Redirect to="/rulings" />'),
    "إعادة توجيه /fatwa/:id لا تسقط المعرّف",
  );
  assert(
    appSrc.includes('<Route path="/qa"><Redirect to="/quiz" />'),
    "/qa يحوّل دائمًا إلى /quiz (لا صفحة شبه فارغة)",
  );
  assert(!appSrc.includes("QaPage"), "QaPage لم يعد موصولًا كمسار عام");
}

console.log(`\n=== النتيجة: ${passed} نجاح، ${failed} فشل ===`);
if (failed > 0) process.exit(1);
