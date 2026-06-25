import { sendJson } from "../_http.js";
import { validateCronAuth } from "../../lib/env-config.mjs";
import { applyMigrations, verifySchema } from "../../lib/db-migrate.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const action = req.query?.action || req.body?.action || "apply";

  try {
    if (action === "verify") {
      const result = await verifySchema();
      sendJson(res, result.ok ? 200 : 503, result);
      return;
    }

    const result = await applyMigrations({ continueOnError: true });
    const verify = await verifySchema();
    sendJson(res, result.ok && verify.ok ? 200 : 503, {
      ok: result.ok && verify.ok,
      migrations: result,
      schema: verify,
    });
  } catch (error) {
    const env = getEnvStatus();
    sendJson(res, 500, {
      ok: false,
      error: error.message,
      hint: "Add DATABASE_URL to Vercel (Supabase Dashboard → Settings → Database → Connection string URI), then retry. Or run supabase/auto_engine_production_complete.sql in SQL Editor.",
      env,
    });
  }
}
