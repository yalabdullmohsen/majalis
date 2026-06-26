/**
 * Enterprise Governance — roles, permissions, lifecycle stages.
 */

export const ROLES = {
  super_admin: {
    id: "super_admin",
    label: "Super Admin",
    label_ar: "مدير عام",
    level: 100,
    permissions: ["*"],
  },
  system_admin: {
    id: "system_admin",
    label: "System Administrator",
    label_ar: "مدير النظام",
    level: 90,
    permissions: ["system.*", "users.manage", "audit.read", "backup.*", "cron.run", "security.*"],
  },
  content_manager: {
    id: "content_manager",
    label: "Content Manager",
    label_ar: "مدير المحتوى",
    level: 80,
    permissions: ["content.*", "lifecycle.*", "publish", "archive", "import", "analytics.read"],
  },
  scientific_reviewer: {
    id: "scientific_reviewer",
    label: "Scientific Reviewer",
    label_ar: "مراجع علمي",
    level: 75,
    permissions: ["review.scientific", "review.approve", "review.reject", "content.read", "audit.read"],
  },
  editor: {
    id: "editor",
    label: "Editor",
    label_ar: "محرر",
    level: 70,
    permissions: ["content.edit", "content.create", "lifecycle.submit", "review.editorial", "content.read"],
  },
  author: {
    id: "author",
    label: "Author",
    label_ar: "مؤلف",
    level: 50,
    permissions: ["content.create", "content.edit_own", "lifecycle.draft", "content.read"],
  },
  translator: {
    id: "translator",
    label: "Translator",
    label_ar: "مترجم",
    level: 50,
    permissions: ["content.translate", "content.edit_own", "lifecycle.draft", "content.read"],
  },
  moderator: {
    id: "moderator",
    label: "Moderator",
    label_ar: "مشرف",
    level: 60,
    permissions: ["content.moderate", "review.editorial", "content.read", "users.read"],
  },
  analytics_viewer: {
    id: "analytics_viewer",
    label: "Analytics Viewer",
    label_ar: "عارض التحليلات",
    level: 30,
    permissions: ["analytics.read", "monitoring.read", "content.read"],
  },
  read_only: {
    id: "read_only",
    label: "Read Only",
    label_ar: "قراءة فقط",
    level: 10,
    permissions: ["content.read", "audit.read"],
  },
};

export const ROLE_IDS = Object.keys(ROLES);

/** Legacy profile.role → governance role mapping */
export const LEGACY_ROLE_MAP = {
  admin: "super_admin",
  sheikh: "scientific_reviewer",
  user: "read_only",
};

export const LIFECYCLE_STAGES = [
  { id: "draft", label: "مسودة", order: 1, auto: false },
  { id: "ai_processing", label: "معالجة AI", order: 2, auto: true },
  { id: "source_verification", label: "التحقق من المصدر", order: 3, auto: true },
  { id: "editorial_review", label: "مراجعة تحريرية", order: 4, auto: false, required_role: "editor" },
  { id: "scientific_review", label: "مراجعة علمية", order: 5, auto: false, required_role: "scientific_reviewer" },
  { id: "approval", label: "اعتماد", order: 6, auto: false, required_role: "content_manager" },
  { id: "publish", label: "نشر", order: 7, auto: false, required_role: "content_manager" },
  { id: "scheduled_review", label: "مراجعة دورية", order: 8, auto: true },
  { id: "archive", label: "أرشفة", order: 9, auto: false },
];

export const REVIEW_CHECKS = [
  { id: "source", label: "مراجعة المصدر", auto: true },
  { id: "text", label: "مراجعة النص", auto: true },
  { id: "classification", label: "مراجعة التصنيف", auto: true },
  { id: "links", label: "مراجعة الروابط", auto: true },
  { id: "metadata", label: "مراجعة البيانات الوصفية", auto: true },
  { id: "images", label: "مراجعة الصور", auto: true },
  { id: "policy", label: "التوافق مع سياسة المنصة", auto: true },
];

export const AUDIT_ACTIONS = [
  "create", "update", "delete", "publish", "unpublish", "archive",
  "permission_change", "login", "import", "cron_run", "review_approve",
  "review_reject", "lifecycle_transition", "backup", "restore",
];

export const QUALITY_KPIS = [
  "completeness_pct", "verification_pct", "needs_review_pct",
  "duplicate_count", "broken_links_count", "update_success_rate",
];
