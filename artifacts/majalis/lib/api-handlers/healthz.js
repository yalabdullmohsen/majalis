import { sendJson } from "../api/_http.mjs";

/**
 * GET /api/healthz — فحص حيوية خفيف للاستخدام العام (App Store / probes).
 * لا يعرض commit ولا uptime ولا تفاصيل داخلية.
 * الفحص العميق: /api/deep-health (محمي بـ CRON_SECRET).
 */
export default async function handler(_req, res) {
  sendJson(
    res,
    200,
    {
      ok: true,
      service: "ssunnah-web",
    },
    {
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      "CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  );
}
