/**
 * Cron: /api/cron/content-scoring
 * يحسب نقاط المحتوى يومياً (يُشغَّل مرة واحدة في اليوم)
 *
 * معالجة الأخطاء الصارمة: إذا فشل نوع محتوى، يكمل البقية
 * Idempotent: آمن للتشغيل مرات متعددة (UPSERT)
 */

import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";

const CONTENT_TYPE_TABLES = {
  lesson:      { table: "lessons",             idCol: "id",       titleCol: "title",    statusFilter: { status: "approved" } },
  hadith:      { table: "verified_hadith_items", idCol: "id",     titleCol: "title",    statusFilter: null },
  fatwa:       { table: "fatwas",              idCol: "id",       titleCol: "question", statusFilter: { status: "approved" } },
  benefit:     { table: "fawaid",              idCol: "id",       titleCol: "text",     statusFilter: { status: "approved" } },
  book:        { table: "library_items",       idCol: "id",       titleCol: "title",    statusFilter: { status: "approved" } },
  scholar:     { table: "sheikhs",             idCol: "id",       titleCol: "name",     statusFilter: { status: "approved" } },
  miracle:     { table: "scientific_miracles", idCol: "id",       titleCol: "title",    statusFilter: { status: "approved" } },
};

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة" });
  }

  if (!validateCronAuth(req)) {
    return sendJson(res, 401, { ok: false, message: "غير مصرح" });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return sendJson(res, 503, { ok: false, message: "Supabase غير مهيأ" });
  }

  const startedAt = Date.now();
  const log = [];
  let totalUpdated = 0;
  let totalErrors = 0;

  // حد الأمان: منع التشغيل المتكرر في فترة قصيرة
  try {
    const { data: recentRun } = await admin
      .from("content_scores")
      .select("computed_at")
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentRun?.computed_at) {
      const lastRun = new Date(recentRun.computed_at);
      const hoursSince = (Date.now() - lastRun.getTime()) / 3600000;
      if (hoursSince < 6) {
        return sendJson(res, 200, {
          ok: true,
          skipped: true,
          reason: `آخر تشغيل منذ ${hoursSince.toFixed(1)} ساعة — الحد الأدنى 6 ساعات`,
        });
      }
    }
  } catch (err) {
    log.push({ step: "throttle-check", warning: err.message });
  }

  // ── حساب النقاط لكل نوع محتوى ──────────────────────────────────────────

  for (const [contentType, cfg] of Object.entries(CONTENT_TYPE_TABLES)) {
    try {
      // جلب عدد المشاهدات (آخر 30 يوماً)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: views } = await admin
        .from("content_views")
        .select("content_id, count")
        .eq("content_type", contentType)
        .gte("created_at", thirtyDaysAgo);

      const viewMap = {};
      if (views) {
        // تجميع المشاهدات يدويًا (لأن Supabase لا يدعم GROUP BY مباشرة)
        const raw = await admin
          .from("content_views")
          .select("content_id")
          .eq("content_type", contentType)
          .gte("created_at", thirtyDaysAgo);

        if (raw.data) {
          for (const v of raw.data) {
            viewMap[v.content_id] = (viewMap[v.content_id] || 0) + 1;
          }
        }
      }

      // عدد الحفظ في المفضلة
      const { data: bookmarks } = await admin
        .from("bookmarks")
        .select("content_id")
        .eq("content_type", contentType);

      const saveMap = {};
      if (bookmarks) {
        for (const b of bookmarks) {
          saveMap[b.content_id] = (saveMap[b.content_id] || 0) + 1;
        }
      }

      // جمع كل IDs من كلا المصدرين
      const allIds = new Set([...Object.keys(viewMap), ...Object.keys(saveMap)]);
      if (!allIds.size) {
        log.push({ type: contentType, updated: 0, skipped: "لا بيانات" });
        continue;
      }

      // بناء وإدراج نقاط المحتوى
      const upserts = [];
      for (const contentId of allIds) {
        const views = viewMap[contentId] || 0;
        const saves = saveMap[contentId] || 0;

        // صيغة النقاط: زيارات (40%) + حفظ (60%)، مع تطبيق logarithmic scaling
        const viewScore = views > 0 ? Math.log1p(views) * 10 : 0;
        const saveScore = saves > 0 ? Math.log1p(saves) * 20 : 0;
        const qualityScore = viewScore * 0.4 + saveScore * 0.6;

        upserts.push({
          content_id:    contentId,
          content_type:  contentType,
          view_count:    views,
          save_count:    saves,
          quality_score: Math.round(qualityScore * 100) / 100,
          computed_at:   new Date().toISOString(),
        });
      }

      // batch upsert بحزم من 100
      let updated = 0;
      for (let i = 0; i < upserts.length; i += 100) {
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
      log.push({ type: contentType, updated, views_tracked: Object.keys(viewMap).length, saves_tracked: Object.keys(saveMap).length });

    } catch (err) {
      log.push({ type: contentType, error: err.message });
      totalErrors++;
      // لا نوقف العملية — نكمل باقي أنواع المحتوى
    }
  }

  // ── حساب مستوى المستخدمين ─────────────────────────────────────────────────

  let levelUpdates = 0;
  try {
    const { data: profiles } = await admin
      .from("user_interest_profiles")
      .select("user_id, tag_id, interest_score")
      .order("interest_score", { ascending: false });

    if (profiles?.length) {
      // تجميع نقاط الاهتمام لكل مستخدم
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
          user_id:    userId,
          level,
          level_score: Math.round(avg * 10) / 10,
          computed_at: new Date().toISOString(),
        };
      });

      for (let i = 0; i < levelUpserts.length; i += 50) {
        const batch = levelUpserts.slice(i, i + 50);
        const { error } = await admin
          .from("user_academic_levels")
          .upsert(batch, { onConflict: "user_id" });
        if (!error) levelUpdates += batch.length;
      }
    }
  } catch (err) {
    log.push({ step: "user-levels", error: err.message });
  }

  const elapsed = Date.now() - startedAt;

  console.log(`[cron/content-scoring] complete: ${totalUpdated} updated, ${totalErrors} errors, ${elapsed}ms`);

  return sendJson(res, 200, {
    ok: totalErrors === 0,
    total_updated: totalUpdated,
    level_updates: levelUpdates,
    errors: totalErrors,
    elapsed_ms: elapsed,
    log,
  });
}
