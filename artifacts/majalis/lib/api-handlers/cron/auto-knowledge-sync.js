import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runFullKnowledgeSync } from "../../../lib/auto-knowledge-sync.mjs";
import { ensureAkeRpcFunctions } from "../../../lib/auto-knowledge-engine/rpc-probe.mjs";
import { withCronTracking } from "../../../lib/auto-knowledge-engine/monitoring/cron-tracker.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }
  try {
    const result = await withCronTracking(
      "auto-knowledge-sync",
      async () => {
        const rpcRepair = await ensureAkeRpcFunctions();
        const sync = await runFullKnowledgeSync({ triggerType: "cron", checkLinks: false });
        return { ...sync, rpcRepair: rpcRepair.skipped ? undefined : rpcRepair };
      },
      { schedule: "*/15 * * * *" },
    );
    sendJson(res, result.ok ? 200 : 500, result);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
