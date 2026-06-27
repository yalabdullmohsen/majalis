import { sendJson } from "../api/_http.mjs";
import { getPlatformHealth } from "../../platform-health.mjs";

export default async function handler(req, res) {
  const lite = req.query?.lite === "1" || req.query?.full !== "1";

  if (lite) {
    sendJson(res, 200, { ok: true, service: "majlisilm-web" });
    return;
  }

  try {
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
    sendJson(res, 503, { ok: false, service: "majlisilm-web", error: err.message });
  }
}
