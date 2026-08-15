/**
 * دخولية الجلسة الواحدة — تظهر عند فتح التطبيق فقط، لا عند التنقل الداخلي.
 * لا تعتمد على API / Supabase.
 */

export const LAUNCH_INTRO_SESSION_KEY = "mj-launch-intro-shown";

/** الحد الأدنى لظهور العلامة التجارية (ms) */
export const LAUNCH_INTRO_MIN_MS = 900;
/** السقف الأقصى — لا يؤخّر فتح التطبيق أكثر من ذلك */
export const LAUNCH_INTRO_MAX_MS = 1400;
/** مدة تلاشي الخروج */
export const LAUNCH_INTRO_FADE_MS = 280;

let sessionMarked = false;

export function hasSeenLaunchIntroThisSession(): boolean {
  if (sessionMarked) return true;
  try {
    return sessionStorage.getItem(LAUNCH_INTRO_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLaunchIntroSeen(): void {
  sessionMarked = true;
  try {
    sessionStorage.setItem(LAUNCH_INTRO_SESSION_KEY, "1");
  } catch {
    /* private mode — يكفي العلم في الذاكرة */
  }
}

/** للاختبارات فقط */
export function __resetLaunchIntroForTests(): void {
  sessionMarked = false;
  try {
    sessionStorage.removeItem(LAUNCH_INTRO_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function shouldShowLaunchIntro(): boolean {
  return !hasSeenLaunchIntroThisSession();
}
