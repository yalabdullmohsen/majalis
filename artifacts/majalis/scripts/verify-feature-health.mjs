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
  const testId = `MJL-TEST-${Date.now()}`;
  const postRes = await fetch(`${PRODUCTION}/api/client-error-log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      errorId: testId,
      message: "feature-health probe",
      route: "/verify-feature-health",
    }),
  });
  const postJson = await postRes.json().catch(() => ({}));
  const posted = postRes.ok && postJson.ok === true;

  const getRes = await fetch(`${PRODUCTION}/api/client-error-log?id=${encodeURIComponent(testId)}`);
  const getJson = await getRes.json().catch(() => ({}));
  const lookedUp = getRes.ok && getJson.ok === true && getJson.report?.errorId === testId;

  record("error log roundtrip", posted && lookedUp, lookedUp ? testId : postJson.message || "lookup failed");
} catch (err) {
  record("error log roundtrip", false, err.message);
}

const failed = checks.filter((c) => !c.ok);
console.log("\nSummary:", failed.length ? `${failed.length} failed` : "all passed");
process.exit(failed.length ? 1 : 0);
