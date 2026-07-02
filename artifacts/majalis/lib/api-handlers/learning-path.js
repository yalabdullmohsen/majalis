/**
 * learning-path.js — API خارطة طالب العلم
 *
 * GET  /api/learning-path?action=sciences
 * GET  /api/learning-path?action=science&slug=...
 * GET  /api/learning-path?action=book&id=...
 * GET  /api/learning-path?action=progress               (requires auth)
 * POST /api/learning-path?action=progress               (requires auth)
 * GET  /api/learning-path?action=achievements           (requires auth)
 * GET  /api/learning-path?action=streak                 (requires auth)
 * POST /api/learning-path?action=quiz-answer            (requires auth)
 */

import { createClient } from "@supabase/supabase-js";
import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";

export const maxDuration = 20;

// ── Auth helpers ─────────────────────────────────────────────────────────────

function extractBearer(req) {
  const h = req.headers?.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

function userClient(token) {
  const url  = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function requireUser(req) {
  const token = extractBearer(req);
  if (!token) return { user: null, client: null };
  const client = userClient(token);
  const { data: { user } } = await client.auth.getUser().catch(() => ({ data: { user: null } }));
  return { user, client };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function ok(res, data)     { sendJson(res, 200, { ok: true, ...data }); }
function notFound(res, msg){ sendJson(res, 404, { ok: false, error: msg || "not_found" }); }
function forbidden(res)    { sendJson(res, 401, { ok: false, error: "يجب تسجيل الدخول" }); }
function serverErr(res, e) { sendJson(res, 500, { ok: false, error: String(e?.message || e) }); }

// ── HANDLER ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const action = req.query?.action || req.body?.action || "sciences";
  const admin  = getSupabaseAdmin();

  try {
    // ── قائمة العلوم ─────────────────────────────────────────────────────
    if (action === "sciences") {
      const { data, error } = await admin
        .from("lp_sciences")
        .select("id, name, slug, description, why_study, icon, color, sort_order")
        .eq("is_active", true)
        .order("sort_order");

      if (error) return serverErr(res, error);
      return ok(res, { sciences: data ?? [] });
    }

    // ── تفاصيل علم معين مع مستوياته وكتبه ───────────────────────────────
    if (action === "science") {
      const slug = req.query?.slug || req.body?.slug;
      if (!slug) return notFound(res, "slug_required");

      const { data: science, error: sciErr } = await admin
        .from("lp_sciences")
        .select("id, name, slug, description, why_study, icon, color")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (sciErr || !science) return notFound(res, "science_not_found");

      // جلب الكتب مع المستوى
      const { data: books, error: booksErr } = await admin
        .from("lp_books")
        .select(`
          id, title, author, cover_image_url, summary,
          difficulty, estimated_hours, pages_count, order_in_level,
          level:lp_levels(id, name, slug, sort_order, color)
        `)
        .eq("science_id", science.id)
        .eq("is_active", true)
        .order("order_in_level");

      if (booksErr) return serverErr(res, booksErr);

      // تجميع الكتب حسب المستوى
      const levels = {};
      for (const book of (books ?? [])) {
        const lvl = book.level;
        if (!lvl) continue;
        if (!levels[lvl.slug]) {
          levels[lvl.slug] = { ...lvl, books: [] };
        }
        levels[lvl.slug].books.push({ ...book, level: undefined });
      }

      const levelsArr = Object.values(levels).sort((a, b) => a.sort_order - b.sort_order);
      return ok(res, { science, levels: levelsArr });
    }

    // ── تفاصيل كتاب ───────────────────────────────────────────────────────
    if (action === "book") {
      const id = req.query?.id || req.body?.id;
      if (!id) return notFound(res, "id_required");

      const { data: book, error: bookErr } = await admin
        .from("lp_books")
        .select(`
          id, title, author, cover_image_url, summary,
          difficulty, estimated_hours, pages_count, pdf_url, audio_url,
          science:lp_sciences(id, name, slug, icon, color),
          level:lp_levels(id, name, slug, sort_order, color)
        `)
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (bookErr || !book) return notFound(res, "book_not_found");

      const [{ data: explanations }, { data: benefits }, { data: quizzes }] = await Promise.all([
        admin.from("lp_explanations").select("id, sheikh_name, type, url, notes, sort_order")
          .eq("book_id", id).order("sort_order"),
        admin.from("lp_book_benefits").select("id, content, sort_order")
          .eq("book_id", id).order("sort_order"),
        admin.from("lp_quizzes").select("id, question, options, sort_order")
          .eq("book_id", id).order("sort_order"),
      ]);

      return ok(res, {
        book,
        explanations: explanations ?? [],
        benefits: benefits ?? [],
        quizzes: quizzes ?? [],
      });
    }

    // ── تقدم المستخدم (GET) ───────────────────────────────────────────────
    if (action === "progress" && req.method !== "POST") {
      const { user } = await requireUser(req);
      if (!user) return forbidden(res);

      const { data, error } = await admin
        .from("lp_user_progress")
        .select("book_id, status, progress_percent, started_at, completed_at")
        .eq("user_id", user.id);

      if (error) return serverErr(res, error);
      return ok(res, { progress: data ?? [] });
    }

    // ── تحديث تقدم المستخدم (POST) ───────────────────────────────────────
    if (action === "progress" && req.method === "POST") {
      const { user } = await requireUser(req);
      if (!user) return forbidden(res);

      const { book_id, status, progress_percent } = req.body || {};
      if (!book_id || !status) return sendJson(res, 400, { ok: false, error: "book_id + status required" });

      const now = new Date().toISOString();
      const upsertData = {
        user_id: user.id,
        book_id,
        status,
        progress_percent: progress_percent ?? (status === "completed" ? 100 : 0),
        updated_at: now,
        ...(status === "in_progress" && !req.body?.started_at ? { started_at: now } : {}),
        ...(status === "completed" ? { completed_at: now, progress_percent: 100 } : {}),
      };

      const { error } = await admin.from("lp_user_progress").upsert(upsertData, { onConflict: "user_id,book_id" });
      if (error) return serverErr(res, error);

      // تحديث Streak
      await updateStreak(admin, user.id);

      // منح إنجازات إذا انتهى الكتاب
      if (status === "completed") {
        await checkAchievements(admin, user.id, book_id);
      }

      return ok(res, { updated: true });
    }

    // ── إنجازات المستخدم ──────────────────────────────────────────────────
    if (action === "achievements") {
      const { user } = await requireUser(req);
      if (!user) return forbidden(res);

      const { data, error } = await admin
        .from("lp_achievements")
        .select("id, badge_name, badge_icon, badge_color, earned_at")
        .eq("user_id", user.id)
        .order("earned_at", { ascending: false });

      if (error) return serverErr(res, error);
      return ok(res, { achievements: data ?? [] });
    }

    // ── streak ────────────────────────────────────────────────────────────
    if (action === "streak") {
      const { user } = await requireUser(req);
      if (!user) return forbidden(res);

      const { data, error } = await admin
        .from("lp_streaks")
        .select("current_streak, longest_streak, last_activity_date")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") return serverErr(res, error);
      return ok(res, { streak: data ?? { current_streak: 0, longest_streak: 0, last_activity_date: null } });
    }

    // ── الإجابة على سؤال اختبار ───────────────────────────────────────────
    if (action === "quiz-answer") {
      const { user } = await requireUser(req);
      if (!user) return forbidden(res);

      const { quiz_id, answer } = req.body || {};
      if (!quiz_id || !answer) return sendJson(res, 400, { ok: false, error: "quiz_id + answer required" });

      const { data: q, error: qErr } = await admin
        .from("lp_quizzes")
        .select("correct_answer, explanation")
        .eq("id", quiz_id)
        .single();

      if (qErr || !q) return notFound(res, "question_not_found");

      const correct = q.correct_answer === answer;
      return ok(res, { correct, explanation: q.explanation ?? null });
    }

    sendJson(res, 400, { ok: false, error: "action_unknown" });
  } catch (e) {
    serverErr(res, e);
  }
}

// ── Streak update ─────────────────────────────────────────────────────────────

async function updateStreak(admin, userId) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await admin
      .from("lp_streaks")
      .select("current_streak, longest_streak, last_activity_date")
      .eq("user_id", userId)
      .single();

    if (!existing) {
      await admin.from("lp_streaks").insert({
        user_id: userId, current_streak: 1, longest_streak: 1, last_activity_date: today,
      });
      return;
    }

    const last = existing.last_activity_date;
    if (last === today) return; // نفس اليوم

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const newCurrent = last === yesterdayStr ? existing.current_streak + 1 : 1;
    const newLongest = Math.max(newCurrent, existing.longest_streak ?? 0);

    await admin.from("lp_streaks").upsert({
      user_id: userId, current_streak: newCurrent, longest_streak: newLongest,
      last_activity_date: today, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
  } catch { /* silent */ }
}

// ── Achievement checker ───────────────────────────────────────────────────────

async function checkAchievements(admin, userId, bookId) {
  try {
    const { count } = await admin.from("lp_user_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("status", "completed");

    const milestones = [
      { count: 1,  badge: "أول خطوة",         icon: "🌱", color: "#22c55e" },
      { count: 5,  badge: "طالب مجتهد",        icon: "📚", color: "#3b82f6" },
      { count: 10, badge: "عشرة كتب",          icon: "🏆", color: "#f59e0b" },
      { count: 25, badge: "حافظ المتون",       icon: "🌟", color: "#8b5cf6" },
      { count: 50, badge: "طالب العلم المتقدم", icon: "👑", color: "#ef4444" },
    ];

    for (const m of milestones) {
      if (count === m.count) {
        await admin.from("lp_achievements").upsert({
          user_id: userId, badge_name: m.badge, badge_icon: m.icon, badge_color: m.color,
        }, { onConflict: "user_id,badge_name", ignoreDuplicates: true });
      }
    }
  } catch { /* silent */ }
}
