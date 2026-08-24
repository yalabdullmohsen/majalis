/**
 * انحدار: إصلاحات Production P0/P1 (2026-08-24).
 * التشغيل: node --import tsx src/lib/__tests__/prod-routing-fix-regressions.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findDuplicateHrefs } from "../link-dedupe";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const src = resolve(root, "src");

let passed = 0;
let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

const lessonPage = readFileSync(resolve(root, "lib/api-handlers/lesson-page.js"), "utf8");
const vercel = readFileSync(resolve(root, "vercel.json"), "utf8");
const lessonDetail = readFileSync(resolve(src, "pages/lessons/ui/LessonDetailView.tsx"), "utf8");
const generateSeo = readFileSync(resolve(root, "scripts/generate-seo.mjs"), "utf8");
const brand = readFileSync(resolve(src, "shared/config/brand.ts"), "utf8");
const recitation = readFileSync(resolve(src, "pages/quran/ui/RecitationTestView.tsx"), "utf8");
const notFound = readFileSync(resolve(src, "views/not-found.tsx"), "utf8");
const card = readFileSync(resolve(src, "components/lessons/UnifiedLessonCard.tsx"), "utf8");

console.log("\n=== P0: lesson homepage fallback ===");
assert(existsSync(resolve(root, "api/lessons/[id].js")), "مسار API مخصص للدروس");
assert(vercel.includes('"api/lessons/[id].js"'), "vercel.json يُضمّن handler الدروس");
assert(vercel.includes('"/lessons/:id"'), "rewrite /lessons/:id موجود");
assert(!lessonPage.includes("dist/index.html") || lessonPage.includes("injectLessonHead"), "لا fallback SPA خام في catch");
assert(!/catch[\s\S]*statusCode\s*=\s*200[\s\S]*dist\/index\.html/.test(lessonPage), "catch لا يعيد 200 + index");
assert(lessonDetail.includes("NotFound"), "تفاصيل الدرس → NotFound عند غياب السجل");
assert(!lessonDetail.includes('<Empty text="لم يُعثر على الدرس."'), "لا Empty عام");

console.log("\n=== P0: dedupe مركزي ===");
assert(generateSeo.includes("dedupeLinksByHref"), "generate-seo يستخدم dedupe");

console.log("\n=== P0: /rulings → /fiqh ===");
assert(notFound.includes('href: "/fiqh"'), "404 يوجّه للفقه لا /rulings");
assert(!notFound.includes('href: "/rulings"'), "404 بلا /rulings");

console.log("\n=== P1: SSR ===");
assert(generateSeo.includes('"/search":'), "RICH_BODY لـ /search");
assert(generateSeo.includes('role="search"'), "نموذج بحث في SSR");
assert(generateSeo.includes('"/quran/recitation-test-ai":'), "RICH_BODY لاختبار التلاوة");
assert(generateSeo.includes("إذن الميكروفون"), "شرح الميكروفون في SSR");

console.log("\n=== P1: brand ===");
assert(brand.includes('"المجلس العلمي"'), "brand.ts موحّد");
assert(!recitation.includes("خوادم مجالس"), "RecitationTestView بلا brand قديم");

console.log("\n=== P1: جلسات الدروس ===");
assert(card.includes("lesson-unified-card__session-subject"), "بطاقة تعرض مادة/جلسة");
assert(card.includes("lesson-unified-card__schedule-line"), "بطاقة تعرض يوم · وقت");

const prerenderQuiz = resolve(root, "seo-prerender/quiz/index.html");
if (existsSync(prerenderQuiz)) {
  const html = readFileSync(prerenderQuiz, "utf8");
  const relatedUl = html.match(/<h2>روابط ذات صلة<\/h2>\s*<ul>[\s\S]*?<\/ul>/i)?.[0] || "";
  const hrefs = [...relatedUl.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  assert(findDuplicateHrefs(hrefs.map((h) => ({ href: h }))).length === 0, "prerender /quiz: روابط ذات صلة بلا duplicate");
}

console.log(`\nالنتيجة: ${passed}/${passed + failed}`);
if (failed) process.exit(1);
