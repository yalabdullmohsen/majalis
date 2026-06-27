import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { applyMigrations, verifySchema } from "../../../lib/db-migrate.mjs";
import { testDatabaseConnection, resolveDatabaseUrl } from "../../../lib/database.mjs";
import { ensureContentImportSchema } from "../../../lib/content-import/ensure-schema.mjs";

function resolvedMeta() {
  const r = resolveDatabaseUrl();
  return {
    urlRedacted: r.urlRedacted,
    source: r.source,
    rawConfigured: r.rawConfigured,
    normalized: r.normalized,
    normalizeReason: r.normalizeReason,
  };
}

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const action = req.query?.action || req.body?.action || "apply";

  try {
    if (action === "verify") {
      const schema = await verifySchema();
      sendJson(res, schema.ok ? 200 : 500, schema);
      return;
    }

    if (action === "test") {
      const conn = await testDatabaseConnection();
      sendJson(res, conn.ok ? 200 : 500, { connection: conn, resolved: resolvedMeta() });
      return;
    }

    if (action === "content-import-schema") {
      const result = await ensureContentImportSchema();
      sendJson(res, result.ok ? 200 : 500, result);
      return;
    }

    const force = req.query?.force === "1" || req.body?.force === true;
    const verify = await verifySchema();
    if (verify.ok && !force) {
      sendJson(res, 200, {
        ok: true,
        alreadyApplied: true,
        schema: verify,
        resolved: resolvedMeta(),
      });
      return;
    }

    const result = await applyMigrations({ continueOnError: true });
    const verifyAfter = await verifySchema();
    const ok = result.ok && verifyAfter.ok;
    sendJson(res, ok ? 200 : 500, {
      ok,
      migrations: result,
      schema: verifyAfter,
      resolved: resolvedMeta(),
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error.message,
      resolved: resolvedMeta(),
      hint: "Set DATABASE_URL to Supabase Transaction Pooler URL on Vercel (port 6543)",
    });
  }
}
