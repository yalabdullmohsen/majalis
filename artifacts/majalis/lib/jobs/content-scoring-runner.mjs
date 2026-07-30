/**
 * Daily content quality scoring (idempotent UPSERT).
 */
import { getSupabaseAdmin } from "../supabase-admin.mjs";

const CONTENT_TYPE_TABLES = {
  lesson: { table: "lessons" },
  hadith: { table: "verified_hadith_items" },
  fatwa: { table: "fatwas" },
  benefit: { table: "fawaid" },
  book: { table: "library_items" },
  scholar: { table: "sheikhs" },
  miracle: { table: "scientific_miracles" },
};

/**
 * @param {{ signal?: AbortSignal, minHoursBetweenRuns?: number }} [opts]
 */
export async function runContentScoring(opts = {}) {
  const { signal, minHoursBetweenRuns = 6 } = opts;
  if (signal?.aborted) {
    const err = new Error("aborted");
    err.code = "aborted";
    throw err;
  }

  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "supabase_admin_missing" };

  const startedAt = Date.now();
  const log = [];
  let totalUpdated = 0;
  let totalErrors = 0;

  try {
    const { data: recentRun } = await admin
      .from("content_scores")
      .select("computed_at")
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentRun?.computed_at) {
      const hoursSince = (Date.now() - new Date(recentRun.computed_at).getTime()) / 3_600_000;
      if (hoursSince < minHoursBetweenRuns) {
        return {
          ok: true,
          skipped: true,
          reason: `آخر تشغيل منذ ${hoursSince.toFixed(1)} ساعة — الحد الأدنى ${minHoursBetweenRuns} ساعات`,
        };
      }
    }
  } catch (err) {
    log.push({ step: "throttle-check", warning: err?.message || String(err) });
  }

  for (const contentType of Object.keys(CONTENT_TYPE_TABLES)) {
    if (signal?.aborted) break;
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const { data: views } = await admin
        .from("content_views")
        .select("content_id, count")
        .eq("content_type", contentType)
        .gte("created_at", thirtyDaysAgo);

      const viewMap = {};
      for (const row of views || []) {
        const id = row.content_id;
        if (!id) continue;
        viewMap[id] = (viewMap[id] || 0) + Number(row.count || 1);
      }

      const { data: bookmarks } = await admin
        .from("bookmarks")
        .select("content_id")
        .eq("content_type", contentType);

      const saveMap = {};
      for (const b of bookmarks || []) {
        if (!b.content_id) continue;
        saveMap[b.content_id] = (saveMap[b.content_id] || 0) + 1;
      }

      const allIds = new Set([...Object.keys(viewMap), ...Object.keys(saveMap)]);
      if (!allIds.size) {
        log.push({ type: contentType, updated: 0, skipped: "لا بيانات" });
        continue;
      }

      const upserts = [];
      for (const contentId of allIds) {
        const viewCount = viewMap[contentId] || 0;
        const saveCount = saveMap[contentId] || 0;
        const viewScore = viewCount > 0 ? Math.log1p(viewCount) * 10 : 0;
        const saveScore = saveCount > 0 ? Math.log1p(saveCount) * 20 : 0;
        const qualityScore = viewScore * 0.4 + saveScore * 0.6;
        upserts.push({
          content_id: contentId,
          content_type: contentType,
          view_count: viewCount,
          save_count: saveCount,
          quality_score: Math.round(qualityScore * 100) / 100,
          computed_at: new Date().toISOString(),
        });
      }

      let updated = 0;
      for (let i = 0; i < upserts.length; i += 100) {
        if (signal?.aborted) break;
        const batch = upserts.slice(i, i + 100);
        const { error: upsertErr } = await admin
          .from("content_scores")
          .upsert(batch, { onConflict: "content_id,content_type" });
        if (upsertErr) {
          log.push({ type: contentType, batch: i, error: upsertErr.message });
          totalErrors++;
        } else {
          updated += batch.length;
        }
      }

      totalUpdated += updated;
      log.push({
        type: contentType,
        updated,
        views_tracked: Object.keys(viewMap).length,
        saves_tracked: Object.keys(saveMap).length,
      });
    } catch (err) {
      log.push({ type: contentType, error: err?.message || String(err) });
      totalErrors++;
    }
  }

  let levelUpdates = 0;
  try {
    if (!signal?.aborted) {
      const { data: profiles } = await admin
        .from("user_interest_profiles")
        .select("user_id, tag_id, interest_score")
        .order("interest_score", { ascending: false });

      if (profiles?.length) {
        const userProfiles = {};
        for (const p of profiles) {
          if (!userProfiles[p.user_id]) userProfiles[p.user_id] = { total: 0, count: 0 };
          userProfiles[p.user_id].total += p.interest_score;
          userProfiles[p.user_id].count += 1;
        }

        const levelUpserts = Object.entries(userProfiles).map(([userId, data]) => {
          const avg = data.total / data.count;
          let level = "beginner";
          if (avg > 50 || data.count > 20) level = "advanced";
          else if (avg > 15 || data.count > 8) level = "intermediate";
          return {
            user_id: userId,
            level,
            level_score: Math.round(avg * 10) / 10,
            computed_at: new Date().toISOString(),
          };
        });

        for (let i = 0; i < levelUpserts.length; i += 50) {
          if (signal?.aborted) break;
          const batch = levelUpserts.slice(i, i + 50);
          const { error } = await admin
            .from("user_academic_levels")
            .upsert(batch, { onConflict: "user_id" });
          if (!error) levelUpdates += batch.length;
        }
      }
    }
  } catch (err) {
    log.push({ step: "user-levels", error: err?.message || String(err) });
  }

  if (signal?.aborted) {
    const err = new Error("aborted");
    err.code = "aborted";
    throw err;
  }

  return {
    ok: totalErrors === 0,
    total_updated: totalUpdated,
    level_updates: levelUpdates,
    errors: totalErrors,
    elapsed_ms: Date.now() - startedAt,
    log,
  };
}
