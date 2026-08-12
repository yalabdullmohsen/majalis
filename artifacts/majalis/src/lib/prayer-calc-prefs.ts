/**
 * Prayer calculation method + madhab + high-latitude + minute adjustments.
 * Offline-first localStorage prefs.
 */

export type PrayerCalcMethodId =
  | "Kuwait"
  | "UmmAlQura"
  | "MuslimWorldLeague"
  | "Egyptian"
  | "NorthAmerica"
  | "Karachi"
  | "Dubai"
  | "Turkey"
  | "Qatar"
  | "Singapore"
  | "Tehran"
  | "FranceUOIF"
  | "MoonsightingCommittee";

export type PrayerMadhabId = "Shafi" | "Hanafi";

export type HighLatitudeRuleId =
  | "auto"
  | "MiddleOfTheNight"
  | "SeventhOfTheNight"
  | "TwilightAngle";

export type PrayerMinuteAdjustments = {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
};

export type PrayerCalcMethodOption = {
  id: PrayerCalcMethodId;
  labelAr: string;
  shortAr: string;
};

export const PRAYER_CALC_METHODS: readonly PrayerCalcMethodOption[] = [
  { id: "Kuwait", labelAr: "وزارة الأوقاف — الكويت", shortAr: "الكويت" },
  { id: "UmmAlQura", labelAr: "أم القرى — السعودية / الخليج", shortAr: "أم القرى" },
  { id: "Qatar", labelAr: "قطر (رسمي)", shortAr: "قطر" },
  { id: "Dubai", labelAr: "دبي / الإمارات", shortAr: "دبي" },
  { id: "MuslimWorldLeague", labelAr: "رابطة العالم الإسلامي", shortAr: "MWL" },
  { id: "Egyptian", labelAr: "الهيئة المصرية العامة", shortAr: "مصر" },
  { id: "Karachi", labelAr: "جامعة العلوم الإسلامية — كراتشي", shortAr: "كراتشي" },
  { id: "NorthAmerica", labelAr: "إسنا — أمريكا الشمالية", shortAr: "ISNA" },
  { id: "FranceUOIF", labelAr: "اتحاد المنظمات الإسلامية بفرنسا", shortAr: "UOIF" },
  { id: "Turkey", labelAr: "رئاسة الشؤون الدينية — تركيا", shortAr: "تركيا" },
  { id: "Singapore", labelAr: "سنغافورة / جنوب شرق آسيا", shortAr: "سنغافورة" },
  { id: "MoonsightingCommittee", labelAr: "لجنة رؤية الهلال", shortAr: "هلال" },
  { id: "Tehran", labelAr: "جامعة طهران الجيوفيزيائية", shortAr: "طهران" },
] as const;

const METHOD_KEY = "majalis-prayer-calc-method-v1";
const MADHAB_KEY = "majalis-prayer-madhab-v1";
const HIGH_LAT_KEY = "majalis-prayer-highlat-v1";
const ADJUST_KEY = "majalis-prayer-adjustments-v1";
const DEFAULT_METHOD: PrayerCalcMethodId = "Kuwait";

const VALID = new Set<string>(PRAYER_CALC_METHODS.map((m) => m.id));

const ZERO_ADJ: PrayerMinuteAdjustments = {
  fajr: 0,
  sunrise: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0,
};

export function getPrayerCalcMethod(): PrayerCalcMethodId {
  try {
    const raw = localStorage.getItem(METHOD_KEY);
    if (raw && VALID.has(raw)) return raw as PrayerCalcMethodId;
  } catch {
    /* ignore */
  }
  return DEFAULT_METHOD;
}

export function setPrayerCalcMethod(id: PrayerCalcMethodId): void {
  if (!VALID.has(id)) return;
  try {
    localStorage.setItem(METHOD_KEY, id);
  } catch {
    /* ignore */
  }
}

/** Apply city-pack default method when user hasn't customized (optional helper). */
export function suggestMethodForRegion(methodId: string): void {
  if (VALID.has(methodId)) setPrayerCalcMethod(methodId as PrayerCalcMethodId);
}

export function prayerCalcMethodLabel(id: PrayerCalcMethodId): string {
  return PRAYER_CALC_METHODS.find((m) => m.id === id)?.labelAr ?? id;
}

