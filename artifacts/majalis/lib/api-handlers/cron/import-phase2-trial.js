import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { runPhase2TrialImport } from "../../../lib/content-import/phase2-trial.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = join(__dirname, "../../..");

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const dryRun = req.query?.dryRun === "1" || req.body?.dryRun === true;

  try {
    const result = await runPhase2TrialImport(APP_ROOT, { dryRun });
    sendJson(res, result.ok ? 200 : 422, { ok: result.ok, ...result });
  } catch (err) {
    console.error("[cron/import-phase2-trial]", err);
    sendJson(res, 500, { ok: false, error: String(err.message || err) });
  }
}
