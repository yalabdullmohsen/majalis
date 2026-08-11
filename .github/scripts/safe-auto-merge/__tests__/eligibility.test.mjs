import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateEligibility, summarizeFiles } from "../eligibility.mjs";
import { formatEligibilityReport, upsertReportBody } from "../report.mjs";
import { isIgnorablePreviewStatus, parseGhPrChecksTsv } from "../checks.mjs";
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

const contentFile = {
  path: "artifacts/majalis/public/data/quiz/العقيدة-011.json",
  additions: 2,
  deletions: 1,
};

function base(over = {}) {
  return {
    isDraft: false,
    state: "OPEN",
    baseRefName: "main",
    headRefName: "cursor/fix-typo-38ac",
    mergeable: "MERGEABLE",
    mergeStateStatus: "CLEAN",
    reviewDecision: "",
    title: "content: دفعة اختبار آمنة",
    body: "",
    labels: ["content-safe"],
    files: [contentFile],
    checks: greenChecks,
    ...over,
  };
}

describe("safe-auto-merge eligibility", () => {
  it("allows a small labeled content-safe PR with quiz files and green checks", () => {
    const r = evaluateEligibility(base());
    assert.equal(r.eligible, true);
    assert.equal(r.waiting, false);
    assert.equal(r.prType, "content-safe");
    assert.equal(r.blockers.length, 0);
    assert.equal(r.willDeployProductionAfterMerge, true);
  });

  it("blocks majalis-content-fill automatic audit branch", () => {
    const r = evaluateEligibility(
      base({ headRefName: "majalis-content-fill", title: "content: from fill branch" }),
    );
    assert.equal(r.eligible, false);
    assert.ok(r.blockers.some((b) => /majalis-content-fill|automatic content-audit branch/i.test(b)));
  });

  it("blocks automatic تدقيق محتوى titles", () => {
    const r = evaluateEligibility(
      base({ title: "تدقيق محتوى: ج-٤٩٢ — صيغ المراجع" }),
    );
    assert.equal(r.eligible, false);
    assert.ok(r.blockers.some((b) => /automatic content-audit title/i.test(b)));
  });

  it("blocks content-safe PRs that touch non-content paths", () => {
    const r = evaluateEligibility(
      base({
        files: [{ path: "artifacts/majalis/src/pages/Home.tsx", additions: 2, deletions: 1 }],
      }),
    );
    assert.equal(r.eligible, false);
    assert.ok(r.blockers.some((b) => /content-safe PR may only touch/i.test(b)));
  });

  it("allows unlabeled low-risk PRs after green checks (label optional)", () => {
    const r = evaluateEligibility(
      base({
        labels: [],
        files: [{ path: "docs/REALITY_AUDIT.md", additions: 10, deletions: 0 }],
        title: "توثيق: تحديث جرد الحقيقة",
      }),
    );
    assert.equal(r.eligible, true);
    assert.equal(r.prType, "unlabeled");
    assert.equal(r.blockers.length, 0);
    assert.equal(r.hardBlockers.length, 0);
    assert.ok(r.warnings.some((w) => /no safe label/i.test(w)));
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
      path: `artifacts/majalis/public/data/quiz/a${i}.json`,
      additions: 1,
      deletions: 0,
    }));
    const r = evaluateEligibility(base({ labels: ["docs-safe", "content-safe"], files }));
    assert.ok(r.blockers.some((b) => /too many files/i.test(b)));
  });

  it("blocks large deletions", () => {
    const r = evaluateEligibility(
      base({
        files: [{ path: "artifacts/majalis/data/needs-post-review.jsonl", additions: 0, deletions: 500 }],
      }),
    );
    assert.ok(r.blockers.some((b) => /large deletions/i.test(b)));
  });

  it("blocks danger paths (workflows, ios, supabase, api, lockfile, capacitor)", () => {
    for (const path of [
      ".github/workflows/ci.yml",
      "artifacts/majalis/ios/App/App/AppDelegate.swift",
      "ios/App/AppDelegate.swift",
      "artifacts/majalis/capacitor.config.ts",
      "artifacts/majalis/ios/App/App/capacitor.config.json",
      "artifacts/majalis/supabase/migrations/001.sql",
      "supabase/migrations/001.sql",
      "artifacts/majalis/api/index.js",
      "api/index.js",
      "artifacts/majalis/lib/api-handlers/cron/job-worker.js",
      "artifacts/majalis/lib/security/ssrf.mjs",
      "artifacts/majalis/lib/auth/session.js",
      "artifacts/majalis/lib/jobs/queue.mjs",
      "fastlane/Fastfile",
      "pnpm-lock.yaml",
      "package.json",
      "artifacts/majalis/vercel.json",
    ]) {
      const r = evaluateEligibility(
        base({
          labels: ["safe:auto-merge", "code-safe"],
          files: [{ path, additions: 1, deletions: 0 }],
        }),
      );
      assert.equal(r.eligible, false, path);
      assert.ok(
        r.dangerousFiles.length || r.hasCicd || r.hasIos || r.hasMigration,
        path,
      );
      assert.ok(
        r.suggestedAddLabels.includes("blocked:danger-path"),
        `suggested blocked label for ${path}`,
      );
    }
  });

  it("accepts new safe:* labels on content paths", () => {
    const r = evaluateEligibility(base({ labels: ["safe:content"] }));
    assert.equal(r.eligible, true);
    assert.equal(r.prType, "safe:content");
  });

  it("allows code-safe non-content UI file when not content-labeled", () => {
    const r = evaluateEligibility(
      base({
        labels: ["code-safe"],
        files: [{ path: "artifacts/majalis/src/pages/Home.tsx", additions: 2, deletions: 1 }],
      }),
    );
    assert.equal(r.eligible, true);
  });

  it("blocks risky:manual-review and blocked:danger-path labels", () => {
    assert.ok(
      evaluateEligibility(base({ labels: ["safe:ui", "risky:manual-review"] })).blockers.some((b) =>
        /risky:manual-review/.test(b),
      ),
    );
    assert.ok(
      evaluateEligibility(base({ labels: ["safe:test", "blocked:danger-path"] })).blockers.some((b) =>
        /blocked:danger-path/.test(b),
      ),
    );
  });

  it("blocks failed Color contrast when the check is present", () => {
    const r = evaluateEligibility(
      base({
        checks: [
          ...greenChecks,
          { name: "Color contrast (Playwright)", state: "fail" },
        ],
      }),
    );
    assert.ok(r.blockers.some((b) => /Color contrast/i.test(b)));
  });

  it("blocks release-train-ready from immediate auto-merge", () => {
    const r = evaluateEligibility(
      base({ labels: ["content-safe", "release-train-ready"] }),
    );
    assert.ok(r.blockers.some((b) => /release-train-ready/i.test(b)));
  });

  it("blocks failed preview-smoke for non-content PRs", () => {
    const r = evaluateEligibility(
      base({
        labels: ["code-safe"],
        files: [{ path: "artifacts/majalis/src/pages/Home.tsx", additions: 1, deletions: 0 }],
        checks: greenChecks.map((c) =>
          c.name === "preview-smoke" ? { ...c, state: "fail" } : c,
        ),
      }),
    );
    assert.ok(r.blockers.some((b) => /preview-smoke/i.test(b)));
  });

  it("does not hard-block content-safe when Vercel Preview is Ignored/Canceled", () => {
    const r = evaluateEligibility(
      base({
        strictVercel: true,
        checks: greenChecks.map((c) =>
          c.name === "Vercel – majalis-majalis"
            ? {
                name: c.name,
                state: "canceled",
                description: "Canceled by Ignored Build Step",
              }
            : c,
        ),
      }),
    );
    assert.equal(r.eligible, true, r.blockers.join("; "));
    assert.equal(r.vercelPreviewKind, "ignored");
  });

  it("waits (not hard-fail) when Verify build is pending", () => {
    const r = evaluateEligibility(
      base({
        checks: greenChecks.map((c) =>
          c.name === "Verify build" ? { ...c, state: "pending" } : c,
        ),
      }),
    );
    assert.equal(r.eligible, false);
    assert.equal(r.waiting, true);
    assert.equal(r.needsManualReview, false);
    assert.ok(r.waitBlockers.some((b) => /Verify build/i.test(b)));
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
      const r = evaluateEligibility(
        base({
          labels: [label],
          files:
            label === "content-safe" || label === "safe:content"
              ? [contentFile]
              : [{ path: "docs/note.md", additions: 1, deletions: 0 }],
        }),
      );
      assert.equal(r.prType, label);
    }
  });
});

