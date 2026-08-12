/** Role constants shared by auth UI — no Supabase/admin-api imports. */

export const GOVERNANCE_ROLES = [
  { id: "super_admin", label: "مدير عام" },
  { id: "system_admin", label: "مدير النظام" },
  { id: "content_manager", label: "مدير المحتوى" },
  { id: "scientific_reviewer", label: "مراجع علمي" },
  { id: "editor", label: "محرر" },
  { id: "author", label: "مؤلف" },
  { id: "translator", label: "مترجم" },
  { id: "moderator", label: "مشرف" },
  { id: "analytics_viewer", label: "عارض التحليلات" },
  { id: "read_only", label: "قراءة فقط" },
];

export const LIFECYCLE_STAGES = [
  "draft",
  "ai_processing",
  "source_verification",
  "editorial_review",
  "scientific_review",
  "approval",
  "publish",
  "scheduled_review",
  "archive",
];

export const LEGACY_ROLE_MAP: Record<string, string> = {
  admin: "super_admin",
  sheikh: "scientific_reviewer",
  user: "read_only",
};

export const ADMIN_GOVERNANCE_ROLES = [
  "super_admin",
  "system_admin",
  "content_manager",
  "scientific_reviewer",
  "editor",
  "moderator",
];
