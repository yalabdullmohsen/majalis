/**
 * Readiness reason codes — allowlisted public diagnostics (no secrets).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyDurablePgError,
  DURABLE_REASONS,
  publicReadyReason,
} from "../reliability/env.mjs";

describe("readyz public reasons", () => {
  it("maps missing relation → queue_schema_missing", () => {
    assert.equal(
      classifyDurablePgError({ code: "42P01", message: 'relation "background_jobs" does not exist' }),
      DURABLE_REASONS.queue_schema_missing,
    );
  });

  it("maps missing column → missing_columns", () => {
    assert.equal(
      classifyDurablePgError({ code: "42703", message: 'column "idempotency_key" does not exist' }),
      DURABLE_REASONS.missing_columns,
    );
  });

  it("maps auth/SSL failures → env_mismatch", () => {
    assert.equal(
      classifyDurablePgError({ message: "password authentication failed for user" }),
      DURABLE_REASONS.env_mismatch,
    );
  });

  it("publicReadyReason only allows known codes", () => {
    assert.equal(publicReadyReason("database_not_configured"), "database_not_configured");
    assert.equal(publicReadyReason("queue_column_missing"), "missing_columns");
    assert.equal(publicReadyReason("SELECT * FROM secrets"), "queue_query_failed");
  });

  it("readyz handler source exposes reason on not_ready and never fakes 200", async () => {
    const { readFileSync } = await import("node:fs");
    const { join, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const root = join(dirname(fileURLToPath(import.meta.url)), "..");
    const src = readFileSync(join(root, "api-handlers/readyz.js"), "utf8");
    assert.match(src, /payload\.reason\s*=\s*publicReadyReason/);
    assert.match(src, /ready \? 200 : 503/);
    assert.doesNotMatch(src, /sendJson\(\s*res,\s*200,\s*\{[^}]*not_ready/);
  });
});
