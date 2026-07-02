/**
 * محرك RAG الرئيسي — Pipeline كامل:
 * 1. تحليل النية
 * 2. استرجاع الوثائق
 * 3. ترتيب المصادر
 * 4. توليد الإجابة
 * 5. تسجيل الاستعلام
 */

import { retrieveDocuments } from "./retrieval.mjs";
import { rankDocuments, detectOpinionDiversity, extractOpinions } from "./ranking.mjs";
import { generateAnswer } from "./generation.mjs";
import { analyzeIntent, detectOutputMode } from "./intent.mjs";
import { cacheGet, cacheSet, cacheKey } from "./cache.mjs";
import {
  ANSWER_QUALITY,
  PERSONAL_FATWA_MSG,
  NO_SOURCES_MSG,
  CONTENT_TYPE_LABEL,
} from "./constants.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

/**
 * بناء هيكل المصادر للعرض في الواجهة
 */
function buildSourcesList(docs) {
  return docs.slice(0, 12).map((d, i) => ({
    index:       i + 1,
    content_type: d.content_type,
    type_label:  CONTENT_TYPE_LABEL[d.content_type] || d.content_type,
    title:       d.title,
    excerpt:     d.excerpt,
    source_ref:  d.source_ref,
    source_url:  d.source_url,
    authority:   Math.round(d.authority_score),
    metadata:    d.metadata || {},
    href:        buildHref(d),
  }));
}

function buildHref(doc) {
  const meta = doc.metadata || {};
  switch (doc.content_type) {
    case "fiqh_decision": return meta.slug ? `/fiqh-council/${meta.slug}` : "";
    case "lesson":        return doc.content_id ? `/lessons/${doc.content_id}` : "";
    case "hadith":        return "/hadith";
    case "book":          return doc.content_id ? `/library/${doc.content_id}` : "";
    case "benefit":       return "/fawaid";
    case "quran_verse":   return "/quran";
    default:              return doc.source_url || "";
  }
}

/**
 * تسجيل الاستعلام في research_queries
 */
async function logQuery(admin, { userId, sessionId, query, intent, docs, answer, quality, durationMs, fromCache }) {
  try {
    await admin.from("research_queries").insert({
      user_id:            userId || null,
      session_id:         sessionId || "",
      query_text:         query,
      intent:             intent || "general",
      retrieved_sources:  JSON.stringify(docs.slice(0, 5).map((d) => ({
        content_type: d.content_type,
        title:        d.title,
        source_ref:   d.source_ref,
      }))),
      generated_answer:   answer.slice(0, 3000),
      answer_quality:     quality,
      content_types_used: [...new Set(docs.map((d) => d.content_type))],
      duration_ms:        durationMs,
      from_cache:         fromCache,
    });
  } catch (err) {
    console.warn("[rag] logQuery failed:", err.message);
  }
}

/**
 * pipeline الباحث الشرعي الكامل
 *
 * @param {object} opts
 * @param {string} opts.query      - سؤال المستخدم
 * @param {string} [opts.userId]   - معرّف المستخدم (اختياري)
 * @param {string} [opts.sessionId]
 * @param {string[]} [opts.types]  - تصفية حسب نوع المحتوى
 * @param {number} [opts.limit]    - عدد المصادر
 */
export async function runRAGPipeline({ query, userId, sessionId, types, limit = 15 }) {
  const t0 = Date.now();
  const admin = getSupabaseAdmin();

  // ── 1. تحليل النية ─────────────────────────────────────────────────────────
  const { intent, isPersonal, contentTypes } = analyzeIntent(query);
  const outputMode = detectOutputMode(query);

  if (isPersonal) {
    return {
      ok:          true,
      answer:      PERSONAL_FATWA_MSG,
      sources:     [],
      byType:      {},
      opinions:    [],
      intent,
      quality:     ANSWER_QUALITY.BLOCKED,
      hasOpinions: false,
      fromCache:   false,
    };
  }

  // ── 2. Cache check ─────────────────────────────────────────────────────────
  const effectiveTypes = types?.length ? types : contentTypes;
  const ck = cacheKey(query, effectiveTypes);
  const cached = cacheGet(ck);
  if (cached) {
    // سجّل الاستعلام كـ cache hit
    if (admin) logQuery(admin, { userId, sessionId, query, intent, docs: cached.docs || [],
      answer: cached.answer, quality: cached.quality, durationMs: Date.now() - t0, fromCache: true });
    return { ...cached, fromCache: true };
  }

  // ── 3. استرجاع الوثائق ────────────────────────────────────────────────────
  const rawDocs = await retrieveDocuments(admin, query, {
    types: effectiveTypes,
    limit: Math.min(limit, 20),
  });

  // ── 4. ترتيب ──────────────────────────────────────────────────────────────
  const { ranked, byType } = rankDocuments(rawDocs);
  const hasOpinions = detectOpinionDiversity(ranked);
  const opinions   = hasOpinions ? extractOpinions(ranked) : [];

  // ── 5. توليد الإجابة ───────────────────────────────────────────────────────
  const topDocs = ranked.slice(0, 12);
  const { answer, model } = await generateAnswer(query, topDocs);
  const sources = buildSourcesList(topDocs);

  const quality = topDocs.length === 0
    ? ANSWER_QUALITY.NO_SOURCES
    : topDocs.length < 3
    ? ANSWER_QUALITY.PARTIAL
    : ANSWER_QUALITY.FULL;

  const durationMs = Date.now() - t0;

  // ── 6. Cache + تسجيل ──────────────────────────────────────────────────────
  const result = { ok: true, answer, sources, byType, opinions, intent, outputMode,
                   quality, hasOpinions, model, durationMs, fromCache: false, docs: topDocs };
  cacheSet(ck, result);

  if (admin) {
    logQuery(admin, { userId, sessionId, query, intent, docs: topDocs,
      answer, quality, durationMs, fromCache: false });
  }

  return result;
}
