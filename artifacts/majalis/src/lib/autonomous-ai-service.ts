/**
 * Autonomous AI Platform — client service
 */

import { adminFetch as apiFetch } from "@/lib/admin-api";

export type AutonomousObservability = {
  ok: boolean;
  cronJobs?: Array<{ name: string; schedule: string; path: string; status: string }>;
  ai?: { status: string; openai: boolean; anthropic: boolean; metadataOnly: boolean };
  database?: { status: string; serviceRole: boolean };
  sources?: { total: number; active: number; connectorsHealthy: number };
  metrics?: {
    itemsNew: number;
    itemsUpdated: number;
    itemsRejected: number;
    successRate: number;
    runsTotal: number;
    retryPending: number;
    dailyContentCount: number;
  };
  rejectionReasons?: Record<string, number>;
  recentEvents?: Array<{ stage: string; message: string; success: boolean; created_at: string }>;
};

export type AutonomousReport = {
  automation_pct: number;
  automated_operations: number;
  human_required_operations: Array<{ operation: string; reason: string }>;
  security_score: number;
  performance_score: number;
  content_quality_score: number;
  scalability_score: number;
  improvement_plan: string[];
};


async function autonomousApi(action: string, body?: Record<string, unknown>) {
  const res = await apiFetch(`/api/admin/autonomous-ai?action=${action}`, {
    method: body ? "POST" : "GET",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Autonomous AI API ${action} failed`);
  return res.json();
}

export async function fetchAutonomousDashboard(): Promise<AutonomousObservability | null> {
  try {
    const json = await autonomousApi("dashboard");
    return json;
  } catch {
    return null;
  }
}

export async function runAutonomousPipeline(opts?: { mode?: string; checkLinks?: boolean }) {
  return autonomousApi("run", opts);
}

export async function runSecurityAudit() {
  const json = await autonomousApi("security");
  return json.audit;
}

export async function generateAutonomousReport(): Promise<AutonomousReport | null> {
  try {
    const json = await autonomousApi("report");
    return json.report;
  } catch {
    return null;
  }
}

export async function fetchDailyContent(type?: string) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  const res = await fetch(`/api/daily-content?${params}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.content || [];
}

export async function fetchPipelineEvents(limit = 30) {
  const json = await autonomousApi("events");
  return (json.events || []).slice(0, limit);
}

export const PIPELINE_STAGE_LABELS: Record<string, string> = {
  discover: "اكتشاف",
  fetch: "جلب",
  clean: "تنظيف",
  dedup: "إزالة التكرار",
  verify_source: "التحقق",
  classify: "تصنيف",
  keywords: "كلمات مفتاحية",
  summarize: "ملخص",
  relate: "ربط",
  seo: "SEO",
  store: "حفظ",
  publish: "نشر",
  index: "فهرسة",
  audit: "سجلات",
};
