/**
 * فحص ما قبل النشر: التأكد من ضبط MAJALIS_OWNER_EMAILS في البيئة.
 * لا يطبع القيمة إطلاقًا — فقط الحالة والصيغة.
 *
 * السياق: أُزيل البريد الشخصي من الكود، وصار تفويض المالك يقرأ قائمة البريد من
 * هذا المتغير. إن لم يُضبط في Production فسيعتمد تفويض المالك على دور قاعدة
 * البيانات (is_owner / super_admin) فقط، ولن يعمل «تمهيد المالك بالبريد».
 *
 * الاستخدام:
 *   node scripts/verify-owner-env.mjs           # تحذير فقط (exit 0)
 *   node scripts/verify-owner-env.mjs --require  # يفشل إن كان غائبًا (لبوابة النشر)
 */
const REQUIRE = process.argv.includes("--require");
const raw = (process.env.MAJALIS_OWNER_EMAILS || "").trim();

if (!raw) {
  const msg =
    "⚠ MAJALIS_OWNER_EMAILS غير مضبوط في هذه البيئة.\n" +
    "  تفويض المالك سيعتمد على دور قاعدة البيانات فقط (is_owner/super_admin).\n" +
    "  اضبطه قبل النشر في Vercel: Settings → Environment Variables → Production\n" +
    "  الصيغة: بريد أو أكثر مفصولة بفواصل (owner@example.com,owner2@example.com)";
  if (REQUIRE) {
    console.error("✗ " + msg);
    process.exit(1);
  }
  console.warn(msg);
  process.exit(0);
}

const emails = raw.split(",").map((e) => e.trim()).filter(Boolean);
const valid = emails.every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
if (!valid) {
  console.error(`✗ MAJALIS_OWNER_EMAILS مضبوط لكن الصيغة غير صحيحة (${emails.length} مدخلة). المتوقع: بريد صحيح مفصول بفواصل.`);
  process.exit(1);
}
// لا نطبع القيمة — فقط العدد
console.log(`✓ MAJALIS_OWNER_EMAILS مضبوط (${emails.length} بريدًا، الصيغة صحيحة).`);
