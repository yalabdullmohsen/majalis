/**
 * Enterprise Governance — client service
 */

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

function authHeaders(): Record<string, string> {
  const secret = import.meta.env.VITE_ADMIN_API_SECRET || import.meta.env.VITE_CRON_SECRET;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers.Authorization = `Bearer ${secret}`;
  return headers;
}

export async function fetchGovernanceDashboard(): Promise<GovernanceDashboard | null> {
  try {
    const res = await fetch("/api/admin/governance?action=dashboard", { headers: authHeaders() });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function runSecurityAudit() {
  const res = await fetch("/api/admin/governance?action=security", { headers: authHeaders() });
  if (!res.ok) throw new Error("Security audit failed");
  const json = await res.json();
  return json.audit;
}

export async function runBackupCheck() {
  const res = await fetch("/api/admin/governance?action=backup", { method: "POST", headers: authHeaders() });
  if (!res.ok) throw new Error("Backup failed");
  const json = await res.json();
  return json.backup;
}

export async function generateGovernanceReport() {
  const res = await fetch("/api/admin/governance?action=report", { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.report;
}

export async function fetchReviewQueue() {
  const res = await fetch("/api/admin/governance?action=reviews", { headers: authHeaders() });
  if (!res.ok) return [];
  const json = await res.json();
  return json.reviews || [];
}

export async function fetchMaintenancePlan() {
  const res = await fetch("/api/admin/governance?action=maintenance-plan", { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.plan;
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
