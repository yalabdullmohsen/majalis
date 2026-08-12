/**
 * Unit tests — rollback trigger on mock smoke failures.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shouldTriggerRollback, checkEndpoint, runSmokeChecks } from "../health-check.mjs";
import { buildRollbackPlan, executeRollback, rollbackAllowed } from "../rollback.mjs";

describe("shouldTriggerRollback", () => {
  it("does not rollback when smoke ok", () => {
    const d = shouldTriggerRollback({ ok: true, failed: [] });
    assert.equal(d.rollback, false);
    assert.equal(d.reason, "not_needed");
  });

  it("triggers rollback on 5xx / fetch errors", () => {
    const d = shouldTriggerRollback({
      ok: false,
      failed: [{ path: "/api/healthz", status: 500, detail: "http_500" }],
    });
    assert.equal(d.rollback, true);
    assert.equal(d.reason, "post_deploy_failure");
  });

  it("triggers rollback on json_not_ready", () => {
    const d = shouldTriggerRollback({
      ok: false,
      failed: [{ path: "/api/readyz", status: 200, detail: "json_not_ready" }],
    });
    assert.equal(d.rollback, true);
  });
});

describe("checkEndpoint mocks", () => {
  it("accepts healthy healthz payload", async () => {
    const fetchImpl = async () => ({
      status: 200,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify({ ok: true }),
    });
    const r = await checkEndpoint("https://example.test", "/api/healthz", { fetchImpl });
    assert.equal(r.ok, true);
  });

  it("fails on 503 readyz", async () => {
    const fetchImpl = async () => ({
      status: 503,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify({ status: "not_ready" }),
    });
    const r = await checkEndpoint("https://example.test", "/api/readyz", { fetchImpl });
    assert.equal(r.ok, false);
  });

  it("runSmokeChecks aggregates failures", async () => {
    let n = 0;
    const fetchImpl = async (url) => {
      n += 1;
      if (String(url).includes("healthz")) {
        return {
          status: 500,
          headers: { get: () => "application/json" },
          text: async () => JSON.stringify({ ok: false }),
        };
      }
      return {
        status: 200,
        headers: { get: () => "text/html" },
        text: async () => "<html><script src=/assets/x.js></script></html>",
      };
    };
    const smoke = await runSmokeChecks({
      baseUrl: "https://example.test",
      paths: ["/", "/api/healthz"],
      fetchImpl,
    });
    assert.equal(smoke.ok, false);
    assert.equal(smoke.failed.length, 1);
    assert.ok(n >= 2);
  });
});

describe("rollback plan + limit", () => {
  it("builds a valid plan", () => {
    const plan = buildRollbackPlan({
      stableSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      brokenSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      mergeShas: ["bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
      reason: "post_deploy_failure",
      trainTag: "release(train): test",
    });
    assert.equal(plan.ok, true);
    assert.match(plan.branch, /^rollback\/release-train-/);
    assert.match(plan.title, /rollback\(train\)/);
  });

  it("rejects identical shas", () => {
    const plan = buildRollbackPlan({
      stableSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      brokenSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      reason: "x",
    });
    assert.equal(plan.ok, false);
  });

  it("enforces max 1 rollback attempt", async () => {
    assert.equal(rollbackAllowed({ alreadyRolledBack: 0 }).allow, true);
    assert.equal(rollbackAllowed({ alreadyRolledBack: 1 }).allow, false);

    const plan = buildRollbackPlan({
      stableSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      brokenSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      reason: "mock",
    });
    const calls = [];
    const rb = await executeRollback(plan, {
      attempt: 2,
      maxAttempts: 1,
      run: async (cmd) => {
        calls.push(cmd);
        return { code: 0, stdout: "", stderr: "" };
      },
    });
    assert.equal(rb.executed, false);
    assert.equal(rb.error, "max_rollback_attempts_exceeded");
    assert.equal(calls.length, 0);
  });

  it("executeRollback runs checkout/push/pr/merge on attempt 1", async () => {
    const plan = buildRollbackPlan({
      stableSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      brokenSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      reason: "mock",
    });
    const calls = [];
    const rb = await executeRollback(plan, {
      attempt: 1,
      maxAttempts: 1,
      run: async (cmd) => {
        calls.push(cmd);
        return { code: 0, stdout: "ok", stderr: "" };
      },
    });
    assert.equal(rb.executed, true);
    assert.ok(calls.some((c) => c.includes("git checkout")));
    assert.ok(calls.some((c) => c.includes("git push")));
    assert.ok(calls.some((c) => c.includes("gh pr create")));
    assert.ok(calls.some((c) => c.includes("gh pr merge")));
  });
});
