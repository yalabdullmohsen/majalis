/**
 * أعلام مسار الحفظ + البحوث الشرعية — كلها OFF افتراضيًا.
 * لا تُفتح Routes للعامة قبل اكتمال الموجات والاختبارات.
 */

export type MemorizationResearchFeatureFlags = {
  /** قسم مسار الحفظ للعامة */
  hifzPathEnabled: boolean;
  /** تجربة وحدة الحفظ (تكرار/مراجعة) */
  hifzPathPracticeEnabled: boolean;
  /** قسم البحوث الشرعية للعامة */
  scholarlyResearchEnabled: boolean;
  /** نموذج اقترح بحثًا */
  scholarlyResearchSuggestEnabled: boolean;
  /** مراكز Admin v3 (لاحقاً) */
  memorizationResearchAdminEnabled: boolean;
};

export const MEMORIZATION_RESEARCH_FLAGS_DEFAULT: Readonly<MemorizationResearchFeatureFlags> =
  {
    hifzPathEnabled: false,
    hifzPathPracticeEnabled: false,
    scholarlyResearchEnabled: false,
    scholarlyResearchSuggestEnabled: false,
    memorizationResearchAdminEnabled: false,
  };

const LS_KEY = "ssunnah-memorization-research-flags-v1";

let runtimeFlags: MemorizationResearchFeatureFlags = {
  ...MEMORIZATION_RESEARCH_FLAGS_DEFAULT,
};

function readPersistedOverrides(): Partial<MemorizationResearchFeatureFlags> {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<MemorizationResearchFeatureFlags>;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Partial<MemorizationResearchFeatureFlags> = {};
    for (const key of Object.keys(
      MEMORIZATION_RESEARCH_FLAGS_DEFAULT,
    ) as (keyof MemorizationResearchFeatureFlags)[]) {
      if (typeof parsed[key] === "boolean") out[key] = parsed[key];
    }
    return out;
  } catch {
    return {};
  }
}

export function hydrateMemorizationResearchFlagsFromStorage(): Readonly<MemorizationResearchFeatureFlags> {
  runtimeFlags = {
    ...MEMORIZATION_RESEARCH_FLAGS_DEFAULT,
    ...readPersistedOverrides(),
  };
  return runtimeFlags;
}

export function getMemorizationResearchFlags(): Readonly<MemorizationResearchFeatureFlags> {
  return runtimeFlags;
}

export function isMemorizationResearchFlagOn(
  flag: keyof MemorizationResearchFeatureFlags,
): boolean {
  return runtimeFlags[flag] === true;
}

export function isHifzPathEnabled(): boolean {
  return runtimeFlags.hifzPathEnabled === true;
}

export function isScholarlyResearchEnabled(): boolean {
  return runtimeFlags.scholarlyResearchEnabled === true;
}

/** اختبار/تشخيص داخلي فقط. */
export function setMemorizationResearchFlagsForTests(
  partial: Partial<MemorizationResearchFeatureFlags>,
): void {
  runtimeFlags = { ...runtimeFlags, ...partial };
}

export function resetMemorizationResearchFlags(): void {
  runtimeFlags = { ...MEMORIZATION_RESEARCH_FLAGS_DEFAULT };
}

export function persistMemorizationResearchFlagOverrides(
  partial: Partial<MemorizationResearchFeatureFlags>,
): void {
  try {
    if (typeof localStorage === "undefined") return;
    const next = { ...readPersistedOverrides(), ...partial };
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    runtimeFlags = { ...MEMORIZATION_RESEARCH_FLAGS_DEFAULT, ...next };
  } catch {
    /* private mode */
  }
}
