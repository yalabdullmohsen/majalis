/**
 * Learning paths seed — modules per path (used when DB unavailable).
 */

export const LEVEL_LABELS = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

export const LEARNING_PATHS = [
  { slug: "aqeedah", title: "العقيدة", title_en: "Aqeedah", description: "مسار شامل في العقيدة الإسلامية الصحيحة", level: "beginner", category: "aqeedah", estimated_hours: 40 },
  { slug: "tawheed", title: "التوحيد", title_en: "Tawheed", description: "دراسة التوحيد وإقامة الدليل عليه", level: "beginner", category: "aqeedah", estimated_hours: 30 },
  { slug: "hadith", title: "الحديث", title_en: "Hadith", description: "علم الحديث النبوي ودراسة الأحاديث", level: "intermediate", category: "hadith", estimated_hours: 50 },
  { slug: "mustalah-hadith", title: "مصطلح الحديث", title_en: "Hadith Terminology", description: "مصطلحات علم الحديث وأقسامه", level: "intermediate", category: "hadith", estimated_hours: 35 },
  { slug: "fiqh", title: "الفقه", title_en: "Fiqh", description: "أصول الأحكام الشرعية العملية", level: "beginner", category: "fiqh", estimated_hours: 60 },
  { slug: "usool-fiqh", title: "أصول الفقه", title_en: "Principles of Fiqh", description: "قواعد استنباط الأحكام", level: "advanced", category: "fiqh", estimated_hours: 45 },
  { slug: "tafseer", title: "التفسير", title_en: "Tafseer", description: "تفسير كتاب الله تعالى", level: "intermediate", category: "quran", estimated_hours: 55 },
  { slug: "uloom-quran", title: "علوم القرآن", title_en: "Quranic Sciences", description: "علوم القرآن ومعرفة نزوله", level: "intermediate", category: "quran", estimated_hours: 40 },
  { slug: "seerah", title: "السيرة", title_en: "Seerah", description: "سيرة النبي ﷺ وتاريخ الدعوة", level: "beginner", category: "seerah", estimated_hours: 35 },
  { slug: "adab", title: "الآداب", title_en: "Islamic Etiquette", description: "آداب الإسلام في الحياة اليومية", level: "beginner", category: "akhlaq", estimated_hours: 25 },
  { slug: "akhlaq", title: "الأخلاق", title_en: "Ethics", description: "تهذيب النفس وبناء الخُلُق", level: "beginner", category: "akhlaq", estimated_hours: 25 },
  { slug: "arabic", title: "اللغة العربية", title_en: "Arabic Language", description: "أساسيات اللغة العربية للطالب العلمي", level: "beginner", category: "language", estimated_hours: 40 },
  { slug: "nahw", title: "النحو", title_en: "Arabic Grammar", description: "قواعد النحو العربي", level: "intermediate", category: "language", estimated_hours: 45 },
  { slug: "dawah", title: "الدعوة", title_en: "Dawah", description: "آداب الدعوة إلى الله ووسائلها", level: "intermediate", category: "dawah", estimated_hours: 30 },
  { slug: "tarbiyah", title: "التربية", title_en: "Islamic Education", description: "التربية الإسلامية وبناء الشخصية", level: "intermediate", category: "tarbiyah", estimated_hours: 35 },
];

function makeModules(pathSlug, pathTitle) {
  return [
    { sort_order: 1, title: `مقدمة في ${pathTitle}`, module_type: "lesson", description: "تعريف بالمسار وأهدافه" },
    { sort_order: 2, title: `أساسيات ${pathTitle}`, module_type: "lesson", description: "المفاهيم الأساسية" },
    { sort_order: 3, title: `كتاب مرجعي — ${pathTitle}`, module_type: "book", description: "قراءة كتاب مختصر في المجال" },
    { sort_order: 4, title: `محاضرة — ${pathTitle}`, module_type: "lecture", description: "محاضرة علمية مسجلة" },
    { sort_order: 5, title: `اختبار — ${pathTitle}`, module_type: "quiz", description: "اختبار تقييمي للمسار" },
    { sort_order: 6, title: `مهمة تطبيقية — ${pathTitle}`, module_type: "task", description: "تطبيق عملي لما تعلمته" },
  ].map((m, i) => ({ ...m, id: `${pathSlug}-mod-${i + 1}`, path_slug: pathSlug }));
}

export const LEARNING_MODULES = LEARNING_PATHS.flatMap((p) => makeModules(p.slug, p.title));

export const DEMO_QUIZZES = LEARNING_PATHS.map((p) => ({
  id: `quiz-${p.slug}`,
  path_slug: p.slug,
  title: `اختبار ${p.title}`,
  section: p.title,
  level: p.level,
  passing_score: 70,
  questions: [
    {
      id: `${p.slug}-q1`,
      question_type: "multiple_choice",
      question: `ما هو التعريف الصحيح لـ ${p.title}؟`,
      options: ["تعريف صحيح", "تعريف خاطئ", "تعريف ناقص", "لا شيء مما سبق"],
      correct_answer: { value: 0 },
      explanation: "راجع الدرس الأول في المسار",
      reference_source: `مسار ${p.title}`,
    },
    {
      id: `${p.slug}-q2`,
      question_type: "true_false",
      question: `${p.title} من العلوم الشرعية المهمة`,
      options: ["صح", "خطأ"],
      correct_answer: { value: true },
      explanation: "نعم، هذا علم من علوم الشريعة",
      reference_source: `مسار ${p.title}`,
    },
    {
      id: `${p.slug}-q3`,
      question_type: "text",
      question: `اذكر أحد مصادر ${p.title}`,
      correct_answer: { values: ["القرآن", "السنة", "كتب العلماء"] },
      explanation: "المصادر الشرعية: القرآن والسنة وقول العلماء",
      reference_source: "مصادر التلقي",
    },
  ],
}));

export function getPathBySlug(slug) {
  return LEARNING_PATHS.find((p) => p.slug === slug) || null;
}

export function getModulesForPath(slug) {
  return LEARNING_MODULES.filter((m) => m.path_slug === slug).sort((a, b) => a.sort_order - b.sort_order);
}

export function getQuizForPath(slug) {
  return DEMO_QUIZZES.find((q) => q.path_slug === slug) || null;
}
