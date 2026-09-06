import { sendJson } from "../api/_http.mjs";
import { getPublicBuildMeta } from "../build-meta.mjs";

/**
 * GET /api/healthz (و /healthz عبر rewrite) — حيوية عامة بلا أسرار.
 */
export default async function handler(_req, res) {
  const meta = getPublicBuildMeta();
  sendJson(res, 200, meta, {
    "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=120",
    "CDN-Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
  });
}
