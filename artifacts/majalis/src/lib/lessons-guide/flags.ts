/**
 * أعلام دليل الدروس — كلها OFF افتراضيًا (الإصدار التالي خلف Feature Flag).
 * لا يغيّر Build قيد مراجعة Apple.
 */

export type LessonsGuideFeatureFlags = {
  /** تفعيل مسار / تجربة دليل الدروس */
  lessonsGuideEnabled: boolean;
  /** تبويب الخريطة — يتطلب إحداثيات موثّقة */
  lessonsGuideMapEnabled: boolean;
  /** طلب موقع الجهاز للدروس القريبة */
  lessonsGuideNearbyEnabled: boolean;
  /** Onboarding أول دخول */
  lessonsGuideOnboardingEnabled: boolean;
};

/** PR-1: عقود ومحوّل فقط — لا UI منتج. */
export const LESSONS_GUIDE_FLAGS_DEFAULT: Readonly<LessonsGuideFeatureFlags> = {
  lessonsGuideEnabled: false,
  lessonsGuideMapEnabled: false,
  lessonsGuideNearbyEnabled: false,
  lessonsGuideOnboardingEnabled: false,
};

const LS_KEY = "ssunnah-lessons-guide-flags-v1";

let runtimeFlags: LessonsGuideFeatureFlags = { ...LESSONS_GUIDE_FLAGS_DEFAULT };

function readPersistedOverrides(): Partial<LessonsGuideFeatureFlags> {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<LessonsGuideFeatureFlags>;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Partial<LessonsGuideFeatureFlags> = {};
    for (const key of Object.keys(LESSONS_GUIDE_FLAGS_DEFAULT) as (keyof LessonsGuideFeatureFlags)[]) {
      if (typeof parsed[key] === "boolean") out[key] = parsed[key];
    }
    return out;
  } catch {
    return {};
  }
}

export function hydrateLessonsGuideFlagsFromStorage(): Readonly<LessonsGuideFeatureFlags> {
  runtimeFlags = { ...LESSONS_GUIDE_FLAGS_DEFAULT, ...readPersistedOverrides() };
  return runtimeFlags;
}

export function getLessonsGuideFlags(): Readonly<LessonsGuideFeatureFlags> {
  return runtimeFlags;
}

export function isLessonsGuideFlagOn(flag: keyof LessonsGuideFeatureFlags): boolean {
  return runtimeFlags[flag] === true;
}

/** هل تظهر تجربة الدليل للعامة؟ */
export function isLessonsGuideEnabled(): boolean {
  return runtimeFlags.lessonsGuideEnabled === true;
}

/** اختبار/تشخيص داخلي فقط. */
export function setLessonsGuideFlagsForTests(
  partial: Partial<LessonsGuideFeatureFlags>,
): void {
  runtimeFlags = { ...runtimeFlags, ...partial };
}

export function resetLessonsGuideFlags(): void {
  runtimeFlags = { ...LESSONS_GUIDE_FLAGS_DEFAULT };
}

export function persistLessonsGuideFlagOverrides(
  partial: Partial<LessonsGuideFeatureFlags>,
): void {
  try {
    if (typeof localStorage === "undefined") return;
    const next = { ...readPersistedOverrides(), ...partial };
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    runtimeFlags = { ...LESSONS_GUIDE_FLAGS_DEFAULT, ...next };
  } catch {
    /* private mode */
  }
}
