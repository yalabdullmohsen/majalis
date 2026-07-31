/**
 * Pure eligibility evaluation for safe auto-merge.
 */
import {
  AUTH_SECURITY_PATH_PATTERNS,
  AUTH_SECURITY_TEXT,
  BLOCKED_DANGER_PATH_LABEL,
  BLOCKING_LABELS,
  BRANCH_ALLOW_RE,
  BRANCH_EXCLUDE_RE,
  DANGER_PATH_PATTERNS,
  MAX_DELETED_FILES,
  MAX_FILES_FOR_AUTO_MERGE,
  MAX_TOTAL_DELETIONS,
  RELEASE_TRAIN_LABEL,
  REQUIRED_CHECK_NAMES,
  RISKY_MANUAL_REVIEW_LABEL,
  SAFE_AUTO_MERGE_LABEL,
  SAFE_LABELS,
  TITLE_BLOCK_RE,
} from "./constants.mjs";

/**
 * @typedef {{ path: string, additions?: number, deletions?: number, changeType?: string }} PrFile
 * @typedef {{ name: string, state: string }} CheckRow
 */

/**
 * Normalize check state to pass|fail|pending|missing|other
 * @param {string} raw
 */
export function normalizeCheckState(raw) {
  const s = String(raw || "").toLowerCase().trim();
  if (!s || s === "missing") return "missing";
  if (/^(pass|success|completed_success)$/.test(s)) return "pass";
  if (/^(fail|failure|cancelled|canceled|timed_out|action_required|error)$/.test(s)) return "fail";
  if (/^(pending|queued|in_progress|expected|waiting|requested)$/.test(s)) return "pending";
  if (/^(skip|skipped|neutral)$/.test(s)) return "skip";
  return "other";
}

/**
 * @param {PrFile[]} files
 */
export function summarizeFiles(files = []) {
  const paths = files.map((f) => f.path).filter(Boolean);
  let totalDeletions = 0;
  let deletedFiles = 0;
  for (const f of files) {
    const del = Number(f.deletions || 0);
    totalDeletions += del;
    const ct = String(f.changeType || "").toUpperCase();
    if (ct === "DELETED" || ct === "REMOVED") deletedFiles += 1;
    else if (del > 0 && Number(f.additions || 0) === 0) deletedFiles += 1;
  }
  return { paths, totalDeletions, deletedFiles, fileCount: paths.length };
}

/**
 * @param {string[]} paths
 */
export function findDangerousFiles(paths = []) {
  const hits = [];
  for (const p of paths) {
    for (const re of DANGER_PATH_PATTERNS) {
      if (re.test(p)) {
        hits.push({ path: p, reason: `danger_path:${re}` });
        break;
      }
    }
  }
  return hits;
}

/**
 * @param {string[]} paths
 * @param {string} title
 * @param {string} body
 */
export function findAuthSecurityHits(paths = [], title = "", body = "") {
  const hits = [];
  for (const p of paths) {
    for (const re of AUTH_SECURITY_PATH_PATTERNS) {
      if (re.test(p)) {
        hits.push({ path: p, reason: `auth_security_path:${re}` });
        break;
      }
    }
  }
  const blob = `${title}\n${body}`;
  if (AUTH_SECURITY_TEXT.test(blob)) {
    hits.push({ path: "(title/body)", reason: "auth_security_text" });
  }
  return hits;
}

/**
 * Infer PR type from labels (first matching safe label).
 * @param {string[]} labels
 */
export function inferPrType(labels = []) {
  const lower = labels.map((l) => String(l).toLowerCase());
  for (const safe of SAFE_LABELS) {
    if (lower.includes(safe)) return safe;
  }
  if (lower.includes(RELEASE_TRAIN_LABEL)) return "release-train";
  if (lower.some((l) => BLOCKING_LABELS.includes(l))) return "manual-review";
  return "unlabeled";
}

/**
 * @param {{
 *   isDraft?: boolean,
 *   state?: string,
 *   baseRefName?: string,
 *   headRefName?: string,
 *   mergeable?: string,
 *   mergeStateStatus?: string,
 *   reviewDecision?: string,
 *   title?: string,
 *   body?: string,
 *   labels?: string[],
 *   files?: PrFile[],
 *   checks?: CheckRow[],
 * }} input
 */
