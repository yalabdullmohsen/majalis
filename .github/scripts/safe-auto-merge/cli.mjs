#!/usr/bin/env node
/**
 * CLI for safe auto-merge:
 *   node cli.mjs evaluate --pr N [--json] [--strict-vercel] [--no-checks]
 *   node cli.mjs report --pr N [--post] [--strict-vercel]
 *   node cli.mjs ensure-labels
 *
 * Exit codes for evaluate: 0 = eligible, 2 = hard block, 3 = waiting on checks, 1 = error
 */
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluateEligibility } from "./eligibility.mjs";
import { parseGhPrChecksTsv, parseStatusCheckRollup } from "./checks.mjs";
import { formatEligibilityReport, upsertReportBody } from "./report.mjs";
import {
  BLOCKED_DANGER_PATH_LABEL,
  RELEASE_TRAIN_LABEL,
  REPORT_MARKER_BEGIN,
  RISKY_MANUAL_REVIEW_LABEL,
  SAFE_AUTO_MERGE_LABEL,
  SAFE_DOMAIN_LABELS,
  SAFE_LABELS,
  CLASSIFICATION_LABELS,
  NO_DEPLOY_LABELS,
  AUTOMATIC_CONTENT_AUDIT_BRANCH_RE,
  AUTOMATIC_CONTENT_AUDIT_TITLE_RE,
} from "./constants.mjs";

function usage() {
  console.error(`Usage:
  node cli.mjs evaluate --pr <n> [--json] [--strict-vercel] [--no-checks]
  node cli.mjs report --pr <n> [--post] [--strict-vercel] [--no-checks]
  node cli.mjs ensure-labels`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pr") args.pr = argv[++i];
    else if (a === "--json") args.json = true;
    else if (a === "--post") args.post = true;
    else if (a === "--strict-vercel") args.strictVercel = true;
    else if (a === "--no-checks") args.noChecks = true;
    else if (a.startsWith("-")) throw new Error(`Unknown flag: ${a}`);
    else args._.push(a);
  }
  return args;
}

function gh(args, opts = {}) {
  const r = spawnSync("gh", args, {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    env: process.env,
    ...opts,
  });
  if (r.error) throw r.error;
  return r;
}

function loadPr(pr) {
  const view = gh([
    "pr",
    "view",
    String(pr),
    "--json",
    "number,state,isDraft,baseRefName,headRefName,mergeable,mergeStateStatus,reviewDecision,title,body,labels,files,headRefOid,statusCheckRollup,url",
  ]);
  if (view.status !== 0) {
    throw new Error(view.stderr || `gh pr view failed (${view.status})`);
  }
  const prJson = JSON.parse(view.stdout);

  const checksProc = gh(["pr", "checks", String(pr)], { stdio: ["ignore", "pipe", "pipe"] });
  const tsvRows = parseGhPrChecksTsv(checksProc.stdout || "");
  const rollupRows = parseStatusCheckRollup(prJson.statusCheckRollup || []);

  // Prefer TSV rows; supplement missing names from rollup (Vercel contexts)
  const byName = new Map();
  for (const r of tsvRows) byName.set(r.name, r);
  for (const r of rollupRows) {
    if (!byName.has(r.name)) byName.set(r.name, r);
  }

  return {
    prJson,
    checks: [...byName.values()],
  };
}

function toEvalInput(prJson, checks, flags) {
  return {
    isDraft: prJson.isDraft,
    state: prJson.state,
    baseRefName: prJson.baseRefName,
    headRefName: prJson.headRefName,
    mergeable: prJson.mergeable,
    mergeStateStatus: prJson.mergeStateStatus,
    reviewDecision: prJson.reviewDecision,
    title: prJson.title,
    body: prJson.body,
    labels: (prJson.labels || []).map((l) => l.name || l),
    files: prJson.files || [],
    checks,
    requireChecks: !flags.noChecks,
    strictVercel: Boolean(flags.strictVercel),
  };
}

