import { sendJson } from "./_http.js";
import { getPublishedAutoContentFeed } from "../lib/auto-content/auto-content-sync.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  const slug = String(req.query?.slug || "").trim();
  const limit = Math.min(Number(req.query?.limit || 20), 100);
  const contentType = req.query?.type ? String(req.query.type) : null;

  try {
    const result = await getPublishedAutoContentFeed({ limit, contentType, slug: slug || null });
    sendJson(res, result.ok ? 200 : 503, result);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
