import { sendJson } from "../api/_http.mjs";
import { getPlatformHealth } from "../platform-health.mjs";
import { sendSafeError } from "../api/safe-error.mjs";

/** Redact secret names from public full health — only ok + missingCount. */
function redactSecretGroups(groups) {
  if (!groups || typeof groups !== "object") return {};
  return Object.fromEntries(
    Object.entries(groups).map(([name, g]) => [
      name,
      {
        ok: Boolean(g?.ok),
        missingCount: Array.isArray(g?.missing) ? g.missing.length : 0,
      },
    ]),
  );
}

export default async function handler(req, res) {
  const lite = req.query?.lite === "1" || req.query?.full !== "1";

  if (lite) {
    res.setHeader?.("Cache-Control", "no-store");
    sendJson(res, 200, {
      ok: true,
      service: "majlisilm-web",
      at: new Date().toISOString(),
      uptimeMs: Math.round(process.uptime() * 1000),
      commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || null,
    });
    return;
  }

  try {
    const health = await getPlatformHealth({ skipRemote: true });
    sendJson(res, health.ok ? 200 : 503, {
      ok: health.ok,
      service: "majlisilm-web",
      at: health.at,
      blockers: (health.blockers || []).map((b) =>
        // Avoid leaking exact secret names in blockers like secrets:FOO,BAR
        String(b).startsWith("secrets:") ? "secrets:missing" : b,
      ),
      secretGroups: redactSecretGroups(health.secretGroups),
      services: {
        database: health.services?.database,
        supabase: {
          ok: health.services?.supabase?.ok,
          anon: health.services?.supabase?.anon,
          serviceRole: health.services?.supabase?.serviceRole,
        },
        cron: {
          ok: health.services?.cron?.ok,
          missingCount: Array.isArray(health.services?.cron?.missing)
            ? health.services.cron.missing.length
            : 0,
        },
        assistant: {
          ok: health.services?.assistant?.ok,
          anthropic: health.services?.assistant?.anthropic,
        },
        mke: health.services?.mke,
      },
    });
  } catch (err) {
    sendSafeError(res, sendJson, err, { status: 503, code: "health_unavailable" });
  }
}
