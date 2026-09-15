import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregateRequiredJobs,
  parseRequired,
} from "../aggregate-required.mjs";

describe("aggregate-required", () => {
  it("required failure fails aggregator", () => {
    const r = aggregateRequiredJobs([
      { name: "build", required: true, result: "failure" },
      { name: "fast-lane", required: false, result: "skipped" },
    ]);
    assert.equal(r.ok, false);
    assert.ok(r.blockers.some((b) => b.startsWith("build=")));
  });

  it("optional skipped does not fail", () => {
    const r = aggregateRequiredJobs([
      { name: "build", required: "true", result: "success" },
      { name: "visual-snapshot", required: "false", result: "skipped" },
      { name: "lhci-home", required: false, result: "skipped" },
    ]);
    assert.equal(r.ok, true);
    assert.deepEqual(r.blockers, []);
  });

  it("required skipped fails", () => {
    const r = aggregateRequiredJobs([
      { name: "visual-snapshot", required: true, result: "skipped" },
    ]);
    assert.equal(r.ok, false);
  });

  it("missing required flag fails explicitly", () => {
    const r = aggregateRequiredJobs([{ name: "build", result: "success" }]);
    assert.equal(r.ok, false);
    assert.match(r.error || "", /missing or invalid required/);
  });

  it("optional failure still fails (no silent green)", () => {
    const r = aggregateRequiredJobs([
      { name: "color-contrast", required: false, result: "failure" },
    ]);
    assert.equal(r.ok, false);
  });

  it("parseRequired accepts only explicit booleans", () => {
    assert.equal(parseRequired("true"), true);
    assert.equal(parseRequired("false"), false);
    assert.equal(parseRequired(""), null);
    assert.equal(parseRequired(undefined), null);
  });
});
