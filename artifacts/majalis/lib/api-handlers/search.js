/**
 * GET /api/search
 * نقطة نهاية البحث الموحدة — محرك البحث العربي الموحد
 *
 * المعاملات:
 *   q       - استعلام البحث (مطلوب)
 *   types   - أنواع المحتوى مفصولة بفاصلة (lesson,library,hadith,fatwa,qa,fawaid,miracle,story,fiqh)
 *   limit   - حد النتائج (افتراضي: 20، أقصى: 50)
 *   offset  - للتصفح (افتراضي: 0)
 *
 * الضمانات:
 *   - جميع الاستعلامات تمر عبر normalize_ar() قبل البحث
 *   - لا تُعرض إلا النتائج ذات status = 'approved'/'published'
 *   - نص القرآن يُعاد حرفياً بتشكيله الكامل بدون تعديل
 *   - timeout 3000ms
 *   - parameterized queries عبر Supabase JS client
 */

import { sendJson } from "../api/_http.mjs";
import { createClient } from "@supabase/supabase-js";

// ─── إعداد Supabase ─────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  // نقطة نهاية عامة غير مصادَق عليها — نُفضّل مفتاح anon المحكوم بـ RLS
  // على service_role (الذي يتجاوز RLS بالكامل) لتفادي تسريب صفوف غير
  // منشورة إن نُسي فلتر status في دالة بحث جديدة مستقبلاً.
  const key =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ─── تطبيع عربي خفيف (mirror من arabic-normalize.ts للاستخدام في Node) ──────

