/**
 * Thin GitHub CLI helpers for the Release Train (spawn-based, mockable).
 */
import { spawnSync } from "node:child_process";

export function ghJson(args, opts = {}) {
  const r = (opts.spawn || spawnSync)("gh", args, {
    encoding: "utf8",
    env: { ...process.env, ...(opts.env || {}) },
  });
  if (r.status !== 0) {
    const err = new Error(`gh ${args.join(" ")} failed: ${r.stderr || r.stdout}`);
    err.code = r.status;
    throw err;
  }
  const out = (r.stdout || "").trim();
  return out ? JSON.parse(out) : null;
}

export function ghText(args, opts = {}) {
  const r = (opts.spawn || spawnSync)("gh", args, {
    encoding: "utf8",
    env: { ...process.env, ...(opts.env || {}) },
  });
  return {
    code: r.status ?? 1,
    stdout: r.stdout || "",
    stderr: r.stderr || "",
  };
}

export function shell(command, opts = {}) {
  const r = (opts.spawn || spawnSync)("bash", ["-lc", command], {
    encoding: "utf8",
    env: { ...process.env, ...(opts.env || {}) },
    cwd: opts.cwd,
  });
  return {
    code: r.status ?? 1,
    stdout: r.stdout || "",
    stderr: r.stderr || "",
  };
}

/**
 * List open PRs targeting main with useful fields.
 */
export function listOpenMainPrs(opts = {}) {
  return (
    ghJson(
      [
        "pr",
        "list",
        "--base",
        "main",
        "--state",
        "open",
        "--limit",
        String(opts.limit || 50),
        "--json",
        "number,title,body,author,isDraft,mergeable,mergeStateStatus,labels,headRefName,baseRefName,url,files,statusCheckRollup",
      ],
      opts,
    ) || []
  );
}

export function prChecksGreen(pr) {
  const rollup = pr.statusCheckRollup || [];
  if (!Array.isArray(rollup) || rollup.length === 0) return false;
  // Require at least one completed success that looks like Verify build / quality,
  // and no failing/pending required-looking checks.
  let hasVerify = false;
  for (const c of rollup) {
    const name = c.name || c.context || "";
    const conclusion = (c.conclusion || "").toUpperCase();
    const status = (c.status || c.state || "").toUpperCase();
    const failed =
      conclusion === "FAILURE" ||
      conclusion === "CANCELLED" ||
      status === "FAILURE" ||
      status === "ERROR" ||
      status === "PENDING" ||
      status === "QUEUED" ||
      status === "IN_PROGRESS";
    if (/verify build|quality/i.test(name)) {
      if (conclusion === "SUCCESS" || status === "SUCCESS") hasVerify = true;
      else return false;
    } else if (failed && conclusion !== "SKIPPED" && status !== "SUCCESS") {
      // Soft: ignore skipped; block hard failures on other checks when conclusion set.
      if (conclusion === "FAILURE" || status === "FAILURE" || status === "ERROR") return false;
      if (status === "PENDING" || status === "IN_PROGRESS" || status === "QUEUED") return false;
    }
  }
  return hasVerify;
}

export function normalizePr(pr) {
  const labels = (pr.labels || []).map((l) => (typeof l === "string" ? l : l.name)).filter(Boolean);
  const files = (pr.files || []).map((f) => (typeof f === "string" ? f : f.path)).filter(Boolean);
  return {
    ...pr,
    number: pr.number,
    labels,
    files,
    fileCount: files.length,
    author: pr.author?.login || pr.author || "",
  };
}
