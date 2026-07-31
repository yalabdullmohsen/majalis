#!/usr/bin/env node
/**
 * Release Train orchestrator — qualify → batch → sequential merge → gates → smoke → report.
 *
 * Env:
 *   RELEASE_TRAIN_DRY_RUN=1
 *   RELEASE_TRAIN_SKIP_LOCAL_VALIDATE=1
 *   RELEASE_TRAIN_SKIP_DEPLOY_GATES=1
 *   RELEASE_TRAIN_SKIP_SMOKE=1
 *   RELEASE_TRAIN_BASE_URL=https://majlisilm.com
 *   RELEASE_TRAIN_ROOT=/workspace
 *   GITHUB_STEP_SUMMARY
 *   GITHUB_SERVER_URL / GITHUB_REPOSITORY / GITHUB_RUN_ID
 */
import { writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { DOMAIN_PRIORITY, formatKuwaitReleaseTag } from "./constants.mjs";
import { qualifyPullRequest, sortByDomainPriority } from "./qualify.mjs";
import { selectBatch } from "./select-batch.mjs";
import { listOpenMainPrs, normalizePr, prChecksGreen, shell, ghText, ghJson } from "./github.mjs";
import { processOnePr } from "./merge-sequential.mjs";
import { runSmokeChecks, shouldTriggerRollback } from "./health-check.mjs";
import { buildRollbackPlan, executeRollback, rollbackAllowed } from "./rollback.mjs";
import { writeReport } from "./report.mjs";

function envFlag(name) {
  return /^(1|true|yes)$/i.test(String(process.env[name] || ""));
}

function runUrl() {
  const server = process.env.GITHUB_SERVER_URL;
  const repo = process.env.GITHUB_REPOSITORY;
  const id = process.env.GITHUB_RUN_ID;
  if (server && repo && id) return `${server}/${repo}/actions/runs/${id}`;
  return "(local)";
}

function summary(md) {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (path) appendFileSync(path, md + "\n", "utf8");
}

async function runPreDeployGates(run) {
  const steps = [
    ["install", "pnpm install --frozen-lockfile"],
    ["typecheck", "pnpm run typecheck"],
    ["eslint", "pnpm --filter @workspace/majalis exec eslint src lib --max-warnings=0"],
    ["test", "pnpm --filter @workspace/majalis run test"],
    ["build", "PORT=24216 BASE_PATH=/ pnpm --filter @workspace/majalis run build"],
  ];
  for (const [name, cmd] of steps) {
    console.log(`::group::pre-deploy ${name}`);
    const r = run(cmd);
    console.log(r.stdout);
    if (r.stderr) console.error(r.stderr);
    console.log("::endgroup::");
    if (r.code !== 0) return { ok: false, failedStep: name, detail: r.stderr || r.stdout };
  }
  return { ok: true };
}

async function main() {
  const root = process.env.RELEASE_TRAIN_ROOT || process.cwd();
  const dryRun = envFlag("RELEASE_TRAIN_DRY_RUN");
  const skipLocal = envFlag("RELEASE_TRAIN_SKIP_LOCAL_VALIDATE");
  const skipGates = envFlag("RELEASE_TRAIN_SKIP_DEPLOY_GATES");
  const skipSmoke = envFlag("RELEASE_TRAIN_SKIP_SMOKE");
  const startedAt = new Date().toISOString();
  const trainTag = formatKuwaitReleaseTag(new Date());

  console.log(`🚂 Release Train — ${trainTag}`);
  console.log(`dryRun=${dryRun} skipLocal=${skipLocal} skipGates=${skipGates} skipSmoke=${skipSmoke}`);

  const baseline = shell(`git fetch origin main && git rev-parse origin/main`);
  const baselineSha = (baseline.stdout || "").trim().split("\n").pop();
  if (!baselineSha) {
    console.error("Failed to resolve origin/main");
    process.exit(2);
  }
  console.log(`baselineSha=${baselineSha}`);

  const rawPrs = listOpenMainPrs({ limit: 50 });
  const excluded = [];
  const eligible = [];

  for (const raw of rawPrs) {
    let pr = normalizePr(raw);
    if (!pr.files.length) {
      try {
        const detail = ghJson(["pr", "view", String(pr.number), "--json", "files,statusCheckRollup"]);
        pr = normalizePr({ ...raw, files: detail?.files || [], statusCheckRollup: detail?.statusCheckRollup || raw.statusCheckRollup });
      } catch (err) {
        console.warn(`warn: could not load files for #${pr.number}: ${err.message}`);
      }
    }
    const ciGreen = prChecksGreen(pr);
    const q = qualifyPullRequest(pr, { ciGreen, requireCiGreen: true });
    if (!q.eligible) {
      excluded.push({
        number: pr.number,
        reason: q.reason,
        detail: q.classification?.reasons || [],
        title: pr.title,
      });
      if (q.reason === "level_c_blocked" && q.exclusionComment && !dryRun) {
        ghText(["pr", "comment", String(pr.number), "--body", q.exclusionComment]);
      }
      continue;
    }
    eligible.push({
      ...pr,
      domains: q.domains,
      level: q.classification.level,
      classification: q.classification,
    });
  }

  const sorted = sortByDomainPriority(eligible, DOMAIN_PRIORITY);
  const { selected, deferred, cumulativeFiles } = selectBatch(sorted);
  for (const d of deferred) {
    excluded.push({ number: d.number, reason: d.deferReason, detail: [], title: d.title });
  }

  console.log(`eligible=${eligible.length} selected=${selected.length} cumulativeFiles=${cumulativeFiles}`);

  const merged = [];
  for (const pr of selected) {
    console.log(`::group::merge PR #${pr.number} (${pr.level})`);
    const result = processOnePr(pr, {
      dryRun,
      skipLocalValidate: skipLocal || dryRun,
      level: pr.level,
    });
    console.log("::endgroup::");
    if (!result.ok) {
      excluded.push({
        number: pr.number,
        reason: result.error || "process_failed",
        detail: result.log || [],
        title: pr.title,
      });
      continue;
    }
    merged.push({
      number: pr.number,
      title: pr.title,
      author: pr.author,
      domains: pr.domains,
      level: pr.level,
      mergeSha: result.mergeSha,
    });
  }

  let productionSha = baselineSha;
  let deployStatus = "skipped_no_merges";
  let rollbackStatus = "Not Needed";
  let health = { results: [], ok: true };
  let notes = "";

  if (merged.length > 0 && !dryRun) {
    shell(`git fetch origin main`);
    productionSha = shell(`git rev-parse origin/main`).stdout.trim().split("\n").pop() || productionSha;

    if (!skipGates) {
      const gates = await runPreDeployGates(shell);
      if (!gates.ok) {
        deployStatus = `blocked_pre_deploy:${gates.failedStep}`;
        notes = `Pre-deploy gate failed at ${gates.failedStep}. Generating auto-revert PR.`;
        summary(`## ❌ Pre-deploy gate failed\n\nStep: \`${gates.failedStep}\`\n`);
        const plan = buildRollbackPlan({
          stableSha: baselineSha,
          brokenSha: productionSha,
          mergeShas: merged.map((m) => m.mergeSha).filter(Boolean),
          reason: `pre_deploy_${gates.failedStep}`,
          trainTag,
        });
        const allow = rollbackAllowed({ alreadyRolledBack: 0, maxAttempts: 1 });
        if (plan.ok && allow.allow) {
          const rb = await executeRollback(plan, {
            run: async (cmd) => shell(cmd),
            maxAttempts: 1,
            attempt: 1,
          });
          rollbackStatus = rb.executed ? "Executed (pre-deploy)" : `Failed: ${rb.error}`;
        }
        productionSha = shell(`git fetch origin main && git rev-parse origin/main`).stdout.trim().split("\n").pop();
      } else {
        deployStatus = "gates_passed_awaiting_vercel";
        // Vercel deploys from main automatically; wait then smoke.
        if (!skipSmoke) {
          console.log("Waiting for Vercel production settle…");
          shell(`sleep 90`);
          health = await runSmokeChecks({});
          const decision = shouldTriggerRollback(health);
          if (decision.rollback) {
            deployStatus = "deployed_smoke_failed";
            const allow = rollbackAllowed({ alreadyRolledBack: 0, maxAttempts: 1 });
            const plan = buildRollbackPlan({
              stableSha: baselineSha,
              brokenSha: productionSha,
              mergeShas: merged.map((m) => m.mergeSha).filter(Boolean),
              reason: decision.reason,
              trainTag,
            });
            if (plan.ok && allow.allow) {
              const rb = await executeRollback(plan, {
                run: async (cmd) => shell(cmd),
                maxAttempts: 1,
                attempt: 1,
              });
              rollbackStatus = rb.executed ? "Executed" : `Failed: ${rb.error}`;
              if (rb.executed) {
                productionSha = shell(`git fetch origin main && git rev-parse origin/main`).stdout
                  .trim()
                  .split("\n")
                  .pop();
              }
            }
            summary(`## 🔴 Post-deploy smoke failed — rollback ${rollbackStatus}\n`);
          } else {
            deployStatus = "deployed_healthy";
            rollbackStatus = "Not Needed";
            summary(`## ✅ Post-deploy smoke passed\n`);
          }
        } else {
          deployStatus = "gates_passed_smoke_skipped";
        }
      }
    } else {
      deployStatus = "merges_only_gates_skipped";
    }
  } else if (dryRun) {
    deployStatus = "dry_run";
    notes = "Dry run — no merges or deploys executed.";
  }

  const finishedAt = new Date().toISOString();
  const report = writeReport(
    {
      trainTag,
      runUrl: runUrl(),
      startedAt,
      finishedAt,
      baselineSha,
      productionSha,
      deployStatus,
      rollbackStatus,
      merged,
      excluded,
      health,
      notes,
    },
    { root },
  );

  // Persist report on a branch commit when running in Actions (best-effort).
  if (!dryRun && process.env.GITHUB_ACTIONS === "true") {
    const commitReport = shell(
      [
        `cd "${root}"`,
        `git config user.name "release-train-bot"`,
        `git config user.email "release-train-bot@users.noreply.github.com"`,
        `git fetch origin main`,
        `git checkout -B release-train/report origin/main`,
        `git add "${report.relative}"`,
        `git diff --cached --quiet || (git commit -m "chore(release-train): report ${trainTag}" && git push -u origin release-train/report && gh pr create --base main --head release-train/report --title "chore(release-train): report" --body "Automated train report" --label maintenance-safe || true)`,
      ].join(" && "),
    );
    console.log(`report commit code=${commitReport.code}`);
  }

  writeFileSync(join(root, "artifacts/release-train/last-run.json"), JSON.stringify({
    trainTag,
    baselineSha,
    productionSha,
    deployStatus,
    rollbackStatus,
    merged: merged.map((m) => m.number),
    excluded: excluded.map((e) => ({ number: e.number, reason: e.reason })),
    report: report.relative,
  }, null, 2));

  summary(report.markdown);
  console.log(`Report written: ${report.relative}`);
  console.log(JSON.stringify({ merged: merged.length, excluded: excluded.length, deployStatus, rollbackStatus }, null, 2));

  if (deployStatus.startsWith("blocked_") || deployStatus === "deployed_smoke_failed") {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
