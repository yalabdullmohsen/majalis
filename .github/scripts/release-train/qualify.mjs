/**
 * Qualify open PRs for the Release Train.
 */
import { DOMAIN_LABELS, READY_LABEL } from "./constants.mjs";
import { classifyPullRequest, levelCExclusionComment } from "./classify.mjs";

function checkStatus(rollup, nameRe) {
  const items = rollup || [];
  for (const c of items) {
    const name = c.name || c.context || "";
    if (!nameRe.test(name)) continue;
    const conclusion = String(c.conclusion || "").toUpperCase();
    const status = String(c.status || c.state || "").toUpperCase();
    if (conclusion === "SUCCESS" || status === "SUCCESS") return "pass";
    if (conclusion === "SKIPPED" || status === "SKIPPED") return "skipped";
    if (conclusion === "FAILURE" || status === "FAILURE" || status === "ERROR") return "fail";
    if (status === "PENDING" || status === "IN_PROGRESS" || status === "QUEUED" || !conclusion) {
      return "pending";
    }
    return conclusion.toLowerCase() || status.toLowerCase() || "unknown";
  }
  return "missing";
}

/**
 * Named required checks for the train (beyond generic green).
 * @param {object} pr
 * @param {string[]} files
 */
export function evaluateRequiredChecks(pr, files = []) {
  const rollup = pr.statusCheckRollup || [];
  const paths = files.join("\n");
  const hasSql = /(^|\/)supabase\/|\.sql$|(^|\/)migrations?\/|db-migrate|migration-runner/i.test(paths);
  const hasIos = /(^|\/)ios\/|\.swift$|capacitor\.config/i.test(paths);

  const verify = checkStatus(rollup, /^(Verify build|quality)$/i);
  const preview = checkStatus(rollup, /^preview-smoke$/i);
  const postgres = checkStatus(rollup, /^postgres-integration$/i);
  const xcode = checkStatus(rollup, /^xcodebuild-simulator$/i);

  const failures = [];
  if (verify !== "pass") failures.push(`Verify build=${verify}`);
  if (preview === "fail" || preview === "pending") failures.push(`preview-smoke=${preview}`);
  if (hasSql && postgres !== "pass") failures.push(`postgres-integration=${postgres} (SQL paths)`);
  if (hasIos && xcode !== "pass") failures.push(`xcodebuild-simulator=${xcode} (iOS paths)`);

  return {
    ok: failures.length === 0,
    failures,
    checks: { verify, preview, postgres, xcode, hasSql, hasIos },
  };
}

/**
 * @param {object} pr — GitHub PR JSON-ish
 * @param {{ requireCiGreen?: boolean, ciGreen?: boolean }} opts
 */
export function qualifyPullRequest(pr, opts = {}) {
  const requireCiGreen = opts.requireCiGreen !== false;
  const labels = (pr.labels || []).map((l) => (typeof l === "string" ? l : l?.name)).filter(Boolean);
  const labelSet = new Set(labels.map((l) => l.toLowerCase()));
  const reasons = [];

  if (pr.state && String(pr.state).toUpperCase() !== "OPEN") {
    return { eligible: false, reason: "not_open", classification: null };
  }
  if (pr.isDraft === true || pr.draft === true) {
    return { eligible: false, reason: "draft", classification: null };
  }
  if (pr.baseRefName && pr.baseRefName !== "main") {
    return { eligible: false, reason: "base_not_main", classification: null };
  }
  if (String(pr.reviewDecision || "").toUpperCase() === "CHANGES_REQUESTED") {
    return { eligible: false, reason: "changes_requested", classification: null };
  }
  if (pr.mergeable === false || String(pr.mergeable || "").toUpperCase() === "CONFLICTING") {
    return { eligible: false, reason: "merge_conflict", classification: null };
  }
  if (String(pr.mergeStateStatus || "").toUpperCase() === "CONFLICTING") {
    return { eligible: false, reason: "merge_conflict", classification: null };
  }
  if (!labelSet.has(READY_LABEL.toLowerCase())) {
    return { eligible: false, reason: `missing_label:${READY_LABEL}`, classification: null };
  }
  const domains = DOMAIN_LABELS.filter((d) => labelSet.has(d.toLowerCase()));
  if (domains.length === 0) {
    return { eligible: false, reason: "missing_domain_label", classification: null };
  }
  if (requireCiGreen && opts.ciGreen === false) {
    return { eligible: false, reason: "ci_not_green", classification: null };
  }

  const files = pr.files || pr.changedFilesPaths || [];
  const classification = classifyPullRequest({
    files,
    title: pr.title,
    body: pr.body,
    labels,
  });

  if (classification.blocked) {
    return {
      eligible: false,
      reason: "level_c_blocked",
      classification,
      exclusionComment: levelCExclusionComment(pr.number, classification.reasons),
      domains,
    };
  }

  const required = evaluateRequiredChecks(pr, files);
  if (!required.ok) {
    return {
      eligible: false,
      reason: "required_checks",
      detail: required.failures,
      classification,
      domains,
      checks: required.checks,
    };
  }

  return {
    eligible: true,
    reason: "ok",
    classification,
    domains,
    labels,
    checks: required.checks,
  };
}

/**
 * Sort eligible PRs by domain priority then number.
 * @param {Array<{ domains: string[], number: number }>} items
 * @param {string[]} priorityOrder
 */
export function sortByDomainPriority(items, priorityOrder) {
  const rank = (domains) => {
    let best = Number.POSITIVE_INFINITY;
    for (const d of domains || []) {
      const idx = priorityOrder.findIndex((p) => p.toLowerCase() === String(d).toLowerCase());
      if (idx >= 0 && idx < best) best = idx;
    }
    return best;
  };
  return [...items].sort((a, b) => {
    const ra = rank(a.domains);
    const rb = rank(b.domains);
    if (ra !== rb) return ra - rb;
    return (a.number || 0) - (b.number || 0);
  });
}