export function evaluateEligibility(input = {}) {
  const blockers = [];
  const warnings = [];
  const labels = (input.labels || []).map((l) => String(l).toLowerCase());
  const title = String(input.title || "");
  const body = String(input.body || "");
  const branch = String(input.headRefName || "");
  const fileSummary = summarizeFiles(input.files || []);
  const dangerousFiles = findDangerousFiles(fileSummary.paths);
  const authHits = findAuthSecurityHits(fileSummary.paths, title, body);
  const prType = inferPrType(labels);

  const hasSafeLabel = SAFE_LABELS.some((l) => labels.includes(l));
  const checks = Array.isArray(input.checks) ? input.checks : [];

  const checkMap = {};
  for (const c of checks) {
    checkMap[c.name] = normalizeCheckState(c.state);
  }

  function findCheck(re) {
    const row = checks.find((c) => re.test(c.name));
    return row ? { name: row.name, state: normalizeCheckState(row.state) } : { name: null, state: "missing" };
  }

  const verify = findCheck(REQUIRED_CHECK_NAMES.verifyBuild);
  const preview = findCheck(REQUIRED_CHECK_NAMES.previewSmoke);
  const vercelLint = findCheck(REQUIRED_CHECK_NAMES.vercelCheck);
  const vercelDeploy = findCheck(REQUIRED_CHECK_NAMES.vercelDeploy);
  const postgres = findCheck(REQUIRED_CHECK_NAMES.postgres);
  const colorContrast = findCheck(REQUIRED_CHECK_NAMES.colorContrast);
  const iosStatic = findCheck(REQUIRED_CHECK_NAMES.iosStatic);

  // --- hard structural gates ---
  if (input.state && String(input.state).toUpperCase() !== "OPEN") {
    blockers.push("PR is not OPEN");
  }
  if (input.baseRefName && input.baseRefName !== "main") {
    blockers.push("base branch is not main");
  }
  if (input.isDraft === true) {
    blockers.push("PR is Draft");
  }
  if (String(input.reviewDecision || "") === "CHANGES_REQUESTED") {
    blockers.push("CHANGES_REQUESTED");
  }
  if (TITLE_BLOCK_RE.test(title)) {
    blockers.push("title forbids auto-merge");
  }
  if (labels.includes(RELEASE_TRAIN_LABEL)) {
    blockers.push("labeled release-train-ready (owned by scheduled train)");
  }
  for (const bl of BLOCKING_LABELS) {
    if (labels.includes(bl)) blockers.push(`blocking label: ${bl}`);
  }
  if (branch && !BRANCH_ALLOW_RE.test(branch)) {
    blockers.push(`branch pattern not allowed: ${branch}`);
  }
  if (branch && BRANCH_EXCLUDE_RE.test(branch)) {
    blockers.push(`dual automation branch excluded: ${branch}`);
  }
  if (!hasSafeLabel) {
    blockers.push(
      `missing safe label (need one of: ${SAFE_LABELS.join(", ")})`,
    );
  }

  const mergeable = String(input.mergeable || "");
  const mstatus = String(input.mergeStateStatus || "");
  if (mergeable && mergeable !== "MERGEABLE" && mergeable !== "UNKNOWN") {
    blockers.push(`mergeable=${mergeable}`);
  }
  if (mstatus === "CONFLICTING" || mstatus === "DIRTY") {
    blockers.push("conflict / dirty merge state");
  }
  if (mstatus === "BEHIND") {
    blockers.push("branch behind main (update required)");
  }

  // --- size / danger ---
  if (fileSummary.fileCount > MAX_FILES_FOR_AUTO_MERGE) {
    blockers.push(
      `too many files changed (${fileSummary.fileCount} > ${MAX_FILES_FOR_AUTO_MERGE})`,
    );
  }
  if (fileSummary.totalDeletions > MAX_TOTAL_DELETIONS) {
    blockers.push(
      `large deletions (${fileSummary.totalDeletions} lines > ${MAX_TOTAL_DELETIONS})`,
    );
  }
  if (fileSummary.deletedFiles > MAX_DELETED_FILES) {
    blockers.push(
      `too many deleted files (${fileSummary.deletedFiles} > ${MAX_DELETED_FILES})`,
    );
  }
  if (dangerousFiles.length) {
    blockers.push(
      `dangerous paths require manual review (${dangerousFiles.length}): ${dangerousFiles
        .slice(0, 8)
        .map((d) => d.path)
        .join(", ")}`,
    );
  }
  if (authHits.length) {
    blockers.push(
      `auth/security/RLS change detected: ${authHits
        .slice(0, 6)
        .map((h) => h.path)
        .join(", ")}`,
    );
  }

  // migration / ios / cicd shorthand (also covered by danger paths)
  const hasMigration = fileSummary.paths.some(
    (p) =>
      /migration/i.test(p) ||
      /\.sql$/i.test(p) ||
      /^artifacts\/majalis\/supabase\//i.test(p) ||
      /^supabase\/migrations\//i.test(p),
  );
  const hasIos = fileSummary.paths.some(
    (p) =>
      /^artifacts\/majalis\/ios\//i.test(p) ||
      /\.swift$/i.test(p) ||
      /capacitor\.config\./i.test(p),
  );
  const hasCicd = fileSummary.paths.some(
    (p) =>
      /^\.github\/workflows\//i.test(p) ||
      /^fastlane\//i.test(p),
  );
  if (hasMigration) blockers.push("migration / SQL change → manual review");
  if (hasIos) blockers.push("iOS / Capacitor native change → manual review");
  if (hasCicd) blockers.push("CI/CD / Fastlane change → manual review");

  // Suggested labels for the report/cli sync (never close PRs).
  const suggestedAddLabels = [];
  const suggestedRemoveLabels = [];
  if (dangerousFiles.length || hasMigration || hasIos || hasCicd || authHits.length) {
    suggestedAddLabels.push(BLOCKED_DANGER_PATH_LABEL, RISKY_MANUAL_REVIEW_LABEL);
  } else if (hasSafeLabel && !labels.includes(RISKY_MANUAL_REVIEW_LABEL)) {
    // Clear stale danger labels only when paths are clean (cli applies carefully).
    suggestedRemoveLabels.push(BLOCKED_DANGER_PATH_LABEL);
  }
  if (
    hasSafeLabel &&
    !labels.includes(SAFE_AUTO_MERGE_LABEL) &&
    !dangerousFiles.length &&
    !hasMigration &&
    !hasIos &&
    !hasCicd
  ) {
    warnings.push(
      `consider adding \`${SAFE_AUTO_MERGE_LABEL}\` for explicit auto-merge opt-in`,
    );
  }

  // --- required checks (when evaluating for merge enable) ---
  const requireChecks = input.requireChecks !== false;
  if (requireChecks) {
    // Verify build embeds: typecheck, lint, test, build, generators --check,
    // verify:no-runtime-ddl, verify:single-response, verify:no-unsafe-auto-merge,
    // db:migration:verify (see .github/workflows/ci.yml).
    if (verify.state !== "pass") {
      blockers.push(`CI Verify build not green (${verify.state})`);
    }
    if (preview.state !== "pass") {
      blockers.push(`preview-smoke not green (${preview.state})`);
    }
    // git diff clean after build is enforced by vercel-check job
    if (vercelLint.state !== "pass") {
      blockers.push(
        `Vercel check (lint-typecheck-build / git diff clean) not green (${vercelLint.state})`,
      );
    }
    if (vercelDeploy.state === "fail" || vercelDeploy.state === "pending") {
      blockers.push(`Vercel deployment not green (${vercelDeploy.state})`);
    } else if (vercelDeploy.state === "missing") {
      warnings.push("Vercel – majalis-majalis status not reported yet");
      // Do not hard-block solely on missing Vercel preview context (forks / lag);
      // when present it must be green. For same-repo PRs it usually appears.
      if (input.strictVercel === true) {
        blockers.push("Vercel deployment status missing");
      }
    }
    if (postgres.state === "fail" || postgres.state === "pending") {
      blockers.push(`postgres-integration not green (${postgres.state})`);
    }
    // Soft-required when the workflow job exists for this PR.
    if (colorContrast.state === "fail" || colorContrast.state === "pending") {
      blockers.push(`Color contrast gate not green (${colorContrast.state})`);
    }
    // iOS static gates: required when the check is present (path-filtered workflow).
    if (hasIos && (iosStatic.state === "fail" || iosStatic.state === "pending" || iosStatic.state === "missing")) {
      blockers.push(`iOS static gates required for native changes (${iosStatic.state})`);
    } else if (iosStatic.state === "fail" || iosStatic.state === "pending") {
      blockers.push(`iOS static gates not green (${iosStatic.state})`);
    }
  }

  // Deduplicate blockers while preserving order
  const seen = new Set();
  const uniqueBlockers = [];
  for (const b of blockers) {
    if (seen.has(b)) continue;
    seen.add(b);
    uniqueBlockers.push(b);
  }

  const eligible = uniqueBlockers.length === 0;

  return {
    eligible,
    prType,
    hasSafeLabel,
    blockers: uniqueBlockers,
    warnings,
    dangerousFiles,
    authHits,
    fileSummary,
    hasMigration,
    hasIos,
    hasCicd,
    suggestedAddLabels: [...new Set(suggestedAddLabels)],
    suggestedRemoveLabels: [...new Set(suggestedRemoveLabels)],
    needsManualReview: !eligible,
    checks: {
      verifyBuild: verify,
      previewSmoke: preview,
      vercelCheck: vercelLint,
      vercelDeploy,
      postgres,
      colorContrast,
      iosStatic,
    },
    labels: {
      all: labels,
      safeMatched: SAFE_LABELS.filter((l) => labels.includes(l)),
    },
  };
}
