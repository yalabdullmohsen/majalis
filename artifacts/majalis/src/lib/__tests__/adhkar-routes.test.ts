/**
 * مسارات الأذكار: /adhkar/:slug وتحويل ?cat= القديم.
 * التشغيل: npx tsx src/lib/__tests__/adhkar-routes.test.ts
 */
import { ADHKAR_CATEGORIES, FEATURED_ADHKAR_SLUGS } from "../adhkar-seed";
import {
  adhkarCatRedirectPath,
  hrefAdhkar,
  resolveAdhkarCategory,
} from "../content-href";

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

console.log("\n=== hrefAdhkar ===");
{
  assert(hrefAdhkar() === "/adhkar", "بلا معرّف → /adhkar");
  assert(hrefAdhkar("morning") === "/adhkar/morning", "slug → /adhkar/morning");
  assert(hrefAdhkar("adh-morning") === "/adhkar/morning", "id → /adhkar/morning");
  assert(hrefAdhkar("evening") === "/adhkar/evening", "مساء");
}

console.log("\n=== resolveAdhkarCategory ===");
{
  assert(resolveAdhkarCategory("morning")?.id === "adh-morning", "slug morning");
  assert(resolveAdhkarCategory("adh-evening")?.slug === "evening", "id evening");
  assert(resolveAdhkarCategory("unknown") === null, "غير معروف → null");
}

console.log("\n=== adhkarCatRedirectPath (?cat= → /adhkar/:slug) ===");
{
  assert(
    adhkarCatRedirectPath("?cat=morning") === "/adhkar/morning",
    "?cat=morning",
  );
  assert(
    adhkarCatRedirectPath("?cat=adh-evening") === "/adhkar/evening",
    "?cat=adh-evening (id)",
  );
  assert(
    adhkarCatRedirectPath("?cat=morning&foo=1") === "/adhkar/morning?foo=1",
    "يحافظ على بقية الاستعلام",
  );
  assert(adhkarCatRedirectPath("?foo=1") === null, "بلا cat → null");
  assert(adhkarCatRedirectPath("?cat=nope") === null, "cat غير معروف → null");
}

console.log("\n=== FEATURED_ADHKAR_SLUGS ===");
{
  for (const slug of FEATURED_ADHKAR_SLUGS) {
    const cat = ADHKAR_CATEGORIES.find((c) => c.slug === slug);
    assert(Boolean(cat), `تصنيف مميّز موجود في البذرة: ${slug}`);
    assert(
      hrefAdhkar(slug) === `/adhkar/${slug}`,
      `مسار prerender/SPA متوقع: /adhkar/${slug}`,
    );
  }
}

console.log(`\n${"─".repeat(40)}`);
console.log(`نتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
