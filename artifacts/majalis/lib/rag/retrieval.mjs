/**
 * طبقة الاسترجاع — تسترجع الوثائق ذات الصلة من search_index وجداول المحتوى
 *
 * اختيار FTS بدلاً من pgvector:
 * - النصوص الشرعية العربية تستخدم مصطلحات محددة جداً (صحيح البخاري، الآية، الحديث...)
 * - FTS مع tsvector يُعطي نتائج ممتازة للمصطلحات الشرعية الدقيقة
 * - pgvector يحتاج pipeline لتوليد embeddings لكل محتوى (تكلفة + وقت)
 * - يمكن إضافة semantic search هجين لاحقاً فوق FTS كتحسين
 */

import { MAX_CONTEXT_DOCS, MIN_RELEVANCE_SCORE } from "./constants.mjs";

/** تطبيع الاستعلام للبحث */
function normalizeQuery(q) {
  return String(q || "")
    .replace(/[ً-ٰٟ]/g, "") // حذف التشكيل
    .trim()
    .slice(0, 300);
}

/** تقصير مقتطف النص للسياق */
function excerpt(text, maxLen = 400) {
  if (!text) return "";
  const t = String(text).replace(/\s+/g, " ").trim();
  return t.length <= maxLen ? t : t.slice(0, maxLen) + "…";
}

/**
 * البحث الرئيسي في search_index عبر Supabase RPC
 */
async function searchInIndex(admin, query, types, limit) {
  if (!admin) return [];
  const q = normalizeQuery(query);
  if (!q) return [];

  // بحث FTS أولاً
  const { data: ftsResults, error: ftsErr } = await admin.rpc("search_unified_rag", {
    p_query: q,
    p_types: types?.length ? types : null,
    p_limit: limit,
  });

  if (!ftsErr && ftsResults?.length > 0) {
    return ftsResults.map((r) => ({
      id:              r.id,
      content_id:      r.content_id,
      content_type:    r.content_type,
      title:           r.title,
      excerpt:         excerpt(r.body_text),
      source_ref:      r.source_reference,
      source_url:      r.source_url,
      authority_score: Number(r.authority_score),
      metadata:        r.metadata || {},
      relevance_score: Number(r.rank || 0),
    }));
  }

  // بحث جزئي احتياطي (ILIKE)
  const { data: partialResults } = await admin.rpc("search_unified_rag_partial", {
    p_query: q.slice(0, 60),
    p_types: types?.length ? types : null,
    p_limit: Math.min(limit, 8),
  });

  return (partialResults || []).map((r) => ({
    id:              r.id,
    content_id:      r.content_id,
    content_type:    r.content_type,
    title:           r.title,
    excerpt:         excerpt(r.body_text),
    source_ref:      r.source_reference,
    source_url:      r.source_url,
    authority_score: Number(r.authority_score),
    metadata:        r.metadata || {},
    relevance_score: Number(r.rank || 0),
  }));
}

/**
 * بحث احتياطي مباشر في verified_hadith_items (يعمل حتى لو كان search_index فارغاً)
 */
async function searchHadithDirect(admin, query, limit = 6) {
  if (!admin) return [];
  const term = normalizeQuery(query).slice(0, 80);
  if (!term) return [];

  const { data } = await admin
    .from("verified_hadith_items")
    .select("id, title, text, grade, source_name, source_url, narrator, chapter, scholar")
    .is("deleted_at", null)
    .or(`text.ilike.%${term}%,title.ilike.%${term}%`)
    .limit(limit);

  return (data || []).map((h) => ({
    id:              h.id,
    content_id:      String(h.id),
    content_type:    "hadith",
    title:           h.title || String(h.text || "").slice(0, 80),
    excerpt:         excerpt(h.text),
    source_ref:      h.source_name || "حديث",
    source_url:      h.source_url || "",
    authority_score: h.grade?.includes("صحيح") ? 92 : h.grade?.includes("حسن") ? 78 : 58,
    metadata:        { grade: h.grade, narrator: h.narrator, chapter: h.chapter, scholar: h.scholar },
    relevance_score: 0.5,
  }));
}

/**
 * بحث احتياطي في fiqh_council_items
 */
async function searchFiqhDirect(admin, query, limit = 5) {
  if (!admin) return [];
  const term = normalizeQuery(query).slice(0, 80);
  if (!term) return [];

  const { data } = await admin
    .from("fiqh_council_items")
    .select("id, title, slug, ruling_text, summary, source_name, source_url, category, type, session_date, decision_number, confidence_level")
    .eq("status", "published")
    .or(`title.ilike.%${term}%,ruling_text.ilike.%${term}%,summary.ilike.%${term}%`)
    .limit(limit);

  return (data || []).map((f) => ({
    id:              f.id,
    content_id:      String(f.id),
    content_type:    "fiqh_decision",
    title:           f.title,
    excerpt:         excerpt(f.ruling_text || f.summary),
    source_ref:      f.source_name || "مجمع فقهي",
    source_url:      f.source_url || `/fiqh-council/${f.slug}`,
    authority_score: f.confidence_level === "source_verified" ? 88 : 72,
    metadata:        { category: f.category, type: f.type, slug: f.slug,
                       session_date: f.session_date, decision_number: f.decision_number },
    relevance_score: 0.6,
  }));
}

/**
 * بحث في fawaid
 */
async function searchFawaid(admin, query, limit = 4) {
  if (!admin) return [];
  const term = normalizeQuery(query).slice(0, 80);
  if (!term) return [];

  const { data } = await admin
    .from("fawaid")
    .select("id, title, text, author, source, category")
    .or(`text.ilike.%${term}%,title.ilike.%${term}%`)
    .limit(limit);

  return (data || []).map((f) => ({
    id:              f.id,
    content_id:      String(f.id),
    content_type:    "benefit",
    title:           f.title || String(f.text || "").slice(0, 80),
    excerpt:         excerpt(f.text),
    source_ref:      f.author || f.source || "فائدة",
    source_url:      "",
    authority_score: 60,
    metadata:        { author: f.author, source: f.source, category: f.category },
    relevance_score: 0.4,
  }));
}

/**
 * الاسترجاع الكامل: search_index + بحوث احتياطية
 */
export async function retrieveDocuments(admin, query, { types, limit = MAX_CONTEXT_DOCS } = {}) {
  const results = await Promise.allSettled([
    searchInIndex(admin, query, types, limit),
    searchHadithDirect(admin, query, 5),
    searchFiqhDirect(admin, query, 4),
    searchFawaid(admin, query, 3),
  ]);

  const allDocs = results.flatMap((r) => r.status === "fulfilled" ? r.value : []);

  // إزالة التكرار بـ content_id + content_type
  const seen = new Set();
  const unique = allDocs.filter((d) => {
    const key = `${d.content_type}:${d.content_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // تصفية بالحد الأدنى للصلة
  return unique
    .filter((d) => d.relevance_score >= MIN_RELEVANCE_SCORE || d.authority_score >= 70)
    .slice(0, limit);
}

/**
 * الكيانات المرتبطة من الرسم البياني المعرفي
 */
export async function retrieveRelatedEntities(admin, contentId, contentType, depth = 1) {
  if (!admin || !contentId) return [];
  try {
    const { data } = await admin.rpc("get_related_entities", {
      p_content_id:   contentId,
      p_content_type: contentType,
      p_depth:        Math.min(depth, 3),
    });
    return data || [];
  } catch {
    return [];
  }
}
