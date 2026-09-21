/**
 * كتالوج مراكز Admin v3 — روابط Legacy موثّقة فقط (لا CRUD جديد في Wave 6).
 */
import type { AdminV3CenterId } from "../nav";

export type AdminV3Permission =
  | "admin.read"
  | "content.read"
  | "content.write"
  | "review.read"
  | "review.decide"
  | "users.read"
  | "users.roles"
  | "notifications.read"
  | "analytics.read"
  | "automation.read"
  | "system.read"
  | "settings.read"
  | "audit.read";

export type AdminV3ToolItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  tags: string[];
  /** مصدر الجرد — للتوثيق فقط */
  legacySource: string;
};

export type AdminV3CenterDef = {
  id: Exclude<AdminV3CenterId, "home">;
  title: string;
  summary: string;
  permissions: readonly AdminV3Permission[];
  tools: readonly AdminV3ToolItem[];
};

export const ADMIN_V3_CENTERS: Record<
  Exclude<AdminV3CenterId, "home">,
  AdminV3CenterDef
> = {
  content: {
    id: "content",
    title: "مركز المحتوى",
    summary: "إدارة موحّدة للمحتوى والاستيراد — العمليات عبر المسارات السابقة حتى Wave 7.",
    permissions: ["admin.read", "content.read", "content.write"],
    tools: [
      { id: "lessons", title: "الدروس", description: "إدارة الدروس والجداول", href: "/admin?section=lessons", tags: ["دروس"], legacySource: "AdminShell#lessons" },
      { id: "sheikhs", title: "المشايخ", description: "ملفات المشايخ", href: "/admin?section=sheikhs", tags: ["مشايخ"], legacySource: "AdminShell#sheikhs" },
      { id: "library", title: "المكتبة", description: "كتب ومراجع", href: "/admin?section=library", tags: ["مكتبة"], legacySource: "AdminShell#library" },
      { id: "categories", title: "التصنيفات", description: "أبواب العلم", href: "/admin?section=categories", tags: ["تصنيف"], legacySource: "AdminShell#categories" },
      { id: "fawaid", title: "الفوائد", description: "فوائد مختصرة", href: "/admin?section=fawaid", tags: ["فوائد"], legacySource: "AdminShell#fawaid" },
      { id: "adhkar", title: "الأذكار", description: "أذكار وأوراد", href: "/admin?section=adhkar", tags: ["أذكار"], legacySource: "AdminShell#adhkar" },
      { id: "qa", title: "الأسئلة والأجوبة", description: "بنك الأسئلة", href: "/admin?section=qa", tags: ["أسئلة"], legacySource: "AdminShell#qa" },
      { id: "quiz", title: "المسابقة", description: "أسئلة التحدي", href: "/admin?section=quiz", tags: ["تحدي"], legacySource: "AdminShell#quiz" },
      { id: "miracles", title: "إشارات كونية", description: "محتوى الإعجاز", href: "/admin?section=miracles", tags: ["إشارات"], legacySource: "AdminShell#miracles" },
      { id: "rulings", title: "الأحكام", description: "موسوعة الأحكام (أرشيف/إدارة)", href: "/admin?section=rulings", tags: ["فقه"], legacySource: "AdminShell#rulings" },
      { id: "import-url", title: "استيراد برابط", description: "استيراد درس عبر URL", href: "/admin/content-import/url", tags: ["استيراد"], legacySource: "LessonImportUrlPage" },
      { id: "import-image", title: "استيراد بصورة", description: "استخلاص من صورة", href: "/admin/content-import/image", tags: ["استيراد"], legacySource: "LessonImportImagePage" },
      { id: "universities", title: "الجامعات", description: "إدارة الجامعات", href: "/admin/universities", tags: ["جامعات"], legacySource: "UniversitiesAdminPage" },
      { id: "prophet-stories", title: "قصص الأنبياء", description: "إدارة قصص الأنبياء", href: "/admin?section=prophet-stories", tags: ["قصص"], legacySource: "AdminShell#prophet-stories" },
      { id: "islamic-stories", title: "القصص الإسلامية", description: "إدارة القصص", href: "/admin?section=islamic-stories", tags: ["قصص"], legacySource: "AdminShell#islamic-stories" },
    ],
  },
  review: {
    id: "review",
    title: "مركز المراجعة",
    summary: "طابور مراجعة موحّد — الوجهات السابقة مجمّعة هنا دون دمج منطق CRUD.",
    permissions: ["admin.read", "review.read", "review.decide"],
    tools: [
      { id: "review-hub", title: "مركز المراجعة (Hub)", description: "مساحة المراجعة الرئيسية", href: "/admin/review-hub", tags: ["مراجعة"], legacySource: "ReviewHubPage" },
      { id: "review-center", title: "مراجعة الأتمتة", description: "طابور مراجعة الأتمتة", href: "/admin/review-center", tags: ["أتمتة", "مراجعة"], legacySource: "AutomationReviewPage" },
      { id: "submissions", title: "مقترحات المجتمع", description: "مراجعة المساهمات", href: "/admin?section=submissions", tags: ["مجتمع"], legacySource: "AdminShell#submissions" },
      { id: "scholarly", title: "التوثيق العلمي", description: "مراجعة علمية", href: "/admin?section=scholarly-verification", tags: ["توثيق"], legacySource: "AdminShell#scholarly-verification" },
      { id: "calendar-review", title: "مراجعة التقويم الشرعي", description: "مراجعة مناسبات التقويم", href: "/admin?section=religious-calendar-review", tags: ["تقويم"], legacySource: "AdminShell#religious-calendar-review" },
      { id: "reports", title: "التقارير", description: "بلاغات المستخدمين", href: "/admin?section=reports", tags: ["بلاغات"], legacySource: "AdminShell#reports" },
    ],
  },
  users: {
    id: "users",
    title: "المستخدمون والأدوار",
    summary: "عرض المستخدمين والأدوار عبر الواجهة السابقة — بلا تغيير صلاحيات/RLS.",
    permissions: ["admin.read", "users.read", "users.roles"],
    tools: [
      { id: "users", title: "المستخدمون", description: "قائمة الحسابات", href: "/admin?section=users", tags: ["مستخدمون"], legacySource: "AdminShell#users" },
      { id: "governance", title: "الحوكمة", description: "سياسات الحوكمة (عرض)", href: "/admin?section=governance", tags: ["حوكمة"], legacySource: "AdminShell#governance" },
    ],
  },
  notifications: {
    id: "notifications",
    title: "الإشعارات",
    summary: "قنوات الإشعار والتكاملات — مجمّعة من المسارات السابقة.",
    permissions: ["admin.read", "notifications.read"],
    tools: [
      { id: "telegram", title: "Telegram", description: "تكامل تيليجرام", href: "/admin?section=telegram", tags: ["إشعار"], legacySource: "AdminShell#telegram" },
      { id: "instagram", title: "إنستغرام", description: "تكامل إنستغرام", href: "/admin/integrations/instagram", tags: ["إشعار", "تكامل"], legacySource: "InstagramIntegrationPage" },
    ],
  },
  analytics: {
    id: "analytics",
    title: "التحليلات",
    summary: "مساحة تحليلات موحّدة فوق الأدوات السابقة.",
    permissions: ["admin.read", "analytics.read"],
    tools: [
      { id: "search-analytics", title: "تحليلات البحث", description: "إحصاءات البحث", href: "/admin?section=search-analytics", tags: ["بحث"], legacySource: "AdminShell#search-analytics" },
      { id: "feature-status", title: "حالة الميزات", description: "لوحة حالة الميزات", href: "/admin/feature-status", tags: ["ميزات"], legacySource: "FeatureStatusPage" },
      { id: "dashboard-legacy", title: "لوحة التحكم المتقدمة", description: "لوحة review/dashboard السابقة", href: "/admin/dashboard", tags: ["لوحة"], legacySource: "AdminDashboardPage" },
    ],
  },
  automation: {
    id: "automation",
    title: "الأتمتة",
    summary: "مراكز الأتمتة والـCMS والذكاء — مجمّعة بلا تكرار واجهات جديدة CRUD.",
    permissions: ["admin.read", "automation.read"],
    tools: [
      { id: "auto-center", title: "مركز الأتمتة", description: "المركز الرئيسي", href: "/admin/automation/center", tags: ["أتمتة"], legacySource: "AutomationCenterPage" },
      { id: "auto-dashboard", title: "لوحة الأتمتة", description: "لوحة تشغيل", href: "/admin/automation/dashboard", tags: ["أتمتة"], legacySource: "AutomationDashboardPage" },
      { id: "auto-content", title: "المحتوى الآلي", description: "إنتاج محتوى آلي", href: "/admin/auto-content", tags: ["محتوى"], legacySource: "AutoContentPage" },
      { id: "content-production", title: "إنتاج المحتوى", description: "خط إنتاج المحتوى", href: "/admin/content-production", tags: ["إنتاج"], legacySource: "ContentProductionDashboardPage" },
      { id: "sources", title: "مصادر الاستيراد", description: "مصادر الأتمتة", href: "/admin/sources", tags: ["مصادر"], legacySource: "AutomationSourcesPage" },
      { id: "platform", title: "منصة المعرفة", description: "محرك المعرفة", href: "/admin/automation/platform", tags: ["معرفة"], legacySource: "MajlisKnowledgeEnginePage" },
      { id: "autonomous", title: "المنصة الذاتية", description: "المنصة الذاتية", href: "/admin/autonomous-platform", tags: ["AI"], legacySource: "AutonomousPlatformPage" },
      { id: "smart-cms", title: "CMS الذكي", description: "إدارة CMS", href: "/admin?section=smart-cms", tags: ["CMS"], legacySource: "AdminShell#smart-cms" },
      { id: "aggregator", title: "محرك التجميع", description: "تجميع المحتوى", href: "/admin?section=aggregator", tags: ["تجميع"], legacySource: "AdminShell#aggregator" },
      { id: "knowledge-engine", title: "Auto Knowledge", description: "محرك المعرفة الآلي", href: "/admin?section=knowledge-engine", tags: ["معرفة"], legacySource: "AdminShell#knowledge-engine" },
    ],
  },
  system: {
    id: "system",
    title: "النظام",
    summary: "مراقبة وأخطاء وحالة المنصة — عرض فقط عبر المسارات السابقة.",
    permissions: ["admin.read", "system.read"],
    tools: [
      { id: "error-logs", title: "سجل الأخطاء", description: "أخطاء العميل", href: "/admin?section=error-logs", tags: ["أخطاء"], legacySource: "AdminShell#error-logs" },
      { id: "feature-status", title: "حالة الميزات", description: "مراقبة الميزات", href: "/admin/feature-status", tags: ["مراقبة"], legacySource: "FeatureStatusPage" },
      { id: "internal-status", title: "الحالة الداخلية", description: "صفحة الحالة الداخلية", href: "/internal/status", tags: ["مراقبة"], legacySource: "InternalStatusPage" },
    ],
  },
  settings: {
    id: "settings",
    title: "الإعدادات",
    summary: "إعدادات مجمّعة — بدون تغيير سياسات الخادم في هذه الموجة.",
    permissions: ["admin.read", "settings.read"],
    tools: [
      { id: "settings", title: "إعدادات اللوحة", description: "إعدادات عامة", href: "/admin?section=settings", tags: ["إعدادات"], legacySource: "AdminShell#settings" },
      { id: "governance", title: "سياسات الحوكمة", description: "عرض السياسات", href: "/admin?section=governance", tags: ["حوكمة"], legacySource: "AdminShell#governance" },
    ],
  },
  audit: {
    id: "audit",
    title: "سجل التدقيق",
    summary: "أحداث واجهة Admin v3 المحلية — لا يغيّر RLS.",
    permissions: ["admin.read", "audit.read"],
    tools: [],
  },
};

export function listCenterTools(centerId: Exclude<AdminV3CenterId, "home">): readonly AdminV3ToolItem[] {
  return ADMIN_V3_CENTERS[centerId]?.tools ?? [];
}

export function filterCenterTools(
  tools: readonly AdminV3ToolItem[],
  query: string,
  tag: string,
): AdminV3ToolItem[] {
  const q = query.trim().toLowerCase();
  return tools.filter((t) => {
    if (tag && tag !== "الكل" && !t.tags.includes(tag)) return false;
    if (!q) return true;
    const blob = `${t.title} ${t.description} ${t.tags.join(" ")} ${t.href}`.toLowerCase();
    return blob.includes(q);
  });
}

export function uniqueTags(tools: readonly AdminV3ToolItem[]): string[] {
  const set = new Set<string>();
  for (const t of tools) for (const tag of t.tags) set.add(tag);
  return ["الكل", ...[...set].sort((a, b) => a.localeCompare(b, "ar"))];
}
