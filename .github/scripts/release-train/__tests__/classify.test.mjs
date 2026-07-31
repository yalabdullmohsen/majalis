/**
 * Unit tests — risk classification Levels A/B/C.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyPullRequest, levelCExclusionComment } from "../classify.mjs";
import { qualifyPullRequest, sortByDomainPriority } from "../qualify.mjs";
import { selectBatch } from "../select-batch.mjs";
import { DOMAIN_PRIORITY } from "../constants.mjs";

describe("classifyPullRequest", () => {
  it("Level A for JSON/content/test-only changes", () => {
    const r = classifyPullRequest({
      files: ["artifacts/majalis/public/data/qa/seed.json", "docs/note.md"],
      title: "content: update seed",
    });
    assert.equal(r.level, "A");
    assert.equal(r.blocked, false);
  });

  it("Level B for small UI/refactor sets", () => {
    const r = classifyPullRequest({
      files: ["artifacts/majalis/src/views/HomePage.tsx", "artifacts/majalis/src/styles/home.css"],
      title: "ui: tweak home hero spacing",
    });
    assert.equal(r.level, "B");
    assert.equal(r.blocked, false);
  });

  it("Level C for SQL / migrations", () => {
    const r = classifyPullRequest({
      files: ["artifacts/majalis/supabase/migrations/20260731_rls.sql"],
      title: "db: add policy",
    });
    assert.equal(r.level, "C");
    assert.equal(r.blocked, true);
  });

  it("Level C for iOS / Capacitor native", () => {
    const r = classifyPullRequest({
      files: ["artifacts/majalis/ios/App/AppDelegate.swift", "artifacts/majalis/capacitor.config.ts"],
      title: "ios: bump",
    });
    assert.equal(r.level, "C");
    assert.equal(r.blocked, true);
  });

  it("Level C when files > 40", () => {
    const files = Array.from({ length: 41 }, (_, i) => `src/f${i}.ts`);
    const r = classifyPullRequest({ files, title: "chore: bulk" });
    assert.equal(r.level, "C");
    assert.equal(r.blocked, true);
  });

  it("builds exclusion comment", () => {
    const c = levelCExclusionComment(99, ["sql path"]);
    assert.match(c, /#99/);
    assert.match(c, /Level C/);
    assert.match(c, /sql path/);
  });
});

describe("qualify + batch", () => {
  it("requires ready + domain labels and rejects drafts", () => {
    const draft = qualifyPullRequest({
      number: 1,
      state: "OPEN",
      isDraft: true,
      labels: ["release-train-ready", "code-safe"],
      files: ["a.ts"],
    });
    assert.equal(draft.eligible, false);
    assert.equal(draft.reason, "draft");

    const ok = qualifyPullRequest({
      number: 2,
      state: "OPEN",
      isDraft: false,
      mergeable: "MERGEABLE",
      labels: ["release-train-ready", "code-safe"],
      files: ["docs/a.md"],
      title: "docs: typo",
    }, { ciGreen: true });
    assert.equal(ok.eligible, true);
    assert.equal(ok.classification.level, "A");
  });

  it("sorts by domain priority and respects batch caps", () => {
    const sorted = sortByDomainPriority(
      [
        { number: 3, domains: ["content-safe"], fileCount: 10 },
        { number: 1, domains: ["security-safe"], fileCount: 5 },
        { number: 2, domains: ["code-safe"], fileCount: 5 },
      ],
      DOMAIN_PRIORITY,
    );
    assert.deepEqual(sorted.map((p) => p.number), [1, 2, 3]);

    const batch = selectBatch(
      Array.from({ length: 10 }, (_, i) => ({ number: i + 1, fileCount: 12, domains: ["code-safe"] })),
      { maxPrs: 8, maxFiles: 80 },
    );
    assert.ok(batch.selected.length <= 8);
    assert.ok(batch.cumulativeFiles <= 80);
    assert.ok(batch.deferred.length >= 1);
  });
});
