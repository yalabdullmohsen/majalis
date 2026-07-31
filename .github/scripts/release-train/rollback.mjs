/**
 * Auto-rollback helpers for Release Train.
 * Creates a revert branch + PR body; actual git/gh I/O is injectable for tests.
 */

/**
 * @param {{ stableSha: string, brokenSha: string, mergeShas?: string[], reason: string, trainTag?: string }} input
 */
export function buildRollbackPlan(input) {
  const stableSha = String(input.stableSha || "").trim();
  const brokenSha = String(input.brokenSha || "").trim();
  const mergeShas = (input.mergeShas || []).filter(Boolean);
  if (!stableSha || !/^[0-9a-f]{7,40}$/i.test(stableSha)) {
    return { ok: false, error: "invalid_stable_sha" };
  }
  if (!brokenSha || brokenSha === stableSha) {
    return { ok: false, error: "nothing_to_rollback" };
  }
  const branch = `rollback/release-train-${stableSha.slice(0, 8)}-${Date.now().toString(36)}`;
  const title = `rollback(train): restore production to ${stableSha.slice(0, 8)}`;
  const body = [
    "## Release Train Auto-Rollback",
    "",
    `- **Reason:** ${input.reason || "post_deploy_failure"}`,
    `- **Stable SHA:** \`${stableSha}\``,
    `- **Broken SHA:** \`${brokenSha}\``,
    `- **Train tag:** ${input.trainTag || "(n/a)"}`,
    `- **Merged commits to revert:** ${mergeShas.length ? mergeShas.map((s) => `\`${s}\``).join(", ") : "(range restore)"}`,
    "",
    "Generated automatically by `scheduled-release-train.yml`. Max 1 rollback attempt per train run.",
  ].join("\n");

  return {
    ok: true,
    branch,
    title,
    body,
    strategy: mergeShas.length ? "revert_commits" : "restore_tree",
    revertShasNewestFirst: [...mergeShas].reverse(),
    stableSha,
    brokenSha,
  };
}

/**
 * Execute rollback via injected runners (git/gh).
 * @param {ReturnType<typeof buildRollbackPlan>} plan
 * @param {{
 *   run: (cmd: string) => Promise<{ code: number, stdout: string, stderr: string }>,
 *   maxAttempts?: number,
 *   attempt?: number,
 * }} deps
 */
export async function executeRollback(plan, deps) {
  if (!plan?.ok) return { executed: false, error: plan?.error || "invalid_plan" };
  const attempt = deps.attempt ?? 1;
  const maxAttempts = deps.maxAttempts ?? 1;
  if (attempt > maxAttempts) {
    return { executed: false, error: "max_rollback_attempts_exceeded", attempt };
  }

  const run = deps.run;
  const steps = [];

  const checkout = await run(`git fetch origin main && git checkout -B ${plan.branch} ${plan.stableSha}`);
  steps.push({ step: "checkout_stable", ...checkout });
  if (checkout.code !== 0) {
    return { executed: false, error: "checkout_failed", steps, attempt };
  }

  // Push restore branch pointing at stable tree, open PR, squash-merge into main.
  const push = await run(`git push -u origin ${plan.branch} --force-with-lease`);
  steps.push({ step: "push_branch", ...push });
  if (push.code !== 0) {
    return { executed: false, error: "push_failed", steps, attempt };
  }

  const prCreate = await run(
    `gh pr create --base main --head ${plan.branch} --title ${JSON.stringify(plan.title)} --body ${JSON.stringify(plan.body)} --label maintenance-safe`,
  );
  steps.push({ step: "create_pr", ...prCreate });
  if (prCreate.code !== 0) {
    return { executed: false, error: "pr_create_failed", steps, attempt };
  }

  const merge = await run(`gh pr merge --squash --delete-branch --admin || gh pr merge --squash --delete-branch`);
  steps.push({ step: "merge_pr", ...merge });
  if (merge.code !== 0) {
    return { executed: false, error: "merge_failed", steps, attempt };
  }

  return { executed: true, steps, attempt, branch: plan.branch };
}

/**
 * Pure decision helper used by unit tests.
 */
export function rollbackAllowed({ alreadyRolledBack, maxAttempts = 1 }) {
  if (alreadyRolledBack >= maxAttempts) {
    return { allow: false, reason: "max_1_attempt" };
  }
  return { allow: true, reason: "ok" };
}
