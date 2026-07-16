/**
 * مرآة ثابتة (build-time) لأسماء/أوصاف المسارات العلمية — تُستخدَم فقط من
 * scripts/generate-seo.mjs لتوليد صفحات SEO الثابتة مسبقًا لكل مسار (لا وصول
 * لقاعدة البيانات وقت البناء الثابت). البيانات الحقيقية والحية تأتي دومًا من
 * جدول learning_paths عبر src/lib/learning-paths-service.ts وقت التشغيل —
 * هذا الملف نسخة SEO فقط ويجب إبقاؤه متزامنًا يدويًا مع صفوف learning_paths
 * (الحقل الحرج للمزامنة: slug — أي مسار جديد في القاعدة يحتاج إضافة هنا
 * ليحصل على صفحة SEO ثابتة عند البناء).
 */
export type LearningPathSeoEntry = { slug: string; title: string; description: string };

export const LEARNING_PATHS_INDEX: LearningPathSeoEntry[] = [
  { slug: "aqeedah", title: "العقيدة", description: "مسار شامل في العقيدة الإسلامية الصحيحة" },
  { slug: "tawheed", title: "التوحيد", description: "دراسة معمّقة لكتاب التوحيد للشيخ محمد بن عبد الوهاب" },
  { slug: "hadith", title: "الحديث", description: "علم الحديث النبوي ودراسة الأحاديث" },
  { slug: "mustalah-hadith", title: "مصطلح الحديث", description: "مصطلحات علم الحديث وأقسامه" },
  { slug: "fiqh", title: "الفقه", description: "أصول الأحكام الشرعية العملية" },
  { slug: "usool-fiqh", title: "أصول الفقه", description: "قواعد استنباط الأحكام" },
  { slug: "tafseer", title: "التفسير", description: "تفسير كتاب الله تعالى" },
  { slug: "uloom-quran", title: "علوم القرآن", description: "علوم القرآن ومعرفة نزوله وتأويله" },
  { slug: "seerah", title: "السيرة", description: "سيرة النبي ﷺ وتاريخ الدعوة" },
  { slug: "adab", title: "الآداب", description: "آداب الإسلام في الحياة اليومية" },
  { slug: "akhlaq", title: "الأخلاق", description: "تهذيب النفس وبناء الخُلُق" },
  { slug: "arabic", title: "اللغة العربية", description: "أساسيات اللغة العربية للطالب العلمي" },
  { slug: "nahw", title: "النحو", description: "قواعد النحو العربي" },
  { slug: "dawah", title: "الدعوة", description: "آداب الدعوة إلى الله ووسائلها" },
  { slug: "tarbiyah", title: "التربية", description: "التربية الإسلامية وبناء الشخصية" },
];
