/**
 * Phase 7 — Content Engines Registry
 */

export const ENGINE_IDS = [
  "lesson-intelligence",
  "benefits",
  "quiz",
  "lesson-notes",
  "sheikh-enrichment",
  "instagram",
  "youtube",
  "articles",
  "review-queue",
  "recommendations",
  "notifications",
  "backfill",
];

export const ENGINES = {
  "lesson-intelligence": {
    id: "lesson-intelligence",
    labelAr: "محرك ذكاء الدروس",
    description: "استخراج ونشر الدروس من المصادر الموثوقة",
    sourceTypes: ["instagram", "youtube", "rss", "website"],
    defaultEnabled: true,
  },
  benefits: {
    id: "benefits",
    labelAr: "محرك استخراج الفوائد",
    description: "استخراج فوائد مختصرة من الدروس والمقالات",
    sourceTypes: ["lesson", "article"],
    defaultEnabled: true,
  },
  quiz: {
    id: "quiz",
    labelAr: "محرك توليد الأسئلة",
    description: "توليد أسئلة اختيار من متعدد من الدروس",
    sourceTypes: ["lesson", "article"],
    defaultEnabled: true,
  },
  "lesson-notes": {
    id: "lesson-notes",
    labelAr: "محرك ملاحظات الدروس",
    description: "إنشاء ملاحظات منظمة لكل درس",
    sourceTypes: ["lesson"],
    defaultEnabled: true,
  },
  "sheikh-enrichment": {
    id: "sheikh-enrichment",
    labelAr: "محرك إثراء الشيوخ",
    description: "تحسين صفحات الشيوخ من المحتوى الفعلي",
    sourceTypes: ["sheikh"],
    defaultEnabled: true,
  },
  instagram: {
    id: "instagram",
    labelAr: "محرك إنستغرام",
    description: "استيراد منشورات إنستغرام المعتمدة",
    sourceTypes: ["instagram"],
    defaultEnabled: true,
  },
  youtube: {
    id: "youtube",
    labelAr: "محرك يوتيوب",
    description: "استيراد فيديوهات يوتيوب المعتمدة",
    sourceTypes: ["youtube"],
    defaultEnabled: true,
  },
  articles: {
    id: "articles",
    labelAr: "محرك المقالات",
    description: "استيراد مقالات RSS والمواقع",
    sourceTypes: ["rss", "website"],
    defaultEnabled: true,
  },
  "review-queue": {
    id: "review-queue",
    labelAr: "محرك مركز المراجعة",
    description: "معالجة عناصر المراجعة المعلقة",
    sourceTypes: [],
    defaultEnabled: true,
  },
  recommendations: {
    id: "recommendations",
    labelAr: "محرك التوصيات",
    description: "ربط المحتوى ذي الصلة (قد يعجبك أيضًا)",
    sourceTypes: [],
    defaultEnabled: true,
  },
  notifications: {
    id: "notifications",
    labelAr: "محرك الإشعارات",
    description: "إشعارات المحتوى الجديد",
    sourceTypes: [],
    defaultEnabled: true,
  },
  backfill: {
    id: "backfill",
    labelAr: "محرك التعبئة الأولية",
    description: "تعبئة شهر حالي ثم التزامن التدريجي",
    sourceTypes: ["all"],
    defaultEnabled: true,
  },
};

export const REVIEW_REASONS = [
  "missing_source",
  "low_quality",
  "duplicate",
  "weak_extraction",
  "unknown_sheikh",
  "unclear_category",
  "needs_manual_approval",
];

export const LESSON_CATEGORIES = [
  "عقيدة",
  "فقه",
  "حديث",
  "تفسير",
  "سيرة",
  "آداب",
  "رقائق",
  "قرآن",
];

export const INSTAGRAM_CLASSIFICATIONS = ["درس", "إعلان", "دورة", "فائدة", "تنبيه"];

export function listEngines() {
  return ENGINE_IDS.map((id) => ENGINES[id]);
}

export function getEngine(id) {
  return ENGINES[id] || null;
}
