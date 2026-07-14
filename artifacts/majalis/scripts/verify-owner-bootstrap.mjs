#!/usr/bin/env node
/**
 * Verify owner bootstrap configuration and production endpoint availability.
 */

import { isBootstrapOwnerEmail, hasUnrestrictedAdminAccess } from "../lib/owner-config.mjs";
import { hasPermission, canImportContent } from "../lib/admin-auth.mjs";

const TARGET_EMAIL = (process.env.MAJALIS_OWNER_EMAILS || "").split(",")[0].trim().toLowerCase();
const PRODUCTION = "https://majlisilm.com";

const checks = [];

function record(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

record("bootstrap email listed", isBootstrapOwnerEmail(TARGET_EMAIL));
record(
  "unrestricted admin access (email only)",
  hasUnrestrictedAdminAccess({ email: TARGET_EMAIL, governanceRole: "read_only" }),
);
record(
  "import permission via owner context",
  canImportContent({ email: TARGET_EMAIL, unrestricted: true, isOwner: true }),
);
record(
  "content.edit via owner context",
  hasPermission({ email: TARGET_EMAIL, unrestricted: true }, "content.edit"),
);

try {
  const health = await fetch(`${PRODUCTION}/api/healthz`);
  record("production /api/healthz", health.ok, `HTTP ${health.status}`);
} catch (err) {
  record("production /api/healthz", false, err.message);
}

try {
  const ownerCron = await fetch(`${PRODUCTION}/api/cron/bootstrap-owner?action=list`);
  const body = await ownerCron.json();
  record(
    "production bootstrap-owner route deployed",
    ownerCron.status === 401 && body.error === "unauthorized",
    `HTTP ${ownerCron.status}`,
  );
} catch (err) {
  record("production bootstrap-owner route deployed", false, err.message);
}

const failed = checks.filter((c) => !c.ok);
console.log("\nSummary:", failed.length ? `${failed.length} failed` : "all checks passed");
process.exit(failed.length ? 1 : 0);
