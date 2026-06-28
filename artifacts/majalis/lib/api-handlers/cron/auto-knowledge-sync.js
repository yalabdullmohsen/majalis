import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runFullKnowledgeSync } from "../../../lib/auto-knowledge-sync.mjs";
import { ensureAkeRpcFunctions } from "../../../lib/auto-knowledge-engine/rpc-probe.mjs";

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
    const rpcRepair = await ensureAkeRpcFunctions();
    const connectorSlug = req.query?.connector || req.query?.slug || req.body?.connectorSlug;
    const forceConnector = Boolean(connectorSlug) || req.query?.force === "1";
    const result = await runFullKnowledgeSync({
      triggerType: "cron",
      checkLinks: false,
      continuous: !forceConnector,
      engineOnly: true,
      connectorSlug: connectorSlug || undefined,
      maxConnectors: connectorSlug ? 1 : undefined,
      maxItemsPerConnector: forceConnector ? 5 : undefined,
    });
    sendJson(res, result.ok ? 200 : 500, { ...result, rpcRepair: rpcRepair.skipped ? undefined : rpcRepair });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message });
  }
}
