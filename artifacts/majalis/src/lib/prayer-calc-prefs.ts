/**
 * Prayer calculation method preference (adhan-js) — persisted for offline-first.
 */

export type PrayerCalcMethodId =
  | "Kuwait"
  | "UmmAlQura"
  | "MuslimWorldLeague"
  | "Egyptian"
  | "NorthAmerica"
  | "Karachi"
  | "Dubai"
  | "Turkey";

export type PrayerCalcMethodOption = {
  id: PrayerCalcMethodId;
  labelAr: string;
  shortAr: string;
};

export const PRAYER_CALC_METHODS: readonly PrayerCalcMethodOption[] = [
  { id: "Kuwait", labelAr: "وزارة الأوقاف — الكويت", shortAr: "الكويت" },
  { id: "UmmAlQura", labelAr: "أم القرى — السعودية", shortAr: "أم القرى" },
  { id: "MuslimWorldLeague", labelAr: "رابطة العالم الإسلامي", shortAr: "MWL" },
  { id: "Egyptian", labelAr: "الهيئة المصرية العامة", shortAr: "مصر" },
  { id: "NorthAmerica", labelAr: "إسنا — أمريكا الشمالية", shortAr: "ISNA" },
  { id: "Karachi", labelAr: "جامعة العلوم الإسلامية — كراتشي", shortAr: "كراتشي" },
  { id: "Dubai", labelAr: "دبي", shortAr: "دبي" },
  { id: "Turkey", labelAr: "رئاسة الشؤون الدينية — تركيا", shortAr: "تركيا" },
] as const;

const METHOD_KEY = "majalis-prayer-calc-method-v1";
const DEFAULT_METHOD: PrayerCalcMethodId = "Kuwait";

const VALID = new Set<string>(PRAYER_CALC_METHODS.map((m) => m.id));

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

export function prayerCalcMethodLabel(id: PrayerCalcMethodId): string {
  return PRAYER_CALC_METHODS.find((m) => m.id === id)?.labelAr ?? id;
}

/** Cache method id string used in prayer-times cache key. */
export function prayerCalcMethodCacheId(id: PrayerCalcMethodId = getPrayerCalcMethod()): string {
  return `adhan-${id}-v1`;
}

type AdhanModule = typeof import("adhan");

/** Resolve adhan CalculationParameters for the selected method. */
export function resolveAdhanParams(mod: AdhanModule, methodId: PrayerCalcMethodId) {
  const factory =
    mod.CalculationMethod[methodId] ?? mod.CalculationMethod.Kuwait;
  const params = factory();
  params.madhab = mod.Madhab.Shafi;
  return params;
}
