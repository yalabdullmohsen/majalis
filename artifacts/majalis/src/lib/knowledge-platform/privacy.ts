/**
 * خصوصية منصة المعرفة — محلي، قابل للتعطيل، قابل للمسح.
 */

import { allowsAnalytics } from "@/lib/cookie-consent";

export const PERSONALIZATION_KEY = "majalis-kp-personalization-v1";
export const LOCAL_SEARCH_HISTORY_KEY = "majalis-kp-search-history-v1";
export const ACTIVITY_STORAGE_KEY = "majalis-kp-activity-v1";

export function isPersonalizationEnabled(): boolean {
  if (typeof localStorage === "undefined") return true;
  try {
    const v = localStorage.getItem(PERSONALIZATION_KEY);
    if (v === null) return true;
    return v !== "0";
  } catch {
    return true;
  }
}

export function setPersonalizationEnabled(on: boolean): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PERSONALIZATION_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function maySendUsageSignals(): boolean {
  return isPersonalizationEnabled() && allowsAnalytics();
}

export function clearLocalSearchHistory(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(LOCAL_SEARCH_HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

export function pushLocalSearchQuery(q: string, max = 12): void {
  if (!isPersonalizationEnabled()) return;
  const query = q.trim().slice(0, 80);
  if (!query || typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_SEARCH_HISTORY_KEY);
    const prev: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [query, ...prev.filter((x) => x !== query)].slice(0, max);
    localStorage.setItem(LOCAL_SEARCH_HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function listLocalSearchHistory(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function clearKnowledgePlatformLocalData(): { keysCleared: string[] } {
  const keys = [PERSONALIZATION_KEY, LOCAL_SEARCH_HISTORY_KEY, ACTIVITY_STORAGE_KEY];
  const keysCleared: string[] = [];
  if (typeof localStorage !== "undefined") {
    for (const k of keys) {
      try {
        if (localStorage.getItem(k) != null) {
          localStorage.removeItem(k);
          keysCleared.push(k);
        }
      } catch {
        /* ignore */
      }
    }
  }
  return { keysCleared };
}
