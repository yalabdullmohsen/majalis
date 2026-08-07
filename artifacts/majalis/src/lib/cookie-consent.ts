/**
 * Cookie / tracking consent — necessary storage always allowed;
 * analytics & optional telemetry only after explicit opt-in.
 */

export type ConsentCategory = "necessary" | "preferences" | "analytics";

export type CookieConsentState = {
  version: 1;
  decidedAt: string | null;
  necessary: true;
  preferences: boolean;
  analytics: boolean;
};

const STORAGE_KEY = "majalis-cookie-consent-v1";

export const DEFAULT_CONSENT: CookieConsentState = {
  version: 1,
  decidedAt: null,
  necessary: true,
  preferences: true,
  analytics: false,
};

export function readCookieConsent(): CookieConsentState {
  if (typeof window === "undefined") return DEFAULT_CONSENT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONSENT;
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    return {
      version: 1,
      decidedAt: parsed.decidedAt ?? null,
      necessary: true,
      preferences: parsed.preferences !== false,
      analytics: parsed.analytics === true,
    };
  } catch {
    return DEFAULT_CONSENT;
  }
}

export function writeCookieConsent(partial: Partial<Omit<CookieConsentState, "version" | "necessary">>): CookieConsentState {
  const next: CookieConsentState = {
    ...readCookieConsent(),
    ...partial,
    version: 1,
    necessary: true,
    decidedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    document.documentElement.dataset.analyticsConsent = next.analytics ? "1" : "0";
  }
  try {
    window.dispatchEvent(new CustomEvent("majalis-consent-changed", { detail: next }));
  } catch {
    /* ignore */
  }
  return next;
}

export function hasDecidedCookieConsent(): boolean {
  return Boolean(readCookieConsent().decidedAt);
}

export function allowsAnalytics(): boolean {
  return readCookieConsent().analytics === true;
}

/** Apply dataset flag early (boot). */
export function applyConsentDataset(state: CookieConsentState = readCookieConsent()): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.analyticsConsent = state.analytics ? "1" : "0";
}
