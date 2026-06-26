import { sendJson } from "../api/_http.mjs";
import { unifiedSearch, trackResultClick } from "../../lib/scholarly-intelligence/unified-search.mjs";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const query = String(req.query?.q || req.query?.query || "").trim();
    if (!query) {
      sendJson(res, 400, { ok: false, error: "query_required" });
      return;
    }

    const filters = {
      content_type: req.query?.type || req.query?.content_type || null,
      author: req.query?.author || req.query?.scholar || null,
      verification_status: req.query?.status || req.query?.verification_status || null,
      language: req.query?.lang || req.query?.language || null,
      year: req.query?.year ? Number(req.query.year) : null,
      date_from: req.query?.date_from || null,
      date_to: req.query?.date_to || null,
    };

    try {
      const result = await unifiedSearch({
        query,
        limit: Number(req.query?.limit || 40),
        filters,
        userId: req.query?.userId || null,
        sessionId: req.query?.sessionId || req.headers["x-session-id"] || null,
      });
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error.message });
    }
    return;
  }

  if (req.method === "POST") {
    const body = req.body || {};
    if (body.action === "click") {
      try {
        const result = await trackResultClick({
          query: body.query,
          resultId: body.resultId,
          kind: body.kind,
          userId: body.userId,
          sessionId: body.sessionId,
        });
        sendJson(res, 200, result);
      } catch (error) {
        sendJson(res, 500, { ok: false, error: error.message });
      }
      return;
    }

    const query = String(body.q || body.query || "").trim();
    if (!query) {
      sendJson(res, 400, { ok: false, error: "query_required" });
      return;
    }

    try {
      const result = await unifiedSearch({
        query,
        limit: Number(body.limit || 40),
        filters: body.filters || {},
        userId: body.userId || null,
        sessionId: body.sessionId || null,
      });
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error.message });
    }
    return;
  }

  sendJson(res, 405, { ok: false, error: "method_not_allowed" });
}
