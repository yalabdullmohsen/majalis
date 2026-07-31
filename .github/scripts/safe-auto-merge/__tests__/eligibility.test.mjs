import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateEligibility, summarizeFiles } from "../eligibility.mjs";
import { formatEligibilityReport, upsertReportBody } from "../report.mjs";
import { parseGhPrChecksTsv } from "../checks.mjs";
import {
  MAX_FILES_FOR_AUTO_MERGE,
  REPORT_MARKER_BEGIN,
  SAFE_LABELS,
} from "../constants.mjs";

const greenChecks = [
  { name: "Verify build", state: "pass" },
  { name: "preview-smoke", state: "pass" },
  { name: "lint-typecheck-build", state: "pass" },
  { name: "Vercel – majalis-majalis", state: "SUCCESS" },
  { name: "postgres-integration", state: "pass" },
];

function base(over = {}) {
  return {
    isDraft: false,
    state: "OPEN",
    baseRefName: "main",
    headRefName: "cursor/fix-typo-38ac",
    mergeable: "MERGEABLE",
    mergeStateStatus: "CLEAN",
    reviewDecision: "",
    title: "fix: typo",
    body: "",
    labels: ["content-safe"],
    files: [{ path: "artifacts/majalis/src/pages/Home.tsx", additions: 2, deletions: 1 }],
    checks: greenChecks,
    ...over,
  };
}

describe("safe-auto-merge eligibility", () => {
  it("allows a small labeled content PR with green checks", () => {
    const r = evaluateEligibility(base());
    assert.equal(r.eligible, true);
    assert.equal(r.prType, "content-safe");
    assert.equal(r.blockers.length, 0);
  });

  it("requires a safe label", () => {
    const r = evaluateEligibility(base({ labels: [] }));
    assert.equal(r.eligible, false);
    assert.ok(r.blockers.some((b) => /missing safe label/i.test(b)));
  });

  it("blocks Draft", () => {
    const r = evaluateEligibility(base({ isDraft: true }));
    assert.ok(r.blockers.some((b) => /Draft/i.test(b)));
  });

  it("blocks CHANGES_REQUESTED", () => {
    const r = evaluateEligibility(base({ reviewDecision: "CHANGES_REQUESTED" }));
    assert.ok(r.blockers.some((b) => /CHANGES_REQUESTED/.test(b)));
  });

  it("blocks conflicts and behind", () => {
    assert.ok(
      evaluateEligibility(base({ mergeStateStatus: "CONFLICTING" })).blockers.some((b) =>
        /conflict/i.test(b),
      ),
    );
    assert.ok(
      evaluateEligibility(base({ mergeStateStatus: "BEHIND" })).blockers.some((b) =>
        /behind/i.test(b),
      ),
    );
  });

  it("blocks >40 files", () => {
    const files = Array.from({ length: MAX_FILES_FOR_AUTO_MERGE + 1 }, (_, i) => ({
      path: `docs/a${i}.md`,
      additions: 1,
      deletions: 0,
    }));
    const r = evaluateEligibility(base({ labels: ["docs-safe", "content-safe"], files }));
    assert.ok(r.blockers.some((b) => /too many files/i.test(b)));
  });

  it("blocks large deletions", () => {
    const r = evaluateEligibility(
      base({
        files: [{ path: "docs/big.md", additions: 0, deletions: 500 }],
      }),
    );
    assert.ok(r.blockers.some((b) => /large deletions/i.test(b)));
  });

  it("blocks danger paths (workflows, ios, supabase, lockfile)", () => {
    for (const path of [
      ".github/workflows/ci.yml",
      "artifacts/majalis/ios/App/App/AppDelegate.swift",
      "artifacts/majalis/supabase/migrations/001.sql",
      "fastlane/Fastfile",
      "pnpm-lock.yaml",
      "package.json",
      "artifacts/majalis/vercel.json",
    ]) {
      const r = evaluateEligibility(
        base({ labels: ["code-safe"], files: [{ path, additions: 1, deletions: 0 }] }),
      );
      assert.equal(r.eligible, false, path);
      assert.ok(r.dangerousFiles.length || r.hasCicd || r.hasIos || r.hasMigration, path);
    }
  });

  it("blocks release-train-ready from immediate auto-merge", () => {
    const r = evaluateEligibility(
      base({ labels: ["content-safe", "release-train-ready"] }),
    );
    assert.ok(r.blockers.some((b) => /release-train-ready/i.test(b)));
  });

  it("blocks failed preview-smoke", () => {
    const r = evaluateEligibility(
      base({
        checks: greenChecks.map((c) =>
          c.name === "preview-smoke" ? { ...c, state: "fail" } : c,
        ),
      }),
    );
    assert.ok(r.blockers.some((b) => /preview-smoke/i.test(b)));
  });

  it("blocks auth/security path cues", () => {
    const r = evaluateEligibility(
      base({
        labels: ["code-safe"],
        files: [{ path: "artifacts/majalis/src/auth/session.ts", additions: 3, deletions: 1 }],
      }),
    );
    assert.ok(r.blockers.some((b) => /auth\/security/i.test(b)));
  });

  it("supports all SAFE_LABELS as prType", () => {
    for (const label of SAFE_LABELS) {
      const r = evaluateEligibility(base({ labels: [label] }));
      assert.equal(r.prType, label);
    }
  });
});

describe("checks + report", () => {
  it("parses gh pr checks TSV", () => {
    const rows = parseGhPrChecksTsv(
      "Verify build\tpass\t1m\thttps://x\t\npreview-smoke\tpending\t\thttps://y\t",
    );
    assert.equal(rows.length, 2);
    assert.equal(rows[0].name, "Verify build");
    assert.equal(rows[1].state, "pending");
  });

  it("formats and upserts report markers", () => {
    const result = evaluateEligibility(base());
    const md = formatEligibilityReport(result, { prNumber: 1, headSha: "abc" });
    assert.ok(md.includes(REPORT_MARKER_BEGIN));
    assert.ok(md.includes("مؤهل") || md.includes("غير مؤهل"));
    const next = upsertReportBody(`hello\n${md}\n`, formatEligibilityReport(
      evaluateEligibility(base({ labels: [] })),
      { prNumber: 1, headSha: "def" },
    ));
    assert.ok(next.includes("missing safe label") || next.includes("غير مؤهل"));
    assert.equal(next.indexOf(REPORT_MARKER_BEGIN), next.lastIndexOf(REPORT_MARKER_BEGIN));
  });

  it("summarizeFiles counts deletions", () => {
    const s = summarizeFiles([
      { path: "a.md", additions: 1, deletions: 2 },
      { path: "b.md", additions: 0, deletions: 5, changeType: "DELETED" },
    ]);
    assert.equal(s.totalDeletions, 7);
    assert.equal(s.deletedFiles, 1);
  });
});
