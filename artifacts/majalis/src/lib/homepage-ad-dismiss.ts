const DISMISS_KEY = "mj-homepage-ad-dismissed-at-v1";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

/** هل أغلق المستخدم الشريط خلال آخر 24 ساعة؟ */
export function isHomepageAdDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

export function dismissHomepageAd(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}
