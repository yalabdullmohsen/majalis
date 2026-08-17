import { useEffect, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { MapPin } from "lucide-react";
import { SectionLobby } from "@/components/lobby/SectionLobby";
import { getLobby } from "@/config/section-lobbies";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import {
  formatTime12,
  type PrayerSlot,
} from "@/lib/prayer-times";
import {
  getHighLatitudeRule,
  getPrayerCalcMethod,
  getPrayerMadhab,
  PRAYER_CALC_METHODS,
  setHighLatitudeRule,
  setPrayerCalcMethod,
  setPrayerMadhab,
  type HighLatitudeRuleId,
  type PrayerCalcMethodId,
  type PrayerMadhabId,
} from "@/lib/prayer-calc-prefs";
import { getActivePrayerLocation } from "@/lib/prayer-location-prefs";
import { PrayerLocationPicker } from "@/components/prayer/PrayerLocationPicker";
import { PrayerAnnualTimetable } from "@/components/prayer/PrayerAnnualTimetable";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/pages/prayer-times.css";
import "@/components/sections/section-cards.css";

const PRAYER_AR: Record<string, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

const HIJRI_MONTHS = [
  "محرم", "صفر", "ربيع الأول", "ربيع الآخر",
  "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
  "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
];

function formatHijri(raw: string | null): string {
  if (!raw) return "";
  const [d, m, y] = raw.split("-").map(Number);
  if (!d || !m || !y) return raw;
  const monthName = HIJRI_MONTHS[(m - 1)] ?? "";
  return `${d} ${monthName} ${y} هـ`;
}

function zoneDateReadable(timeZone: string): string {
  return new Intl.DateTimeFormat("ar", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function zoneNowSeconds(timeZone: string): { totalMinutes: number; seconds: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value || 0);
  const s = Number(parts.find((p) => p.type === "second")?.value || 0);
  return { totalMinutes: h * 60 + m, seconds: s };
}

function secondsUntilPrayer(
  prayerMinutes: number | null,
  timeZone: string,
): { seconds: number; isTomorrow: boolean } {
  if (prayerMinutes == null) return { seconds: 0, isTomorrow: false };
  const now = zoneNowSeconds(timeZone);
  if (prayerMinutes > now.totalMinutes) {
    return { seconds: (prayerMinutes - now.totalMinutes) * 60 - now.seconds, isTomorrow: false };
  }
  return {
    seconds: (24 * 60 - now.totalMinutes + prayerMinutes) * 60 - now.seconds,
    isTomorrow: true,
  };
}

function formatHms(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return toArabicDigits(
    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`,
  );
}

/** عرض 12 ساعة عربي (ص/م) — الحسابات تبقى على time24/minutes داخليًا */
function displayTime12(p: PrayerSlot): string {
  const labeled = (p.time || "").trim();
  if (labeled && /[صم]/.test(labeled)) return labeled;
  const raw = (p.time24 || labeled).trim();
  return raw ? formatTime12(raw) : "—";
}
/** حالة مختصرة لكل صف في قائمة المواقيت */
function rowStatusLabel(
  key: string,
  nextKey: string | undefined,
  inGrace: boolean,
  graceKey: string | undefined,
  past: boolean,
): string {
  if (inGrace && key === graceKey) return "مضى على الأذان";
  if (key === nextKey && !inGrace) return "قادمة";
  if (inGrace && key === nextKey) return "حان وقتها";
  if (past) return "مضت";
  return "قادمة";
}

export default function PrayerTimesPage() {
  const [locLabel, setLocLabel] = useState(() => getActivePrayerLocation().label);
  const [locToken, setLocToken] = useState(0);
  const [govOpen, setGovOpen] = useState(false);
  const [calcMethod, setCalcMethod] = useState<PrayerCalcMethodId>(() => getPrayerCalcMethod());
  const [madhab, setMadhab] = useState<PrayerMadhabId>(() => getPrayerMadhab());
  const [highLat, setHighLat] = useState<HighLatitudeRuleId>(() => getHighLatitudeRule());

  const lobby = getLobby("prayer");

  useEffect(() => {
    applyPageSeo({
      path: "/prayer-times",
      title: "مواقيت الصلاة العالمية أوفلاين | المجلس العلمي",
      description: "محرك مواقيت صلاة عالمي أوفلاين لأي مدينة، مع إمساكية سنوية وعدّ تنازلي وتنبيهات محلية.",
      keywords: ["مواقيت الصلاة", "إمساكية", "أوفلاين", "الفجر", "الأذان"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "مواقيت الصلاة العالمية",
          url: "https://www.majlisilm.com/prayer-times",
          description: "مواقيت الصلوات الخمس لأي مدينة في العالم بحساب فلكي محلي",
          provider: { "@type": "Organization", name: "المجلس العلمي", url: "https://www.majlisilm.com" },
        },
      ],
    });
  }, []);

  const { data, countdown, loading: _loading, reload } = usePrayerCountdown();
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);
  const timeZone = data?.timezone || getActivePrayerLocation().timeZone;

  // re-bind when location prefs change
  useEffect(() => {
    void locToken;
    setLocLabel(getActivePrayerLocation().label);
  }, [locToken]);

  function handleCalcMethod(id: PrayerCalcMethodId) {
    setPrayerCalcMethod(id);
    setCalcMethod(id);
    setPinnedKey(null);
    reload();
  }

  function handleMadhab(id: PrayerMadhabId) {
    setPrayerMadhab(id);
    setMadhab(id);
    setPinnedKey(null);
    reload();
  }

  function handleHighLat(id: HighLatitudeRuleId) {
    setHighLatitudeRule(id);
    setHighLat(id);
    setPinnedKey(null);
    reload();
  }

  // لا شاشة تحميل تعترض — الهيكل يظهر دائماً؛ البيانات من الكاش/محلي فوراً
  if (!countdown?.next) {
    return (
      <SectionLobby lobbyId="prayer" title={lobby.title} primary={lobby.primary} groups={lobby.groups}>
        <p className="pts-error" role="alert">تعذّر تجهيز المواقيت محلياً. جرّب اختيار موقع آخر.</p>
        <button type="button" className="pts-retry" onClick={reload} aria-label="إعادة محاولة تحميل المواقيت">
          إعادة المحاولة
        </button>
        <PrayerLocationPicker
          onChanged={() => {
            setLocToken((n) => n + 1);
            reload();
          }}
        />
      </SectionLobby>
    );
  }

  const prayers: PrayerSlot[] = (data?.prayers ?? []).filter((p) => p.time);
  const nowInfo = zoneNowSeconds(timeZone);

  const inGrace = !pinnedKey && countdown.sinceSeconds != null;
  const ranKey = countdown.next.key;

  const displayKey = pinnedKey ?? (inGrace ? ranKey : countdown.next.key);
  const displayItem = prayers.find((p) => p.key === displayKey);
  const displayName = PRAYER_AR[displayKey] ?? countdown.next.name;

  let displayHms: string;
  let isTomorrow = false;
  if (pinnedKey && pinnedKey !== countdown.next.key) {
    const { seconds, isTomorrow: tmrw } = secondsUntilPrayer(displayItem?.minutes ?? null, timeZone);
    displayHms = formatHms(seconds);
    isTomorrow = tmrw;
  } else if (inGrace && countdown.sinceHms) {
    displayHms = countdown.sinceHms;
  } else {
    displayHms = countdown.remainingHms ?? "--:--:--";
  }

  const heroLabel = pinnedKey && pinnedKey !== countdown.next.key
    ? "الوقت المتبقي لـ"
    : inGrace
      ? "مضى على الأذان"
      : "الصلاة القادمة";

  const isNext = (key: string) => key === countdown.next?.key;
  const isPinned = (key: string) => key === displayKey;
  const isPast = (p: PrayerSlot) =>
    p.minutes != null && p.minutes < nowInfo.totalMinutes && !isNext(p.key) && !(inGrace && p.key === ranKey);

  const hijriStr = formatHijri(data?.date?.hijri ?? null);
  const gregStr = zoneDateReadable(timeZone);

  const primary = lobby.primary
    ? {
        ...lobby.primary,
        label: heroLabel,
        subtitle: `${displayKey === "Sunrise" ? displayName : `صلاة ${displayName}`} · ${displayHms}`,
      }
    : undefined;

  return (
    <SectionLobby lobbyId="prayer" title={lobby.title} primary={primary} groups={lobby.groups}>
      <div id="mawaqeet" className="pts-lobby-body">
        <div className="pts-dates">
          {hijriStr && <span>{hijriStr}</span>}
          <span className="pts-dates__sep" aria-hidden="true">·</span>
          <span>{gregStr}</span>
        </div>
        <button
          type="button"
          className="pts-location"
          onClick={() => setGovOpen((v) => !v)}
          aria-expanded={govOpen}
          aria-controls="pts-gov-panel"
        >
          <MapPin size={15} strokeWidth={2} aria-hidden="true" />
          <span>{locLabel}</span>
        </button>

        {govOpen && (
          <div id="pts-gov-panel" className="pts-gov-panel" role="region" aria-label="إعدادات الموقع والحساب">
            <PrayerLocationPicker
              onChanged={(next) => {
                setLocLabel(next.label);
                setLocToken((n) => n + 1);
                setPinnedKey(null);
                reload();
              }}
            />
            <label className="pts-method" htmlFor="pts-calc-method">
              <span className="pts-method__label">طريقة الحساب</span>
              <select
                id="pts-calc-method"
                className="pts-method__select"
                value={calcMethod}
                onChange={(e) => handleCalcMethod(e.target.value as PrayerCalcMethodId)}
                dir="rtl"
              >
                {PRAYER_CALC_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.labelAr}
                  </option>
                ))}
              </select>
            </label>
            <label className="pts-method" htmlFor="pts-madhab">
              <span className="pts-method__label">مذهب العصر</span>
              <select
                id="pts-madhab"
                className="pts-method__select"
                value={madhab}
                onChange={(e) => handleMadhab(e.target.value as PrayerMadhabId)}
                dir="rtl"
              >
                <option value="Shafi">شافعي / مالكي / حنبلي</option>
                <option value="Hanafi">حنفي</option>
              </select>
            </label>
            <label className="pts-method" htmlFor="pts-highlat">
              <span className="pts-method__label">مناطق خطوط العرض العالية</span>
              <select
                id="pts-highlat"
                className="pts-method__select"
                value={highLat}
                onChange={(e) => handleHighLat(e.target.value as HighLatitudeRuleId)}
                dir="rtl"
              >
                <option value="auto">تلقائي موصى به</option>
                <option value="MiddleOfTheNight">منتصف الليل</option>
                <option value="SeventhOfTheNight">سُبع الليل</option>
                <option value="TwilightAngle">زاوية الشفق</option>
              </select>
            </label>
          </div>
        )}

        {pinnedKey && pinnedKey !== countdown.next.key && (
          <div className="pts-hero__actions">
            {isTomorrow && <span className="pts-badge">غداً</span>}
            <button type="button" className="pts-hero__reset" onClick={() => setPinnedKey(null)}>
              العودة للصلاة القادمة
            </button>
          </div>
        )}

        {prayers.length > 0 && (
          <nav className="pts-list" aria-label="صلوات اليوم">
            {prayers.map((p) => {
              const next = isNext(p.key);
              const pinned = isPinned(p.key);
              const past = isPast(p);
              const status = rowStatusLabel(p.key, countdown.next?.key, inGrace, ranKey, past);
              return (
                <button
                  key={p.key}
                  type="button"
                  className={[
                    "pts-row",
                    next || (inGrace && p.key === ranKey) ? "pts-row--next" : "",
                    pinned && !next ? "pts-row--pinned" : "",
                    past ? "pts-row--past" : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => setPinnedKey(p.key === pinnedKey ? null : p.key)}
                  aria-pressed={pinned}
                  aria-label={`${PRAYER_AR[p.key] ?? p.name}، ${displayTime12(p)}، ${status}`}
                >
                  <span className="pts-row__meta">
                    <span className="pts-row__name">{PRAYER_AR[p.key] ?? p.name}</span>
                    <span className="pts-row__status">{status}</span>
                  </span>
                  <span className="pts-row__time" dir="ltr">{displayTime12(p)}</span>
                </button>
              );
            })}
          </nav>
        )}

        <PrayerAnnualTimetable />
        <p className="sr-only">تنبيهات الأذان من إعدادات الأذان</p>
      </div>
    </SectionLobby>
  );
}
