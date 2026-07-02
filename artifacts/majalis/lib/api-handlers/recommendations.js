/**
 * Recommendations API — /api/recommendations/*
 *
 * GET  /api/recommendations           — توصيات مخصصة (هجين)
 * GET  /api/recommendations/related   — محتوى ذو صلة من الرسم البياني
 * POST /api/recommendations/track     — تسجيل حدث سلوكي
 * GET  /api/recommendations/profile   — ملف اهتمامات المستخدم
 * DELETE /api/recommendations/profile — حذف بيانات المستخدم (الخصوصية)
 */

import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import { createClient } from "@supabase/supabase-js";

// ── ثوابت ─────────────────────────────────────────────────────────────────

const CONTENT_TYPES = new Set([
  "lesson","hadith","fatwa","benefit","book","scholar","qa",
  "ruling","story","miracle","dhikr","quran_ayah",
]);

// أوزان الأحداث لتحديث نقاط الاهتمام
const EVENT_WEIGHTS = {
  view:           1,
  complete:       5,
  save:           10,
  search:         2,
  follow_scholar: 8,
  time_spent:     0.5,  // per second, capped
  share:          7,
  bookmark_remove:-5,
};

// أوزان استراتيجيات التوصية
const STRATEGY_WEIGHTS = {
  content_based:   0.40,
  knowledge_graph: 0.30,
  collaborative:   0.20,
  context_aware:   0.10,
};

// مضاعفات الوقت (Context-Aware)
function getTimeMultiplier(contentType) {
  const hour = new Date().getUTCHours() + 3; // تحويل تقريبي للتوقيت الخليجي
  const h = ((hour % 24) + 24) % 24;
  if (h >= 22 || h < 5) {
    // ليل: قرآن وأذكار
    return contentType === "quran_ayah" ? 1.5 : contentType === "dhikr" ? 1.4 : 0.8;
  }
  if (h >= 5 && h < 8) {
    // صباح: حديث وفائدة
    return contentType === "hadith" ? 1.4 : contentType === "benefit" ? 1.3 : 1;
  }
  return 1.0;
}

// ── مساعدات ──────────────────────────────────────────────────────────────────

function isMissingTable(err) {
  const msg = String(err?.message || "").toLowerCase();
  return err?.code === "42P01" || err?.code === "PGRST205" ||
    msg.includes("does not exist") || msg.includes("could not find");
}

function extractBearer(req) {
  const h = req.headers?.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

function userClient(token) {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getUser(req) {
  const token = extractBearer(req);
  if (!token) return null;
  const client = userClient(token);
  const { data: { user } } = await client.auth.getUser().catch(() => ({ data: { user: null } }));
  return user;
}

// ── استراتيجية 1: Content-Based ──────────────────────────────────────────────

async function contentBasedRecs(admin, userId, limit = 20) {
  if (!userId) return [];

  // جلب أعلى الوسوم اهتمامًا
  const { data: interests, error: ie } = await admin
    .from("user_interest_profiles")
    .select("tag_id, interest_score")
    .eq("user_id", userId)
    .order("interest_score", { ascending: false })
    .limit(15);

  if (ie || !interests?.length) return [];

  const tagIds = interests.map((i) => i.tag_id);
  const tagScores = Object.fromEntries(interests.map((i) => [i.tag_id, i.interest_score]));

  // جلب المحتوى المرتبط بهذه الوسوم
  const { data: relations } = await admin
    .from("content_tag_relations")
    .select("content_id, content_type, tag_id, weight")
    .in("tag_id", tagIds)
    .limit(200);

  if (!relations?.length) return [];

  // حساب نقاط التشابه
  const scores = {};
  for (const r of relations) {
    const key = `${r.content_id}::${r.content_type}`;
    const tagScore = tagScores[r.tag_id] || 0;
    scores[key] = (scores[key] || 0) + tagScore * r.weight;
  }

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([key, score]) => {
      const [content_id, content_type] = key.split("::");
      return { content_id, content_type, score, strategy: "content_based" };
    });
}

// ── استراتيجية 2: Knowledge Graph ────────────────────────────────────────────

async function knowledgeGraphRecs(admin, contentId, contentType, depth = 1, limit = 15) {
  if (!contentId || !contentType) return [];

  const { data, error } = await admin.rpc("get_related_content", {
    p_source_id:   contentId,
    p_source_type: contentType,
    p_depth:       Math.min(depth, 3),
  });

  if (error || !data?.length) return [];

  return data
    .sort((a, b) => (b.weight * (3 - b.depth)) - (a.weight * (3 - a.depth)))
    .slice(0, limit)
    .map((r) => ({
      content_id:   r.content_id,
      content_type: r.content_type,
      score:        r.weight * (1 / (r.depth + 1)),
      strategy:     "knowledge_graph",
    }));
}

// ── استراتيجية 3: Collaborative Filtering ────────────────────────────────────

async function collaborativeRecs(admin, userId, limit = 15) {
  if (!userId) return [];

  // جلب المستخدمين المشابهين
  const { data: similar, error } = await admin.rpc("get_similar_users", {
    p_user_id: userId,
    p_limit:   10,
  });

  if (error || !similar?.length) return [];

  const simUserIds = similar.map((u) => u.similar_user_id);
  const simScores = Object.fromEntries(similar.map((u) => [u.similar_user_id, u.similarity]));

  // جلب أكثر ما يحبه المستخدمون المشابهون
  const { data: topTags } = await admin
    .from("user_interest_profiles")
    .select("tag_id, interest_score, user_id")
    .in("user_id", simUserIds)
    .order("interest_score", { ascending: false })
    .limit(100);

  if (!topTags?.length) return [];

  // وزن الوسوم بمعامل التشابه
  const weightedTags = {};
  for (const t of topTags) {
    const sim = simScores[t.user_id] || 0.1;
    weightedTags[t.tag_id] = (weightedTags[t.tag_id] || 0) + t.interest_score * sim;
  }

  const topTagIds = Object.entries(weightedTags)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id);

  if (!topTagIds.length) return [];

  const { data: relations } = await admin
    .from("content_tag_relations")
    .select("content_id, content_type, tag_id")
    .in("tag_id", topTagIds)
    .limit(100);

  if (!relations?.length) return [];

  const scores = {};
  for (const r of relations) {
    const key = `${r.content_id}::${r.content_type}`;
    scores[key] = (scores[key] || 0) + (weightedTags[r.tag_id] || 0);
  }

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([key, score]) => {
      const [content_id, content_type] = key.split("::");
      return { content_id, content_type, score, strategy: "collaborative" };
    });
}

