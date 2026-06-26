/**
 * Islamic Intelligence Platform — client service
 */

export type IntelligenceAgent = {
  id: string;
  label: string;
  label_ar: string;
  schedule: string;
  description: string;
};

export type IntelligenceDashboard = {
  agents: Record<string, IntelligenceAgent>;
  agent_count: number;
  recent_runs: Array<{
    id: string;
    agent_id: string;
    status: string;
    items_checked: number;
    issues_found: number;
    started_at: string;
  }>;
  analytics?: IntelligenceAnalytics;
  human_required: Array<{ task: string; reason: string }>;
};

export type IntelligenceAnalytics = {
  most_read_topics: Array<{ slug: string; title: string; count: number }>;
  most_searched: Array<{ query: string; count: number }>;
  pages_needing_enrichment: Array<{ query: string; search_count: number }>;
  insufficient_content: Array<{ query: string; searches: number; message: string }>;
  content_growth: { new_items: number; updated_items: number; growth_rate: number };
  update_success_rate: number;
  quality: { avg_score: number; incomplete: number; needs_review: number };
  verification_pct: number;
  search_quality_score: number;
  avg_response_ms: number;
};

export type IntelligenceReport = {
  completion_pct: number;
  automation_pct: number;
  ai_agent_count: number;
  fully_autonomous_tasks: string[];
  human_required_tasks: Array<{ task: string; reason: string }>;
  performance_assessment: { score: number; avg_search_ms: number };
  security_assessment: { score: number; note: string };
  content_quality_assessment: { score: number; verification_pct: number };
};

function authHeaders(): Record<string, string> {
  const secret = import.meta.env.VITE_ADMIN_API_SECRET || import.meta.env.VITE_CRON_SECRET;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers.Authorization = `Bearer ${secret}`;
  return headers;
}

export async function fetchIntelligenceDashboard(): Promise<IntelligenceDashboard | null> {
  try {
    const res = await fetch("/api/admin/islamic-intelligence?action=dashboard", { headers: authHeaders() });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchIntelligenceAnalytics(days = 30): Promise<IntelligenceAnalytics | null> {
  try {
    const res = await fetch(`/api/admin/islamic-intelligence?action=analytics&days=${days}`, { headers: authHeaders() });
    if (!res.ok) return null;
    const json = await res.json();
    return json.analytics;
  } catch {
    return null;
  }
}

export async function runIntelligencePlatform(mode = "full") {
  const res = await fetch("/api/admin/islamic-intelligence?action=run", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ mode, checkLinks: true }),
  });
  if (!res.ok) throw new Error("Run failed");
  return res.json();
}

export async function runIntelligenceAgent(agentId: string) {
  const res = await fetch("/api/admin/islamic-intelligence?action=run-agent", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ agent: agentId }),
  });
  if (!res.ok) throw new Error("Agent run failed");
  return res.json();
}

export async function generateIntelligenceReport(): Promise<IntelligenceReport | null> {
  const res = await fetch("/api/admin/islamic-intelligence?action=report", { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.report;
}

export async function generateWeeklyIntelligenceReport() {
  const res = await fetch("/api/admin/islamic-intelligence?action=weekly-report", { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.report;
}

export async function fetchDevelopmentPlan() {
  const res = await fetch("/api/admin/islamic-intelligence?action=plan", { headers: authHeaders() });
  if (!res.ok) return null;
  const json = await res.json();
  return json.plan;
}

export const AGENT_LABELS: Record<string, string> = {
  knowledge_auditor: "مدقق المعرفة",
  content_planner: "مخطط المحتوى",
  knowledge_discovery: "اكتشاف المعرفة",
  relationship_builder: "باني العلاقات",
  quality_scorer: "مقياس الجودة",
  security_assistant: "مساعد الأمان",
  performance_optimizer: "محسّن الأداء",
  analytics: "التحليلات",
  weekly_report: "التقرير الأسبوعي",
};
