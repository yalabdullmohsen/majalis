import { adminFetch } from "@/lib/admin-api";

export type TrustedLessonSource = {
  id?: string;
  name: string;
  platform: string;
  url: string;
  source_type: string;
  trust_level: string;
  auto_publish_allowed: boolean;
  country?: string;
  city?: string;
  category?: string;
  active: boolean;
  feed_url?: string;
  last_checked_at?: string;
  last_success_at?: string;
  failure_count?: number;
  last_error?: string;
};

export type AutomationAuditRecord = {
  id: string;
  source_id?: string;
  source_url: string;
  decision: string;
  reason?: string;
  confidence_score?: number;
  lesson_id?: string;
  draft_id?: string;
  created_at: string;
  parsed_payload?: Record<string, unknown>;
};

async function postAutomation(body: Record<string, unknown>) {
  const res = await adminFetch("/api/admin/lesson-automation", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function listTrustedLessonSources(activeOnly = false) {
  return postAutomation({ action: "list-sources", activeOnly });
}

export async function upsertTrustedLessonSource(source: TrustedLessonSource) {
  return postAutomation({ action: "upsert-source", source });
}

export async function toggleTrustedSource(sourceId: string, active?: boolean) {
  return postAutomation({ action: "toggle-source", sourceId, active });
}

export async function toggleAutoPublish(sourceId: string, auto_publish_allowed?: boolean) {
  return postAutomation({ action: "toggle-auto-publish", sourceId, auto_publish_allowed });
}

export async function runLessonAutomationMonitor(opts?: { sourceId?: string; dryRun?: boolean }) {
  return postAutomation({ action: "run-monitor", ...opts });
}

export async function listAutomationReview() {
  return postAutomation({ action: "list-review" });
}

export async function listAutomationAudit(decision?: string) {
  return postAutomation({ action: "list-audit", decision });
}

export async function approveAutomationDraft(draftId: string, parsed?: Record<string, unknown>) {
  return postAutomation({ action: "approve-draft", draftId, parsed_fields: parsed });
}

export async function rejectAutomationDraft(draftId: string) {
  return postAutomation({ action: "reject-draft", draftId });
}

export const TRUST_LEVELS = [
  ["official", "رسمي"],
  ["trusted", "موثوق"],
  ["community", "مجتمع"],
  ["unknown", "غير معروف"],
] as const;

export const SOURCE_TYPES = [
  ["instagram", "Instagram"],
  ["website", "موقع"],
  ["rss", "RSS"],
  ["telegram", "Telegram"],
  ["youtube", "YouTube"],
  ["x", "X"],
  ["manual", "يدوي"],
] as const;
