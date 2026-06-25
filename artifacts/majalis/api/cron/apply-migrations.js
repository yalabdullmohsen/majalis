import { sendJson } from "../_http.js";
import { validateCronAuth } from "../../lib/env-config.mjs";
import { applyMigrations, verifySchema } from "../../lib/db-migrate.mjs";
import { testDatabaseConnection, resolveDatabaseUrl } from "../../lib/database.mjs";

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const action = req.query?.action || req.body?.action || "apply";

  try {
    if (action === "verify") {
      const schema = await verifySchema();
      sendJson(res, schema.ok ? 200 : 503, schema);
      return;
    }

    if (action === "test") {
      const conn = await testDatabaseConnection();
      sendJson(res, conn.ok ? 200 : 503, { connection: conn, resolved: resolveDatabaseUrl() });
      return;
    }

    const result = await applyMigrations({ continueOnError: true });
    const verify = await verifySchema();
    sendJson(res, result.ok && verify.ok ? 200 : 503, {
      ok: result.ok && verify.ok,
      migrations: result,
      schema: verify,
      resolved: resolveDatabaseUrl(),
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error.message,
      resolved: resolveDatabaseUrl(),
      hint: "Add DATABASE_URL or POSTGRES_URL or POSTGRES_PASSWORD or SUPABASE_ACCESS_TOKEN to Vercel",
    });
  }
}
