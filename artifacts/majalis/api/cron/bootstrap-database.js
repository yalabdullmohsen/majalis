import { sendJson } from "../_http.js";
import { validateCronAuth } from "../../lib/env-config.mjs";
import { applyMigrations, ensureSchemaReady, verifySchema } from "../../lib/db-migrate.mjs";
import { testDatabaseConnection, resolveDatabaseUrl } from "../../lib/database.mjs";
import { runAutoContentSync } from "../../lib/auto-content/auto-content-sync.mjs";
import { getPublishedAutoContentFeed } from "../../lib/auto-content/auto-content-sync.mjs";

export default async function handler(req, res) {
  if (!validateCronAuth(req)) {
    sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  const action = req.query?.action || req.body?.action || "full";

  try {
    if (action === "verify") {
      sendJson(res, 200, await verifySchema());
      return;
    }

    if (action === "connection") {
      const conn = await testDatabaseConnection();
      sendJson(res, conn.ok ? 200 : 503, { ...conn, resolved: resolveDatabaseUrl() });
      return;
    }

    if (action === "migrate") {
      const result = await applyMigrations({ continueOnError: false });
      sendJson(res, result.ok ? 200 : 503, result);
      return;
    }

    // Full bootstrap: connection → migrations → sync → verify
    const started = Date.now();
    const steps = {};

    steps.databaseUrl = resolveDatabaseUrl();
    steps.connection = await testDatabaseConnection().catch((e) => ({ ok: false, error: e.message }));

    steps.schema = await ensureSchemaReady();
    if (!steps.schema.ok) {
      sendJson(res, 503, {
        ok: false,
        step: "schema",
        steps,
        durationMs: Date.now() - started,
      });
      return;
    }

    steps.sync = await runAutoContentSync({ triggerType: "bootstrap" });
    steps.content = await getPublishedAutoContentFeed({ limit: 10 });

    const ok = steps.sync?.ok && (steps.content?.items?.length > 0 || steps.sync?.published > 0);
    sendJson(res, ok ? 200 : 503, {
      ok,
      steps: {
        databaseUrl: steps.databaseUrl,
        connection: { ok: steps.connection?.ok, source: steps.connection?.source },
        schema: { ok: steps.schema?.ok },
        sync: {
          ok: steps.sync?.ok,
          imported: steps.sync?.imported,
          published: steps.sync?.published,
          failed: steps.sync?.failed,
        },
        content: { count: steps.content?.items?.length ?? 0 },
      },
      durationMs: Date.now() - started,
    });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message, resolved: resolveDatabaseUrl() });
  }
}
