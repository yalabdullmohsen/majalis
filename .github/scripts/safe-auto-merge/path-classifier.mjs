/**
 * Path-based CI / safe-auto-merge lane classifier.
 * Pure functions — no I/O. Used by CI emit script and eligibility.
 */
import { DANGER_PATH_PATTERNS, AUTH_SECURITY_PATH_PATTERNS } from "./constants.mjs";

/** @typedef {'docs'|'policy'|'content'|'frontend'|'mushaf'|'risky'|'other'} PathKind */
/** @typedef {'docs-only'|'policy-only'|'content-only'|'frontend'|'mushaf'|'risky'|'full'|'mixed'} LaneName */

/**
 * @param {string} p
 * @returns {boolean}
 */
export function isDocsPath(p) {
  const s = String(p || "");
  return /^docs\//i.test(s) || /^\.github\/docs\//i.test(s) || /\.md$/i.test(s);
}

/**
 * @param {string} p
 * @returns {boolean}
 */
export function isPolicyPath(p) {
  const s = String(p || "");
  return (
    /^\.github\/scripts\/safe-auto-merge\//i.test(s) ||
    /^scripts\/verify-no-unsafe-auto-merge\.mjs$/i.test(s) ||
    /^\.github\/workflows\/auto-merge-to-main\.yml$/i.test(s) ||
    /^\.github\/workflows\/pr-safe-merge-report\.yml$/i.test(s) ||
    /^\.github\/workflows\/vercel-check\.yml$/i.test(s) ||
    /^\.github\/workflows\/preview-smoke\.yml$/i.test(s) ||
    /^\.github\/workflows\/tasmee3_ci\.yml$/i.test(s) ||
    /^\.github\/workflows\/owner-bootstrap\.yml$/i.test(s) ||
    /^\.github\/workflows\/platform-bootstrap\.yml$/i.test(s) ||
    /^\.github\/workflows\/production-bootstrap\.yml$/i.test(s) ||
    /^\.github\/workflows\/phase2-trial-import\.yml$/i.test(s) ||
    /^artifacts\/majalis\/vercel\.json$/i.test(s)
  );
}

/**
 * @param {string} p
 * @returns {boolean}
 */
export function isContentPath(p) {
  const s = String(p || "");
  return (
    /^artifacts\/majalis\/public\/data\//i.test(s) ||
    /^artifacts\/majalis\/data\//i.test(s) ||
    /^CONTINUATION_PLAN\.md$/i.test(s)
  );
}

/**
 * Mushaf / Quran / QPC / fonts / import tooling.
 * @param {string} p
 * @returns {boolean}
 */
export function isMushafPath(p) {
  const s = String(p || "");
  if (/public\/fonts\/qpc-v2/i.test(s)) return true;
  return /mushaf|quran-import|\bqpc\b|qpc-v2|quran/i.test(s) || /\/fonts\//i.test(s);
}

/**
 * @param {string} p
 * @returns {boolean}
 */
