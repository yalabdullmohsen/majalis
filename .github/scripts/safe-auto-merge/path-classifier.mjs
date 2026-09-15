/**
 * Path-based CI / safe-auto-merge lane classifier.
 * Pure functions — no I/O. Used by CI emit script and eligibility.
 */
import { DANGER_PATH_PATTERNS, AUTH_SECURITY_PATH_PATTERNS } from "./constants.mjs";

/** @typedef {'docs'|'policy'|'content'|'frontend'|'mushaf'|'native'|'risky'|'other'} PathKind */
/** @typedef {'docs-only'|'ci-config'|'policy-only'|'content-only'|'web-logic'|'visual'|'frontend'|'mushaf'|'native'|'risky'|'full'|'mixed'} LaneName */

/**
 * @param {string} p
 * @returns {boolean}
 */
export function isDocsPath(p) {
  const s = String(p || "");
  return (
    /^docs\//i.test(s) ||
    /^\.github\/docs\//i.test(s) ||
    /^\.cursor\//i.test(s) ||
    /^cursor\//i.test(s) ||
    /^AGENTS\.md$/i.test(s) ||
    /\.md$/i.test(s) ||
    /\.mdc$/i.test(s)
  );
}

/**
 * @param {string} p
 * @returns {boolean}
 */
export function isPolicyPath(p) {
  const s = String(p || "");
  return (
    /^\.github\/scripts\/safe-auto-merge\//i.test(s) ||
    /^\.github\/scripts\/ci\//i.test(s) ||
    /^\.github\/actions\//i.test(s) ||
    /^scripts\/verify-no-unsafe-auto-merge\.mjs$/i.test(s) ||
    /^scripts\/verify-ci\.mjs$/i.test(s) ||
    /^scripts\/verify-preflight\.mjs$/i.test(s) ||
    /^scripts\/verify-fingerprint\.mjs$/i.test(s) ||
    /^scripts\/verify-changed-scope\.mjs$/i.test(s) ||
    /^scripts\/ci\//i.test(s) ||
    /^scripts\/git-hooks\//i.test(s) ||
    /^scripts\/__tests__\/(agent-throughput|verify-ci|verify-preflight|aggregator|path-lane)/i.test(
      s,
    ) ||
    /^reports\/changed-scope/i.test(s) ||
    /^\.gitignore$/i.test(s) ||
    /^package\.json$/i.test(s) ||
    /^\.github\/workflows\/ci\.yml$/i.test(s) ||
    /^\.github\/workflows\/auto-merge-to-main\.yml$/i.test(s) ||
    /^\.github\/workflows\/pr-safe-merge-report\.yml$/i.test(s) ||
    /^\.github\/workflows\/vercel-check\.yml$/i.test(s) ||
    /^\.github\/workflows\/preview-smoke\.yml$/i.test(s) ||
    /^\.github\/workflows\/tasmee3_ci\.yml$/i.test(s) ||
    /^\.github\/workflows\/owner-bootstrap\.yml$/i.test(s) ||
    /^\.github\/workflows\/platform-bootstrap\.yml$/i.test(s) ||
    /^\.github\/workflows\/production-bootstrap\.yml$/i.test(s) ||
    /^\.github\/workflows\/phase2-trial-import\.yml$/i.test(s) ||
    /^\.github\/workflows\/harvest-sources\.yml$/i.test(s) ||
    /^\.github\/workflows\/auto-deploy\.yml$/i.test(s) ||
    /^\.github\/workflows\/auto-maintenance\.yml$/i.test(s) ||
    /^scripts\/auto-maintenance\//i.test(s) ||
    /^artifacts\/majalis\/vercel\.json$/i.test(s)
  );
}

/**
 * Capacitor / iOS / Android surfaces — native lane (لا Postgres افتراضيًا).
 * @param {string} p
 * @returns {boolean}
 */
