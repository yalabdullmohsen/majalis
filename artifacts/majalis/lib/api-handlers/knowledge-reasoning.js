import { sendJson } from "../../api/_http.mjs";
import { runReasoningQuery } from "../../../lib/reasoning-engine/answer.mjs";
import { createHash } from "node:crypto";

function sessionId(req) {
  const raw = req.headers["x-session-id"] || req.headers["x-forwarded-for"] || "anon";
  return createHash("sha256").update(String(raw)).digest("hex").slice(0, 32);
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, service: "knowledge-reasoning", version: 1 });
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "Method not allowed" });
    return;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const query = String(body.query || body.message || req.query?.q || "").trim();

  try {
    const result = await runReasoningQuery({
      query,
      sessionId: sessionId(req),
      synthesize: body.synthesize !== false,
      expandGraph: body.expandGraph !== false,
      limit: body.limit ?? 25,
    });

    if (!result.ok) {
      sendJson(res, 400, result);
      return;
    }

    sendJson(res, 200, {
      ok: true,
      answer: result.answer.summary,
      citations: result.answer.citations,
      confidence: result.confidence,
      no_evidence: result.answer.noEvidence,
      evidence_tiers: result.answer.evidence_tiers,
      disclaimer: result.answer.disclaimer,
      retrieval_mode: result.retrievalMode,
      latency_ms: result.latency_ms,
    });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
