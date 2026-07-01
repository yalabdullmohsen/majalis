/**
 * Server-side fiqh research engine — text search fallback + optional LLM synthesis.
 */

import { createHash } from "node:crypto";

export const FIQH_RESEARCH_DISCLAIMER =
  "هذه خلاصة بحثية مستندة إلى مواد منشورة في المنصة، وليست فتوى شخصية. " +
  "في المسائل الخاصة والنوازل، يُرجى سؤال أهل العلم المختصين.";

const PERSONAL_FATWA_PATTERNS = [
  /أفتني/,
  /ما حكم/,
  /هل يجوز لي/,
  /يجوز لي/,
  /حالتي/,
  /واقعتي/,
  /زوجي/,
  /زوجتي/,
  /طلاقي/,
  /ميراثي/,
];

export function looksLikePersonalFatwaRequest(query) {
  const q = String(query || "").trim();
  if (q.length < 4) return false;
  return PERSONAL_FATWA_PATTERNS.some((p) => p.test(q));
}

export function normalizeQuery(q) {
  return String(q || "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .trim()
    .toLowerCase()
    .slice(0, 500);
}

export function formatCitation(item, baseUrl = "https://majlisilm.com") {
  const parts = [
    item.title,
    item.source_name ? `المصدر: ${item.source_name}` : "",
    item.decision_number ? `رقم القرار: ${item.decision_number}` : "",
    item.session_date ? `التاريخ: ${String(item.session_date).slice(0, 10)}` : "",
    item.category ? `التصنيف: ${item.category}` : "",
    item.source_url ? `الرابط الأصلي: ${item.source_url}` : "",
    `رابط المنصة: ${baseUrl}/fiqh-council/${item.slug}`,
  ].filter(Boolean);
  return parts.join(" | ");
}

export function toCitation(item, excerpt) {
  const text = excerpt || item.summary || item.ruling_text || (item.content || "").slice(0, 200) || item.title;
  return {
    slug: item.slug,
    title: item.title,
    excerpt: String(text).slice(0, 280),
    href: `/fiqh-council/${item.slug}`,
    type: item.type,
    category: item.category,
    source_name: item.source_name,
    source_url: item.source_url,
    session_date: item.session_date,
    decision_number: item.decision_number,
    citation: formatCitation(item),
  };
}

export function buildSummary(items, query) {
  if (!items.length) {
    return "لا توجد مادة موثقة كافية في قاعدة بيانات المنصة للإجابة عن هذا السؤال.";
  }
  const intro = `وفق المواد المنشورة في المجمع الفقهي، إليك ما يرتبط بسؤالك «${query}»:`;
  const bullets = items.slice(0, 5).map((item, i) => {
    const snippet = item.summary || item.ruling_text || item.title;
    return `${i + 1}. ${item.title}: ${String(snippet).slice(0, 160)}${snippet && snippet.length > 160 ? "…" : ""}`;
  });
  return [intro, ...bullets].join("\n");
}

export const FIQH_NO_VERIFIED_MATERIAL_MSG =
  "لا توجد مادة موثقة كافية في قاعدة بيانات المنصة للإجابة عن هذا السؤال.";

export function isVerifiedPublishedItem(item) {
  if (item.status !== "published") return false;
  return (
    item.confidence_level === "source_verified" &&
    item.source_name &&
    item.source_url
  ) || item.documentation_level === "official_verified";
}

export async function searchPublishedItems(admin, query, filters = {}) {
  const q = String(query || "").trim();
  if (!q) return [];

  const { data, error } = await admin.rpc("search_fiqh_council_advanced", {
    query: q,
    p_type: filters.type && filters.type !== "الكل" ? filters.type : null,
    p_category: filters.category && filters.category !== "الكل" ? filters.category : null,
    p_subcategory: filters.subcategory || null,
    p_source: filters.source || null,
    p_year: filters.year && filters.year !== "الكل" ? Number(filters.year) : null,
    p_tags: null,
    p_nawazil_topic: null,
    p_decision_number: null,
    result_limit: filters.limit || 10,
  });

  if (error) {
    const { data: fallback } = await admin
      .from("fiqh_council_items")
      .select("*")
      .eq("status", "published")
      .is("archived_at", null)
      .ilike("title", `%${q}%`)
      .limit(10);
    return fallback || [];
  }

  return data || [];
}

export async function logResearchSearch(admin, payload) {
  try {
    const { data: logRow } = await admin
      .from("fiqh_research_search_logs")
      .insert(payload)
      .select("id")
      .single();

    if (!payload.answered && payload.query) {
      await admin.from("fiqh_research_unanswered").insert({
        query: payload.query,
        log_id: logRow?.id || null,
        status: "open",
      });
    }

    return logRow?.id || null;
  } catch {
    return null;
  }
}

export async function isAssistantEnabled(admin) {
  try {
    const { data } = await admin.from("fiqh_research_settings").select("is_enabled").eq("id", 1).maybeSingle();
    return data?.is_enabled !== false;
  } catch {
    return true;
  }
}

export async function synthesizeFromContext(query, items) {
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey || !items.length) return null;

  const context = items.slice(0, 6).map((item, i) =>
    `[${i + 1}] ${item.title}\n` +
    `المصدر: ${item.source_name || "—"}\n` +
    `التصنيف: ${item.category || "—"}\n` +
    `الملخص: ${item.summary || item.ruling_text || ""}\n` +
    `الرابط: /fiqh-council/${item.slug}`,
  ).join("\n\n");

  const system =
    "أنت مساعد بحث فقهي لمنصة المجلس العلمي. " +
    "لخّص فقط من المواد المقدمة. لا تُصدر فتوى جديدة. " +
    "لا تجب من خارج السياق. اذكر أن الإجابة خلاصة بحثية. " +
    "في النهاية: «يُرجى مراجعة المصادر الأصلية وسؤال أهل العلم في المسائل الخاصة.»";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system,
      messages: [{
        role: "user",
        content: `السؤال: ${query}\n\nالمواد المنشورة:\n${context}\n\nاكتب خلاصة بحثية مختصرة مع الإشارة للمواد.`,
      }],
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const text = data?.content?.[0]?.text;
  return typeof text === "string" ? text.trim() : null;
}

