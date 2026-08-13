import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyChangedPaths,
  classifyOnePath,
  isCheckSatisfied,
} from "../path-classifier.mjs";

describe("path-classifier", () => {
  it("docs-only does not require build/mushaf/postgres", () => {
    const r = classifyChangedPaths([
      "docs/KNOWN_PITFALLS.md",
      "docs/README.md",
      "README.md",
    ]);
    assert.equal(r.lane, "docs-only");
    assert.equal(r.needBuild, false);
    assert.equal(r.needMushaf, false);
    assert.equal(r.needPostgres, false);
    assert.equal(r.needFastLane, true);
    assert.equal(r.needPolicyTests, false);
    assert.equal(r.requiredChecks.build, false);
    assert.equal(r.requiredChecks.mushafGates, false);
    assert.equal(r.requiredChecks.postgres, false);
    assert.equal(r.manualReview, false);
  });

  it("policy-only stays on fast lane with policy tests", () => {
    const r = classifyChangedPaths([
      ".github/scripts/safe-auto-merge/eligibility.mjs",
      "scripts/verify-no-unsafe-auto-merge.mjs",
    ]);
    assert.equal(r.lane, "policy-only");
    assert.equal(r.needBuild, false);
    assert.equal(r.needMushaf, false);
    assert.equal(r.needPostgres, false);
    assert.equal(r.needFastLane, true);
    assert.equal(r.needPolicyTests, true);
  });

  it("content-only does not require mushaf unless Quran/mushaf paths", () => {
    const quiz = classifyChangedPaths([
      "artifacts/majalis/public/data/quiz/العقيدة-011.json",
      "CONTINUATION_PLAN.md",
    ]);
    assert.equal(quiz.lane, "content-only");
    assert.equal(quiz.needBuild, true);
    assert.equal(quiz.needMushaf, false);
    assert.equal(quiz.needPostgres, false);

    const quranData = classifyChangedPaths([
      "artifacts/majalis/public/data/quran/pages.json",
    ]);
    assert.equal(quranData.needMushaf, true);
    assert.ok(quranData.lane === "mushaf" || quranData.needMushaf);
  });

  it("mushaf requires all mushaf gates", () => {
    const r = classifyChangedPaths([
      "artifacts/majalis/src/features/mushaf/MushafPageView.tsx",
      "artifacts/majalis/public/fonts/qpc-v2/p1.woff2",
    ]);
    assert.equal(r.lane, "mushaf");
    assert.equal(r.needBuild, true);
    assert.equal(r.needMushaf, true);
    assert.equal(r.requiredChecks.mushafMeasure, true);
    assert.equal(r.requiredChecks.mushafGates, true);
    assert.equal(r.requiredChecks.layoutBands, true);
    assert.equal(r.requiredChecks.visualSnapshot, true);
  });

  it("supabase/sql remains manual review and not fast-merge", () => {
    const r = classifyChangedPaths([
      "artifacts/majalis/supabase/migrations/20260101_foo.sql",
    ]);
    assert.equal(r.lane, "risky");
    assert.equal(r.manualReview, true);
    assert.equal(r.needPostgres, true);
    assert.equal(r.needFastLane, false);
    assert.equal(classifyOnePath("supabase/schema.sql"), "risky");
  });

  it("ios/capacitor remains manual review", () => {
    const r = classifyChangedPaths([
      "artifacts/majalis/ios/App/App/Info.plist",
      "artifacts/majalis/capacitor.config.ts",
    ]);
    assert.equal(r.lane, "risky");
    assert.equal(r.manualReview, true);
    assert.equal(r.needFastLane, false);
  });

  it(".github/workflows remains manual review", () => {
    const r = classifyChangedPaths([".github/workflows/ci.yml"]);
    assert.equal(r.lane, "risky");
    assert.equal(r.manualReview, true);
    assert.equal(r.needPostgres, true);
    assert.equal(r.needFastLane, false);
  });

  it("frontend requires build; color contrast only with UI/CSS", () => {
    const tsOnly = classifyChangedPaths([
      "artifacts/majalis/src/lib/format-date.ts",
    ]);
    assert.equal(tsOnly.lane, "frontend");
    assert.equal(tsOnly.needBuild, true);
    assert.equal(tsOnly.needMushaf, false);
    assert.equal(tsOnly.needColorContrast, false);
    assert.equal(tsOnly.needPreviewSmoke, false);

    const css = classifyChangedPaths([
      "artifacts/majalis/src/index.css",
      "artifacts/majalis/src/components/NavBar.tsx",
    ]);
    assert.equal(css.needColorContrast, true);
    assert.equal(css.requiredChecks.colorContrast, false);
    assert.equal(css.needVercelCheck, false);
  });

  it("auto-merge / pr-safe-merge-report workflows are policy not risky", () => {
    const r = classifyChangedPaths([
      ".github/workflows/auto-merge-to-main.yml",
      ".github/workflows/pr-safe-merge-report.yml",
    ]);
    assert.equal(r.lane, "policy-only");
    assert.equal(r.manualReview, false);
    assert.equal(r.needFastLane, true);
  });

  it("throughput workflows + majalis vercel.json are policy not risky", () => {
    const r = classifyChangedPaths([
      ".github/workflows/vercel-check.yml",
      ".github/workflows/preview-smoke.yml",
      "artifacts/majalis/vercel.json",
    ]);
    assert.equal(r.manualReview, false);
    assert.equal(r.needPreviewSmoke, false);
    assert.equal(r.needVercelCheck, false);
  });
});
