import { supabase } from "@/lib/supabase";
import { logSupabaseError } from "@/lib/supabase-config";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import type { CmsContentKind } from "./content-types";

export type CmsNotificationType =
  | "new_content"
  | "import_failed"
  | "duplicate_detected"
  | "cron_completed"
  | "cron_failed"
  | "review_needed";

export type CmsNotification = {
  id: string;
  type: CmsNotificationType;
  title: string;
  message: string;
  content_kind?: CmsContentKind;
  record_id?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  created_at: string;
};

const NOTIFICATION_LABELS: Record<CmsNotificationType, string> = {
  new_content: "محتوى جديد",
  import_failed: "فشل استيراد",
  duplicate_detected: "تكرار مكتشف",
  cron_completed: "اكتمال مهمة Cron",
  cron_failed: "فشل أتمتة",
  review_needed: "يحتاج مراجعة",
};

export function notificationTypeLabel(type: CmsNotificationType): string {
  return NOTIFICATION_LABELS[type] || type;
}

/** Push notification to in-memory store + best-effort DB persist. */
const localNotifications: CmsNotification[] = [];

export async function pushCmsNotification(input: {
  type: CmsNotificationType;
  title: string;
  message: string;
  content_kind?: CmsContentKind;
  record_id?: string;
  metadata?: Record<string, unknown>;
}): Promise<CmsNotification> {
  const notification: CmsNotification = {
    id: crypto.randomUUID(),
    type: input.type,
    title: input.title,
    message: input.message,
    content_kind: input.content_kind,
    record_id: input.record_id,
    metadata: input.metadata,
    read: false,
    created_at: new Date().toISOString(),
  };

  localNotifications.unshift(notification);
  if (localNotifications.length > 100) localNotifications.pop();

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from("cms_admin_notifications").insert({
      type: input.type,
      title: input.title,
      message: input.message,
      content_kind: input.content_kind || null,
      record_id: input.record_id || null,
      metadata: input.metadata || {},
      read: false,
    });
    if (error && error.code !== "PGRST205") {
      logSupabaseError("pushCmsNotification", error);
    }
  }

  return notification;
}

export async function getCmsNotifications(limit = 30): Promise<CmsNotification[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("cms_admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && data?.length) {
      return data.map((row) => ({
        id: String(row.id),
        type: row.type as CmsNotificationType,
        title: String(row.title),
        message: String(row.message),
        content_kind: row.content_kind as CmsContentKind | undefined,
        record_id: row.record_id ? String(row.record_id) : undefined,
        metadata: (row.metadata as Record<string, unknown>) || {},
        read: Boolean(row.read),
        created_at: String(row.created_at),
      }));
    }
    if (error && error.code !== "PGRST205") {
      logSupabaseError("getCmsNotifications", error);
    }
  }

  return localNotifications.slice(0, limit);
}

export async function markNotificationRead(id: string): Promise<void> {
  const local = localNotifications.find((n) => n.id === id);
  if (local) local.read = true;

  if (isSupabaseConfigured()) {
    const { error } = await supabase.from("cms_admin_notifications").update({ read: true }).eq("id", id);
    if (error && error.code !== "PGRST205") logSupabaseError("markNotificationRead", error);
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  const all = await getCmsNotifications(50);
  return all.filter((n) => !n.read).length;
}

/** Derive notifications from recent platform activity (imports, drafts, crons). */
export async function refreshActivityNotifications(): Promise<CmsNotification[]> {
  if (!isSupabaseConfigured()) return getCmsNotifications();

  const notifications: CmsNotification[] = [];

  const { data: failedJobs } = await supabase
    .from("content_import_jobs")
    .select("id, type, filename, status, import_errors")
    .eq("status", "failed")
    .order("started_at", { ascending: false })
    .limit(3);

  for (const job of failedJobs || []) {
    notifications.push({
      id: `import-fail-${job.id}`,
      type: "import_failed",
      title: "فشل عملية استيراد",
      message: `${job.type || "استيراد"} — ${job.filename || job.id}`,
      metadata: { jobId: job.id, errors: job.import_errors },
      read: false,
      created_at: new Date().toISOString(),
    });
  }

  const { data: pendingDrafts } = await supabase
    .from("content_drafts")
    .select("id, content_kind, workflow_status, created_at")
    .eq("workflow_status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  for (const draft of pendingDrafts || []) {
    notifications.push({
      id: `review-${draft.id}`,
      type: "review_needed",
      title: "محتوى بانتظار المراجعة",
      message: `${draft.content_kind} — مسودة ${String(draft.id).slice(0, 8)}`,
      content_kind: draft.content_kind as CmsContentKind,
      record_id: String(draft.id),
      read: false,
      created_at: String(draft.created_at),
    });
  }

  return [...notifications, ...(await getCmsNotifications(20))].slice(0, 30);
}
