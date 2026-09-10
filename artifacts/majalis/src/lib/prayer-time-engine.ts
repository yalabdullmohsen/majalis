/**
 * واجهة موحّدة لمحرك مواقيت الصلاة — مصدر الحقيقة: `prayer-times.ts`.
 */
import {
  computePrayerTimesForDate,
  fetchPrayerTimes,
  getPrayerTimes,
  type PrayerSlot,
  type PrayerTimesPayload,
} from "./prayer-times";
import { getActivePrayerLocation } from "./prayer-location-prefs";
import { getPrayerCalcMethod, prayerCalcMethodLabel } from "./prayer-calc-prefs";

export type PrayerEngineDay = {
  dateISO: string;
  timeZone: string;
  methodId: string;
  methodLabel: string;
  locationSource: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  prayers: PrayerSlot[];
  computedAt: string;
  engineVersion: "prayer-time-engine/v1";
  payload: PrayerTimesPayload;
};

export async function computePrayerEngineDay(opts?: {
  date?: Date;
  governorateId?: string;
}): Promise<PrayerEngineDay> {
  const loc = getActivePrayerLocation();
  const method = getPrayerCalcMethod();
  const payload = opts?.governorateId
    ? await fetchPrayerTimes(opts.governorateId)
    : opts?.date
      ? await getPrayerTimes(
          opts.date.toISOString().slice(0, 10),
          {
            lat: loc.lat,
            lon: loc.lon,
            label: loc.label,
            timeZone: loc.timeZone,
          },
          method,
        )
      : await fetchPrayerTimes();

  return {
    dateISO: payload.date.gregorian,
    timeZone: payload.timezone || loc.timeZone,
    methodId: method,
    methodLabel: prayerCalcMethodLabel(method),
    locationSource: String(payload.source ?? loc.source),
    locationLabel: payload.city || loc.label,
    latitude: loc.lat,
    longitude: loc.lon,
    prayers: payload.prayers,
    computedAt: payload.fetchedAt || new Date().toISOString(),
    engineVersion: "prayer-time-engine/v1",
    payload,
  };
}

export { computePrayerTimesForDate, fetchPrayerTimes, getPrayerTimes };
export type { PrayerSlot, PrayerTimesPayload };
