/**
 * Safe auto-merge policy — labels, path gates, size limits.
 * Auto-merge stays enabled; dangerous PRs require manual review.
 */

/**
 * Optional classification labels for reporting / domain clarity.
 * Not required for low-risk auto-merge after green checks (path/size/CI gates still apply).
 * New `safe:*` names are preferred; legacy `*-safe` kept for compatibility.
 */
export const SAFE_LABELS = Object.freeze([
  "safe:auto-merge",
  "safe:content",
  "safe:ui",
  "safe:test",
  // legacy aliases
  "content-safe",
  "ui-safe",
  "code-safe",
  "tests-safe",
  "maintenance-safe",
]);

/** Preferred domain labels (documentation / reporting). */
export const SAFE_DOMAIN_LABELS = Object.freeze([
  "safe:content",
  "safe:ui",
  "safe:test",
]);

/** Explicit opt-in for immediate squash auto-merge. */
export const SAFE_AUTO_MERGE_LABEL = "safe:auto-merge";

/** Owned by scheduled release train — never auto-merge here. */
export const RELEASE_TRAIN_LABEL = "release-train-ready";

/** Applied when danger paths are detected (blocks auto-merge). */
export const BLOCKED_DANGER_PATH_LABEL = "blocked:danger-path";

/** Applied when policy requires human review. */
export const RISKY_MANUAL_REVIEW_LABEL = "risky:manual-review";

/** محتوى شرعي/علمي يحتاج مراجعة بشرية قبل الدمج. */
export const NEEDS_CONTENT_REVIEW_LABEL = "needs-content-review";

/**
 * Labels that block Production deploy after merge to main.
 * Classification labels must NEVER appear here.
 */
export const NO_DEPLOY_LABELS = Object.freeze(["no-deploy", "hold"]);

/**
 * Default classification labels auto-applied when a PR is unlabeled.
 * Used for reporting only — never gate main Production deploy.
 */
export const CLASSIFICATION_LABELS = Object.freeze([
  "content-safe",
  "ui",
  "perf",
  "ios",
  "ci",
  "docs",
]);

export const MAX_FILES_FOR_AUTO_MERGE = 40;

/** Aggregate deletions across the PR (lines). */
export const MAX_TOTAL_DELETIONS = 400;

/** Files with changeType DELETED (or deletions-only removals). */
export const MAX_DELETED_FILES = 12;

/**
 * Paths that always force manual review (no auto-merge).
 * Keep in sync with .github/docs/SAFE_AUTO_MERGE.md
 */
/**
 * Labels that mean "content audit only" — files must stay inside CONTENT_SAFE_PATHS.
 */
export const CONTENT_SAFE_LABELS = Object.freeze(["content-safe", "safe:content"]);

/**
 * Allowed paths for content-safe / safe:content auto-merge.
 * Quiz JSON + content audit artifacts / continuation plan only.
 */
export const CONTENT_SAFE_PATH_PATTERNS = Object.freeze([
  /^artifacts\/majalis\/public\/data\/quiz\//i,
  /^artifacts\/majalis\/public\/data\//i,
  /^artifacts\/majalis\/data\//i,
  /^CONTINUATION_PLAN\.md$/i,
]);

export const DANGER_PATH_PATTERNS = Object.freeze([
  /^\.github\/workflows\//i,
  /^supabase\//i,
  /^artifacts\/majalis\/supabase\//i,
  /^ios\//i,
  /^artifacts\/majalis\/ios\//i,
  /(^|\/)capacitor\.config\./i,
  /^api\//i,
  /^artifacts\/majalis\/api\//i,
  /^artifacts\/majalis\/lib\/api-handlers\//i,
  /^artifacts\/majalis\/lib\/security\//i,
  /^artifacts\/majalis\/lib\/auth\//i,
  /^artifacts\/majalis\/lib\/jobs\//i,
  /^package\.json$/i,
  /^pnpm-lock\.yaml$/i,
  /(^|\/)vercel\.json$/i,
  /^fastlane\//i,
  // secrets / sensitive config
  /(^|\/)\.env(\.|$)/i,
  /(^|\/)secrets?[./]/i,
  /Config\.xcconfig$/i,
  /\.p8$/i,
  /\.pem$/i,
  /service[_-]?role/i,
  /SUPABASE_SERVICE/i,
  /AuthKey_/i,
]);

