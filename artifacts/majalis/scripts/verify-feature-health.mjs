#!/usr/bin/env node
/**
 * Verify production feature-health + auth-context endpoints.
 */
const PRODUCTION = process.env.MAJALIS_PRODUCTION_URL || "https://www.majlisilm.com";

const checks = [];
function record(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
}

for (const path of ["/api/healthz", "/api/public-config", "/api/admin/auth-context"]) {
  try {
    const res = await fetch(`${PRODUCTION}${path}`);
    const json = await res.json().catch(() => ({}));
    if (path === "/api/admin/auth-context") {
      record(path, res.status === 401, `HTTP ${res.status} (auth required)`);
    } else {
      record(path, res.ok && json.ok !== false, `HTTP ${res.status}`);
    }
  } catch (err) {
    record(path, false, err.message);
  }
}

try {
  const res = await fetch(`${PRODUCTION}/api/client-error-log?id=MJL-20260627-211329-4BBJR6`);
  const json = await res.json();
  record("error log lookup", json.ok === true, json.report?.message?.slice(0, 60) || "missing");
} catch (err) {
  record("error log lookup", false, err.message);
}

const failed = checks.filter((c) => !c.ok);
console.log("\nSummary:", failed.length ? `${failed.length} failed` : "all passed");
process.exit(failed.length ? 1 : 0);
