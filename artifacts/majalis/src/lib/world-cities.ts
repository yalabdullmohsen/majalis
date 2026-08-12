/**
 * Offline world-cities pack loader + fuzzy search (no network after first fetch).
 * Pack: public/data/prayer/world-cities.json
 */

import { normalizeArabic } from "@/shared/arabic-normalize";

export type WorldCity = {
  id: string;
  nameAr: string;
  nameEn: string;
  countryCode: string;
  countryAr: string;
  adminAr: string;
  timeZone: string;
  lat: number;
  lon: number;
  defaultMethod: string;
};

export type WorldCountry = {
  code: string;
  nameAr: string;
  method: string;
};

type Pack = {
  v: number;
  count: number;
  countries: WorldCountry[];
  cities: Array<[string, string, string, string, string, string, string, number, number, string]>;
};

let packPromise: Promise<Pack> | null = null;
let cached: Pack | null = null;
let cityIndex: WorldCity[] | null = null;

function rowToCity(row: Pack["cities"][number]): WorldCity {
  return {
    id: row[0],
    nameAr: row[1],
    nameEn: row[2],
    countryCode: row[3],
    countryAr: row[4],
    adminAr: row[5] || "",
    timeZone: row[6],
    lat: row[7],
    lon: row[8],
    defaultMethod: row[9],
  };
}

async function loadPack(): Promise<Pack> {
  if (cached) return cached;
  if (!packPromise) {
    packPromise = (async () => {
      const base = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL || "/";
      const url = `${base.replace(/\/?$/, "/")}data/prayer/world-cities.json`;
      const res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) throw new Error(`world-cities ${res.status}`);
      const json = (await res.json()) as Pack;
      cached = json;
      cityIndex = json.cities.map(rowToCity);
      return json;
    })().catch((err) => {
      packPromise = null;
      throw err;
    });
  }
  return packPromise;
}

export async function ensureWorldCitiesLoaded(): Promise<void> {
  await loadPack();
}

export async function listWorldCountries(): Promise<WorldCountry[]> {
  const pack = await loadPack();
  return pack.countries;
}

export async function listCitiesByCountry(countryCode: string): Promise<WorldCity[]> {
  await loadPack();
  const cc = countryCode.toUpperCase();
  return (cityIndex ?? []).filter((c) => c.countryCode === cc);
}

export async function listAdminsByCountry(countryCode: string): Promise<string[]> {
  const cities = await listCitiesByCountry(countryCode);
  const set = new Set<string>();
  for (const c of cities) {
    if (c.adminAr) set.add(c.adminAr);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "ar"));
}

export async function getWorldCityById(id: string): Promise<WorldCity | null> {
  await loadPack();
  return (cityIndex ?? []).find((c) => c.id === id) ?? null;
}

export async function searchWorldCities(
  query: string,
  opts?: { countryCode?: string; adminAr?: string; limit?: number },
): Promise<WorldCity[]> {
  await loadPack();
  const q = normalizeArabic(query.trim());
  const limit = opts?.limit ?? 40;
  const cc = opts?.countryCode?.toUpperCase();
  const admin = opts?.adminAr;
  const pool = (cityIndex ?? []).filter((c) => {
    if (cc && c.countryCode !== cc) return false;
    if (admin && c.adminAr !== admin) return false;
    return true;
  });
  if (!q) return pool.slice(0, limit);

  const scored: Array<{ c: WorldCity; s: number }> = [];
  for (const c of pool) {
    const hayAr = normalizeArabic(`${c.nameAr} ${c.adminAr} ${c.countryAr}`);
    const hayEn = `${c.nameEn} ${c.countryCode}`.toLowerCase();
    const nameArN = normalizeArabic(c.nameAr);
    let s: number | null = null;
    if (nameArN === q) s = 120;
    else if (hayAr.startsWith(q) || nameArN.startsWith(q)) s = 100;
    else if (hayAr.includes(q)) s = 70;
    else if (hayEn.includes(query.trim().toLowerCase())) s = 50;
    if (s == null) continue;
    scored.push({ c, s });
  }
  scored.sort((a, b) => b.s - a.s || a.c.nameAr.localeCompare(b.c.nameAr, "ar"));
  return scored.slice(0, limit).map((x) => x.c);
}

/** Nearest city in pack — used to resolve IANA timezone from raw GPS. */
export async function findNearestWorldCity(lat: number, lon: number): Promise<WorldCity | null> {
  await loadPack();
  let best: WorldCity | null = null;
  let bestD = Infinity;
  for (const c of cityIndex ?? []) {
    const d = (c.lat - lat) ** 2 + (c.lon - lon) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

export function formatCityLabel(city: WorldCity): string {
  return city.adminAr
    ? `${city.nameAr} · ${city.adminAr} · ${city.countryAr}`
    : `${city.nameAr} · ${city.countryAr}`;
}
