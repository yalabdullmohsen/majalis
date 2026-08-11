import { useEffect, useState } from "react";
import { Crosshair, MapPin, Search } from "lucide-react";
import {
  ensureWorldCitiesLoaded,
  findNearestWorldCity,
  formatCityLabel,
  listAdminsByCountry,
  listCitiesByCountry,
  listWorldCountries,
  searchWorldCities,
  type WorldCity,
  type WorldCountry,
} from "@/lib/world-cities";
import {
  getActivePrayerLocation,
  setLocationFromGps,
  setLocationFromKuwaitGov,
  setLocationFromWorldCity,
  type PrayerActiveLocation,
} from "@/lib/prayer-location-prefs";
import { KUWAIT_GOVERNORATES, setSelectedGovernorate } from "@/lib/prayer-kuwait-geo";
import { suggestMethodForRegion } from "@/lib/prayer-calc-prefs";

type Props = {
  onChanged: (loc: PrayerActiveLocation) => void;
};

export function PrayerLocationPicker({ onChanged }: Props) {
  const [loc, setLoc] = useState(() => getActivePrayerLocation());
  const [countries, setCountries] = useState<WorldCountry[]>([]);
  const [country, setCountry] = useState(loc.countryCode || "KW");
  const [admins, setAdmins] = useState<string[]>([]);
  const [admin, setAdmin] = useState("");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<WorldCity[]>([]);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void ensureWorldCitiesLoaded()
      .then(() => listWorldCountries())
      .then((c) => {
        setCountries(c);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !country) return;
    void listAdminsByCountry(country).then(setAdmins);
    void listCitiesByCountry(country).then((cities) => setHits(cities.slice(0, 40)));
  }, [country, ready]);

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => {
      void searchWorldCities(query, {
        countryCode: country || undefined,
        adminAr: admin || undefined,
        limit: 40,
      }).then(setHits);
    }, 120);
    return () => window.clearTimeout(t);
  }, [query, country, admin, ready]);

  function applyCity(city: WorldCity) {
    if (city.defaultMethod) suggestMethodForRegion(city.defaultMethod);
    const next = setLocationFromWorldCity(city);
    setLoc(next);
    onChanged(next);
  }

  function applyKuwaitGov(id: string) {
    const gov = KUWAIT_GOVERNORATES.find((g) => g.id === id);
    if (!gov) return;
    setSelectedGovernorate(id);
    const next = setLocationFromKuwaitGov(gov);
    setLoc(next);
    onChanged(next);
  }

  function useGps() {
    if (!navigator.geolocation) {
      setGpsError("المتصفح لا يدعم تحديد الموقع.");
      return;
    }
    setGpsBusy(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void (async () => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const nearest = await findNearestWorldCity(lat, lon);
          const timeZone =
            nearest?.timeZone ||
            Intl.DateTimeFormat().resolvedOptions().timeZone ||
            "UTC";
          const label = nearest
            ? `GPS · قرب ${nearest.nameAr}`
            : `GPS · ${lat.toFixed(3)}, ${lon.toFixed(3)}`;
          if (nearest?.defaultMethod) suggestMethodForRegion(nearest.defaultMethod);
          const next = setLocationFromGps({
            lat,
            lon,
            timeZone,
            label,
            countryCode: nearest?.countryCode,
            cityId: nearest?.id,
          });
          setLoc(next);
          onChanged(next);
          setGpsBusy(false);
        })();
      },
      () => {
        setGpsBusy(false);
        setGpsError("تعذّر الحصول على الموقع. فعّل الصلاحية أو اختر مدينة يدوياً.");
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  return (
    <div className="pts-loc" dir="rtl">
      <p className="pts-loc__current">
        <MapPin size={14} aria-hidden />
        <span>{loc.label}</span>
        <span className="pts-loc__tz">{loc.timeZone}</span>
      </p>

      <div className="pts-loc__modes">
        <button type="button" className="pts-loc__gps" onClick={useGps} disabled={gpsBusy}>
          <Crosshair size={14} aria-hidden />
          {gpsBusy ? "جاري التحديد…" : "التحديد التلقائي (GPS)"}
        </button>
        {gpsError && <p className="pts-loc__err" role="alert">{gpsError}</p>}
      </div>

      <p className="pts-loc__section">اختصارات الكويت</p>
      <div className="pts-gov" role="tablist" aria-label="محافظات الكويت">
        {KUWAIT_GOVERNORATES.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            className={`pts-gov__chip${loc.kuwaitGovId === g.id ? " pts-gov__chip--active" : ""}`}
            onClick={() => applyKuwaitGov(g.id)}
            aria-selected={loc.kuwaitGovId === g.id}
          >
            {g.name}
          </button>
        ))}
      </div>

      <p className="pts-loc__section">الاختيار اليدوي — دولة / منطقة / مدينة</p>
      <div className="pts-loc__filters">
        <label className="pts-loc__field">
          <span>الدولة</span>
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setAdmin("");
              setQuery("");
            }}
            dir="rtl"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.nameAr}
              </option>
            ))}
          </select>
        </label>
        <label className="pts-loc__field">
          <span>المنطقة</span>
          <select
            value={admin}
            onChange={(e) => setAdmin(e.target.value)}
            dir="rtl"
          >
            <option value="">الكل</option>
            {admins.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="pts-loc__search">
        <Search size={14} aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن مدينة…"
          aria-label="بحث المدن أوفلاين"
          dir="rtl"
        />
      </label>

      <ul className="pts-loc__hits" role="listbox" aria-label="نتائج المدن">
        {hits.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={`pts-loc__hit${loc.cityId === c.id ? " is-active" : ""}`}
              onClick={() => applyCity(c)}
            >
              <span>{formatCityLabel(c)}</span>
              <span className="pts-loc__hit-meta">{c.timeZone}</span>
            </button>
          </li>
        ))}
        {ready && hits.length === 0 && (
          <li className="pts-loc__empty">لا نتائج — جرّب دولة أخرى أو بحثاً أقصر.</li>
        )}
      </ul>
    </div>
  );
}
