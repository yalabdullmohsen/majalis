/**
 * Admin notification delivery — in-app bell, optional webhook.
 */

import { getSupabaseAdmin, isMissingTableError } from "../../supabase-admin.mjs";
import { akeLog } from "../monitoring.mjs";

async function listAdminUserIds(admin) {
  try {
    const { data: profiles } = await admin.from("profiles").select("id").eq("is_admin", true);
    if (profiles?.length) return profiles.map((p) => p.id);
  } catch {
    /* fallback */
  }
  try {
    const { data: roles } = await admin.from("profiles").select("id").in("role", ["admin", "editor"]);
    if (roles?.length) return roles.map((p) => p.id);
  } catch {
    /* fallback */
  }
  return [];
}

export async function getNotificationPreferences() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      in_app_enabled: true,
      email_enabled: false,
      webhook_enabled: false,
      min_severity: "warning",
      alert_cooldown_minutes: 60,
      daily_report_enabled: true,
    };
  }
  try {
    const { data } = await admin.from("ake_notification_preferences").select("*").eq("id", "global").maybeSingle();
    return data || { in_app_enabled: true, min_severity: "warning" };
  } catch {
    return { in_app_enabled: true, min_severity: "warning" };
  }
}

const SEVERITY_RANK = { info: 0, warning: 1, critical: 2 };

export function severityMeetsMinimum(severity, minSeverity) {
  return (SEVERITY_RANK[severity] ?? 0) >= (SEVERITY_RANK[minSeverity] ?? 1);
}

export async function notifyAdminsAkeAlert(alert) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, sent: 0 };

  const prefs = await getNotificationPreferences();
  if (!prefs.in_app_enabled) return { ok: true, sent: 0, skipped: "in_app_disabled" };
  if (!severityMeetsMinimum(alert.severity || "warning", prefs.min_severity || "warning")) {
    return { ok: true, sent: 0, skipped: "below_min_severity" };
  }

  const userIds = await listAdminUserIds(admin);
  if (!userIds.length) return { ok: true, sent: 0, reason: "no_admins" };

  const title = alert.title || alert.message || "تنبيه AKE";
  const body = alert.message || "";
  const link = alert.link || "/admin/platform/monitoring";
  const type = alert.severity === "critical" ? "alert_critical" : "alert_warning";

  let sent = 0;
  for (const userId of userIds) {
    try {
      await admin.from("notifications").insert({
        user_id: userId,
        title,
        body,
        type,
        link,
        is_read: false,
        metadata: alert.metadata || {},
      });
      sent += 1;
    } catch {
      /* continue */
    }
  }

  if (prefs.webhook_enabled && prefs.webhook_url) {
    await sendWebhookNotification(prefs.webhook_url, { title, body, severity: alert.severity, link, metadata: alert.metadata });
  }

  return { ok: true, sent };
}

async function sendWebhookNotification(url, payload) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "ake-monitoring", at: new Date().toISOString(), ...payload }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    akeLog("notify-webhook", { error: err.message }, "error");
  }
}

export async function notifyDailyReport(report) {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false };

  const prefs = await getNotificationPreferences();
  if (!prefs.daily_report_enabled) return { ok: true, skipped: true };

  const metrics = report.metrics || {};
  const title = `التقرير اليومي — ${report.report_date}`;
  const body = `مصادر نشطة: ${metrics.active_sources ?? 0} · منشور: ${metrics.lessons_published ?? 0} درس · ${metrics.benefits_published ?? 0} فائدة · ${metrics.cron_failures ?? 0} فشل cron`;

  const notify = await notifyAdminsAkeAlert({
    severity: "info",
    title,
    message: body,
    link: "/admin/platform/monitoring",
    metadata: { reportId: report.id, reportDate: report.report_date },
  });

  try {
    await admin
      .from("ake_daily_reports")
      .update({ notification_sent: true, sent_at: new Date().toISOString(), status: "sent" })
      .eq("id", report.id);
  } catch (err) {
    if (!isMissingTableError(err)) akeLog("notify-report", { error: err.message }, "error");
  }

  return notify;
}
