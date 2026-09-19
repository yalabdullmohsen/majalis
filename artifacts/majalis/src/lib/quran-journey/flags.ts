/**
 * أعلام رحلة القرآن المتقدمة — كلها OFF افتراضيًا.
 * تعطيل العلم لا يحذف بيانات المستخدم المحلية.
 * المصحف الأساسي يعمل بغض النظر عن هذه الأعلام.
 */

export type QuranJourneyFeatureFlags = {
  mushafMarkersV2: boolean;
  quranJourneys: boolean;
  memorizationTracker: boolean;
  quranReview: boolean;
  quranNotebook: boolean;
  quranProgressMap: boolean;
  quranActivity: boolean;
};

/** PR-1: عقود وتخزين محلي فقط — لا UI ولا مزامنة مستضافة. */
export const QURAN_JOURNEY_FLAGS_DEFAULT: Readonly<QuranJourneyFeatureFlags> = {
  mushafMarkersV2: false,
  quranJourneys: false,
  memorizationTracker: false,
  quranReview: false,
  quranNotebook: false,
  quranProgressMap: false,
  quranActivity: false,
};

const LS_KEY = "ssunnah-quran-journey-flags-v1";

let runtimeFlags: QuranJourneyFeatureFlags = { ...QURAN_JOURNEY_FLAGS_DEFAULT };

function readPersistedOverrides(): Partial<QuranJourneyFeatureFlags> {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<QuranJourneyFeatureFlags>;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Partial<QuranJourneyFeatureFlags> = {};
    for (const key of Object.keys(QURAN_JOURNEY_FLAGS_DEFAULT) as (keyof QuranJourneyFeatureFlags)[]) {
      if (typeof parsed[key] === "boolean") out[key] = parsed[key];
    }
    return out;
  } catch {
    return {};
  }
}

/** يحمّل تجاوزات localStorage فوق الافتراضي (كلها false). */
export function hydrateQuranJourneyFlagsFromStorage(): Readonly<QuranJourneyFeatureFlags> {
  runtimeFlags = { ...QURAN_JOURNEY_FLAGS_DEFAULT, ...readPersistedOverrides() };
  return runtimeFlags;
}

export function getQuranJourneyFlags(): Readonly<QuranJourneyFeatureFlags> {
  return runtimeFlags;
}

export function isQuranJourneyFlagOn(
  flag: keyof QuranJourneyFeatureFlags,
): boolean {
  return runtimeFlags[flag] === true;
}

/** اختبار/تشخيص داخلي فقط — لا يستدعى من UI منتج في PR-1. */
export function setQuranJourneyFlagsForTests(
  partial: Partial<QuranJourneyFeatureFlags>,
): void {
  runtimeFlags = { ...runtimeFlags, ...partial };
}

export function resetQuranJourneyFlags(): void {
  runtimeFlags = { ...QURAN_JOURNEY_FLAGS_DEFAULT };
}

/** حفظ تجاوز اختياري (تشخيص) — لا يفعّل الميزات في الإنتاج افتراضيًا. */
export function persistQuranJourneyFlagOverrides(
  partial: Partial<QuranJourneyFeatureFlags>,
): void {
  try {
    if (typeof localStorage === "undefined") return;
    const next = { ...readPersistedOverrides(), ...partial };
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    hydrateQuranJourneyFlagsFromStorage();
  } catch {
    /* ignore */
  }
}
