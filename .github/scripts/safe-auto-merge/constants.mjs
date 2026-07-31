/**
 * Safe auto-merge policy — labels, path gates, size limits.
 * Auto-merge stays enabled; dangerous PRs require manual review.
 */

/** At least one required for auto-merge eligibility. */
export const SAFE_LABELS = Object.freeze([
  "content-safe",
  "ui-safe",
  "code-safe",
  "tests-safe",
  "maintenance-safe",
]);

/** Owned by scheduled release train — never auto-merge here. */
export const RELEASE_TRAIN_LABEL = "release-train-ready";

export const MAX_FILES_FOR_AUTO_MERGE = 40;

/** Aggregate deletions across the PR (lines). */
export const MAX_TOTAL_DELETIONS = 400;

/** Files with changeType DELETED (or deletions-only removals). */
export const MAX_DELETED_FILES = 12;

/**
 * Paths that always force manual review (no auto-merge).
 * Keep in sync with product policy in AUTOMATION_SETUP.md.
 */
export const DANGER_PATH_PATTERNS = Object.freeze([
  /^supabase\/migrations\//i,
  /^artifacts\/majalis\/supabase\//i,
  /^\.github\/workflows\//i,
  /^fastlane\//i,
  /^artifacts\/majalis\/ios\//i,
  /^package\.json$/i,
  /^pnpm-lock\.yaml$/i,
  /(^|\/)vercel\.json$/i,
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

export const BRANCH_ALLOW_RE =
  /^((cursor|session|claude|automation|fix|feature|security|docs|chore)\/|majalis-content-fill$)/;

export const BRANCH_EXCLUDE_RE = /^(automation\/content|automation\/tasks)$/;

/** Check names we care about in reports / gates. */
export const REQUIRED_CHECK_NAMES = Object.freeze({
  verifyBuild: /^(Verify build|quality)$/i,
  previewSmoke: /^preview-smoke$/i,
  vercelCheck: /^lint-typecheck-build$/i,
  postgres: /^postgres-integration$/i,
  xcodebuild: /^xcodebuild-simulator$/i,
  vercelDeploy: /Vercel\s*[–-]\s*majalis-majalis/i,
});

export const REPORT_MARKER_BEGIN = "<!-- majalis-safe-auto-merge-report -->";
export const REPORT_MARKER_END = "<!-- /majalis-safe-auto-merge-report -->";