export async function runFiqhResearchQuery(admin, { query, filters = {}, sessionId = null }) {
  const started = Date.now();
  const normalized = normalizeQuery(query);

  if (!query?.trim()) {
    return { ok: false, message: "اكتب سؤالك أولًا." };
  }

  const enabled = await isAssistantEnabled(admin);
  if (!enabled) {
    return { ok: false, message: "مساعد الباحث الفقهي معطّل مؤقتاً." };
  }

  if (looksLikePersonalFatwaRequest(query)) {
    const answer = {
      summary: "هذا السؤال يتعلق بمسألة شخصية. مساعد الباحث لا يُصدر فتاوى — يُرجى سؤال عالم مختص.",
      citations: [],
      disclaimer: FIQH_RESEARCH_DISCLAIMER,
      noResults: true,
      personalFatwaRedirect: true,
    };
    await logResearchSearch(admin, {
      query,
      normalized_query: normalized,
      filters,
      session_id: sessionId,
      result_count: 0,
      citations: [],
      answer_preview: answer.summary,
      retrieval_mode: "text",
      answered: false,
      is_personal_fatwa: true,
      latency_ms: Date.now() - started,
    });
    return { ok: true, answer, citations: [], retrievalMode: "text" };
  }

  const rawItems = await searchPublishedItems(admin, query, filters);
  const items = rawItems.filter(isVerifiedPublishedItem);
  let summary = buildSummary(items, query);
  let retrievalMode = "text";

  const llmSummary = await synthesizeFromContext(query, items);
  if (llmSummary) {
    summary = llmSummary;
    retrievalMode = "hybrid";
  }

  const citations = items.map((item) => toCitation(item));
  const answer = {
    summary,
    citations,
    disclaimer: FIQH_RESEARCH_DISCLAIMER,
    noResults: items.length === 0,
  };

  await logResearchSearch(admin, {
    query,
    normalized_query: normalized,
    filters,
    session_id: sessionId,
    result_count: items.length,
    citations,
    answer_preview: summary.slice(0, 500),
    retrieval_mode: retrievalMode,
    answered: items.length > 0,
    is_personal_fatwa: false,
    latency_ms: Date.now() - started,
  });

  return { ok: true, answer, citations, retrievalMode };
}

export function sessionIdFromRequest(req) {
  const raw = req.headers["x-session-id"] || req.headers["x-forwarded-for"] || "anon";
  return createHash("sha256").update(String(raw)).digest("hex").slice(0, 32);
}