export function isNativePath(p) {
  const s = String(p || "");
  return (
    /^ios\//i.test(s) ||
    /^android\//i.test(s) ||
    /^artifacts\/majalis\/ios\//i.test(s) ||
    /^artifacts\/majalis\/android\//i.test(s) ||
    /capacitor/i.test(s) ||
    /^\.github\/workflows\/ios-/i.test(s)
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
    /^artifacts\/majalis\/scripts\/harvest\//i.test(s) ||
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
 * UI / CSS surfaces that warrant color-contrast + visual/LHCI.
 * منطق TS فقط (web-logic) لا يدخل هنا.
 * @param {string} p
 * @returns {boolean}
 */
export function isUiCssPath(p) {
  const s = String(p || "");
  return (
    /\.css$/i.test(s) ||
    /\.tsx$/i.test(s) ||
    /\/components\//i.test(s) ||
    /\/pages\//i.test(s) ||
    /\/views\//i.test(s) ||
    /\/styles\//i.test(s) ||
    /index\.html$/i.test(s) ||
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
    /^\.github\/workflows\/ci\.yml$/i.test(p) ||
    /^\.github\/workflows\/auto-merge-to-main\.yml$/i.test(p) ||
    /^\.github\/workflows\/pr-safe-merge-report\.yml$/i.test(p) ||
    /^\.github\/workflows\/vercel-check\.yml$/i.test(p) ||
    /^\.github\/workflows\/preview-smoke\.yml$/i.test(p) ||
    /^\.github\/workflows\/tasmee3_ci\.yml$/i.test(p) ||
    /^\.github\/workflows\/owner-bootstrap\.yml$/i.test(p) ||
    /^\.github\/workflows\/platform-bootstrap\.yml$/i.test(p) ||
    /^\.github\/workflows\/production-bootstrap\.yml$/i.test(p) ||
    /^\.github\/workflows\/phase2-trial-import\.yml$/i.test(p) ||
    /^\.github\/workflows\/harvest-sources\.yml$/i.test(p) ||
    /^\.github\/workflows\/auto-deploy\.yml$/i.test(p) ||
    /^\.github\/workflows\/auto-maintenance\.yml$/i.test(p)
  );
}

/**
 * @param {string} p
 * @returns {boolean}
 */
export function isRiskyPath(p) {
  const s = String(p || "");
  // Allowlisted policy workflows / throughput paths are not risky.
  if (isPolicyPath(s) || isPolicyWorkflowAllowlist(s)) return false;
  if (/^artifacts\/majalis\/vercel\.json$/i.test(s)) return false;
  if (/^scripts\/auto-maintenance\//i.test(s)) return false;
  // Native handled separately (lane=native) — not DB/postgres risky by default.
  if (isNativePath(s)) return false;
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
  if (/^\.github\/workflows\//i.test(s)) return true;
  // lockfile = تبعية جديدة → risky؛ package.json وحده = policy (scripts/meta)
  if (/^pnpm-lock\.yaml$/i.test(s)) return true;
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
  if (isNativePath(p)) return "native";
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
    native: false,
    risky: false,
    other: false,
  };
  /** @type {Record<string, PathKind>} */
  const byPath = {};
  /** @type {Record<string, string[]>} */
  const filesByKind = {
    docs: [],
    policy: [],
    content: [],
    frontend: [],
    mushaf: [],
    native: [],
    risky: [],
    other: [],
  };
  let hasUiCss = false;

  for (const p of list) {
    const kind = classifyOnePath(p);
    byPath[p] = kind;
    kinds[kind] = true;
    filesByKind[kind].push(p);
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
        native: true,
        risky: true,
        other: true,
      },
      byPath,
      filesByKind,
      hasUiCss: true,
      forceFull: true,
      paths: list,
    });
  }

  return finalizeClassification({
    kinds,
    byPath,
    filesByKind,
    hasUiCss,
    forceFull: false,
    paths: list,
  });
}

/**
 * @param {{
 *   kinds: Record<string, boolean>,
 *   byPath: Record<string, PathKind>,
 *   filesByKind: Record<string, string[]>,
 *   hasUiCss: boolean,
 *   forceFull: boolean,
 *   paths: string[],
 * }} input
 */