// ── استراتيجية 4: Context-Aware ──────────────────────────────────────────────

async function contextAwareRecs(admin, limit = 10) {
  // أفضل المحتوى حسب الوقت والنقاط
  const { data: scores } = await admin
    .from("content_scores")
    .select("content_id, content_type, quality_score")
    .order("quality_score", { ascending: false })
    .limit(50);

  if (!scores?.length) return [];

  return scores
    .map((s) => ({
      content_id:   s.content_id,
      content_type: s.content_type,
      score:        s.quality_score * getTimeMultiplier(s.content_type),
      strategy:     "context_aware",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ── دمج النتائج وجلب بيانات المحتوى ─────────────────────────────────────────

async function mergeAndFetch(admin, strategyResults, userId, seenIds = new Set(), limit = 10) {
  // دمج النقاط من كل استراتيجية
  const merged = {};
  const names = ["content_based", "knowledge_graph", "collaborative", "context_aware"];

  for (const results of strategyResults) {
    const stratName = results[0]?.strategy || "context_aware";
    const w = STRATEGY_WEIGHTS[stratName] || 0.25;
    const maxScore = Math.max(...results.map((r) => r.score), 1);

    for (const r of results) {
      const key = `${r.content_id}::${r.content_type}`;
      if (seenIds.has(key)) continue;
      merged[key] = (merged[key] || 0) + (r.score / maxScore) * w;
    }
  }

  // فرز وأخذ الأفضل
  const sorted = Object.entries(merged)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit * 3);

  // جلب بيانات المحتوى الفعلية
  const byType = {};
  for (const [key] of sorted) {
    const [id, type] = key.split("::");
    if (!byType[type]) byType[type] = [];
    byType[type].push(id);
  }

  const contentMap = {};
  await Promise.all(
    Object.entries(byType).map(async ([type, ids]) => {
      const rows = await fetchContentMeta(admin, type, ids);
      for (const row of rows) contentMap[`${row.id}::${type}`] = { ...row, content_type: type };
    })
  );

  // بناء النتيجة النهائية
  return sorted
    .map(([key, score]) => {
      const item = contentMap[key];
      if (!item) return null;
      return { ...item, rec_score: Math.round(score * 1000) / 1000 };
    })
    .filter(Boolean)
    .slice(0, limit);
}

async function fetchContentMeta(admin, type, ids) {
  if (!ids.length) return [];
  try {
    if (type === "lesson") {
      const { data } = await admin.from("lessons").select("id, title, category, status").in("id", ids).eq("status", "approved");
      return data || [];
    }
    if (type === "hadith") {
      const { data } = await admin.from("verified_hadith_items").select("id, title, text, collection").in("id", ids);
      return (data || []).map((r) => ({ ...r, title: r.title || r.text?.slice(0, 60) }));
    }
    if (type === "fatwa") {
      const { data } = await admin.from("fatwas").select("id, question, category, status").in("id", ids).eq("status", "approved");
      return (data || []).map((r) => ({ ...r, title: r.question?.slice(0, 80) }));
    }
    if (type === "benefit") {
      const { data } = await admin.from("fawaid").select("id, text, category, topic, status").in("id", ids).eq("status", "approved");
      return (data || []).map((r) => ({ ...r, title: r.text?.slice(0, 80) }));
    }
    if (type === "book") {
      const { data } = await admin.from("library_items").select("id, title, author, category, status").in("id", ids).eq("status", "approved");
      return data || [];
    }
    if (type === "scholar") {
      const { data } = await admin.from("sheikhs").select("id, name, city, specialties, status").in("id", ids).eq("status", "approved");
      return (data || []).map((r) => ({ ...r, title: r.name }));
    }
    if (type === "qa") {
      const { data } = await admin.from("qa_questions").select("id, question, category, status").in("id", ids).eq("status", "published");
      return (data || []).map((r) => ({ ...r, title: r.question?.slice(0, 80) }));
    }
    if (type === "ruling") {
      const { data } = await admin.from("sharia_rulings").select("id, title, category").in("id", ids);
      return data || [];
    }
    if (type === "miracle") {
      const { data } = await admin.from("scientific_miracles").select("id, title, category, status").in("id", ids).eq("status", "approved");
      return data || [];
    }
  } catch { /* صامت */ }
  return [];
}

// ── معالجات الـ API ────────────────────────────────────────────────────────────

async function getRecommendations(req, res) {
  const q = req.query || {};
  const context = q.context || "home";
  const contentId = q.contentId || null;
  const contentType = q.contentType || null;
  const limit = Math.min(parseInt(q.limit) || 10, 30);
  const depth = parseInt(q.depth) || 1;

  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة" });

  const user = await getUser(req);
  const userId = user?.id || null;

  try {
    const [cb, kg, cf, ca] = await Promise.allSettled([
      contentBasedRecs(admin, userId, 20),
      knowledgeGraphRecs(admin, contentId, contentType, depth, 15),
      collaborativeRecs(admin, userId, 15),
      contextAwareRecs(admin, 10),
    ]);

    const results = [
      cb.status === "fulfilled" ? cb.value : [],
      kg.status === "fulfilled" ? kg.value : [],
      cf.status === "fulfilled" ? cf.value : [],
      ca.status === "fulfilled" ? ca.value : [],
    ];

    // استبعاد المحتوى الحالي المعروض
    const seenIds = new Set();
    if (contentId && contentType) seenIds.add(`${contentId}::${contentType}`);

    const recommendations = await mergeAndFetch(admin, results, userId, seenIds, limit);

    return sendJson(res, 200, {
      ok: true,
      recommendations,
      context,
      user_id: userId,
      strategies: {
        content_based:   cb.status === "fulfilled" ? cb.value.length : 0,
        knowledge_graph: kg.status === "fulfilled" ? kg.value.length : 0,
        collaborative:   cf.status === "fulfilled" ? cf.value.length : 0,
        context_aware:   ca.status === "fulfilled" ? ca.value.length : 0,
      },
    });
  } catch (err) {
    if (isMissingTable(err)) {
      return sendJson(res, 200, { ok: true, recommendations: [], context, pending_setup: true });
    }
    console.error("[recommendations] error:", err.message);
    return sendJson(res, 500, { ok: false, error: err.message });
  }
}

async function getRelated(req, res) {
  const q = req.query || {};
  const { id, type, depth = "1", limit = "10" } = q;
  if (!id || !type) return sendJson(res, 400, { ok: false, error: "id و type مطلوبان" });

  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة" });

  const related = await knowledgeGraphRecs(admin, id, type, parseInt(depth), parseInt(limit));
  const items = await mergeAndFetch(admin, [related], null, new Set([`${id}::${type}`]), parseInt(limit));

  return sendJson(res, 200, { ok: true, related: items, source_id: id, source_type: type });
}

async function trackEvent(req, res) {
  const user = await getUser(req);
  if (!user) return sendJson(res, 401, { ok: false, error: "مطلوب تسجيل الدخول" });

  let body = req.body || {};
  const { event_type, content_id, content_type, value = 1, metadata = {} } = body;

  if (!event_type || !content_id || !content_type) {
    return sendJson(res, 400, { ok: false, error: "event_type, content_id, content_type مطلوبة" });
  }
  if (!CONTENT_TYPES.has(content_type)) {
    return sendJson(res, 400, { ok: false, error: "content_type غير صالح" });
  }
  if (!Object.hasOwn(EVENT_WEIGHTS, event_type)) {
    return sendJson(res, 400, { ok: false, error: "event_type غير صالح" });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة" });

  // تسجيل الحدث
  const { error: evErr } = await admin.from("user_behavior_events").insert({
    user_id:      user.id,
    event_type,
    content_id:   String(content_id),
    content_type,
    value:        Math.min(Number(value) || 1, 100),
    metadata,
  });

  if (evErr) {
    if (isMissingTable(evErr)) return sendJson(res, 200, { ok: true, queued: false });
    return sendJson(res, 500, { ok: false, error: evErr.message });
  }

  // تحديث ملف الاهتمامات بالوسوم المرتبطة بهذا المحتوى
  await updateInterestProfile(admin, user.id, content_id, content_type, event_type, value).catch(() => {});

  return sendJson(res, 200, { ok: true });
}

async function updateInterestProfile(admin, userId, contentId, contentType, eventType, rawValue) {
  const weight = EVENT_WEIGHTS[eventType] || 1;
  const value = eventType === "time_spent"
    ? Math.min(rawValue * weight, 5)
    : weight;

  // جلب الوسوم المرتبطة بهذا المحتوى
  const { data: tagRels } = await admin
    .from("content_tag_relations")
    .select("tag_id, weight")
    .eq("content_id", contentId)
    .eq("content_type", contentType);

  if (!tagRels?.length) return;

  for (const rel of tagRels) {
    const delta = value * rel.weight;
    await admin.rpc("upsert_user_interest", {
      p_user_id:  userId,
      p_tag_id:   rel.tag_id,
      p_delta:    delta,
    }).catch(() => {
      // Fallback: manual upsert
      admin.from("user_interest_profiles").upsert({
        user_id:        userId,
        tag_id:         rel.tag_id,
        interest_score: delta,
        event_count:    1,
        last_updated:   new Date().toISOString(),
      }, {
        onConflict: "user_id,tag_id",
        ignoreDuplicates: false,
      }).catch(() => {});
    });
  }
}

async function getUserProfile(req, res) {
  const user = await getUser(req);
  if (!user) return sendJson(res, 401, { ok: false, error: "مطلوب تسجيل الدخول" });

  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة" });

  const [profileRes, levelRes, eventsRes] = await Promise.allSettled([
    admin
      .from("user_interest_profiles")
      .select(`interest_score, event_count, last_updated, tag:tag_id(tag_name, tag_name_ar, tag_type)`)
      .eq("user_id", user.id)
      .order("interest_score", { ascending: false })
      .limit(20),
    admin.from("user_academic_levels").select("*").eq("user_id", user.id).maybeSingle(),
    admin
      .from("user_behavior_events")
      .select("event_type, content_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return sendJson(res, 200, {
    ok: true,
    interests: profileRes.status === "fulfilled" ? (profileRes.value.data || []) : [],
    level: levelRes.status === "fulfilled" ? (levelRes.value.data || null) : null,
    recent_activity: eventsRes.status === "fulfilled" ? (eventsRes.value.data || []) : [],
  });
}

async function deleteProfile(req, res) {
  const user = await getUser(req);
  if (!user) return sendJson(res, 401, { ok: false, error: "مطلوب تسجيل الدخول" });

  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة" });

  await Promise.allSettled([
    admin.from("user_interest_profiles").delete().eq("user_id", user.id),
    admin.from("user_behavior_events").delete().eq("user_id", user.id),
    admin.from("user_academic_levels").delete().eq("user_id", user.id),
  ]);

  return sendJson(res, 200, { ok: true, message: "تم حذف بيانات التوصيات الشخصية" });
}

// ── الموزّع الرئيسي ────────────────────────────────────────────────────────────

export default async function recommendationsHandler(req, res) {
  const method = req.method || "GET";
  const url = new URL(req.url || "/", "http://localhost");
  const pathname = url.pathname;
  req.query = Object.fromEntries(url.searchParams.entries());

  if (method === "GET" && pathname.endsWith("/recommendations/related")) {
    return getRelated(req, res);
  }
  if (method === "GET" && pathname.endsWith("/recommendations/profile")) {
    return getUserProfile(req, res);
  }
  if (method === "DELETE" && pathname.endsWith("/recommendations/profile")) {
    return deleteProfile(req, res);
  }
  if (method === "POST" && pathname.endsWith("/recommendations/track")) {
    return trackEvent(req, res);
  }
  if (method === "GET" && (pathname.endsWith("/recommendations") || pathname.includes("/recommendations?"))) {
    return getRecommendations(req, res);
  }

  return sendJson(res, 404, { ok: false, error: "المسار غير موجود" });
}
