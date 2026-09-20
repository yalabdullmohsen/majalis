/**
 * Lightweight "a newer deploy exists" detector.
 * Compares the session's baked commit with live /version.json so the UI
 * can offer a quiet bottom-sheet update prompt (no forced reload).
 *
 * Decision path:
 *   App Launch → checkForUpdate → Store(/version.json) vs Current Build
 *   → dismissedVersion → Modal Decision
 *
 * Network / parse failures never surface a modal — fail silent.
 */
import { getBuildMetadata } from "@/lib/error-report";

const VERSION_URL = "/version.json";
export const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000; // كل 5 دقائق
const FETCH_TIMEOUT_MS = 8000;

/** النسخة المتجاهلة عبر «لاحقًا» — تُحفظ حتى يظهر نشر أحدث مختلف. */
export const DISMISSED_VERSION_KEY = "majalis_update_dismissed_version";
export const LAST_CHECK_TIME_KEY = "majalis_update_last_check_time";

type VersionPayload = {
  commit?: string;
  shortCommit?: string;
  commitSha?: string;
  builtAt?: string;
  buildTime?: string;
  ref?: string;
  branch?: string;
  /** تحديث إجباري من الخادم — يخفي «لاحقًا» */
  forceUpdate?: boolean;
  updateRequired?: boolean;
};

export type VersionCheckResult = {
  currentVersion: string | null;
  currentBuild: string | null;
  remoteVersion: string | null;
  remoteBuild: string | null;
  updateAvailable: boolean;
  updateRequired: boolean;
  updateRecommended: boolean;
  skipVersion: string | null;
  lastDismissedVersion: string | null;
  lastCheckTime: number;
  networkError: boolean;
};

/**
 * Commit this tab was actually built with (baked in at build time via
 * VITE_COMMIT_HASH / VITE_VERCEL_GIT_COMMIT_SHA — see getBuildMetadata).
 * Returns null for local/dev builds where there is no real commit to
 * compare against (avoids false-positive "update available" banners).
 */
export function getLoadedCommit(): string | null {
  const { commitHash } = getBuildMetadata();
  if (!commitHash || commitHash === "unknown" || commitHash === "dev") return null;
  return commitHash;
}

/** يوحّد معرّف النشر إلى بادئة 8 أحرف (عقد /version.json العلني). */
export function normalizeVersionId(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === "unknown" || trimmed === "dev") return null;
  return trimmed.slice(0, 8);
}

/**
 * تطابق معرّفات النشر (commit short) — مقارنة بادئة وليست semver نصيًا.
 * مثال: "abcdef12…" ≡ "abcdef12".
 */
export function isSameDeployVersion(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = normalizeVersionId(a);
  const right = normalizeVersionId(b);
  if (!left || !right) return false;
  return left === right || left.startsWith(right) || right.startsWith(left);
}

export function getDismissedVersion(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return normalizeVersionId(localStorage.getItem(DISMISSED_VERSION_KEY));
  } catch {
    return null;
  }
}

export function setDismissedVersion(versionId: string): void {
  const id = normalizeVersionId(versionId);
  if (!id || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(DISMISSED_VERSION_KEY, id);
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearDismissedVersion(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(DISMISSED_VERSION_KEY);
  } catch {
    /* ignore */
  }
}

export function getLastCheckTime(): number {
  if (typeof localStorage === "undefined") return 0;
  try {
    const raw = localStorage.getItem(LAST_CHECK_TIME_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function rememberLastCheckTime(at: number): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(LAST_CHECK_TIME_KEY, String(at));
  } catch {
    /* ignore */
  }
}

function extractLiveId(live: VersionPayload | null): string | null {
  if (!live) return null;
  return normalizeVersionId(live.commitSha || live.shortCommit || live.commit);
}

function isForceFromPayload(live: VersionPayload | null): boolean {
  if (!live) return false;
  return live.forceUpdate === true || live.updateRequired === true;
}

async function fetchLiveVersion(): Promise<{
  payload: VersionPayload | null;
  networkError: boolean;
}> {
  try {
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return { payload: null, networkError: true };
    const payload = (await res.json()) as VersionPayload;
    return { payload, networkError: false };
  } catch {
    return { payload: null, networkError: true };
  }
}

function emptyResult(
  loadedCommit: string,
  overrides: Partial<VersionCheckResult> = {},
): VersionCheckResult {
  const current = normalizeVersionId(loadedCommit);
  const dismissed = getDismissedVersion();
  return {
    currentVersion: current,
    currentBuild: current,
    remoteVersion: null,
    remoteBuild: null,
    updateAvailable: false,
    updateRequired: false,
    updateRecommended: false,
    skipVersion: dismissed,
    lastDismissedVersion: dismissed,
    lastCheckTime: getLastCheckTime(),
    networkError: false,
    ...overrides,
  };
}

/**
 * قرار النافذة الكامل — المصدر الوحيد للحقيقة قبل العرض.
 *
 * قواعد:
 * - remote == current → لا نافذة
 * - remote فارغ / فشل شبكة → لا نافذة
 * - remote == dismissedVersion → لا نافذة (لاحقًا لنفس النشر)
 * - remote ≠ current و≠ dismissed → نافذة (اختياري أو إجباري حسب الحمولة)
 */
export async function checkForUpdate(loadedCommit: string): Promise<VersionCheckResult> {
  const now = Date.now();
  rememberLastCheckTime(now);

  const current = normalizeVersionId(loadedCommit);
  if (!current) {
    return emptyResult(loadedCommit, { lastCheckTime: now });
  }

  const { payload, networkError } = await fetchLiveVersion();
  if (networkError || !payload) {
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn("[ssunnah-update] فشل جلب /version.json — لا نافذة تحديث");
    }
    return emptyResult(loadedCommit, {
      lastCheckTime: now,
      networkError: true,
    });
  }

  const remote = extractLiveId(payload);
  if (!remote) {
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn("[ssunnah-update] /version.json بلا معرّف نشر — لا نافذة");
    }
    return emptyResult(loadedCommit, {
      lastCheckTime: now,
      networkError: false,
    });
  }

  const dismissed = getDismissedVersion();
  const sameAsCurrent = isSameDeployVersion(remote, current);
  const sameAsDismissed = isSameDeployVersion(remote, dismissed);
  const updateRequired = isForceFromPayload(payload);
  // إجباري يتجاوز التجاهل الاختياري لنفس الإصدار
  const updateAvailable = !sameAsCurrent && (updateRequired || !sameAsDismissed);
  const updateRecommended = updateAvailable && !updateRequired;

  return {
    currentVersion: current,
    currentBuild: current,
    remoteVersion: remote,
    remoteBuild: remote,
    updateAvailable,
    updateRequired,
    updateRecommended,
    skipVersion: sameAsDismissed ? dismissed : null,
    lastDismissedVersion: dismissed,
    lastCheckTime: now,
    networkError: false,
  };
}

/**
 * Resolves true only when the live /version.json commit genuinely differs
 * from the commit this tab loaded AND was not dismissed via «لاحقًا».
 * Fails silent (resolves false) on any network/parse error.
 */
export async function isNewVersionAvailable(loadedCommit: string): Promise<boolean> {
  const result = await checkForUpdate(loadedCommit);
  return result.updateAvailable;
}
