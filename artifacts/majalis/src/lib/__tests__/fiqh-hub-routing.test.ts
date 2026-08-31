/**
 * يمنع رجوع عطل توجيه الفقه إلى موسوعة /rulings أو دمج الدروس العامة.
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

console.log("\n=== فقه — معرفات فريدة ولا /rulings ===");
{
  const ids = FIQH_HUB_TOPICS.map((t) => t.id);
  assert(new Set(ids).size === ids.length, "كل بطاقة توافق لها id فريد");
  assert(!ids.includes("qa"), "لا بطاقة أسئلة/أحكام غير موثَّقة");
  const hrefs = FIQH_HUB_TOPICS.map((t) => t.href);
  assert(hrefs.every((h) => h.startsWith("/") && h.length > 1), "كل href مسار مطلق صالح");
  for (const t of FIQH_HUB_TOPICS) {
    assert(Boolean(t.title.trim()), `عنوان غير فارغ: ${t.id}`);
    assert(Boolean(t.desc.trim()), `وصف غير فارغ: ${t.id}`);
    assert(!isRulingsEncyclopediaHref(t.href), `${t.id} ليس /rulings`);
  }
  const violations = assertFiqhHubCardHrefsSafe();
  assert(violations.length === 0, `لا بطاقة توجّه إلى /rulings`);
  assert(FIQH_HUB_TOPICS.filter((t) => t.kind === "encyclopedia").length === 0, "لا بطاقة موسوعة");
  assert(FIQH_ENCYCLOPEDIA_HREF === "/fiqh", "FIQH_ENCYCLOPEDIA_HREF → /fiqh");
}

console.log("\n=== فقه — الأصول لا تُدمج في الدروس العامة ===");
{
  const usul = getFiqhHubTopic("usul-fiqh");
  assert(Boolean(usul), "موضوع أصول الفقه موجود");
  assert(usul!.href === "/fiqh/usul", "أصول الفقه → /fiqh/usul");
  assert(!(usul?.relatedGuides ?? []).some((g) => g.href === "/lessons"), "أصول الفقه لا يشير إلى /lessons");
  assert((usul?.relatedGuides ?? []).some((g) => g.href === "/fiqh-qawaid"), "أصول الفقه يرتبط بالقواعد");
}

console.log("\n=== فقه — صفحة المحور من books.json ===");
{
  const pageSrc = readFileSync(resolve(srcRoot, "pages/fiqh/ui/FiqhView.tsx"), "utf8");
  const lobbySrc = readFileSync(resolve(srcRoot, "config/section-lobbies-fiqh.ts"), "utf8");
  assert(pageSrc.includes("getFiqhLobby") && pageSrc.includes("SectionLobby"), "FiqhPage من SectionLobby والسجل");
  assert(lobbySrc.includes("publishedBooks"), "السجل يعرض الكتب المنشورة");
  assert(lobbySrc.includes("@/lib/fiqh-books"), "السجل يستورد fiqh-books");
  assert(!readFileSync(resolve(srcRoot, "config/section-lobbies.ts"), "utf8").includes("@/lib/fiqh-books"), "اللوبي الأساسي بلا fiqh-books");
  assert(!pageSrc.includes("href: `/rulings?category="), "لا مسارات أحكام يدوية");
  assert(!pageSrc.includes('href="/rulings"'), "لا روابط /rulings");
  assert(!pageSrc.includes('"rulings"'), "لا تبويب الأحكام الشرعية");
  assert(!pageSrc.includes("الأحكام الشرعية"), "لا بطاقة الأحكام الشرعية");
}

console.log("\n=== فقه — المسارات في App ===");
{
  const appSrc = readFileSync(resolve(srcRoot, "App.tsx"), "utf8") + "\n" + readFileSync(resolve(srcRoot, "AppRoutes.tsx"), "utf8");
  assert(appSrc.includes('path="/fiqh/books/:bookId"'), "مسار الكتاب");
  assert(appSrc.includes("FiqhBookPage"), "FiqhBookPage موصول");
  assert(appSrc.includes('path="/fiqh/topics/:topicId"'), "مسار قديم /fiqh/topics يبقى للتحويل");
  assert(
    appSrc.includes('<Route path="/fatwa/:id"><Redirect to="/fiqh" />'),
    "إعادة توجيه /fatwa/:id إلى /fiqh",
  );
  assert(
    appSrc.includes('<Route path="/rulings"><Redirect to="/fiqh" />'),
    "إعادة توجيه /rulings إلى /fiqh",
  );
  assert(
    appSrc.includes('<Route path="/qa"><Redirect to="/quiz" />'),
    "/qa يحوّل إلى /quiz",
  );
  assert(!appSrc.includes("QaPage"), "QaPage لم يعد موصولًا كمسار عام");
}

console.log(`\n=== النتيجة: ${passed} نجاح، ${failed} فشل ===`);
if (failed > 0) process.exit(1);
