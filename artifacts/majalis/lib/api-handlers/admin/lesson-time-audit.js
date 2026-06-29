import { sendJson } from "../api/_http.mjs";
import { requireAdminAccess } from "../../lib/admin-auth.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import { auditLessonRow, applyLessonTimeRepair } from "../../lib/lesson-time-core.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth?.ok) return;

  const admin = getSupabaseAdmin();
  if (!admin) {
    sendJson(res, 503, { ok: false, error: "database_unavailable" });
    return;
  }

  const action = req.query?.action || req.body?.action || "audit";

  if (action === "audit") {
    const { data, error } = await admin.from("lessons").select("*").limit(5000);
    if (error) {
      sendJson(res, 500, { ok: false, error: error.message });
      return;
    }

    const rows = data || [];
    const issues = [];
    let prayerRankCount = 0;

    for (const row of rows) {
      const audit = auditLessonRow(row);
      if (audit.effective_prayer_rank && audit.effective_prayer_rank !== "غير مرتبط بصلاة") {
        prayerRankCount += 1;
      }
      if (audit.issues.length || audit.repairs.length) {
        issues.push(audit);
      }
    }

    sendJson(res, 200, {
      ok: true,
      total: rows.length,
      with_issues: issues.length,
      manual_review: issues.filter((i) => i.needs_manual_review).length,
      prayer_rank_coverage_pct: rows.length ? Math.round((prayerRankCount / rows.length) * 100) : 0,
      issues: issues.slice(0, 200),
    });
    return;
  }

  if (action === "repair") {
    const ids = req.body?.ids;
    let query = admin.from("lessons").select("*").limit(5000);
    if (Array.isArray(ids) && ids.length) query = query.in("id", ids);

    const { data, error } = await query;
    if (error) {
      sendJson(res, 500, { ok: false, error: error.message });
      return;
    }

    const repaired = [];
    const failed = [];

    for (const row of data || []) {
      const audit = auditLessonRow(row);
      if (!audit.repairs.length && !audit.issues.includes("shorthand_am_pm")) continue;

      const { row: fixed } = applyLessonTimeRepair(row);
      const { error: upErr } = await admin
        .from("lessons")
        .update({
          lesson_time: fixed.lesson_time,
          start_time: fixed.start_time,
          end_time: fixed.end_time,
          time_period: fixed.time_period,
          prayer_rank: fixed.prayer_rank,
          time_repair_log: fixed.time_repair_log,
        })
        .eq("id", row.id);

      if (upErr) failed.push({ id: row.id, error: upErr.message });
      else repaired.push({ id: row.id, title: row.title, repairs: audit.repairs });
    }

    sendJson(res, 200, { ok: true, repaired_count: repaired.length, failed_count: failed.length, repaired, failed });
    return;
  }

  sendJson(res, 400, { ok: false, error: "unknown_action" });
}