function cmdEvaluate(args) {
  if (!args.pr) throw new Error("--pr required");
  const { prJson, checks } = loadPr(args.pr);
  const result = evaluateEligibility(toEvalInput(prJson, checks, args));
  const out = {
    pr: prJson.number,
    headSha: prJson.headRefOid,
    url: prJson.url,
    ...result,
  };
  if (args.json) {
    console.log(JSON.stringify(out, null, 2));
  } else if (result.eligible) {
    console.log(`ELIGIBLE #${prJson.number}`);
  } else if (result.waiting) {
    console.log(`WAITING #${prJson.number}`);
    for (const b of result.waitBlockers || result.blockers) console.log(`  - ${b}`);
  } else {
    console.log(`NOT_ELIGIBLE #${prJson.number}`);
    for (const b of result.hardBlockers || result.blockers) console.log(`  - ${b}`);
  }
  if (result.eligible) process.exitCode = 0;
  else if (result.waiting) process.exitCode = 3;
  else process.exitCode = 2;
}

function findExistingReportComment(pr) {
  const r = gh([
    "api",
    `repos/${process.env.GITHUB_REPOSITORY}/issues/${pr}/comments`,
    "--paginate",
    "--jq",
    `.[] | select(.body | contains("${REPORT_MARKER_BEGIN}")) | {id, body}`,
  ]);
  if (r.status !== 0) return null;
  const lines = (r.stdout || "").trim().split("\n").filter(Boolean);
  if (!lines.length) return null;
  try {
    return JSON.parse(lines[lines.length - 1]);
  } catch {
    return null;
  }
}

