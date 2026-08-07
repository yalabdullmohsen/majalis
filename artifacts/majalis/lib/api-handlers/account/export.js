/**
 * POST /api/account/export
 * GDPR/PDPL-style portability: authenticated user receives a JSON snapshot
 * of profile-linked data. Missing tables are skipped (best-effort).
 */

import { sendJson } from "../../api/_http.mjs";
import { getSupabaseAdmin } from "../../supabase-admin.mjs";
import { requireUser } from "../../user-auth.mjs";

async function safeSelect(admin, table, filter) {
  try {
    let q = admin.from(table).select("*");
    for (const [col, val] of Object.entries(filter)) {
      q = q.eq(col, val);
    }
    const { data, error } = await q.limit(2000);
    if (error) return { table, error: error.message, rows: [] };
    return { table, rows: data || [] };
  } catch (e) {
    return { table, error: e instanceof Error ? e.message : "unavailable", rows: [] };
  }
}

export default async function exportAccountHandler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return sendJson(res, 405, { ok: false, error: "الطريقة غير مدعومة" });
  }

  const auth = await requireUser(req, res, sendJson);
  if (!auth) return;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة حالياً، حاول لاحقاً" });
  }

  const userId = auth.user.id;
  const email = auth.user.email || null;

  const [profile, favorites, flashcardReviews, bookmarks, readingProgress, citations] =
    await Promise.all([
      safeSelect(admin, "profiles", { id: userId }),
      safeSelect(admin, "favorites", { user_id: userId }),
      safeSelect(admin, "flashcard_reviews", { user_id: userId }),
      safeSelect(admin, "bookmarks", { user_id: userId }),
      safeSelect(admin, "reading_progress", { user_id: userId }),
      safeSelect(admin, "user_citations", { user_id: userId }),
    ]);

  const payload = {
    ok: true,
    exportedAt: new Date().toISOString(),
    subject: {
      userId,
      email,
      createdAt: auth.user.created_at || null,
    },
    datasets: {
      profile: profile.rows,
      favorites: favorites.rows,
      flashcard_reviews: flashcardReviews.rows,
      bookmarks: bookmarks.rows,
      reading_progress: readingProgress.rows,
      citations: citations.rows,
    },
    notes: [
      "تفضيلات الجهاز المحلية (localStorage) غير مضمّنة — صدّرها من صفحة الإعدادات إن لزم.",
      "الجداول غير الموجودة تُتخطى تلقائياً.",
    ],
    skipped: [profile, favorites, flashcardReviews, bookmarks, readingProgress, citations]
      .filter((d) => d.error)
      .map((d) => ({ table: d.table, reason: d.error })),
  };

  res.setHeader?.("Content-Disposition", 'attachment; filename="majlisilm-data-export.json"');
  return sendJson(res, 200, payload);
}
