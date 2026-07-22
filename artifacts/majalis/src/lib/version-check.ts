/**
 * Lightweight "a newer deploy exists" detector + safe auto-apply.
 *
 * Context (full diagnosis lives in READY_FOR_MERGE.md and at the top of
 * scripts/generate-version.mjs / public/sw.js): the platform's real bug
 * behind "updates appear then vanish" is operational — direct pushes to
 * the `production` branch get reverse-merged into `main` later and wipe
 * out newer main-only work, because Vercel's actual production branch is
 * `main`. That is a workflow fix, not a code fix (see the warning in
 * READY_FOR_MERGE.md). This module is the technical mitigation that *is*
 * in scope: it lets a tab notice, on its own, that the commit currently
 * live on the server differs from the one it was loaded with, and applies
 * the update automatically (owner's explicit instruction: "فعّل النسخة
 * الجديدة مباشرة بدون انتظار") — a brief on-screen notice is shown first
 * so a reload is never a silent surprise, then the page reloads itself.
 */
import { getBuildMetadata } from "@/lib/error-report";

const VERSION_URL = "/version.json";
export const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000; // كل 5 دقائق
export const AUTO_RELOAD_GRACE_MS = 1500; // مهلة عرض قصيرة قبل إعادة التحميل التلقائي
const FETCH_TIMEOUT_MS = 8000;

type VersionPayload = {
  commit?: string;
  shortCommit?: string;
  builtAt?: string;
  ref?: string;
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

async function fetchLiveVersion(): Promise<VersionPayload | null> {
  try {
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as VersionPayload;
  } catch {
    return null;
  }
}

/**
 * Resolves true only when the live /version.json commit genuinely differs
 * from the commit this tab loaded. Fails silent (resolves false) on any
 * network/parse error — this is a nicety, never allowed to break the app.
 */
export async function isNewVersionAvailable(loadedCommit: string): Promise<boolean> {
  const live = await fetchLiveVersion();
  if (!live?.commit) return false;
  return live.commit !== loadedCommit;
}
