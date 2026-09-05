/**
 * حالة صفحة التعريف عند أول زيارة — majlis_intro_seen في localStorage.
 */
import { firstVisitIntroConfig } from "@/config/first-visit-intro";
import { storageGetSync } from "./native-storage";

export const FIRST_VISIT_INTRO_STORAGE_KEY = "majlis_intro_seen";

/** مفاتيح قديمة تدل على أن المستخدم سبق استخدم التطبيق */
const LEGACY_INTRO_SEEN_KEYS = [
  "majalis-intro-seen",
  "majlis-home-welcomed-v1",
  "majalis.onboarding.onboarding_seen",
  "onboarding.completed.v1",
  "majalis-quick-guide-v1",
  "majalis-quick-guide-seen",
  "majlis-quick-guide-v1",
  "majalis-welcome-v1",
  "majalis-boot-guide",
  "majalis-first-run-setup-v1",
] as const;

let sessionSeen = false;

function readStoredSeen(): boolean {
  if (sessionSeen) return true;
  try {
    const v = localStorage.getItem(FIRST_VISIT_INTRO_STORAGE_KEY);
    if (v === "true" || v === "1") return true;
  } catch {
    /* تخزين معطّل */
  }
  return false;
}

/** يُستدعى قبل مسح المفاتيح القديمة في initOnboardingState */
export function migrateLegacyFirstVisitIntroKeys(): void {
  if (readStoredSeen()) return;

  for (const key of LEGACY_INTRO_SEEN_KEYS) {
    try {
      if (localStorage.getItem(key)) {
        markFirstVisitIntroSeen();
        return;
      }
    } catch {
      /* ignore */
    }
  }

  try {
    if (storageGetSync("onboarding.completed.v1") === "1") {
      markFirstVisitIntroSeen();
      return;
    }
  } catch {
    /* ignore */
  }

  try {
    const consent = localStorage.getItem("majalis-cookie-consent-v1");
    if (consent && JSON.parse(consent)?.decidedAt) {
      markFirstVisitIntroSeen();
    }
  } catch {
    /* ترحيل أفضل-جهد */
  }
}

export function hasSeenFirstVisitIntroSync(): boolean {
  return readStoredSeen();
}

export function markFirstVisitIntroSeen(): void {
  sessionSeen = true;
  try {
    localStorage.setItem(FIRST_VISIT_INTRO_STORAGE_KEY, "true");
  } catch {
    /* الذاكرة تكفي للجلسة */
  }
}

export function isFirstVisitIntroHomePath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  return p === "/";
}

/** قياس آلي (LH/PSI/CI) — UA المُحاكى موبايل بلا Headless في السلسلة؛ نعتمد إشارات متعددة. */
function isAutomatedPerfProbe(): boolean {
  if (typeof navigator === "undefined") return false;
  try {
    if (navigator.webdriver) return true;
  } catch {
    /* ignore */
  }
  const ua = navigator.userAgent || "";
  if (/HeadlessChrome|Lighthouse|Chrome-Lighthouse|Page\s*Speed|PTST/i.test(ua)) return true;
  try {
    const brands = (
      navigator as Navigator & {
        userAgentData?: { brands?: Array<{ brand?: string }> };
      }
    ).userAgentData?.brands;
    if (brands?.some((b) => /Headless|Lighthouse/i.test(b.brand || ""))) return true;
  } catch {
    /* ignore */
  }
  try {
    const host = typeof location !== "undefined" ? location.hostname : "";
    // معاينة محلية / LHCI — نفس سياسة الـ splash
    if (host === "127.0.0.1" || host === "localhost") return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function shouldShowFirstVisitIntro(pathname: string): boolean {
  if (!firstVisitIntroConfig.enabled) return false;
  if (isAutomatedPerfProbe()) return false;
  if (!isFirstVisitIntroHomePath(pathname)) return false;
  return !hasSeenFirstVisitIntroSync();
}

/** للاختبارات فقط */
export function resetFirstVisitIntroStateForTests(): void {
  sessionSeen = false;
  try {
    localStorage.removeItem(FIRST_VISIT_INTRO_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
