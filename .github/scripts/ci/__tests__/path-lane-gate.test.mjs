import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluatePathLaneGate,
  evaluateAggregatorRow,
} from "../path-lane-gate.mjs";
import { classifyChangedPaths, isCheckSatisfied } from "../../safe-auto-merge/path-classifier.mjs";

describe("path-lane gate semantics", () => {
  it("optional job: need=false → neutral success (no Path-lane failure)", () => {
    const r = evaluatePathLaneGate({ need: "false", build: "failure" });
    assert.equal(r.ok, true);
    assert.equal(r.run, false);
    assert.equal(r.reason, "not_required");
  });

  it("required job: need=true + build success → run", () => {
    const r = evaluatePathLaneGate({ need: "true", build: "success" });
    assert.equal(r.ok, true);
    assert.equal(r.run, true);
  });

  it("required job: need=true + build failure → explicit missing artifact", () => {
    const r = evaluatePathLaneGate({ need: "true", build: "failure" });
    assert.equal(r.ok, false);
    assert.equal(r.reason, "missing_producer_artifact");
    assert.match(r.message, /majalis-dist/);
  });

  it("missing/invalid NEED is not a silent skip", () => {
    assert.equal(evaluatePathLaneGate({ need: "", build: "success" }).reason, "missing_need_output");
    assert.equal(evaluatePathLaneGate({ need: "yes-please", build: "success" }).reason, "invalid_need_output");
  });
});

describe("path-lane matrix (classify + aggregator)", () => {
  it("Case 1 docs-only: UI/mushaf not required; skipped OK", () => {
    const c = classifyChangedPaths(["docs/README.md", "AGENTS.md"]);
    assert.equal(c.outputs.need_build, "false");
    assert.equal(c.outputs.need_visual, "false");
    assert.equal(c.outputs.need_color_contrast, "false");
    assert.equal(c.outputs.need_mushaf, "false");
    assert.equal(isCheckSatisfied("visualSnapshot", "skip", c), true);
    assert.equal(evaluateAggregatorRow({ name: "visual-snapshot", required: c.outputs.need_visual, result: "skipped" }).ok, true);
    assert.equal(evaluateAggregatorRow({ name: "build", required: c.outputs.need_build, result: "skipped" }).ok, true);
  });

  it("Case 2 web source: build + color/visual required", () => {
    const c = classifyChangedPaths(["artifacts/majalis/src/lib/format-date.ts"]);
    assert.equal(c.outputs.need_build, "true");
    assert.equal(c.outputs.need_color_contrast, "true");
    assert.equal(c.outputs.need_visual, "true");
    assert.equal(evaluatePathLaneGate({ need: c.outputs.need_visual, build: "success" }).run, true);
  });

  it("Case 3 visual/UI change: visual gates required and Path-lane allows run when build ok", () => {
    const c = classifyChangedPaths(["artifacts/majalis/src/index.css"]);
    assert.equal(c.outputs.need_visual, "true");
    assert.equal(c.outputs.need_color_contrast, "true");
    const gate = evaluatePathLaneGate({ need: "true", build: "success" });
    assert.equal(gate.run, true);
  });

  it("Case 4 mushaf change: mushaf + visual required", () => {
    const c = classifyChangedPaths([
      "artifacts/majalis/src/features/mushaf-reader/mushaf-reader.css",
    ]);
    assert.equal(c.outputs.need_mushaf, "true");
    assert.equal(c.outputs.need_build, "true");
    assert.equal(c.outputs.need_visual, "true");
    assert.equal(c.outputs.need_postgres, "false");
  });

  it("Case 5 mixed change: unions required lanes", () => {
    const c = classifyChangedPaths([
      "docs/README.md",
      "artifacts/majalis/src/features/mushaf-reader/NewMushafReader.tsx",
      "artifacts/majalis/supabase/migrations/20260101_foo.sql",
    ]);
    assert.equal(c.outputs.need_mushaf, "true");
    assert.equal(c.outputs.need_postgres, "true");
    assert.equal(c.outputs.need_build, "true");
    assert.equal(c.manualReview, true);
  });

  it("Case 6 required job failure → aggregator fails with reason", () => {
    const row = evaluateAggregatorRow({ name: "build", required: "true", result: "failure" });
    assert.equal(row.ok, false);
    assert.equal(row.reason, "required_not_success");
  });

  it("Case 7 optional job skipped → aggregator accepts", () => {
    const row = evaluateAggregatorRow({ name: "visual-snapshot", required: "false", result: "skipped" });
    assert.equal(row.ok, true);
    assert.equal(row.reason, "optional_skip_or_neutral");
  });
});
