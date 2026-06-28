import { sendJson } from "../../api/_http.mjs";
import { validateCronAuth } from "../../../lib/env-config.mjs";
import { applyMigrations, verifySchema } from "../../../lib/db-migrate.mjs";
import { testDatabaseConnection, resolveDatabaseUrl } from "../../../lib/database.mjs";
import { ensureContentImportSchema } from "../../../lib/content-import/ensure-schema.mjs";
import { runActivationMigrations, runActivationTableMigrations } from "../../../lib/migration-runner.mjs";
import { ACTIVATION_TABLES, countTableRows } from "../../../lib/table-probe.mjs";
import { seedRulingsFromFilesystem } from "../../../lib/rulings-db-seed.mjs";
import { assertServiceSecrets } from "../../../lib/service-guard.mjs";
import { requireDatabaseUrl } from "../../../lib/secret-errors.mjs";

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

  const dbGuard = requireDatabaseUrl("apply-migrations cron");
  if (dbGuard && action !== "verify") {
    sendJson(res, 503, dbGuard);
    return;
  }

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
    const scope = req.query?.scope || req.body?.scope || "full";

    if (scope === "seed-rulings") {
      const count = await countTableRows("sharia_rulings");
      const seed =
        count !== null && count > 0
          ? { ok: true, skipped: true, reason: "already_seeded", count }
          : await seedRulingsFromFilesystem({ dryRun: req.query?.dryRun === "1" });
      sendJson(res, seed.ok ? 200 : 500, { ok: seed.ok, scope: "seed-rulings", seed, countBefore: count });
      return;
    }

    if (scope === "activation-tables") {
      const seedRulings = req.query?.seed !== "0" && req.body?.seed !== false;
      const activation = await runActivationTableMigrations({ seedRulings });
      sendJson(res, activation.ok ? 200 : 500, {
        ok: activation.ok,
        scope: "activation-tables",
        activation,
        resolved: resolvedMeta(),
      });
      return;
    }

    if (scope === "ake-rpc") {
      const { ensureAkeRpcFunctions, getAkeRpcHealth } = await import("../../../lib/auto-knowledge-engine/rpc-probe.mjs");
      const repair = await ensureAkeRpcFunctions({ force: req.query?.force === "1" });
      sendJson(res, repair.ok ? 200 : 500, {
        ok: repair.ok,
        scope: "ake-rpc",
        repair,
        resolved: resolvedMeta(),
      });
      return;
    }

    if (scope === "ake-rpc-verify") {
      const { getAkeRpcHealth } = await import("../../../lib/auto-knowledge-engine/rpc-probe.mjs");
      const health = await getAkeRpcHealth();
      sendJson(res, health.ok ? 200 : 503, { ok: health.ok, scope: "ake-rpc-verify", health });
      return;
    }

    if (scope === "fiqh-council" || scope === "ake-fiqh") {
      const result = await applyMigrations({
        files: ["fiqh_council_items_ake_prereq.sql"],
        continueOnError: false,
        trackApplied: true,
      });
      sendJson(res, result.ok ? 200 : 500, {
        ok: result.ok,
        scope: "fiqh-council",
        migrations: result,
        resolved: resolvedMeta(),
      });
      return;
    }

    if (scope === "ake-realtime" || scope === "ake-v15") {
      const result = await applyMigrations({
        files: ["auto_knowledge_engine_v15_realtime.sql"],
        continueOnError: false,
        trackApplied: true,
      });
      sendJson(res, result.ok ? 200 : 500, {
        ok: result.ok,
        scope: "ake-realtime",
        migrations: result,
        resolved: resolvedMeta(),
      });
      return;
    }

    if (scope === "cd-pipeline" || scope === "cd-v1") {
      const result = await applyMigrations({
        files: ["cd_pipeline_v1.sql"],
        continueOnError: false,
        trackApplied: true,
      });
      sendJson(res, result.ok ? 200 : 500, {
        ok: result.ok,
        scope: "cd-pipeline",
        migrations: result,
        resolved: resolvedMeta(),
      });
      return;
    }

    if (scope === "ake-sync" || scope === "ake-v14") {
      const result = await applyMigrations({
        files: ["auto_knowledge_engine_v14_sync.sql"],
        continueOnError: false,
        trackApplied: true,
      });
      sendJson(res, result.ok ? 200 : 500, {
        ok: result.ok,
        scope: "ake-sync",
        migrations: result,
        resolved: resolvedMeta(),
      });
      return;
    }

    if (scope === "activation") {
      assertServiceSecrets("migrations");
      const seedRulings = req.query?.seed !== "0" && req.body?.seed !== false;
      const activation = await runActivationMigrations({ seedRulings });
      sendJson(res, activation.ok ? 200 : 500, {
        ok: activation.ok,
        scope: "activation",
        activation,
        resolved: resolvedMeta(),
      });
      return;
    }

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

    const result = await applyMigrations({ continueOnError: false, trackApplied: true });
    const verifyAfter = await verifySchema();
    let activation = null;
    const activationMissing = ACTIVATION_TABLES.filter((t) => verifyAfter.checks?.[t] !== "ok");
    if (activationMissing.length > 0 || req.query?.activation === "1" || req.body?.activation === true) {
      activation = await runActivationMigrations({ seedRulings: req.query?.seed !== "0" });
    }
    const ok = result.ok && verifyAfter.ok && (!activation || activation.ok);
    sendJson(res, ok ? 200 : 500, {
      ok,
      migrations: result,
      schema: verifyAfter,
      activation,
      resolved: resolvedMeta(),
    });
  } catch (error) {
    const msg = String(error.message || error);
    if (msg.includes("DATABASE") || msg.includes("missing:")) {
      sendJson(res, 503, { ok: false, code: "Missing DATABASE_URL", error: msg, hint: "Set DATABASE_URL to Supabase Transaction Pooler URL on Vercel (port 6543)" });
      return;
    }
    sendJson(res, 500, {
      ok: false,
      error: msg,
      resolved: resolvedMeta(),
      hint: "Set DATABASE_URL to Supabase Transaction Pooler URL on Vercel (port 6543)",
    });
  }
}
