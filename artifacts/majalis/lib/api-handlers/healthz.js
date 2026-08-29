import { sendJson } from "../api/_http.mjs";

function litePayload() {
  return {
    ok: true,
    service: "majlisilm-web",
    at: new Date().toISOString(),
    uptimeMs: Math.round(process.uptime() * 1000),
    commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || null,
  };
}

/**
 * GET /api/healthz
 * Default (lite): process liveness only — must not load AI/DB/CMS graphs.
 * Deep probe: /api/deep-health (cron auth) or legacy ?full=1.
 */
export default async function handler(req, res) {
  const full = req.query?.full === "1";

  if (!full) {
    sendJson(res, 200, {
      ...litePayload(),
      hint: "الفحص العميق عبر /api/deep-health (محمي)",
    }, {
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      "CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    });
    return;
  }

  try {
    const { getPlatformHealth } = await import("../platform-health.mjs");
    const health = await getPlatformHealth({ skipRemote: true });
    sendJson(res, health.ok ? 200 : 503, {
      ok: health.ok,
      service: "majlisilm-web",
      at: health.at,
      blockers: health.blockers,
      secretGroups: health.secretGroups,
      services: {
        database: health.services?.database,
        supabase: health.services?.supabase,
        cron: health.services?.cron,
        assistant: health.services?.assistant,
        mke: health.services?.mke,
      },
    });
  } catch (err) {
    sendJson(res, 503, {
      ok: false,
      service: "majlisilm-web",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