/**
 * مسارات مستثناة من danger-path للدمج التلقائي (throughput):
 * تعطيل فحوص مكررة / bootstrap يدوي / قصر نشر Vercel على main.
 * ci.yml وauto-deploy وrelease وios-testflight تبقى خطرًا.
 */
export const AUTO_MERGE_PATH_ALLOWLIST = Object.freeze([
  /^\.github\/workflows\/auto-merge-to-main\.yml$/i,
  /^\.github\/workflows\/pr-safe-merge-report\.yml$/i,
  /^\.github\/workflows\/vercel-check\.yml$/i,
  /^\.github\/workflows\/preview-smoke\.yml$/i,
  /^\.github\/workflows\/tasmee3_ci\.yml$/i,
  /^\.github\/workflows\/owner-bootstrap\.yml$/i,
  /^\.github\/workflows\/platform-bootstrap\.yml$/i,
  /^\.github\/workflows\/production-bootstrap\.yml$/i,
  /^\.github\/workflows\/phase2-trial-import\.yml$/i,
  /^\.github\/workflows\/harvest-sources\.yml$/i,
  /^\.github\/workflows\/auto-maintenance\.yml$/i,
  /^scripts\/auto-maintenance\//i,
  /^artifacts\/majalis\/vercel\.json$/i,
]);

export function isAutoMergeAllowlistedPath(path) {
  const p = String(path || "");
  return AUTO_MERGE_PATH_ALLOWLIST.some((re) => re.test(p));
}

/** Auth / security / RLS signals (paths or basename cues). */
export const AUTH_SECURITY_PATH_PATTERNS = Object.freeze([
  /(^|\/)auth\//i,
  /rls[_-]?polic/i,
  /row.?level.?security/i,
  /security.?definer/i,
  /KeychainStore/i,
  /NetworkService\.swift$/i,
  /middleware.*auth/i,
  /policy\.sql$/i,
  /grant\s+/i,
]);

/** Title/body keywords that force manual review (high-signal only). */
export const AUTH_SECURITY_TEXT =
  /\b(security\s+definer|service[_-]?role|auth\s+bypass|jwt\s+secret)\b/i;

/** Labels that explicitly block auto-merge. */
export const BLOCKING_LABELS = Object.freeze([
  "risky:manual-review",
  "blocked:danger-path",
  "needs-content-review",
  "manual-review",
  "no-auto-merge",
  "sql",
  "migration",
  "auth",
  "rls",
  "ios-native",
  "security-definer",
]);

export const TITLE_BLOCK_RE = /NO-AUTO-MERGE|دون دمج|do-not-merge/i;

/**
 * فرع/عناوين تدقيق المحتوى التلقائي (content-runner) — يُستبعد من
 * auto-merge وتعليقات التقرير (2026-08-03، طلب إيقاف التدقيق التلقائي).
 * يبقى مسار PR اليدوي عبر فروع cursor/fix/… مع وسم content-safe ممكنًا.
 */
export const AUTOMATIC_CONTENT_AUDIT_BRANCH_RE = /^(majalis-content-fill)$/;

export const AUTOMATIC_CONTENT_AUDIT_TITLE_RE =
  /^تدقيق محتوى(\s|:)|تدقيق محتوى منظ/u;

export const BRANCH_ALLOW_RE =
  /^((cursor|session|claude|codex|automation|fix|feature|security|docs|chore)\/)/;

/**
 * Hard-excluded from auto-merge only (automatic content-fill runner).
 * `automation/content` and `automation/tasks` are allowed to auto-merge when
 * path/size/CI gates pass — missing labels must not block, and a merge to
 * `main` always triggers Vercel Production unless `no-deploy`/`hold`.
 */