function normalizeArabic(text) {
  if (!text) return "";
  return text
    // التشكيل الكامل + علامات وقف قرآنية + الكشيدة
    .replace(/[ً-ٟؐ-ؚۖ-ۜ۟-ۤۧ-ٰۭـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[,.;:!?،؛؟«»""''()[\]{}\-—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── الأنواع المسموح بها ─────────────────────────────────────────────────────

const VALID_TYPES = new Set([
  "lesson", "library", "hadith", "fatwa", "qa", "fawaid",
  "miracle", "story", "fiqh", "adhkar",
]);

// ─── دوال البحث في كل جدول ──────────────────────────────────────────────────

async function searchLessons(supabase, normQuery, limit) {
  const { data } = await supabase
    .from("lessons")
    .select("id, title, description, speaker_name, category, mosque")
    .eq("status", "approved")
    .ilike("search_text", `%${normQuery}%`)
    .limit(limit);
  return (data || []).map((r) => ({
    id: r.id,
    type: "lesson",
    title: r.title,
    summary: r.description || "",
    meta: [r.speaker_name, r.category].filter(Boolean).join(" · "),
    href: `/lessons/${r.id}`,
  }));
}

async function searchLibrary(supabase, normQuery, limit) {
  const { data } = await supabase
    .from("library_items")
    .select("id, title, description, category, type, author_name")
    .eq("status", "approved")
    .ilike("search_text", `%${normQuery}%`)
    .limit(limit);
  return (data || []).map((r) => ({
    id: r.id,
    type: "library",
    title: r.title,
    summary: r.description || "",
    meta: [r.author_name, r.category].filter(Boolean).join(" · "),
    href: `/library/${r.id}`,
  }));
}

async function searchHadith(supabase, normQuery, limit) {
  const { data } = await supabase
    .from("verified_hadith_items")
    .select("id, title, text, narrator, collection")
    .eq("status", "published")
    .ilike("search_text", `%${normQuery}%`)
    .limit(limit);
  return (data || []).map((r) => ({
    id: r.id,
    type: "hadith",
    // النص يُعاد حرفياً بلا تعديل
    title: r.title || r.text?.slice(0, 100) || "",
    summary: r.text || "",
    meta: [r.narrator, r.collection].filter(Boolean).join(" · "),
    href: "/hadith",
  }));
}

async function searchQa(supabase, normQuery, limit) {
  const { data } = await supabase
    .from("qa_questions")
    .select("id, question, answer")
    .eq("status", "published")
    .ilike("search_text", `%${normQuery}%`)
    .limit(limit);
  return (data || []).map((r) => ({
    id: r.id,
    type: "qa",
    title: r.question,
    summary: r.answer?.slice(0, 200) || "",
    meta: "",
    href: "/qa",
  }));
}

async function searchFawaid(supabase, normQuery, limit) {
  const { data } = await supabase
    .from("fawaid")
    .select("id, text, author_name")
    .eq("status", "approved")
    .ilike("search_text", `%${normQuery}%`)
    .limit(limit);
  return (data || []).map((r) => ({
    id: r.id,
    type: "fawaid",
    title: r.text?.slice(0, 120) || "",
    summary: "",
    meta: r.author_name || "",
    href: "/fawaid",
  }));
}

async function searchMiracles(supabase, normQuery, limit) {
  const { data } = await supabase
    .from("scientific_miracles")
    .select("id, title, body, category")
    .eq("status", "approved")
    .ilike("search_text", `%${normQuery}%`)
    .limit(limit);
  return (data || []).map((r) => ({
    id: r.id,
    type: "miracle",
    title: r.title,
    summary: r.body?.slice(0, 200) || "",
    meta: r.category || "",
    href: "/miracles",
  }));
}

async function searchStories(supabase, normQuery, limit) {
  const { data } = await supabase
    .from("akp_stories")
    .select("id, title, summary, category")
    .eq("status", "published")
    .ilike("search_text", `%${normQuery}%`)
    .limit(limit);
  return (data || []).map((r) => ({
    id: r.id,
    type: "story",
    title: r.title,
    summary: r.summary || "",
    meta: r.category || "",
    href: "/stories",
  }));
}

async function searchFiqh(supabase, normQuery, limit) {
  const { data } = await supabase
    .from("fiqh_council_items")
    .select("slug, title, summary, category, type")
    .eq("status", "published")
    .ilike("search_text", `%${normQuery}%`)
    .limit(limit);
  return (data || []).map((r) => ({
    id: r.slug,
    type: "fiqh_decision",
    title: r.title,
    summary: r.summary || "",
    meta: [r.type, r.category].filter(Boolean).join(" · "),
    href: `/fiqh-council/${r.slug}`,
  }));
}

/**
 * البحث في آيات القرآن من quran_search_index (view)
 * النص يُعاد حرفياً بتشكيله الكامل
 */
async function searchQuranIndex(supabase, normQuery, limit) {
  const { data } = await supabase
    .from("quran_search_index")
    .select("content_id, surah_name, ayah_text, source_reference")
    .ilike("search_text", `%${normQuery}%`)
    .limit(limit);
  return (data || []).map((r) => ({
    id: r.content_id,
    type: "quran",
    // النص القرآني يُعرض حرفياً بتشكيله الكامل — ممنوع تعديله
    title: r.ayah_text,
    summary: "",
    meta: [r.surah_name, r.source_reference].filter(Boolean).join(" · "),
    href: "/quran-hub",
    verbatim: true, // يشير للواجهة أن هذا النص يُعرض حرفياً
  }));
}

// ─── Handler الرئيسي ────────────────────────────────────────────────────────

// ─── CORS — مقيَّد بنطاق الموقع ─────────────────────────────────────────────
// كان "*" يسمح لأي موقع باستهلاك واجهة البحث من متصفح المستخدم.
// النطاقات مأخوذة من site.config.json (siteUrl + legacyOrigins)؛ عند تغيير
// النطاق هناك حدِّث القائمة هنا أو مرِّر SITE_ORIGIN في البيئة.
const ALLOWED_ORIGINS = new Set(
  [
    process.env.SITE_ORIGIN,
    "https://www.majlisilm.com", // siteUrl المعتمد
    "https://majlisilm.com",
    "http://majlisilm.com",
    "http://www.majlisilm.com",
  ].filter(Boolean),
);

function applyCors(req, res) {
  const origin = String(req.headers?.origin || "");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // نطاق افتراضي واحد — لا "*"
    res.setHeader("Access-Control-Allow-Origin", "https://www.majlisilm.com");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Vary", "Origin, Accept-Encoding");
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "GET only" });
    return;
  }

  // ── معاملات الاستعلام ────────────────────────────────────────────────────
  const rawQuery = String(req.query?.q || req.query?.query || "").trim();
  if (!rawQuery || rawQuery.length < 2) {
    sendJson(res, 400, { ok: false, error: "query_too_short", message: "q مطلوب (حرفان على الأقل)" });
    return;
  }

  const normQuery = normalizeArabic(rawQuery);
  if (!normQuery) {
    sendJson(res, 400, { ok: false, error: "query_empty_after_normalize" });
    return;
  }

  // أنواع المحتوى
  const rawTypes = String(req.query?.types || req.query?.type || "").trim();
  const requestedTypes = rawTypes
    ? rawTypes.split(",").map((t) => t.trim()).filter((t) => VALID_TYPES.has(t))
    : [...VALID_TYPES];

  const limit = Math.min(Number(req.query?.limit || 20), 50);
  const offset = Math.max(Number(req.query?.offset || 0), 0);

  // ── اتصال Supabase ──────────────────────────────────────────────────────
  const supabase = getSupabase();
  if (!supabase) {
    sendJson(res, 503, { ok: false, error: "database_unavailable" });
    return;
  }

  // ── بحث متوازٍ مع timeout 3s ────────────────────────────────────────────
  const TIMEOUT_MS = 3000;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("search_timeout")), TIMEOUT_MS),
  );

  const perLimit = Math.ceil(limit / requestedTypes.length) + 5;

  const searchMap = {
    lesson:  () => searchLessons(supabase, normQuery, perLimit),
    library: () => searchLibrary(supabase, normQuery, perLimit),
    hadith:  () => searchHadith(supabase, normQuery, perLimit),
    qa:      () => searchQa(supabase, normQuery, perLimit),
    fawaid:  () => searchFawaid(supabase, normQuery, perLimit),
    miracle: () => searchMiracles(supabase, normQuery, perLimit),
    story:   () => searchStories(supabase, normQuery, perLimit),
    fiqh:    () => searchFiqh(supabase, normQuery, perLimit),
    quran:   () => searchQuranIndex(supabase, normQuery, perLimit),
    // الأذكار: بيانات seed — تُعالَج عبر intelligent-search
    adhkar:  () => Promise.resolve([]),
  };

  try {
    const t0 = Date.now();

    const searchPromises = requestedTypes
      .filter((t) => searchMap[t])
      .map((t) => searchMap[t]().catch(() => []));

    const settled = await Promise.race([
      Promise.all(searchPromises),
      timeoutPromise,
    ]);

    const allResults = settled.flat();

    // ── ترتيب وتقطيع ──────────────────────────────────────────────────────
    const sliced = allResults.slice(offset, offset + limit);

    // ── تجميع حسب النوع ─────────────────────────────────────────────────
    const groups = {};
    for (const item of sliced) {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    }

    sendJson(res, 200, {
      ok: true,
      query: rawQuery,
      normalized: normQuery,
      count: sliced.length,
      total: allResults.length,
      response_ms: Date.now() - t0,
      results: sliced,
      groups,
    });
  } catch (err) {
    if (err.message === "search_timeout") {
      sendJson(res, 408, { ok: false, error: "search_timeout", message: "انتهت مهلة البحث (3s)" });
    } else {
      console.error("[/api/search]", err);
      sendJson(res, 500, { ok: false, error: err.message || "internal_error" });
    }
  }
}
