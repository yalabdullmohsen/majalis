import { clearQueue, clearClocksForScope } from "./local-store";

export const GUEST_SCOPE = "guest";

const ACCOUNT_SCOPED_EXACT = [
  "majalis-kp-personalization-v1",
  "majalis-kp-search-history-v1",
  "majalis-kp-activity-v1",
  "majalis-guest-merge-done-v1",
  "majalis-guest-merge-pending-v1",
  "majalis-sync-last-flush",
] as const;

const ACCOUNT_SCOPED_PREFIXES = [
  "majalis-sync-queue:",
  "majalis-sync-clock:",
  "majalis-user-",
  "majalis-reading-progress",
  "majalis-daily-progress",
  "majalis-user-streak",
] as const;

const KEEP_ON_LOGOUT = new Set([
  "majalis-cookie-consent-v1",
  "majalis-theme",
  "userFontSize",
  "majalis-sync-schema-v",
]);

export function activeSyncScope(userId: string | null | undefined): string {
  const id = String(userId || "").trim();
  return id ? `user:${id}` : GUEST_SCOPE;
}

export type AccountIsolationResult = {
  removedKeys: number;
  clearedScopes: string[];
};

export function isolateAccountOnLogout(previousUserId?: string | null): AccountIsolationResult {
  const clearedScopes: string[] = [];
  if (previousUserId) {
    const scope = activeSyncScope(previousUserId);
    clearQueue(scope);
    clearClocksForScope(scope);
    clearedScopes.push(scope);
  }

  let removedKeys = 0;
  if (typeof localStorage === "undefined") {
    return { removedKeys, clearedScopes };
  }

  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || KEEP_ON_LOGOUT.has(key)) continue;
    if ((ACCOUNT_SCOPED_EXACT as readonly string[]).includes(key)) {
      toRemove.push(key);
      continue;
    }
    if (ACCOUNT_SCOPED_PREFIXES.some((p) => key.startsWith(p))) {
      toRemove.push(key);
    }
  }
  for (const key of toRemove) {
    try {
      localStorage.removeItem(key);
      removedKeys += 1;
    } catch {
      /* ignore */
    }
  }

  try {
    window.dispatchEvent(new CustomEvent("majalis-account-isolated"));
  } catch {
    /* ignore */
  }

  return { removedKeys, clearedScopes };
}

export function markGuestMergePending(userId: string): void {
  if (typeof localStorage === "undefined" || !userId) return;
  try {
    localStorage.setItem(
      "majalis-guest-merge-pending-v1",
      JSON.stringify({ userId, at: new Date().toISOString() }),
    );
  } catch {
    /* ignore */
  }
}

export function consumeGuestMergePending(): { userId: string; at: string } | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem("majalis-guest-merge-pending-v1");
    localStorage.removeItem("majalis-guest-merge-pending-v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId?: string; at?: string };
    if (!parsed.userId) return null;
    return { userId: parsed.userId, at: parsed.at || new Date().toISOString() };
  } catch {
    return null;
  }
}
