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

  it("content-only builds without visual/color gates", () => {
    const quiz = classifyChangedPaths([
      "artifacts/majalis/public/data/quiz/العقيدة-011.json",
      "CONTINUATION_PLAN.md",
    ]);
    assert.equal(quiz.lane, "content-only");
    assert.equal(quiz.needBuild, true);
    assert.equal(quiz.needMushaf, false);
    assert.equal(quiz.needPostgres, false);
    assert.equal(quiz.needVisual, false);
    assert.equal(quiz.needColorContrast, false);
    assert.equal(quiz.requiredChecks.visualSnapshot, false);
    assert.equal(quiz.outputs.need_visual, "false");
  });

  it("harvest scripts/data are content-only (no visual)", () => {
    const r = classifyChangedPaths([
      "artifacts/majalis/scripts/harvest/adapters/instagram-provider.mjs",
      "artifacts/majalis/public/data/lessons/feed.json",
    ]);
    assert.equal(r.lane, "content-only");
    assert.equal(r.needBuild, true);
    assert.equal(r.needVisual, false);
    assert.equal(r.requiredChecks.visualSnapshot, false);
  });

  it("quran/mushaf paths enable mushaf UI gates", () => {
    const quranData = classifyChangedPaths([
      "artifacts/majalis/public/data/quran/pages.json",
    ]);
    assert.equal(quranData.needMushaf, true);
    assert.equal(quranData.outputs.need_mushaf, "true");
  });

  it("mushaf UI paths enable mushaf gates", () => {
    const r = classifyChangedPaths([
      "artifacts/majalis/src/features/mushaf-madinah/MushafPage.tsx",
      "artifacts/majalis/public/fonts/qpc-v2/p1.woff2",
    ]);
    assert.equal(r.needMushaf, true);
    assert.equal(r.needBuild, true);
    assert.equal(r.requiredChecks.mushafMeasure, true);
    assert.equal(r.requiredChecks.mushafGates, true);
    assert.equal(r.requiredChecks.layoutBands, true);
    assert.equal(r.requiredChecks.visualSnapshot, true);
    assert.equal(r.outputs.need_mushaf, "true");
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

  it("frontend requires build and color contrast on every UI lane", () => {
    const tsOnly = classifyChangedPaths([
      "artifacts/majalis/src/lib/format-date.ts",
    ]);
    assert.equal(tsOnly.lane, "frontend");
    assert.equal(tsOnly.needBuild, true);
    assert.equal(tsOnly.needMushaf, false);
    assert.equal(tsOnly.needColorContrast, true);
    assert.equal(tsOnly.requiredChecks.colorContrast, true);
    assert.equal(tsOnly.requiredChecks.visualSnapshot, true);
    assert.equal(tsOnly.needPreviewSmoke, false);

    const css = classifyChangedPaths([
      "artifacts/majalis/src/index.css",
      "artifacts/majalis/src/components/NavBar.tsx",
    ]);
    assert.equal(css.needColorContrast, true);
    assert.equal(css.requiredChecks.colorContrast, true);
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
      ".github/workflows/harvest-sources.yml",
      ".github/workflows/auto-deploy.yml",
      "artifacts/majalis/vercel.json",
    ]);
    assert.equal(r.manualReview, false);
    assert.equal(r.needPreviewSmoke, false);
    assert.equal(r.needVercelCheck, false);
  });
});
