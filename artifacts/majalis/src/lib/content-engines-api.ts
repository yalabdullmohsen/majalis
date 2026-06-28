import { adminFetch } from "@/lib/admin-api";

export type ContentEngineConfig = {
  id: string;
  label_ar: string;
  enabled: boolean;
  last_run_at?: string;
  last_success_at?: string;
  last_error?: string;
  health_score: number;
  lastRun?: ContentEngineRun;
};

export type ContentEngineRun = {
  id: string;
  engine_id: string;
  run_type: string;
  status: string;
  items_fetched: number;
  items_parsed: number;
  items_published: number;
  items_review: number;
  items_rejected: number;
  items_duplicate: number;
  started_at: string;
  duration_ms?: number;
};

export type ContentEnginesDashboard = {
  ok: boolean;
  stats: {
    engines: ContentEngineConfig[];
    recent_runs: ContentEngineRun[];
    review_pending: number;
    totals: {
      published_benefits?: number;
      published_questions?: number;
      lesson_notes?: number;
      recommendations?: number;
    };
  };
  verification: VerificationReport;
};

export type VerificationReport = {
  ok: boolean;
  activeSources: number;
  fetched: number;
  parsed: number;
  enriched: number;
  duplicates: number;
  rejected: number;
  review: number;
  published: number;
  indexed: number;
  publishedBenefits: number;
  publishedQuestions: number;
  publishedArticles: number;
  lessonNotes: number;
  recommendationLinks: number;
  reviewPending: number;
};

export async function getContentEnginesDashboard(): Promise<ContentEnginesDashboard> {
  const res = await adminFetch("/api/admin/content-engines?action=dashboard");
  if (!res.ok) throw new Error("Failed to load content engines dashboard");
  return res.json();
}

export async function runContentEngine(engineId: string, options?: { maxItems?: number; lessonId?: string }) {
  const res = await adminFetch("/api/admin/content-engines?action=run", {
    method: "POST",
    body: JSON.stringify({ engineId, ...options }),
  });
  return res.json();
}

export async function runAllContentEngines(engineIds?: string[]) {
  const res = await adminFetch("/api/admin/content-engines?action=run-all", {
    method: "POST",
    body: JSON.stringify({ engineIds }),
  });
  return res.json();
}

export async function runContentEnginesBackfill() {
  const res = await adminFetch("/api/admin/content-engines?action=backfill", { method: "POST" });
  return res.json();
}

export async function retryFailedContentEngines() {
  const res = await adminFetch("/api/admin/content-engines?action=retry-failed", { method: "POST" });
  return res.json();
}

export async function toggleContentEngine(engineId: string, enabled: boolean) {
  const res = await adminFetch("/api/admin/content-engines?action=toggle", {
    method: "POST",
    body: JSON.stringify({ engineId, enabled }),
  });
  return res.json();
}

export async function getContentEngineReviewQueue() {
  const res = await adminFetch("/api/admin/content-engines?action=review-queue");
  return res.json();
}
