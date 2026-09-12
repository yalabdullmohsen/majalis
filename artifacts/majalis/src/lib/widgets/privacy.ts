import type { WidgetPrivacyLevel, WidgetType } from "./types";

export const WIDGET_STORAGE_PREFIX = "sunnah-widget-";
export const WIDGET_BUNDLE_KEY = `${WIDGET_STORAGE_PREFIX}bundle-v1`;
export const WIDGET_BUNDLE_TMP_KEY = `${WIDGET_STORAGE_PREFIX}bundle-v1.tmp`;
export const WIDGET_ACCOUNT_SCOPE_KEY = `${WIDGET_STORAGE_PREFIX}account-scope`;

const LOCK_SAFE: ReadonlySet<WidgetType> = new Set([
  "next_prayer",
  "prayer_times",
  "shortcuts",
  "search_shortcuts",
  "live_prayer",
]);

export function defaultPrivacyForType(type: WidgetType): WidgetPrivacyLevel {
  if (LOCK_SAFE.has(type)) return "lock_safe";
  if (
    type === "mushaf_continue" ||
    type === "wird_khatma" ||
    type === "learning_continue" ||
    type === "today_center"
  ) {
    return "account_private";
  }
  return "public";
}

export function resolveAccountScope(userId: string | null | undefined): string {
  if (!userId) return "guest";
  let h = 2166136261;
  for (let i = 0; i < userId.length; i++) {
    h ^= userId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `u_${(h >>> 0).toString(16)}`;
}

export function assertNoSecretsInSnapshot(json: string): boolean {
  return ![
    /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]+\./,
    /service_role/i,
    /sk-[a-zA-Z0-9]{20,}/,
    /refresh_token/i,
    /access_token\s*[:=]/i,
  ].some((p) => p.test(json));
}
