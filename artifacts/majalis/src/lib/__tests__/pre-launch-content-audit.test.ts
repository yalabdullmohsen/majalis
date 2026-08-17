/**
 * بوابة تدقيق محتوى ما قبل الإطلاق — تمنع رجوع أخطاء التوثيق وSEO المؤكدة.
 * التشغيل: node --import tsx src/lib/__tests__/pre-launch-content-audit.test.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

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

function read(rel: string) {
  return readFileSync(resolve(appRoot, rel), "utf8");
}

console.log("\n=== عبارات توثيق محظورة في الواجهة العامة ===");
{
  const fiqh = read("src/lib/fiqh-hub-topics.ts");
  const fiqhView = read("src/pages/fiqh/ui/FiqhView.tsx");
  const seoGen = read("scripts/generate-seo.mjs");
  assert(!/موثّقة بالأدلة/.test(fiqh), "fiqh-hub-topics بلا «موثّقة بالأدلة»");
  assert(!/مسائل موثّقة بالأدلة/.test(seoGen), "generate-seo بلا «مسائل موثّقة بالأدلة»");
  assert(!/يجري استكمال توثيقها/.test(fiqh), "fiqh-hub-topics بلا «يجري استكمال توثيقها»");
  assert(!/يجري استكمال توثيقها/.test(fiqhView), "واجهة الفقه بلا بطاقة «يجري استكمال توثيقها»");
  assert(!/قيد المراجعة/.test(fiqhView), "واجهة الفقه بلا «قيد المراجعة»");
  assert(!/رابط القراءة/.test(seoGen), "generate-seo بلا «رابط القراءة»");
  assert(!/>رابط القراءة</.test(seoGen) && !/">رابط القراءة</.test(seoGen), "لا تسمية مصدر عامة في قالب المكتبة");
  assert(/librarySourceLabel/.test(seoGen), "مولّد SEO يستخدم تسمية مصدر المكتبة");
}

console.log("\n=== آزر والاحترازات في الذين ذكروا في القرآن ===");
{
  const catalog = JSON.parse(read("public/data/quran-people/people.json"));
  const people = catalog.people || [];
  const azar = people.find((p: { slug?: string; nameAr?: string }) => p.slug === "azar" || p.nameAr === "آزر");
  assert(Boolean(azar), "آزر موجود (الأنعام 6:74)");
  assert(
    azar?.occurrences?.some((o: { surah: number; ayah: number }) => o.surah === 6 && o.ayah === 74),
    "آزر مرتبط بالأنعام 6:74",
  );
  const dhul = people.find((p: { slug?: string }) => p.slug === "dhul-kifl");
  assert(/اختلف|احتراز|دون جزم/.test(dhul?.definition || ""), "ذو الكفل فيه احتراز عن الخلاف في نبوته");
  const luqman = people.find((p: { slug?: string }) => p.slug === "luqman");
  assert(/لم يثبت|لا يُجزم|لا تجزم|بالنبوة/.test(luqman?.definition || ""), "لقمان بلا جزم بالنبوة");
  const dq = people.find((p: { slug?: string }) => p.slug === "dhul-qarnayn");
  assert(/لا يُجزم|الإسكندر/.test(dq?.definition || ""), "ذو القرنين بلا جزم بالتعيين");
}

console.log("\n=== SEO: الأمم والذين ذكروا والأنبياء لا ترث عنوان الرئيسية ===");
{
  const seoRoutes = JSON.parse(read("src/lib/seo-routes.json"));
  const byPath = new Map((seoRoutes.routes || []).map((r: { path: string }) => [r.path, r]));
  const homeTitle = (byPath.get("/") as { title?: string } | undefined)?.title || "";
  for (const path of ["/nations", "/quran/people", "/prophets"]) {
    const route = byPath.get(path) as { title?: string; description?: string } | undefined;
    assert(Boolean(route), `${path} موجود في seo-routes.json`);
    assert(Boolean(route?.title) && route!.title !== homeTitle, `${path} له عنوان مستقل عن الرئيسية`);
    assert((route?.description || "").length >= 50, `${path} description ≥ 50`);
  }

  const prerenderRoot = resolve(appRoot, "seo-prerender");
  if (existsSync(prerenderRoot)) {
    const homeHtml = existsSync(join(prerenderRoot, "index.html"))
      ? readFileSync(join(prerenderRoot, "index.html"), "utf8")
      : "";
    const homeTitleMatch = homeHtml.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || "";
    for (const path of ["/nations", "/quran/people", "/prophets"]) {
      const file = join(prerenderRoot, path.replace(/^\//, ""), "index.html");
      assert(existsSync(file), `seo-prerender${path}/index.html موجود`);
      if (existsSync(file)) {
        const html = readFileSync(file, "utf8");
        const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || "";
        assert(Boolean(title) && title !== homeTitleMatch, `${path} title ≠ عنوان الرئيسية`);
        assert(!/undefined|null|TODO/.test(html), `${path} بلا undefined/null/TODO`);
      }
    }
  } else {
    console.log("  ℹ seo-prerender غير مولَّد بعد — يُفحص عند generate:seo/build");
  }
}

console.log("\n=== صفحات admin/dashboard noindex أو خارج الفهرسة العامة ===");
{
  const seoRoutes = JSON.parse(read("src/lib/seo-routes.json"));
  const admin = (seoRoutes.routes || []).find((r: { path: string }) => r.path === "/admin");
  assert(Boolean(admin), "/admin في seo-routes");
  assert(/noindex/.test((admin as { robots?: string })?.robots || ""), "/admin noindex");
}

console.log("\n=== «قيد المراجعة الشرعية» ليست شعار تسويق في بوابة الفقه ===");
{
  const fiqh = read("src/lib/fiqh-hub-topics.ts");
  assert(!/قيد المراجعة الشرعية/.test(fiqh), "fiqh-hub-topics لا تستخدم «قيد المراجعة الشرعية» كوصف تسويقي");
}

console.log("\n=== محتوى الأنبياء: لا undefined/null/TODO في النصوص ===");
{
  const prophetsSrc = read("src/lib/prophets-data.ts");
  assert(!/"undefined"|"null"|TODO/.test(prophetsSrc), "prophets-data بلا undefined/null/TODO نصيّة");
  const stories = read("src/views/ProphetStoriesPage.tsx");
  assert(!/Esc للقائمة/.test(stories), "واجهة القصص بلا «Esc للقائمة»");
  assert(!/>\s*undefined\s*</.test(stories), "واجهة القصص بلا undefined ظاهر");
}

console.log(`\n=== النتيجة: ${passed} نجح / ${failed} فشل ===\n`);
if (failed > 0) process.exit(1);
