/**
 * Kuwait Lessons Sync — admin client service
 */

export type LessonSyncStats = {
  fetched?: number;
  new?: number;
  updated?: number;
  duplicates?: number;
  review?: number;
  errors?: number;
  archived?: number;
  ai_used?: number;
  published?: number;
};

export type LessonSyncRun = {
  id?: string;
  started_at: string;
  finished_at?: string;
  status: string;
  new_count?: number;
  updated_count?: number;
  duplicate_count?: number;
  error_count?: number;
  review_count?: number;
  archived_count?: number;
  summary?: LessonSyncStats;
  stats?: LessonSyncStats;
};

export type LessonSourceHealth = {
  source_id: string;
  source_name: string;
  source_type: string;
  status: string;
  last_sync_at?: string;
  last_success_at?: string;
  items_fetched?: number;
  items_published?: number;
  items_review?: number;
  last_error?: string;
};

export type LessonSyncDashboard = {
  ok: boolean;
  registry?: {
    active: number;
    pending: number;
    estimated_daily_capacity: number;
    connected: Array<{ id: string; name: string; type: string; estimated_daily_items: number }>;
    pending_integration: Array<{ id: string; name: string; notes?: string }>;
  };
  latest_run?: LessonSyncRun | null;
  source_health?: LessonSourceHealth[];
  recent_runs?: LessonSyncRun[];
  report?: Record<string, unknown>;
};

function authHeaders(): Record<string, string> {
  const secret = import.meta.env.VITE_ADMIN_API_SECRET || import.meta.env.VITE_CRON_SECRET;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers.Authorization = `Bearer ${secret}`;
  return headers;
}

async function lessonSyncFetch(action: string, body?: Record<string, unknown>) {
  const res = await fetch(`/api/admin/lesson-sync?action=${action}`, {
    method: body ? "POST" : "GET",
    headers: authHeaders(),
    body: body ? JSON.stringify({ action, ...body }) : undefined,
  });
  if (!res.ok) throw new Error(`Lesson sync API ${action} failed`);
  return res.json();
}

export async function fetchLessonSyncDashboard(limit = 10): Promise<LessonSyncDashboard> {
  return lessonSyncFetch("stats", { limit });
}

export async function runLessonSyncManual(options?: { useAi?: boolean; dryRun?: boolean }) {
  return lessonSyncFetch("run", options ?? {});
}

export async function fetchLessonSyncReport() {
  return lessonSyncFetch("report");
}
