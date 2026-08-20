/**
 * يحرس إصلاح تكرار الجلب: HomeUpcomingLessons وHomeUpcomingCourses يُركَّبان
 * معًا فيستدعيان fetchLessons() في نفس اللحظة قبل استقرار أيّهما — يجب أن
 * يتشاركا نفس الوعد الجاري بدل إطلاق استعلامَي Supabase مستقلَّين.
 *
 * تشغيل: npx tsx src/lib/__tests__/lessons-service-inflight-dedup.test.ts
 */
import { fetchLessons, invalidateLessonsCache } from "../lessons-service";

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

console.log("\n=== نداءان متزامنان لـ fetchLessons() يتشاركان نفس الوعد ===");
{
  invalidateLessonsCache();
  const [a, b] = await Promise.all([fetchLessons(), fetchLessons()]);
  assert(a === b, "النتيجتان نفس الكائن مرجعيًا (نفس الجلب، لا جلب مستقل مكرر)");
  assert(a.lessons.length > 0, "الجلب يُنتج دروسًا فعلية (seed أو Supabase)");
}

console.log("\n=== bypassCache يتجاوز التشارك عمدًا ===");
{
  invalidateLessonsCache();
  const [a, b] = await Promise.all([
    fetchLessons(),
    fetchLessons({ bypassCache: true }),
  ]);
  assert(a.lessons.length > 0 && b.lessons.length > 0, "كلا النداءين ينجحان رغم اختلاف مسارَيهما");
}

console.log("\n=== نداء لاحق بعد اكتمال الأول لا يُعاد استخدام الوعد المنتهي ===");
{
  invalidateLessonsCache();
  const first = await fetchLessons();
  const second = await fetchLessons();
  assert(first === second, "يُخدَّم من ذاكرة التخزين المؤقت (cachedResult) لا وعد قديم منتهي");
}

console.log(`\n=== النتيجة: ${passed} نجاح، ${failed} فشل ===`);
if (failed > 0) process.exit(1);
