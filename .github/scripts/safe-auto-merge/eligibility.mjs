/**
 * Pure eligibility evaluation for safe auto-merge.
 */
import { isIgnorablePreviewStatus } from "./checks.mjs";
import {
  AUTH_SECURITY_PATH_PATTERNS,
  AUTH_SECURITY_TEXT,
  AUTOMATIC_CONTENT_AUDIT_BRANCH_RE,
  AUTOMATIC_CONTENT_AUDIT_TITLE_RE,
  BLOCKED_DANGER_PATH_LABEL,
  BLOCKING_LABELS,
  BRANCH_ALLOW_RE,
  BRANCH_EXCLUDE_RE,
  CONTENT_SAFE_LABELS,
  CONTENT_SAFE_PATH_PATTERNS,
  DANGER_PATH_PATTERNS,
  isAutoMergeAllowlistedPath,
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
import { classifyChangedPaths } from "./path-classifier.mjs";

/**
 * @typedef {{ path: string, additions?: number, deletions?: number, changeType?: string }} PrFile
 * @typedef {{ name: string, state: string, description?: string }} CheckRow
 */

/**
 * Normalize check state to pass|fail|pending|missing|skip|other
 * @param {string} raw
 * @param {string} [description]
 */
export function normalizeCheckState(raw, description = "") {
  const s = String(raw || "").toLowerCase().trim();
  const desc = String(description || "");
  if (!s || s === "missing") return "missing";
  // Vercel Ignored Build Step often surfaces as canceled/fail + description.
  if (
    isIgnorablePreviewStatus({ state: s, description: desc }) ||
    (/^(cancel|canceled|cancelled|fail|failure)$/.test(s) &&
      /ignored|skipped\s*-\s*not\s*affected/i.test(desc))
  ) {
    return "skip";
  }
  if (/^(pass|success|completed_success)$/.test(s)) return "pass";
  if (/^(fail|failure|timed_out|action_required|error)$/.test(s)) return "fail";
  if (/^(cancel|canceled|cancelled)$/.test(s)) {
    // Bare cancel without Ignored description — treat as skip for Preview contexts only upstream.
    return "fail";
  }
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
    if (isAutoMergeAllowlistedPath(p)) continue;
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
 */
export function findNonContentSafeFiles(paths = []) {
  return paths.filter(
    (p) => !CONTENT_SAFE_PATH_PATTERNS.some((re) => re.test(p)),
  );
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
 *   requireChecks?: boolean,
 *   strictVercel?: boolean,
 * }} input
 */
export function evaluateEligibility(input = {}) {
  const hardBlockers = [];
  const waitBlockers = [];
  const warnings = [];
  const labels = (input.labels || []).map((l) => String(l).toLowerCase());
  const title = String(input.title || "");
  const body = String(input.body || "");
  const branch = String(input.headRefName || "");
  const fileSummary = summarizeFiles(input.files || []);
  const dangerousFiles = findDangerousFiles(fileSummary.paths);
  const authHits = findAuthSecurityHits(fileSummary.paths, title, body);
  const prType = inferPrType(labels);
  const isContentAudit = CONTENT_SAFE_LABELS.some((l) => labels.includes(l));

  const hasSafeLabel = SAFE_LABELS.some((l) => labels.includes(l));
  const checks = Array.isArray(input.checks) ? input.checks : [];
  const pathLane = classifyChangedPaths(fileSummary.paths);
  const req = pathLane.requiredChecks;

  function findCheck(re) {
    const row = checks.find((c) => re.test(c.name));
    if (!row) return { name: null, state: "missing", description: "", ignoredPreview: false };
    const state = normalizeCheckState(row.state, row.description);
    return {
      name: row.name,
      state,
      description: row.description || "",
      ignoredPreview: isIgnorablePreviewStatus(row) || state === "skip",
    };
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
    hardBlockers.push("PR is not OPEN");
  }
  if (input.baseRefName && input.baseRefName !== "main") {
    hardBlockers.push("base branch is not main");
  }
  if (input.isDraft === true) {
    hardBlockers.push("PR is Draft");
  }
  if (String(input.reviewDecision || "") === "CHANGES_REQUESTED") {
    hardBlockers.push("CHANGES_REQUESTED");
  }
  if (TITLE_BLOCK_RE.test(title)) {
    hardBlockers.push("title forbids auto-merge");
  }
  if (AUTOMATIC_CONTENT_AUDIT_BRANCH_RE.test(branch)) {
    hardBlockers.push(
      "automatic content-audit branch (majalis-content-fill) — التدقيق التلقائي معطّل",
    );
  }
  if (AUTOMATIC_CONTENT_AUDIT_TITLE_RE.test(title)) {
    hardBlockers.push(
      "automatic content-audit title — التدقيق التلقائي معطّل (شغّل يدويًا عبر فرع cursor/… إن لزم)",
    );
  }
  if (labels.includes(RELEASE_TRAIN_LABEL)) {
    hardBlockers.push("labeled release-train-ready (owned by scheduled train)");
  }
  for (const bl of BLOCKING_LABELS) {
    if (labels.includes(bl)) hardBlockers.push(`blocking label: ${bl}`);
  }
  if (branch && !BRANCH_ALLOW_RE.test(branch)) {
    hardBlockers.push(`branch pattern not allowed: ${branch}`);
  }
  if (branch && BRANCH_EXCLUDE_RE.test(branch)) {
    hardBlockers.push(`dual automation branch excluded: ${branch}`);
  }
  if (!hasSafeLabel) {
    warnings.push(
      `no safe label — allowed for low-risk PRs after green checks; labels remain optional for classification: ${SAFE_LABELS.join(", ")}`,
    );
  }

  const mergeable = String(input.mergeable || "");
  const mstatus = String(input.mergeStateStatus || "");
  if (mergeable && mergeable !== "MERGEABLE" && mergeable !== "UNKNOWN") {
    hardBlockers.push(`mergeable=${mergeable}`);
  }
  if (mstatus === "CONFLICTING" || mstatus === "DIRTY") {
    hardBlockers.push("conflict / dirty merge state");
  }
  if (mstatus === "BEHIND") {
    hardBlockers.push("branch behind main (update required)");
  }

  // --- size / danger ---
  if (fileSummary.fileCount > MAX_FILES_FOR_AUTO_MERGE) {
    hardBlockers.push(
      `too many files changed (${fileSummary.fileCount} > ${MAX_FILES_FOR_AUTO_MERGE})`,
    );
  }
  if (fileSummary.totalDeletions > MAX_TOTAL_DELETIONS) {
    hardBlockers.push(
      `large deletions (${fileSummary.totalDeletions} lines > ${MAX_TOTAL_DELETIONS})`,
    );
  }
  if (fileSummary.deletedFiles > MAX_DELETED_FILES) {
    hardBlockers.push(
      `too many deleted files (${fileSummary.deletedFiles} > ${MAX_DELETED_FILES})`,
    );
  }
  if (dangerousFiles.length) {
    hardBlockers.push(
      `dangerous paths require manual review (${dangerousFiles.length}): ${dangerousFiles
        .slice(0, 8)
        .map((d) => d.path)
        .join(", ")}`,
    );
  }
  if (authHits.length) {
    hardBlockers.push(
      `auth/security/RLS change detected: ${authHits
        .slice(0, 6)
        .map((h) => h.path)
        .join(", ")}`,
    );
  }

  // content-safe / safe:content → quiz + content-audit paths only
  const nonContentFiles = isContentAudit
    ? findNonContentSafeFiles(fileSummary.paths)
    : [];
  if (isContentAudit && nonContentFiles.length) {
    hardBlockers.push(
      `content-safe PR may only touch quiz/content-audit paths; off-policy: ${nonContentFiles
        .slice(0, 8)
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
      /^ios\//i.test(p) ||
      /^artifacts\/majalis\/ios\//i.test(p) ||
      /\.swift$/i.test(p) ||
      /capacitor\.config\./i.test(p),
  );
  const hasCicd = fileSummary.paths.some(
    (p) =>
      !isAutoMergeAllowlistedPath(p) &&
      (/^\.github\/workflows\//i.test(p) || /^fastlane\//i.test(p)),
  );
  if (hasMigration) hardBlockers.push("migration / SQL change → manual review");
  if (hasIos) hardBlockers.push("iOS / Capacitor native change → manual review");
  if (hasCicd) hardBlockers.push("CI/CD / Fastlane change → manual review");

  const suggestedAddLabels = [];
  const suggestedRemoveLabels = [];
  if (dangerousFiles.length || hasMigration || hasIos || hasCicd || authHits.length || nonContentFiles.length) {
    if (dangerousFiles.length || hasMigration || hasIos || hasCicd || authHits.length) {
      suggestedAddLabels.push(BLOCKED_DANGER_PATH_LABEL, RISKY_MANUAL_REVIEW_LABEL);
    }
  } else if (!labels.includes(RISKY_MANUAL_REVIEW_LABEL)) {
    // Safe low-risk PR: clear stale danger-path label even without a safe:* label.
    suggestedRemoveLabels.push(BLOCKED_DANGER_PATH_LABEL);
  }
  if (
    !labels.includes(SAFE_AUTO_MERGE_LABEL) &&
    !dangerousFiles.length &&
    !hasMigration &&
    !hasIos &&
    !hasCicd
  ) {
    warnings.push(
      `consider adding \`${SAFE_AUTO_MERGE_LABEL}\` for clearer reporting; it is no longer required for low-risk auto-merge`,
    );
  }

  // --- required checks (path-lane aware: skipped OK only when not required) ---
  // Verify build embeds typecheck + lint + test/content-guard + build (ci.yml),
  // or Fast Lane aggregate when docs/policy-only.
  const requireChecks = input.requireChecks !== false;
  let vercelPreviewKind = "unknown"; // green | ignored | pending | missing | failed

  if (requireChecks) {
    if (verify.state === "pending" || verify.state === "missing") {
      waitBlockers.push(`CI Verify build not ready (${verify.state})`);
    } else if (verify.state !== "pass") {
      hardBlockers.push(`CI Verify build not green (${verify.state})`);
    }

    if (req.previewSmoke) {
      if (preview.state === "pending" || preview.state === "missing") {
        waitBlockers.push(`preview-smoke not ready (${preview.state})`);
      } else if (preview.state === "skip" && isContentAudit) {
        warnings.push("preview-smoke skipped — OK for content-safe audit");
      } else if (preview.state !== "pass" && preview.state !== "skip") {
        hardBlockers.push(`preview-smoke not green (${preview.state})`);
      } else if (preview.state === "skip") {
        hardBlockers.push("preview-smoke skipped but required for this path lane");
      }
    } else if (preview.state === "fail") {
      warnings.push("preview-smoke failed but not required for this path lane");
    } else if (preview.state === "skip" || preview.state === "missing") {
      warnings.push(
        `preview-smoke ${preview.state} — OK (not required for lane ${pathLane.lane})`,
      );
    }

    if (req.vercelCheck) {
      if (vercelLint.state === "pending" || vercelLint.state === "missing") {
        waitBlockers.push(
          `Vercel check (lint-typecheck-build) not ready (${vercelLint.state})`,
        );
      } else if (vercelLint.state !== "pass" && vercelLint.state !== "skip") {
        hardBlockers.push(
          `Vercel check (lint-typecheck-build / git diff clean) not green (${vercelLint.state})`,
        );
      }
    } else if (vercelLint.state === "skip" || vercelLint.state === "missing") {
      warnings.push(
        `Vercel check ${vercelLint.state} — OK (not required for lane ${pathLane.lane})`,
      );
    }

    if (vercelDeploy.ignoredPreview || vercelDeploy.state === "skip") {
      vercelPreviewKind = "ignored";
      warnings.push(
        "Vercel Preview ignored/skipped (Ignored Build Step) — لا يمنع content-safe / Fast Lane",
      );
    } else if (vercelDeploy.state === "pass") {
      vercelPreviewKind = "green";
    } else if (vercelDeploy.state === "pending") {
      vercelPreviewKind = "pending";
      if (isContentAudit || !req.previewSmoke) {
        warnings.push(
          `Vercel Preview pending — OK for lane ${pathLane.lane} / content-safe`,
        );
      } else {
        waitBlockers.push(`Vercel deployment not ready (${vercelDeploy.state})`);
      }
    } else if (vercelDeploy.state === "missing") {
      vercelPreviewKind = "missing";
      if (isContentAudit || !req.previewSmoke) {
        warnings.push(
          `Vercel – majalis-majalis status missing — OK for lane ${pathLane.lane}`,
        );
      } else if (input.strictVercel === true) {
        waitBlockers.push("Vercel deployment status missing (waiting)");
      } else {
        warnings.push("Vercel – majalis-majalis status not reported yet");
      }
    } else if (vercelDeploy.state === "fail") {
      vercelPreviewKind = "failed";
      if (isContentAudit || !req.previewSmoke) {
        warnings.push(
          "Vercel Preview fail ignored for content-safe / Fast Lane (production ينشر من main فقط)",
        );
      } else {
        hardBlockers.push(`Vercel deployment not green (${vercelDeploy.state})`);
      }
    }

    if (req.postgres) {
      if (postgres.state === "pending" || postgres.state === "missing") {
        waitBlockers.push(`postgres-integration not ready (${postgres.state})`);
      } else if (postgres.state === "fail") {
        hardBlockers.push(`postgres-integration not green (${postgres.state})`);
      } else if (postgres.state === "skip") {
        hardBlockers.push("postgres-integration skipped but required for risky paths");
      }
    } else if (postgres.state === "skip" || postgres.state === "missing") {
      warnings.push(
        `postgres-integration ${postgres.state} — OK (not required for lane ${pathLane.lane})`,
      );
    } else if (postgres.state === "fail") {
      warnings.push("postgres-integration failed but not required for this path lane");
    }

    if (req.colorContrast) {
      if (colorContrast.state === "pending") {
        waitBlockers.push(`Color contrast gate not ready (${colorContrast.state})`);
      } else if (colorContrast.state === "fail") {
        hardBlockers.push(`Color contrast gate not green (${colorContrast.state})`);
      } else if (colorContrast.state === "skip" || colorContrast.state === "missing") {
        // missing: job not reported yet on some PRs — wait only if UI/CSS lane
        if (colorContrast.state === "missing") {
          waitBlockers.push(`Color contrast gate not ready (${colorContrast.state})`);
        } else {
          hardBlockers.push("Color contrast skipped but required for UI/CSS changes");
        }
      }
    } else if (
      colorContrast.state === "skip" ||
      colorContrast.state === "missing" ||
      colorContrast.state === "pass"
    ) {
      if (colorContrast.state !== "pass") {
        warnings.push(
          `Color contrast ${colorContrast.state} — OK (not required for lane ${pathLane.lane})`,
        );
      }
    }

    if (hasIos && (iosStatic.state === "fail" || iosStatic.state === "pending" || iosStatic.state === "missing")) {
      if (iosStatic.state === "pending" || iosStatic.state === "missing") {
        waitBlockers.push(`iOS static gates required for native changes (${iosStatic.state})`);
      } else {
        hardBlockers.push(`iOS static gates required for native changes (${iosStatic.state})`);
      }
    } else if (iosStatic.state === "fail") {
      hardBlockers.push(`iOS static gates not green (${iosStatic.state})`);
    } else if (iosStatic.state === "pending") {
      waitBlockers.push(`iOS static gates not ready (${iosStatic.state})`);
    }
  } else if (vercelDeploy.ignoredPreview || vercelDeploy.state === "skip") {
    vercelPreviewKind = "ignored";
  } else if (vercelDeploy.state === "pass") {
    vercelPreviewKind = "green";
  }

  const dedupe = (list) => {
    const seen = new Set();
    const out = [];
    for (const b of list) {
      if (seen.has(b)) continue;
      seen.add(b);
      out.push(b);
    }
    return out;
  };

  const uniqueHard = dedupe(hardBlockers);
  const uniqueWait = dedupe(waitBlockers);
  const blockers = [...uniqueHard, ...uniqueWait];
  const waiting = uniqueHard.length === 0 && uniqueWait.length > 0;
  const eligible = uniqueHard.length === 0 && uniqueWait.length === 0;
  const willDeployProduction = eligible || waiting;

  return {
    eligible,
    waiting,
    prType,
    hasSafeLabel,
    isContentAudit,
    blockers,
    hardBlockers: uniqueHard,
    waitBlockers: uniqueWait,
    warnings,
    dangerousFiles,
    authHits,
    nonContentFiles,
    fileSummary,
    hasMigration,
    hasIos,
    hasCicd,
    suggestedAddLabels: [...new Set(suggestedAddLabels)],
    suggestedRemoveLabels: [...new Set(suggestedRemoveLabels)],
    needsManualReview: uniqueHard.length > 0,
    vercelPreviewKind,
    willDeployProductionAfterMerge: willDeployProduction && !uniqueHard.length,
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
      contentSafe: isContentAudit,
    },
    pathLane: {
      lane: pathLane.lane,
      needBuild: pathLane.needBuild,
      needMushaf: pathLane.needMushaf,
      needPostgres: pathLane.needPostgres,
      needFastLane: pathLane.needFastLane,
      requiredChecks: pathLane.requiredChecks,
      manualReview: pathLane.manualReview,
    },
  };
}