function finalizeClassification(input) {
  const { kinds, byPath, filesByKind, hasUiCss, forceFull, paths } = input;

  const needPostgres = Boolean(kinds.risky || forceFull);
  const needNative = Boolean(kinds.native || forceFull);
  const needMushaf = Boolean(kinds.mushaf || forceFull);
  const needFrontendBuild = Boolean(
    kinds.frontend ||
      kinds.mushaf ||
      kinds.risky ||
      kinds.native ||
      kinds.content ||
      kinds.other ||
      forceFull,
  );
  // Docs / policy / ci-config only → Fast Lane (no Vite build / mushaf / postgres).
  const needFastLane =
    !needFrontendBuild &&
    !needMushaf &&
    !needPostgres &&
    !needNative &&
    (kinds.docs || kinds.policy) &&
    !kinds.content &&
    !kinds.frontend &&
    !kinds.other;

  const needBuild = needFrontendBuild;
  const needPolicyTests = Boolean(kinds.policy);

  // visual/LHCI: أسطح UI فعلية أو مصحف أو risky/full — ليس لكل ملف TS منطقي أو other.
  const needVisual =
    Boolean(forceFull) ||
    Boolean(kinds.mushaf) ||
    Boolean(kinds.risky) ||
    Boolean(hasUiCss);

  // التباين يتطلّب بناءًا + سطح UI/CSS (أو visual مطلوب).
  const needColorContrast =
    Boolean(needBuild) && (needVisual || Boolean(hasUiCss));

  const needPreviewSmoke = false;
  const needVercelCheck = false;

  const activeKinds = Object.entries(kinds)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const multiKind = activeKinds.length > 1;

  /** @type {LaneName} */
  let lane = "docs-only";
  let laneReason = "no matching paths";
  if (forceFull) {
    lane = "full";
    laneReason = "forceFull / main / empty-diff / release";
  } else if (multiKind && (kinds.risky || kinds.mushaf || kinds.native || kinds.frontend)) {
    lane = "mixed";
    laneReason = `multiple kinds: ${activeKinds.join("+")}`;
  } else if (kinds.risky) {
    lane = "risky";
    laneReason = "danger/supabase/api/lockfile/workflow";
  } else if (kinds.native) {
    lane = "native";
    laneReason = "capacitor/ios/android paths";
  } else if (kinds.mushaf) {
    lane = "mushaf";
    laneReason = "quran/mushaf/qpc paths";
  } else if (kinds.frontend || kinds.other) {
    if (hasUiCss) {
      lane = "visual";
      laneReason = "UI/CSS/TSX surfaces";
    } else {
      lane = "web-logic";
      laneReason = "frontend logic without UI surface";
    }
  } else if (kinds.content) {
    lane = "content-only";
    laneReason = "public/data or harvest content";
  } else if (kinds.policy && !kinds.docs) {
    lane = "ci-config";
    laneReason = "CI/scripts/actions/package.json policy";
  } else if (kinds.docs && kinds.policy) {
    lane = "ci-config";
    laneReason = "docs + CI/policy";
  } else if (kinds.docs) {
    lane = "docs-only";
    laneReason = "documentation / .cursor / markdown";
  } else if (paths.length === 0) {
    lane = "full";
    laneReason = "empty path list";
  } else {
    lane = "web-logic";
    laneReason = "fallback";
  }

  // توافق خلفي: policy-only اسم مستعار لـ ci-config في المخرجات النصية القديمة
  const laneCompat = lane === "ci-config" ? "ci-config" : lane;

  const manualReview = Boolean(kinds.risky || kinds.native);

  const requiredChecks = {
    verifyBuild: true,
    build: needBuild,
    mushafMeasure: needMushaf,
    mushafGates: needMushaf,
    layoutBands: needMushaf,
    visualSnapshot: needVisual,
    fastLane: needFastLane,
    postgres: needPostgres,
    colorContrast: needColorContrast,
    previewSmoke: needPreviewSmoke,
    vercelCheck: needVercelCheck,
    native: needNative,
  };

  return {
    lane: laneCompat,
    laneReason,
    kinds,
    byPath,
    filesByKind,
    paths,
    hasUiCss,
    forceFull: Boolean(forceFull),
    manualReview,
    needBuild,
    needFastLane,
    needMushaf,
    needPostgres,
    needNative,
    needVisual,
    needColorContrast,
    needPreviewSmoke,
    needVercelCheck,
    needPolicyTests,
    requiredChecks,
    /** GitHub Actions outputs (string booleans). */
    outputs: {
      lane: laneCompat,
      lane_reason: laneReason.replace(/\n/g, " ").slice(0, 200),
      need_build: needBuild ? "true" : "false",
      need_fast_lane: needFastLane ? "true" : "false",
      need_mushaf: needMushaf ? "true" : "false",
      need_postgres: needPostgres ? "true" : "false",
      need_native: needNative ? "true" : "false",
      need_visual: needVisual ? "true" : "false",
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
