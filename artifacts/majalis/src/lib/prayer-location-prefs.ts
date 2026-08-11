/**
 * Active prayer location preference — GPS / world city / Kuwait governorate.
 * Instant localStorage read on launch (0ms).
 */

import { readLocalJson, writeLocalJson, isPlainObject } from "@/lib/safe-json";
import {
  getSelectedGovernorate,
  KUWAIT_GOVERNORATES,
  type KuwaitGovernorate,
} from "@/lib/prayer-kuwait-geo";
import type { WorldCity } from "@/lib/world-cities";
import { writeSavedGeoLocation } from "@/lib/qibla-location";

export type PrayerLocationSource = "gps" | "city" | "kuwait";

export type PrayerActiveLocation = {
  source: PrayerLocationSource;
  label: string;
  lat: number;
  lon: number;
  timeZone: string;
  countryCode?: string;
  cityId?: string;
  kuwaitGovId?: string;
  updatedAt: string;
};

const KEY = "majalis-prayer-location-v1";

function isLoc(v: unknown): v is PrayerActiveLocation {
  return (
    isPlainObject(v) &&
    (v.source === "gps" || v.source === "city" || v.source === "kuwait") &&
    typeof v.label === "string" &&
    typeof v.lat === "number" &&
    typeof v.lon === "number" &&
    typeof v.timeZone === "string"
  );
}

function kuwaitFallback(): PrayerActiveLocation {
  const gov = getSelectedGovernorate();
  return {
    source: "kuwait",
    label: `الكويت · ${gov.name}`,
    lat: gov.lat,
    lon: gov.lon,
    timeZone: "Asia/Kuwait",
    countryCode: "KW",
    kuwaitGovId: gov.id,
    updatedAt: new Date().toISOString(),
  };
}

export function getActivePrayerLocation(): PrayerActiveLocation {
  const saved = readLocalJson<PrayerActiveLocation | null>(KEY, null, (v): v is PrayerActiveLocation | null =>
    v == null || isLoc(v),
  );
  if (saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lon)) return saved;
  return kuwaitFallback();
}

export function setActivePrayerLocation(loc: Omit<PrayerActiveLocation, "updatedAt">): PrayerActiveLocation {
  const next: PrayerActiveLocation = { ...loc, updatedAt: new Date().toISOString() };
  writeLocalJson(KEY, next);
  try {
    writeSavedGeoLocation({
      lat: next.lat,
      lon: next.lon,
      label: next.label,
      source: next.source === "gps" ? "gps" : "city",
    });
  } catch {
    /* optional qibla mirror */
  }
  return next;
}

export function setLocationFromKuwaitGov(gov: KuwaitGovernorate): PrayerActiveLocation {
  return setActivePrayerLocation({
    source: "kuwait",
    label: `الكويت · ${gov.name}`,
    lat: gov.lat,
    lon: gov.lon,
    timeZone: "Asia/Kuwait",
    countryCode: "KW",
    kuwaitGovId: gov.id,
  });
}

export function setLocationFromWorldCity(city: WorldCity): PrayerActiveLocation {
  return setActivePrayerLocation({
    source: "city",
    label: `${city.nameAr} · ${city.countryAr}`,
    lat: city.lat,
    lon: city.lon,
    timeZone: city.timeZone,
    countryCode: city.countryCode,
    cityId: city.id,
  });
}

export function setLocationFromGps(input: {
  lat: number;
  lon: number;
  timeZone: string;
  label: string;
  countryCode?: string;
  cityId?: string;
}): PrayerActiveLocation {
  return setActivePrayerLocation({
    source: "gps",
    label: input.label,
    lat: input.lat,
    lon: input.lon,
    timeZone: input.timeZone,
    countryCode: input.countryCode,
    cityId: input.cityId,
  });
}

export function kuwaitGovernorates(): KuwaitGovernorate[] {
  return KUWAIT_GOVERNORATES;
}

/** Cache key segment for prayer day cache. */
export function prayerLocationCacheId(loc: PrayerActiveLocation = getActivePrayerLocation()): string {
  if (loc.cityId) return `city:${loc.cityId}`;
  if (loc.kuwaitGovId) return `kw:${loc.kuwaitGovId}`;
  return `geo:${loc.lat.toFixed(3)},${loc.lon.toFixed(3)}`;
}
