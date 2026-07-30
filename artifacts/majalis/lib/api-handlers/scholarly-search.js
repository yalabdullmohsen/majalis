import { sendJson } from "../api/_http.mjs";
import { sendSafeError } from "../api/safe-error.mjs";
import { searchScholarlyContent } from "../../lib/scholarly-verification/orchestrator.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, message: "GET only" });
    return;
  }

  try {
    const result = await searchScholarlyContent({
      query: req.query?.q ?? req.query?.query ?? null,
      source_name: req.query?.source ?? req.query?.source_name ?? null,
      author: req.query?.author ?? null,
      content_type: req.query?.type ?? req.query?.content_type ?? null,
      verification_status: req.query?.status ?? req.query?.verification_status ?? null,
      language: req.query?.lang ?? req.query?.language ?? null,
      limit: Number(req.query?.limit ?? 30),
    });
    sendJson(res, 200, result);
  } catch (error) {
    sendSafeError(res, sendJson, error, { code: "scholarly_search_failed" });
  }
}
