/**
 * Grounded answer builder — synthesize only from retrieved evidence.
 */

import {
  REASONING_DISCLAIMER,
  NO_EVIDENCE_MESSAGE,
  MIN_SOURCES_FOR_ANSWER,
  ISLAMIC_QUERY_PATTERNS,
} from "./constants.mjs";
import { retrieveEvidence } from "./retrieve.mjs";
import { expandEvidenceGraph } from "./graph-expand.mjs";
import { aggregateConfidence, toCitation } from "./citations.mjs";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { normalizeQuery } from "../fiqh-research-engine.mjs";

export function looksLikeIslamicKnowledgeQuery(query) {
  const q = String(query || "").trim();
  if (q.length < 4) return false;
  return ISLAMIC_QUERY_PATTERNS.some((p) => p.test(q));
}

function buildEvidenceSummary(query, tiers, citations) {
  if (!citations.length) return NO_EVIDENCE_MESSAGE;

  const intro = `وفق المواد الموثقة في قاعدة معرفة المجلس العلمي، إليك ما يرتبط بسؤالك «${query}»:`;
  const sections = [];

  for (const tier of tiers) {
    if (!tier.items?.length) continue;
    const lines = tier.items.slice(0, 3).map((item, i) => {
      const snippet = String(item.text || item.summary || item.title || "").slice(0, 140);
      return `  ${i + 1}. ${item.title || snippet}: ${snippet}${snippet.length >= 140 ? "…" : ""}`;
    });
    sections.push(`\n【${tier.label}】\n${lines.join("\n")}`);
  }

  const refs = citations.slice(0, 8).map((c, i) =>
    `[${i + 1}] ${c.title} — ${c.source_name || "المجلس العلمي"} (${Math.round(c.trust_score)}% ثقة)`,
  );

  return [intro, ...sections, "\n\nالمراجع:", ...refs, `\n\n${REASONING_DISCLAIMER}`].join("\n");
}

export async function synthesizeGroundedAnswer(query, citations, tiers) {
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey || citations.length < MIN_SOURCES_FOR_ANSWER) return null;

  const context = citations.slice(0, 8).map((c, i) =>
    `[${i + 1}] (${c.tier_label || c.content_kind}) ${c.title}\n` +
    `المصدر: ${c.source_name || "—"}\n` +
    `الثقة: ${c.trust_score}%\n` +
    `مقتطف: ${c.excerpt}\n` +
    `الرابط: ${c.href}`,
  ).join("\n\n");

  const system =
    "أنت مساعد علمي لمنصة المجلس العلمي. " +
    "أجب فقط من المواد المقدمة — لا تُنشئ أحاديث أو آيات أو أقوال علماء. " +
    "رتّب الأدلة: قرآن ثم سنة ثم شروح ثم كتب ثم فتاوى ثم دروس. " +
    "اذكر درجة الثقة. إن لم تكفِ المواد فقل ذلك صراحة.";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 900,
      system,
      messages: [{
        role: "user",
        content: `السؤال: ${query}\n\nالمواد الموثقة:\n${context}\n\nاكتب إجابة مترابطة مع ذكر المراجع.`,
      }],
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const text = data?.content?.[0]?.text;
  return typeof text === "string" ? `${text.trim()}\n\n${REASONING_DISCLAIMER}` : null;
}

async function logQuery(admin, payload) {
  if (!admin) return null;
  try {
    const { data } = await admin.from("reasoning_query_logs").insert(payload).select("id").maybeSingle();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

export async function runReasoningQuery(opts = {}) {
  const admin = opts.admin ?? getSupabaseAdmin();
  const query = String(opts.query || "").trim();
  const started = Date.now();

  if (!query) {
    return { ok: false, message: "اكتب سؤالك أولًا." };
  }

  const retrieval = await retrieveEvidence(query, {
    admin,
    limit: opts.limit ?? 25,
    sessionId: opts.sessionId,
    skipCache: opts.skipCache,
  });

  let citations = retrieval.citations || [];
  let graph = { nodeCount: 0, edgeCount: 0, expanded: [] };

  if (opts.expandGraph !== false && citations.length) {
    graph = await expandEvidenceGraph(admin, citations, { depth: opts.graphDepth ?? 1 });
    const seen = new Set(citations.map((c) => c.ref_id));
    for (const extra of graph.expanded || []) {
      if (!seen.has(extra.ref_id)) {
        citations.push(extra);
        seen.add(extra.ref_id);
      }
    }
  }

  const confidence = aggregateConfidence(citations);
  const noEvidence = citations.length < MIN_SOURCES_FOR_ANSWER;

  let summary = buildEvidenceSummary(query, retrieval.tiers, citations);
  let retrievalMode = "tiered";

  if (!noEvidence && opts.synthesize !== false) {
    const llm = await synthesizeGroundedAnswer(query, citations, retrieval.tiers);
    if (llm) {
      summary = llm;
      retrievalMode = "grounded_llm";
    }
  }

  const evidenceTiers = {};
  for (const tier of retrieval.tiers || []) {
    evidenceTiers[tier.label] = tier.items?.length ?? 0;
  }

  const answer = {
    summary,
    citations: citations.slice(0, 12),
    confidence,
    noEvidence,
    disclaimer: REASONING_DISCLAIMER,
    evidence_tiers: evidenceTiers,
    graph_nodes: graph.nodeCount ?? 0,
    topics: retrieval.topics,
  };

  await logQuery(admin, {
    query,
    normalized_query: normalizeQuery(query),
    session_id: opts.sessionId ?? null,
    actor_id: opts.actorId ?? "anonymous",
    result_count: retrieval.count,
    citation_count: citations.length,
    confidence_score: confidence,
    retrieval_mode: retrievalMode,
    answered: !noEvidence,
    no_evidence: noEvidence,
    citations: citations.slice(0, 12),
    evidence_tiers: evidenceTiers,
    graph_nodes: graph.nodeCount ?? 0,
    answer_preview: summary.slice(0, 500),
    latency_ms: Date.now() - started,
  });

  return {
    ok: true,
    answer,
    citations: answer.citations,
    confidence,
    retrievalMode,
    latency_ms: Date.now() - started,
  };
}
