/**
 * GET/POST /api/cron/bootstrap-database
 * Fast: verify / connection. Full bootstrap: enqueue only (no runtime DDL).
 */
import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { verifySchema } from "../../../lib/db-migrate.mjs";
import { testDatabaseConnection, resolveDatabaseUrl } from "../../../lib/database.mjs";
import { createEnqueueCronHandler } from "../../jobs/cron-enqueue.mjs";

const enqueue = createEnqueueCronHandler("platform-bootstrap");

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

  const action = req.query?.action || req.body?.action || "full";

  if (action === "verify") {
    sendJson(res, 200, { ...(await verifySchema()), resolved: resolvedMeta() });
    return;
  }

  if (action === "connection") {
    const conn = await testDatabaseConnection();
    sendJson(res, conn.ok ? 200 : 500, { ...conn, resolved: resolvedMeta() });
    return;
  }

  if (action === "migrate") {
    sendJson(res, 403, {
      ok: false,
      error: "runtime_schema_migrations_disabled",
      message: "Bootstrap cron must not apply schema.",
    });
    return;
  }

  return enqueue(req, res);
}