function cmdReport(args) {
  if (!args.pr) throw new Error("--pr required");
  const { prJson, checks } = loadPr(args.pr);

  const head = String(prJson.headRefName || "");
  const title = String(prJson.title || "");
  if (
    AUTOMATIC_CONTENT_AUDIT_BRANCH_RE.test(head) ||
    AUTOMATIC_CONTENT_AUDIT_TITLE_RE.test(title)
  ) {
    console.log(
      "skip report/post: automatic content-audit PR (التدقيق التلقائي معطّل)",
    );
    process.exitCode = 0;
    return;
  }

  // Report should show check status without requiring all green for the document itself
  const result = evaluateEligibility(
    toEvalInput(prJson, checks, { ...args, noChecks: args.noChecks }),
  );
  const body = formatEligibilityReport(result, {
    prNumber: prJson.number,
    headSha: prJson.headRefOid,
  });

  if (!args.post) {
    console.log(body);
    process.exitCode = 0;
    return;
  }

  if (!process.env.GITHUB_REPOSITORY) {
    throw new Error("GITHUB_REPOSITORY required to --post");
  }

  const dir = mkdtempSync(join(tmpdir(), "safe-merge-"));
  try {
    const existing = findExistingReportComment(args.pr);
    if (existing?.id) {
      const next = upsertReportBody(existing.body, body);
      const payloadPath = join(dir, "patch.json");
      writeFileSync(payloadPath, JSON.stringify({ body: next }));
      const patch = gh([
        "api",
        "--method",
        "PATCH",
        `repos/${process.env.GITHUB_REPOSITORY}/issues/comments/${existing.id}`,
        "--input",
        payloadPath,
      ]);
      if (patch.status !== 0) throw new Error(patch.stderr || "comment patch failed");
      console.log(`updated comment ${existing.id}`);
    } else {
      const bodyPath = join(dir, "body.md");
      writeFileSync(bodyPath, body);
      const create = gh([
        "pr",
        "comment",
        String(args.pr),
        "--body-file",
        bodyPath,
      ]);
      if (create.status !== 0) throw new Error(create.stderr || "comment create failed");
      console.log("posted new report comment");
    }

    // Sync policy labels — never close the PR.
    syncPrPolicyLabels(args.pr, result);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  process.exitCode = 0;
}

/**
 * Apply / remove policy labels based on eligibility (no PR close).
 * @param {string|number} pr
 * @param {ReturnType<typeof evaluateEligibility>} result
 */
function syncPrPolicyLabels(pr, result) {
  for (const name of result.suggestedAddLabels || []) {
    const r = gh(["pr", "edit", String(pr), "--add-label", name], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (r.status !== 0) {
      console.warn(`add-label ${name}: ${(r.stderr || "").slice(0, 200)}`);
    } else {
      console.log(`added label ${name}`);
    }
  }
  for (const name of result.suggestedRemoveLabels || []) {
    const r = gh(["pr", "edit", String(pr), "--remove-label", name], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (r.status !== 0) {
      // Label may already be absent — non-fatal.
      console.warn(`remove-label ${name}: ${(r.stderr || "skip").slice(0, 120)}`);
    } else {
      console.log(`removed label ${name}`);
    }
  }
}

function cmdEnsureLabels() {
  /** ألوان عالية التباين (نص فاتح على خلفية داكنة في واجهة GitHub). */
  const colors = {
    [SAFE_AUTO_MERGE_LABEL]: "0E8A16",
    "safe:content": "1E3A8A",
    "safe:ui": "5B21B6",
    "safe:test": "1E3A8A",
    [RELEASE_TRAIN_LABEL]: "0E8A16",
    [RISKY_MANUAL_REVIEW_LABEL]: "9A3412",
    [BLOCKED_DANGER_PATH_LABEL]: "7F1D1D",
    "content-safe": "1E3A8A",
    "ui-safe": "5B21B6",
    "code-safe": "0E8A16",
    "tests-safe": "1E3A8A",
    "maintenance-safe": "1E3A8A",
    "manual-review": "9A3412",
    "no-auto-merge": "7F1D1D",
    ui: "5B21B6",
    perf: "9A3412",
    ios: "1E3A8A",
    ci: "1E3A8A",
    docs: "1E3A8A",
    "no-deploy": "7F1D1D",
    hold: "9A3412",
  };
  /** أوصاف عربية للواجهات — الاسم التقني يبقى للمفاتيح الداخلية. */
  const descriptions = {
    [BLOCKED_DANGER_PATH_LABEL]: "يتطلب مراجعة — مسار خطر (داخلي: blocked:danger-path)",
    [RISKY_MANUAL_REVIEW_LABEL]: "مراجعة مطلوبة — يحتاج مراجعة بشرية (داخلي: risky:manual-review)",
    "manual-review": "مراجعة مطلوبة",
    "no-auto-merge": "دمج يدوي",
    "no-deploy": "إيقاف نشر",
    hold: "معلّق",
    ci: "تكامل مستمر",
    docs: "توثيق",
    ios: "تطبيق iOS",
    ui: "واجهة",
    perf: "أداء",
    [SAFE_AUTO_MERGE_LABEL]: "دمج آمن",
    "safe:ui": "واجهة آمنة",
    "safe:content": "محتوى آمن",
    "safe:test": "اختبارات آمنة",
  };
  const all = [
    ...SAFE_LABELS,
    ...SAFE_DOMAIN_LABELS,
    ...CLASSIFICATION_LABELS,
    ...NO_DEPLOY_LABELS,
    RELEASE_TRAIN_LABEL,
    RISKY_MANUAL_REVIEW_LABEL,
    BLOCKED_DANGER_PATH_LABEL,
    "manual-review",
    "no-auto-merge",
  ];
  for (const name of [...new Set(all)]) {
    const color = colors[name] || "1F2937";
    const description =
      descriptions[name] || `سياسة الدمج الآمن: ${name}`;
    const r = gh(
      [
        "label",
        "create",
        name,
        "--color",
        color,
        "--description",
        description,
        "--force",
      ],
      { stdio: "inherit" },
    );
    if (r.status !== 0) {
      console.warn(`label ${name}: exit ${r.status}`);
    }
  }
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const cmd = args._[0];
    if (cmd === "evaluate") cmdEvaluate(args);
    else if (cmd === "report") cmdReport(args);
    else if (cmd === "ensure-labels") cmdEnsureLabels();
    else {
      usage();
      process.exitCode = 1;
    }
  } catch (err) {
    console.error(err?.stack || err);
    process.exitCode = 1;
  }
}

main();
