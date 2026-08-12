/**
 * Sequential update → validate → squash-merge for one PR.
 */
import { ghText, shell } from "./github.mjs";

/**
 * @param {object} pr normalized PR
 * @param {{
 *   dryRun?: boolean,
 *   skipLocalValidate?: boolean,
 *   level?: string,
 *   run?: typeof shell,
 *   gh?: typeof ghText,
 * }} [opts]
 */
export function processOnePr(pr, opts = {}) {
  const run = opts.run || shell;
  const gh = opts.gh || ghText;
  const log = [];
  const n = pr.number;

  const pushLog = (msg) => {
    log.push(msg);
    console.log(msg);
  };

  if (opts.dryRun) {
    pushLog(`[dry-run] would process PR #${n}`);
    return { ok: true, dryRun: true, log, mergeSha: null };
  }

  // Update branch with latest main (GitHub update-branch API via gh).
  const upd = gh(["pr", "update-branch", String(n)], {});
  pushLog(`update-branch #${n}: code=${upd.code}`);
  // Non-zero can mean already up to date on some gh versions — continue carefully.
  if (upd.code !== 0 && !/already|up.to.date|not necessary/i.test(`${upd.stdout}\n${upd.stderr}`)) {
    // Fallback: local merge main into head (requires checkout) — skip if cannot update.
    pushLog(`update-branch failed for #${n}: ${upd.stderr || upd.stdout}`);
    return { ok: false, error: "update_branch_failed", log };
  }

  if (!opts.skipLocalValidate) {
    const head = pr.headRefName;
    const co = run(`git fetch origin "${head}" main && git checkout -B "train-validate-${n}" "origin/${head}"`);
    pushLog(`checkout head #${n}: code=${co.code}`);
    if (co.code !== 0) return { ok: false, error: "checkout_failed", log };

    const mergeMain = run(`git merge origin/main --no-edit`);
    pushLog(`merge main into #${n}: code=${mergeMain.code}`);
    if (mergeMain.code !== 0) {
      run(`git merge --abort || true`);
      return { ok: false, error: "rebase_conflict", log };
    }

    const install = run(`pnpm install --frozen-lockfile`);
    pushLog(`install #${n}: code=${install.code}`);
    if (install.code !== 0) return { ok: false, error: "install_failed", log };

    const typecheck = run(`pnpm run typecheck`);
    pushLog(`typecheck #${n}: code=${typecheck.code}`);
    if (typecheck.code !== 0) return { ok: false, error: "typecheck_failed", log };

    // Level B gets package tests; Level A stays lighter (typecheck already ran).
    if (opts.level === "B") {
      const test = run(`pnpm --filter @workspace/majalis run test`);
      pushLog(`test #${n}: code=${test.code}`);
      if (test.code !== 0) return { ok: false, error: "test_failed", log };
    }

    run(`git checkout main || git checkout -`);
  }

  const merge = gh([
    "pr",
    "merge",
    String(n),
    "--squash",
    "--delete-branch",
    "--subject",
    `${pr.title} (#${n})`,
  ]);
  pushLog(`squash-merge #${n}: code=${merge.code}`);
  if (merge.code !== 0) {
    return { ok: false, error: "merge_failed", log, detail: merge.stderr || merge.stdout };
  }

  const shaProbe = run(`git fetch origin main && git rev-parse origin/main`);
  const mergeSha = (shaProbe.stdout || "").trim().split("\n").pop();
  return { ok: true, log, mergeSha };
}