export function prayerCalcMethodCacheId(id: PrayerCalcMethodId = getPrayerCalcMethod()): string {
  const madhab = getPrayerMadhab();
  const hl = getHighLatitudeRule();
  const adj = getPrayerAdjustments();
  const adjSig = [adj.fajr, adj.sunrise, adj.dhuhr, adj.asr, adj.maghrib, adj.isha].join(",");
  return `adhan-${id}-${madhab}-${hl}-${adjSig}-v2`;
}

export function getPrayerMadhab(): PrayerMadhabId {
  try {
    const raw = localStorage.getItem(MADHAB_KEY);
    if (raw === "Hanafi" || raw === "Shafi") return raw;
  } catch {
    /* ignore */
  }
  return "Shafi";
}

export function setPrayerMadhab(id: PrayerMadhabId): void {
  try {
    localStorage.setItem(MADHAB_KEY, id);
  } catch {
    /* ignore */
  }
}

export function getHighLatitudeRule(): HighLatitudeRuleId {
  try {
    const raw = localStorage.getItem(HIGH_LAT_KEY);
    if (
      raw === "auto" ||
      raw === "MiddleOfTheNight" ||
      raw === "SeventhOfTheNight" ||
      raw === "TwilightAngle"
    ) {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return "auto";
}

export function setHighLatitudeRule(id: HighLatitudeRuleId): void {
  try {
    localStorage.setItem(HIGH_LAT_KEY, id);
  } catch {
    /* ignore */
  }
}

export function getPrayerAdjustments(): PrayerMinuteAdjustments {
  try {
    const raw = localStorage.getItem(ADJUST_KEY);
    if (!raw) return { ...ZERO_ADJ };
    const parsed = JSON.parse(raw) as Partial<PrayerMinuteAdjustments>;
    return {
      fajr: Number(parsed.fajr) || 0,
      sunrise: Number(parsed.sunrise) || 0,
      dhuhr: Number(parsed.dhuhr) || 0,
      asr: Number(parsed.asr) || 0,
      maghrib: Number(parsed.maghrib) || 0,
      isha: Number(parsed.isha) || 0,
    };
  } catch {
    return { ...ZERO_ADJ };
  }
}

export function setPrayerAdjustments(next: Partial<PrayerMinuteAdjustments>): void {
  const cur = getPrayerAdjustments();
  const merged = { ...cur, ...next };
  try {
    localStorage.setItem(ADJUST_KEY, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
}

type AdhanModule = typeof import("adhan");

/** Resolve adhan CalculationParameters for the selected method + prefs. */
export function resolveAdhanParams(
  mod: AdhanModule,
  methodId: PrayerCalcMethodId,
  coords?: { latitude: number; longitude: number },
) {
  let params;
  if (methodId === "FranceUOIF") {
    params = new mod.CalculationParameters("Other" as never, 12, 12);
    // Keep identity for debugging / UI labels
    (params as { method?: string }).method = "FranceUOIF";
  } else {
    const factory =
      (mod.CalculationMethod as Record<string, (() => ReturnType<typeof mod.CalculationMethod.Kuwait>) | undefined>)[
        methodId
      ] ?? mod.CalculationMethod.Kuwait;
    params = factory();
  }

  params.madhab = getPrayerMadhab() === "Hanafi" ? mod.Madhab.Hanafi : mod.Madhab.Shafi;

  const hl = getHighLatitudeRule();
  if (hl === "auto" && coords) {
    params.highLatitudeRule = mod.HighLatitudeRule.recommended(
      new mod.Coordinates(coords.latitude, coords.longitude),
    );
  } else if (hl === "MiddleOfTheNight") {
    params.highLatitudeRule = mod.HighLatitudeRule.MiddleOfTheNight;
  } else if (hl === "SeventhOfTheNight") {
    params.highLatitudeRule = mod.HighLatitudeRule.SeventhOfTheNight;
  } else if (hl === "TwilightAngle") {
    params.highLatitudeRule = mod.HighLatitudeRule.TwilightAngle;
  }

  const adj = getPrayerAdjustments();
  params.adjustments = {
    fajr: adj.fajr,
    sunrise: adj.sunrise,
    dhuhr: adj.dhuhr,
    asr: adj.asr,
    maghrib: adj.maghrib,
    isha: adj.isha,
  };

  return params;
}
