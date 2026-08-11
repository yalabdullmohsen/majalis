/**
 * Offline universal prayer engine — cities pack, calc prefs, annual rows.
 * Run: npx tsx src/lib/__tests__/offline-universal-prayer.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
  clear: () => mem.clear(),
  key: () => null,
  get length() {
    return mem.size;
  },
};

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const pack = JSON.parse(
  readFileSync(join(root, "public/data/prayer/world-cities.json"), "utf8"),
) as { count: number; countries: unknown[]; cities: unknown[] };

assert.ok(pack.count >= 200, `expected ≥200 cities, got ${pack.count}`);
assert.ok(pack.countries.length >= 40, "expected many countries");
assert.ok(Array.isArray(pack.cities) && pack.cities.length === pack.count);

const {
  getPrayerCalcMethod,
  setPrayerCalcMethod,
  getPrayerMadhab,
  setPrayerMadhab,
  getHighLatitudeRule,
  setHighLatitudeRule,
  resolveAdhanParams,
  PRAYER_CALC_METHODS,
} = await import("../prayer-calc-prefs");

assert.ok(PRAYER_CALC_METHODS.some((m) => m.id === "FranceUOIF"));
assert.ok(PRAYER_CALC_METHODS.some((m) => m.id === "Qatar"));
setPrayerCalcMethod("Egyptian");
assert.equal(getPrayerCalcMethod(), "Egyptian");
setPrayerMadhab("Hanafi");
assert.equal(getPrayerMadhab(), "Hanafi");
setHighLatitudeRule("SeventhOfTheNight");
assert.equal(getHighLatitudeRule(), "SeventhOfTheNight");

const adhan = await import("adhan");
const params = resolveAdhanParams(adhan, "FranceUOIF", { latitude: 48.85, longitude: 2.35 });
assert.equal(params.madhab, adhan.Madhab.Hanafi);
assert.equal(params.highLatitudeRule, adhan.HighLatitudeRule.SeventhOfTheNight);

const { setLocationFromWorldCity, getActivePrayerLocation, prayerLocationCacheId } = await import(
  "../prayer-location-prefs"
);
const cityRow = pack.cities.find((r) => (r as string[])[0] === "gb-london") as string[];
assert.ok(cityRow, "london in pack");
setLocationFromWorldCity({
  id: cityRow[0]!,
  nameAr: cityRow[1]!,
  nameEn: cityRow[2]!,
  countryCode: cityRow[3]!,
  countryAr: cityRow[4]!,
  adminAr: cityRow[5]!,
  timeZone: cityRow[6]!,
  lat: cityRow[7] as unknown as number,
  lon: cityRow[8] as unknown as number,
  defaultMethod: cityRow[9]!,
});
const loc = getActivePrayerLocation();
assert.equal(loc.timeZone, "Europe/London");
assert.ok(prayerLocationCacheId(loc).startsWith("city:"));

const { computePrayerTimesForDate } = await import("../prayer-times");
const day = await computePrayerTimesForDate(
  51.5074,
  -0.1278,
  "لندن",
  "Europe/London",
  new Date("2026-06-15T12:00:00Z"),
  "MuslimWorldLeague",
);
assert.equal(day.ok, true);
assert.equal(day.timezone, "Europe/London");
assert.ok(day.prayers.length >= 6);
assert.ok(day.prayers.every((p) => /^\d{2}:\d{2}$/.test(p.time24)));

const { generateMonthTimetable } = await import("../prayer-annual");
const june = await generateMonthTimetable(2026, 6, {
  lat: 51.5074,
  lon: -0.1278,
  timeZone: "Europe/London",
  label: "لندن",
});
assert.equal(june.length, 30);
assert.ok(june[0]?.fajr);

console.log("offline-universal-prayer: ok");
