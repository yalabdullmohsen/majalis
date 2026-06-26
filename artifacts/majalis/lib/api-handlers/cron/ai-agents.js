import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { getSupabaseAdmin } from "../../../lib/supabase-admin.mjs";
import { runAgentPipeline } from "../../../lib/ai-agents/index.mjs";
import { syncTrustedSources } from "../../../lib/trusted-sources/index.mjs";

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const admin = getSupabaseAdmin();
  const mode = req.query?.mode || "pipeline";

  try {
    if (mode === "health") {
      sendJson(res, 200, {
        ok: true,
        mode: "health",
        note: "Lightweight cron probe — full pipeline may exceed serverless timeout; use mode=pipeline on dedicated workers.",
        supabase: Boolean(admin),
      });
      return;
    }

    if (mode === "sources") {
      const sync = await syncTrustedSources(admin, { probe: true });
      sendJson(res, 200, { ok: true, sync });
      return;
    }

    const pipeline = await runAgentPipeline(admin, {
      skipDiscovery: req.query?.skipDiscovery === "1",
    });
    sendJson(res, 200, { ok: true, pipeline });
  } catch (err) {
    console.error("[cron/ai-agents]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
