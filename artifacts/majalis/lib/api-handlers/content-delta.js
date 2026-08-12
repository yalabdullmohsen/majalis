/**
 * GET /api/content-delta — publishable content delta packs for offline sync.
 * When no packs are configured/published, returns an empty list (valid contract).
 */
import { sendJson } from "../api/_http.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { ok: false, message: "الطريقة غير مدعومة." });
    return;
  }

  // Future: load signed packs from storage keyed by ?packs=&since_*.
  // Empty array is the correct response when nothing is published — not a stub ok:true.
  sendJson(
    res,
    200,
    { packs: [] },
    { "Cache-Control": "public, max-age=60" },
  );
}
