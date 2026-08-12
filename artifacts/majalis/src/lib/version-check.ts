/**
 * Lightweight "a newer deploy exists" detector.
 * Compares the session's baked commit with live /version.json so the UI
 * can offer a quiet bottom-sheet update prompt (no forced reload).
 */
import { getBuildMetadata } from "@/lib/error-report";

const VERSION_URL = "/version.json";
export const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000; // كل 5 دقائق
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