describe("checks + report", () => {
  it("parses gh pr checks TSV including Ignored description", () => {
    const rows = parseGhPrChecksTsv(
      "Verify build\tpass\t1m\thttps://x\t\nVercel – majalis-majalis\tcanceled\t0\thttps://y\tCanceled by Ignored Build Step\n",
    );
    assert.equal(rows.length, 2);
    assert.equal(rows[1].name, "Vercel – majalis-majalis");
    assert.equal(rows[1].state, "canceled");
    assert.ok(isIgnorablePreviewStatus(rows[1]));
  });

  it("formats report with Vercel ignore + production deploy lines", () => {
    const result = evaluateEligibility(
      base({
        checks: greenChecks.map((c) =>
          c.name === "Vercel – majalis-majalis"
            ? {
                name: c.name,
                state: "canceled",
                description: "Canceled by Ignored Build Step",
              }
            : c,
        ),
      }),
    );
    const md = formatEligibilityReport(result, { prNumber: 1, headSha: "abc" });
    assert.ok(md.includes(REPORT_MARKER_BEGIN));
    assert.ok(md.includes("مؤهل") || md.includes("بانتظار") || md.includes("غير مؤهل"));
    assert.ok(md.includes("تجاهُل") || md.includes("Ignored") || md.includes("Production"));
    assert.ok(md.includes("majalis-majalis") || md.includes("Production"));
    const next = upsertReportBody(
      `hello\n${md}\n`,
      formatEligibilityReport(evaluateEligibility(base({ labels: [] })), {
        prNumber: 1,
        headSha: "def",
      }),
    );
    assert.ok(next.includes("no safe label") || next.includes("مؤهل"));
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
