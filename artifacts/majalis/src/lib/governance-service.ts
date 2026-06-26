/**
 * Enterprise Governance — client service (Supabase JWT auth, no client secrets).
 */

import { adminFetch } from "@/lib/admin-api";

export type GovernanceDashboard = {
  monitoring?: {
    database?: { status: string };
    vercel?: { status: string };
    supabase?: { status: string };
    cron_jobs?: { total: number; status: string };
    ai?: { status: string };
    queue?: { pending: number; failed: number };
    backups?: { status: string };
    performance?: { success_rate: number };
  };
  quality?: {
    overall_score: number;
    completeness_pct: number;
    verification_pct: number;
    needs_review_pct: number;
    duplicate_count: number;
    broken_links_count: number;
  };
  recent_audit?: Array<{ action: string; actor_id: string; created_at: string; outcome: string }>;
  review_queue?: Array<{ content_kind: string; content_id: string; status: string }>;
};

export async function fetchGovernanceDashboard(): Promise<GovernanceDashboard | null> {
  try {
    const res = await adminFetch("/api/admin/governance?action=dashboard");
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function runSecurityAudit() {
  const res = await adminFetch("/api/admin/governance?action=security");
  if (!res.ok) throw new Error("Security audit failed");
  const json = await res.json();
  return json.audit;
}

export async function runBackupCheck() {
  const res = await adminFetch("/api/admin/governance?action=backup", { method: "POST" });
  if (!res.ok) throw new Error("Backup failed");
  const json = await res.json();
  return json.backup;
}

export async function runRestoreTest() {
  const res = await adminFetch("/api/admin/governance?action=restore-test", { method: "POST" });
  if (!res.ok) throw new Error("Restore test failed");
  const json = await res.json();
  return json.restore;
}

export async function generateGovernanceReport() {
  const res = await adminFetch("/api/admin/governance?action=report");
  if (!res.ok) return null;
  const json = await res.json();
  return json.report;
}

export async function fetchReviewQueue() {
  const res = await adminFetch("/api/admin/governance?action=reviews");
  if (!res.ok) return [];
  const json = await res.json();
  return json.reviews || [];
}

export async function fetchMaintenancePlan() {
  const res = await adminFetch("/api/admin/governance?action=maintenance-plan");
  if (!res.ok) return null;
  const json = await res.json();
  return json.plan;
}

export async function assignGovernanceRole(userId: string, roleId: string) {
  const res = await adminFetch("/api/admin/governance?action=assign-role", {
    method: "POST",
    body: JSON.stringify({ userId, roleId }),
  });
  if (!res.ok) throw new Error("Role assignment failed");
  return res.json();
}

export async function syncLegacyRoles() {
  const res = await adminFetch("/api/admin/governance?action=sync-roles", { method: "POST" });
  if (!res.ok) throw new Error("Role sync failed");
  return res.json();
}

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
  "draft", "ai_processing", "source_verification", "editorial_review",
  "scientific_review", "approval", "publish", "scheduled_review", "archive",
];

export const LEGACY_ROLE_MAP: Record<string, string> = {
  admin: "super_admin",
  sheikh: "scientific_reviewer",
  user: "read_only",
};

export const ADMIN_GOVERNANCE_ROLES = [
  "super_admin", "system_admin", "content_manager",
  "scientific_reviewer", "editor", "moderator",
];
