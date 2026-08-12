/**
 * Last-known geo + city for Qibla / prayer — localStorage for 0ms cold start.
 */

export type SavedGeoLocation = {
  lat: number;
  lon: number;
  label: string;
  source: "gps" | "city";
  updatedAt: string;
};

const GEO_KEY = "majalis-last-geo-v1";

export const QIBLA_CITIES = [
  { name: "الكويت", lat: 29.3759, lon: 47.9774 },
  { name: "مكة المكرمة", lat: 21.3891, lon: 39.8579 },
  { name: "الرياض", lat: 24.6877, lon: 46.7219 },
  { name: "دبي", lat: 25.2048, lon: 55.2708 },
  { name: "القاهرة", lat: 30.0444, lon: 31.2357 },
  { name: "إسطنبول", lat: 41.0082, lon: 28.9784 },
  { name: "كراتشي", lat: 24.8607, lon: 67.0011 },
  { name: "جاكرتا", lat: -6.2088, lon: 106.8456 },
  { name: "لندن", lat: 51.5074, lon: -0.1278 },
  { name: "باريس", lat: 48.8566, lon: 2.3522 },
  { name: "نيويورك", lat: 40.7128, lon: -74.006 },
  { name: "كوالالمبور", lat: 3.139, lon: 101.6869 },
  { name: "المدينة المنورة", lat: 24.4684, lon: 39.6142 },
  { name: "أبوظبي", lat: 24.4539, lon: 54.3773 },
  { name: "بيروت", lat: 33.8938, lon: 35.5018 },
  { name: "عمّان", lat: 31.9539, lon: 35.9106 },
  { name: "بغداد", lat: 33.3152, lon: 44.3661 },
  { name: "الدار البيضاء", lat: 33.5731, lon: -7.5898 },
  { name: "لاهور", lat: 31.5204, lon: 74.3587 },
  { name: "أنقرة", lat: 39.9334, lon: 32.8597 },
] as const;

export function readSavedGeoLocation(): SavedGeoLocation | null {
  try {
    const raw = localStorage.getItem(GEO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGeoLocation;
    if (
      typeof parsed?.lat !== "number" ||
      typeof parsed?.lon !== "number" ||
      !Number.isFinite(parsed.lat) ||
      !Number.isFinite(parsed.lon)
    ) {
      return null;
    }
    return {
      lat: parsed.lat,
      lon: parsed.lon,
      label: typeof parsed.label === "string" ? parsed.label : "موقع محفوظ",
      source: parsed.source === "city" ? "city" : "gps",
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeSavedGeoLocation(loc: Omit<SavedGeoLocation, "updatedAt">): void {
  try {
    const payload: SavedGeoLocation = {
      ...loc,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(GEO_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function formatCoordPair(lat: number, lon: number): string {
  const ns = lat >= 0 ? "ش" : "ج";
  const ew = lon >= 0 ? "ق" : "غ";
  return `${Math.abs(lat).toFixed(4)}°${ns} · ${Math.abs(lon).toFixed(4)}°${ew}`;
}
