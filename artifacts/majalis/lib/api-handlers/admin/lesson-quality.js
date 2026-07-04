/**
 * Admin API — Lesson quality review (incomplete + duplicate candidates).
 * POST /api/admin/lesson-quality   { action, ...params }
 */
import { sendJson } from "../../api/_http.mjs";
import { requireAdminAccess } from "../../../lib/admin-auth.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { backfillLessonCompleteness } from "../../../lib/cms/lesson-completeness.mjs";

export default async function handler(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth) return;

  const body = req.body || {};
  const action = String(body.action || req.query?.action || "").trim();
  const supabase = getSupabaseAdmin();

  try {
    // ── Incomplete lessons ────────────────────────────────────────────────
    if (action === "list-incomplete") {
      const page  = Math.max(1, parseInt(body.page || req.query?.page || "1", 10));
      const limit = 25;
      const offset = (page - 1) * limit;

      const { data, count, error } = await supabase
        .from("lessons")
        .select(
          "id, title, speaker_name, mosque, day_of_week, lesson_time, category, city, region, status, completeness_score, missing_fields, source_id, created_at, external_key",
          { count: "exact" },
        )
        .eq("status", "approved")
        .or("completeness_score.is.null,completeness_score.lt.0.6")
        .order("completeness_score", { ascending: true, nullsFirst: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      sendJson(res, 200, { ok: true, lessons: data || [], total: count || 0, page });
      return;
    }

    // ── Duplicate candidates (same title+mosque normalized, different IDs) ─
    if (action === "list-duplicates") {
      // Find external_key values that look similar using a simplistic title-prefix match.
      // Full fuzzy dedup lives in the intelligence engine; here we do fast SQL grouping.
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title, speaker_name, mosque, day_of_week, lesson_time, status, external_key, created_at, completeness_score")
        .eq("status", "approved")
        .order("title")
        .limit(500);

      if (error) throw error;

      // Client-side grouping: group by (normalized title+mosque+day), flag groups > 1
      function norm(s) {
        return String(s || "")
          .replace(/[ً-ٰٟـ]/g, "")
          .replace(/[أإآٱ]/g, "ا")
          .replace(/[ة]/g, "ه")
          .replace(/[ى]/g, "ي")
          .replace(/\s+/g, "")
          .toLowerCase()
          .slice(0, 40);
      }

      const groups = new Map();
      for (const row of (data || [])) {
        const key = `${norm(row.title)}|${norm(row.mosque)}|${norm(row.day_of_week)}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
      }
      const duplicateGroups = [...groups.values()].filter((g) => g.length > 1);
      sendJson(res, 200, { ok: true, groups: duplicateGroups, totalGroups: duplicateGroups.length });
      return;
    }

    // ── Update lesson (patch fields) ─────────────────────────────────────
    if (action === "update-lesson") {
      const { id, ...patch } = body;
      if (!id) { sendJson(res, 400, { ok: false, error: "id required" }); return; }
      delete patch.action;
      patch.updated_at = new Date().toISOString();

      // Recompute completeness if key fields changed
      if (patch.speaker_name !== undefined || patch.mosque !== undefined ||
          patch.day_of_week !== undefined || patch.lesson_time !== undefined ||
          patch.category !== undefined || patch.city !== undefined) {
        const { data: existing } = await supabase.from("lessons")
          .select("speaker_name, mosque, day_of_week, lesson_time, category, city")
          .eq("id", id).single();
        if (existing) {
          const merged = { ...existing, ...patch };
          const weights = [
            ["speaker_name", 0.20], ["mosque", 0.20], ["day_of_week", 0.20],
            ["lesson_time", 0.15],  ["category", 0.10], ["city", 0.15],
          ];
          let score = 0;
          const missing = [];
          for (const [f, w] of weights) {
            if (merged[f] && String(merged[f]).trim()) score += w;
            else missing.push(f);
          }
          patch.completeness_score = Math.round(score * 100) / 100;
          patch.missing_fields = missing;
        }
      }

      const { data, error } = await supabase.from("lessons").update(patch).eq("id", id).select().single();
      if (error) throw error;
      sendJson(res, 200, { ok: true, lesson: data });
      return;
    }

    // ── Merge duplicate: keep one, delete others ──────────────────────────
    if (action === "merge-duplicates") {
      const { keepId, deleteIds } = body;
      if (!keepId || !Array.isArray(deleteIds) || deleteIds.length === 0) {
        sendJson(res, 400, { ok: false, error: "keepId and deleteIds required" });
        return;
      }
      const { error } = await supabase.from("lessons").delete().in("id", deleteIds);
      if (error) throw error;
      sendJson(res, 200, { ok: true, merged: deleteIds.length });
      return;
    }

    // ── Reject / archive incomplete lesson ────────────────────────────────
    if (action === "reject-lesson") {
      const { id, reason } = body;
      if (!id) { sendJson(res, 400, { ok: false, error: "id required" }); return; }
      const { error } = await supabase.from("lessons")
        .update({ status: "rejected", archive_reason: reason || "incomplete_data", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      sendJson(res, 200, { ok: true });
      return;
    }

    // ── Trigger quality backfill ──────────────────────────────────────────
    if (action === "backfill-quality") {
      const result = await backfillLessonCompleteness({ dryRun: false, limit: 500 });
      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 400, { ok: false, error: `Unknown action: ${action}` });
  } catch (err) {
    console.error("[admin/lesson-quality]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
