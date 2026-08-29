import type { AcademicLevel, LicenseType, ResearchCategory, ResearchKind, ReviewStatus } from "./types";

/** التصنيفات الأساسية — قابلة للإضافة دون تعديل جذري (أضف عنصرًا هنا أو من الإدارة). */
export const RESEARCH_CATEGORIES: ResearchCategory[] = [
  { id: "aqidah", label: "العقيدة والتوحيد", sortOrder: 1 },
  { id: "quran-sciences", label: "القرآن وعلومه", sortOrder: 2 },
  { id: "tafsir", label: "التفسير وأصوله", sortOrder: 3 },
  { id: "hadith", label: "الحديث وعلومه", sortOrder: 4 },
  { id: "fiqh", label: "الفقه", sortOrder: 5 },
  { id: "usul-fiqh", label: "أصول الفقه", sortOrder: 6 },
  { id: "qawaid", label: "القواعد الفقهية", sortOrder: 7 },
  { id: "comparative-fiqh", label: "الفقه المقارن", sortOrder: 8 },
  { id: "siyasa", label: "السياسة الشرعية", sortOrder: 9 },
  { id: "qada", label: "القضاء والإثبات", sortOrder: 10 },
  { id: "islamic-finance", label: "المعاملات المالية الإسلامية", sortOrder: 11 },
  { id: "islamic-econ", label: "الاقتصاد الإسلامي", sortOrder: 12 },
  { id: "nawazil", label: "فقه النوازل", sortOrder: 13 },
  { id: "seerah", label: "السيرة النبوية", sortOrder: 14 },
  { id: "islamic-history", label: "التاريخ الإسلامي", sortOrder: 15 },
  { id: "dawah", label: "الدعوة والثقافة الإسلامية", sortOrder: 16 },
  { id: "sects", label: "الفرق والمذاهب", sortOrder: 17 },
  { id: "maqasid", label: "مقاصد الشريعة", sortOrder: 18 },
  { id: "quranic-studies", label: "الدراسات القرآنية", sortOrder: 19 },
  { id: "hadith-studies", label: "الدراسات الحديثية", sortOrder: 20 },
  { id: "aqidah-studies", label: "الدراسات العقدية", sortOrder: 21 },
  { id: "fiqh-studies", label: "الدراسات الفقهية", sortOrder: 22 },
  { id: "comparative-studies", label: "الدراسات المقارنة", sortOrder: 23 },
  { id: "family", label: "الأسرة والأحوال الشخصية", sortOrder: 24 },
  { id: "inheritance", label: "المواريث والوصايا", sortOrder: 25 },
  { id: "waqf", label: "الوقف والعمل الخيري", sortOrder: 26 },
  { id: "akhlaq", label: "الأخلاق والآداب الإسلامية", sortOrder: 27 },
  { id: "ijaz", label: "الإعجاز العلمي", sortOrder: 28 },
  { id: "interfaith", label: "الحوار والأديان", sortOrder: 29 },
  { id: "arabic", label: "اللغة العربية وآدابها المرتبطة بالدراسات الشرعية", sortOrder: 30 },
  { id: "manuscripts", label: "تحقيق المخطوطات", sortOrder: 31 },
  { id: "biographies", label: "التراجم والأعلام", sortOrder: 32 },
  { id: "contemporary-thought", label: "قضايا الفكر المعاصر", sortOrder: 33 },
  { id: "ai-tech", label: "الذكاء الاصطناعي والتقنية في خدمة العلوم الشرعية", sortOrder: 34 },
  { id: "interdisciplinary", label: "أبحاث متعددة التخصصات", sortOrder: 35 },
].map((c) => ({ ...c, active: true }));

export const RESEARCH_KIND_LABELS: Record<ResearchKind, string> = {
  undergraduate: "بحث جامعي",
  graduation_project: "مشروع تخرج",
  course_paper: "بحث مقرر دراسي",
  masters_thesis: "رسالة ماجستير",
  phd_dissertation: "أطروحة دكتوراه",
  peer_reviewed: "بحث محكم",
  journal_article: "ورقة علمية",
  analytical_study: "دراسة تحليلية",
  comparative_study: "دراسة مقارنة",
  manuscript_edition: "تحقيق مخطوط",
  research_proposal: "خطة بحث",
  research_abstract: "ملخص بحث",
  book_review: "مراجعة كتاب",
  personal_research: "بحث شخصي",
  unpublished: "بحث غير منشور",
  published_journal: "بحث منشور في مجلة علمية",
  conference_paper: "بحث مقدم إلى مؤتمر أو ندوة",
};

export const ACADEMIC_LEVEL_LABELS: Record<AcademicLevel, string> = {
  undergraduate: "بكالوريوس / جامعي",
  masters: "ماجستير",
  phd: "دكتوراه",
  postdoc: "ما بعد الدكتوراه",
  faculty: "هيئة تدريس",
  independent: "باحث مستقل",
  other: "أخرى",
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  draft: "مسودة",
  submitted: "تم الإرسال",
  auto_screening: "قيد الفحص الآلي",
  awaiting_review: "بانتظار المراجعة",
  needs_revision: "يحتاج تعديلات",
  rejected: "مرفوض",
  accepted: "مقبول",
  published: "منشور",
  withdrawn: "مسحوب",
  rights_hold: "موقوف بسبب بلاغ حقوق",
};

export const LICENSE_LABELS: Record<LicenseType, string> = {
  all_rights_reserved: "جميع الحقوق محفوظة",
  cc_by: "المشاع الإبداعي CC BY",
  cc_by_sa: "المشاع الإبداعي CC BY-SA",
  cc_by_nc: "المشاع الإبداعي CC BY-NC",
  cc_by_nc_sa: "المشاع الإبداعي CC BY-NC-SA",
  cc_by_nd: "المشاع الإبداعي CC BY-ND",
  cc0: "CC0 (ملك عام)",
  publisher_permission: "إذن الناشر",
  author_permission: "إذن المؤلف",
  unknown: "غير محدد",
};

export const RIGHTS_DISCLAIMER =
  "جميع الحقوق العلمية والأدبية محفوظة لأصحاب الأبحاث والجهات الناشرة، وتعرض المنصة المحتوى وفق الإذن أو الترخيص المتاح.";

export const PERSONAL_RESEARCH_NOTICE =
  "الآراء والنتائج الواردة في البحث تمثل صاحبها، ولا تمثل بالضرورة رأي منصة سُنّة.";

export const ANTI_CHEATING_NOTICE =
  "توفر المنصة أدوات مساعدة للبحث والتعلم، ولا يجوز استخدام محتواها لتقديم عمل منقول أو منتحل على أنه عمل أصلي.";

export const PLATFORM_OWNERSHIP_NOTICE =
  "المنصة لا تدّعي ملكية الأبحاث المنشورة؛ دورها الفهرسة والعرض وفق الإذن أو الترخيص.";

export function categoryById(id: string): ResearchCategory | undefined {
  return RESEARCH_CATEGORIES.find((c) => c.id === id);
}

export function categoryLabel(id: string): string {
  return categoryById(id)?.label ?? id;
}

export const THESIS_KINDS: ResearchKind[] = ["masters_thesis", "phd_dissertation"];
export const PEER_REVIEWED_KINDS: ResearchKind[] = ["peer_reviewed", "published_journal", "journal_article"];