export const BRANCH_EXCLUDE_RE = /^(majalis-content-fill)$/;

/** Soft dual-automation branches — warn + auto-label, do not hard-block. */
export const BRANCH_SOFT_AUTOMATION_RE =
  /^(automation\/content|automation\/tasks)$/;

/**
 * Check names required before enabling GitHub auto-merge.
 * Individual typecheck/lint/test/build/gates live inside "Verify build".
 */
export const REQUIRED_CHECK_NAMES = Object.freeze({
  verifyBuild: /^(Verify build|quality)$/i,
  previewSmoke: /^preview-smoke$/i,
  vercelCheck: /^lint-typecheck-build$/i,
  postgres: /^postgres-integration$/i,
  colorContrast: /Color contrast/i,
  iosStatic: /iOS static/i,
  xcodebuild: /^xcodebuild-simulator$/i,
  vercelDeploy: /Vercel\s*[–-]\s*majalis-majalis/i,
});

export const REPORT_MARKER_BEGIN = "<!-- majalis-safe-auto-merge-report -->";
export const REPORT_MARKER_END = "<!-- /majalis-safe-auto-merge-report -->";

/** Paths smoke-tested on Preview (must stay aligned with preview-smoke.yml). */
export const PREVIEW_SMOKE_PATHS = Object.freeze([
  "/",
  "/mushaf",
  "/prayer-times",
  "/lessons",
  "/api/healthz",
  "/api/readyz",
]);


/**
 * Infer default classification labels from changed paths.
 * @param {string[]} paths
 * @returns {string[]}
 */
export function classifyLabelsFromPaths(paths = []) {
  const labels = new Set();
  const list = (paths || []).map((p) => String(p || ""));
  if (!list.length) return ["docs"];

  const contentOnly = list.every((p) =>
    CONTENT_SAFE_PATH_PATTERNS.some((re) => re.test(p)) || /\.(md|mdx)$/i.test(p),
  );
  const anyContent = list.some((p) =>
    CONTENT_SAFE_PATH_PATTERNS.some((re) => re.test(p)) ||
    /^artifacts\/majalis\/(public\/)?data\//i.test(p),
  );
  const anyUi = list.some(
    (p) =>
      /^artifacts\/majalis\/src\//i.test(p) ||
      /\.(css|scss|tsx|jsx)$/i.test(p) ||
      /components\//i.test(p),
  );
  const anyPerf = list.some(
    (p) => /perf|lighthouse|budget|lcp|cls|web-vitals/i.test(p),
  );
  const anyIos = list.some(
    (p) =>
      /^ios\//i.test(p) ||
      /capacitor/i.test(p) ||
      /\.(swift|pbxproj)$/i.test(p),
  );
  const anyCi = list.some(
    (p) =>
      /^\.github\//i.test(p) ||
      /^scripts\//i.test(p) ||
      /vercel\.json$/i.test(p),
  );
  const anyDocs = list.some((p) => /^docs\//i.test(p) || /\.(md|mdx)$/i.test(p));

  if (contentOnly && anyContent) labels.add("content-safe");
  else if (anyContent) labels.add("content-safe");
  if (anyUi) labels.add("ui");
  if (anyPerf) labels.add("perf");
  if (anyIos) labels.add("ios");
  if (anyCi) labels.add("ci");
  if (anyDocs && !anyUi && !anyContent && !anyIos) labels.add("docs");
  if (!labels.size) {
    if (anyDocs) labels.add("docs");
    else labels.add("ui");
  }
  return [...labels].filter((l) => CLASSIFICATION_LABELS.includes(l));
}

/**
 * @param {string[]} labels
 * @returns {boolean}
 */
export function hasNoDeployLabel(labels = []) {
  const lower = labels.map((l) => String(l).toLowerCase());
  return NO_DEPLOY_LABELS.some((l) => lower.includes(l));
}