export function isFrontendPath(p) {
  const s = String(p || "");
  if (/^artifacts\/majalis\/index\.html$/i.test(s)) return true;
  if (/^artifacts\/majalis\/src\//i.test(s)) return true;
  if (/^artifacts\/majalis\/lib\//i.test(s)) return true;
  if (/^artifacts\/majalis\/.*\.css$/i.test(s)) return true;
  return false;
}

/**
 * UI / CSS surfaces that warrant color-contrast.
 * @param {string} p
 * @returns {boolean}
 */
export function isUiCssPath(p) {
  const s = String(p || "");
  return (
    /\.css$/i.test(s) ||
    /\/components\//i.test(s) ||
    /\/pages\//i.test(s) ||
    /\/views\//i.test(s) ||
    /index\.css$/i.test(s) ||
    /quran\.css$/i.test(s)
  );
}

/**
 * Policy-owned workflow files — not treated as risky CI/CD for Fast Lane.
 * (Other `.github/workflows/**` remain risky / manual review.)
 * @param {string} p
 */
function isPolicyWorkflowAllowlist(p) {
  return (
    /^\.github\/workflows\/auto-merge-to-main\.yml$/i.test(p) ||
    /^\.github\/workflows\/pr-safe-merge-report\.yml$/i.test(p) ||
    /^\.github\/workflows\/vercel-check\.yml$/i.test(p) ||
    /^\.github\/workflows\/preview-smoke\.yml$/i.test(p) ||
    /^\.github\/workflows\/tasmee3_ci\.yml$/i.test(p) ||
    /^\.github\/workflows\/owner-bootstrap\.yml$/i.test(p) ||
    /^\.github\/workflows\/platform-bootstrap\.yml$/i.test(p) ||
    /^\.github\/workflows\/production-bootstrap\.yml$/i.test(p) ||
    /^\.github\/workflows\/phase2-trial-import\.yml$/i.test(p)
  );
}

/**
 * @param {string} p
 * @returns {boolean}
 */
export function isRiskyPath(p) {
  const s = String(p || "");
  // Allowlisted policy workflows / throughput paths are not risky.
  if (isPolicyWorkflowAllowlist(s)) return false;
  if (/^artifacts\/majalis\/vercel\.json$/i.test(s)) return false;
  for (const re of DANGER_PATH_PATTERNS) {
    if (re.test(s)) return true;
  }
  for (const re of AUTH_SECURITY_PATH_PATTERNS) {
    if (re.test(s)) return true;
  }
  if (/^supabase\//i.test(s)) return true;
  if (/^artifacts\/majalis\/supabase\//i.test(s)) return true;
  if (/^api\//i.test(s)) return true;
  if (/^artifacts\/majalis\/api\//i.test(s)) return true;
  if (/^ios\//i.test(s)) return true;
  if (/^artifacts\/majalis\/ios\//i.test(s)) return true;
  if (/capacitor/i.test(s)) return true;
  if (/^\.github\/workflows\//i.test(s)) return true;
  if (/^package\.json$/i.test(s) || /^pnpm-lock\.yaml$/i.test(s)) return true;
  if (/\.sql$/i.test(s) || /migration/i.test(s)) return true;
  if (/\brls\b|row.?level.?security|security.?definer/i.test(s)) return true;
  return false;
}

/**
 * Classify a single path (highest-severity kind wins).
 * @param {string} p
 * @returns {PathKind}
 */
export function classifyOnePath(p) {
  if (isRiskyPath(p)) return "risky";
  if (isMushafPath(p)) return "mushaf";
  if (isContentPath(p)) return "content";
  if (isFrontendPath(p)) return "frontend";
  if (isPolicyPath(p)) return "policy";
  if (isDocsPath(p)) return "docs";
  return "other";
}

/**
 * @param {string[]} paths
 * @param {{ forceFull?: boolean }} [opts]
 */
export function classifyChangedPaths(paths = [], opts = {}) {
  const list = (paths || []).map((p) => String(p || "").replace(/\\/g, "/")).filter(Boolean);
  const kinds = {
    docs: false,
    policy: false,
    content: false,
    frontend: false,
    mushaf: false,
    risky: false,
    other: false,
  };
  /** @type {Record<string, PathKind>} */
  const byPath = {};
  let hasUiCss = false;

  for (const p of list) {
    const kind = classifyOnePath(p);
    byPath[p] = kind;
    kinds[kind] = true;
    if (isUiCssPath(p)) hasUiCss = true;
  }

  if (opts.forceFull) {
    return finalizeClassification({
      kinds: {
        docs: false,
        policy: false,
        content: false,
        frontend: true,
        mushaf: true,
        risky: true,
        other: true,
      },
      byPath,
      hasUiCss: true,
      forceFull: true,
      paths: list,
    });
  }

  return finalizeClassification({ kinds, byPath, hasUiCss, forceFull: false, paths: list });
}

/**
 * @param {{
 *   kinds: Record<string, boolean>,
 *   byPath: Record<string, PathKind>,
 *   hasUiCss: boolean,
 *   forceFull: boolean,
 *   paths: string[],
 * }} input
 */
function finalizeClassification(input) {
  const { kinds, byPath, hasUiCss, forceFull, paths } = input;

  const needPostgres = Boolean(kinds.risky || forceFull);
  // بوابات المصحف عند لمس مسارات واجهة/بيانات المصحف أو QPC
  const needMushaf = Boolean(kinds.mushaf || forceFull);
  const needFrontendBuild = Boolean(
    kinds.frontend || kinds.mushaf || kinds.risky || kinds.content || kinds.other || forceFull,
  );
  // Docs / policy only → Fast Lane (no Vite build / mushaf / postgres).
  const needFastLane =
    !needFrontendBuild &&
    !needMushaf &&
    !needPostgres &&
    (kinds.docs || kinds.policy) &&
    !kinds.content &&
    !kinds.frontend &&
    !kinds.other;

  const needBuild = needFrontendBuild;
  const needPolicyTests = Boolean(kinds.policy);
  const needColorContrast = Boolean(
    forceFull || kinds.risky || kinds.mushaf || (kinds.frontend && hasUiCss),
  );
  // Verify build وحده شرط الدمج — هذه تبقى إعلامية/متوقفة تلقائيًا (CI_THROUGHPUT).
  const needPreviewSmoke = false;
  const needVercelCheck = false;

  /** @type {LaneName} */
  let lane = "docs-only";
  if (forceFull) lane = "full";
  else if (kinds.risky) lane = "risky";
  else if (kinds.mushaf) lane = "mushaf";
  else if (kinds.frontend || kinds.other) lane = "frontend";
  else if (kinds.content) lane = "content-only";
  else if (kinds.policy && !kinds.docs) lane = "policy-only";
  else if (kinds.docs && kinds.policy) lane = "policy-only";
  else if (kinds.docs) lane = "docs-only";
  else if (paths.length === 0) lane = "full";
  else lane = "frontend";

  const manualReview = Boolean(kinds.risky);

  const requiredChecks = {
    verifyBuild: true,
    build: needBuild,
    mushafMeasure: needMushaf,
    mushafGates: needMushaf,
    layoutBands: needMushaf,
    visualSnapshot: needMushaf,
    fastLane: needFastLane,
    postgres: needPostgres,
    colorContrast: false,
    previewSmoke: needPreviewSmoke,
    vercelCheck: needVercelCheck,
  };

  return {
    lane,
    kinds,
    byPath,
    paths,
    hasUiCss,
    forceFull: Boolean(forceFull),
    manualReview,
    needBuild,
    needFastLane,
    needMushaf,
    needPostgres,
    needColorContrast,
    needPreviewSmoke,
    needVercelCheck,
    needPolicyTests,
    requiredChecks,
    /** GitHub Actions outputs (string booleans). */
    outputs: {
      lane,
      need_build: needBuild ? "true" : "false",
      need_fast_lane: needFastLane ? "true" : "false",
      need_mushaf: needMushaf ? "true" : "false",
      need_postgres: needPostgres ? "true" : "false",
      need_color_contrast: needColorContrast ? "true" : "false",
      need_preview_smoke: needPreviewSmoke ? "true" : "false",
      need_policy_tests: needPolicyTests ? "true" : "false",
      manual_review: manualReview ? "true" : "false",
    },
  };
}

/**
 * Whether a check result is acceptable for auto-merge given classification.
 * @param {keyof ReturnType<typeof classifyChangedPaths>['requiredChecks'] | string} checkKey
 * @param {'pass'|'fail'|'pending'|'missing'|'skip'|'other'} state
 * @param {ReturnType<typeof classifyChangedPaths>} classification
 */
export function isCheckSatisfied(checkKey, state, classification) {
  const req = classification?.requiredChecks?.[checkKey];
  if (req === false) {
    // Not required: skip / missing / pass OK; fail is unexpected but do not block merge.
    return state === "pass" || state === "skip" || state === "missing" || state === "other";
  }
  // Required
  if (state === "pass") return true;
  if (state === "skip") return false; // required check must not be skipped
  return false;
}
