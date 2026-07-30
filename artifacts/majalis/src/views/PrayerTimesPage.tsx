import { useEffect, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { Link } from "wouter";
import { Bell, Compass, MapPin } from "lucide-react";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import {
  KUWAIT_GOVERNORATES,
  getSelectedGovernorate,
  setSelectedGovernorate,
  type PrayerSlot,
} from "@/lib/prayer-times";
import "@/styles/pages/prayer-times.css";

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

function kuwaitDateReadable(): string {
  return new Intl.DateTimeFormat("ar-KW", {
    timeZone: "Asia/Kuwait",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function kuwaitNowSeconds(): { totalMinutes: number; seconds: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuwait",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const s = Number(parts.find((p) => p.type === "second")?.value ?? 0);
  return { totalMinutes: h * 60 + m, seconds: s };
}

function secondsUntilPrayer(prayerMinutes: number | null): { seconds: number; isTomorrow: boolean } {
  if (prayerMinutes == null) return { seconds: 0, isTomorrow: false };
  const now = kuwaitNowSeconds();
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
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function displayTime24(p: PrayerSlot): string {
  const raw = (p.time24 || p.time || "").trim();
  const m = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return p.time;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

function MosqueSilhouette() {
  return (
    <svg
      className="pts-mosque"
      viewBox="0 0 360 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M180 28c-28 22-42 48-42 78v14h84v-14c0-30-14-56-42-78Z"
        fill="currentColor"
        opacity="0.14"
      />
      <path d="M180 18v22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.22" />
      <circle cx="180" cy="14" r="4" fill="currentColor" opacity="0.28" />
      <rect x="118" y="112" width="124" height="88" rx="6" fill="currentColor" opacity="0.12" />
      <path
        d="M130 112v-18c0-10 8-22 18-30 6 8 12 18 12 30v18H130Z"
        fill="currentColor"
        opacity="0.16"
      />
      <path
        d="M200 112v-18c0-10 8-22 18-30 6 8 12 18 12 30v18H200Z"
        fill="currentColor"
        opacity="0.16"
      />
      <rect x="68" y="78" width="22" height="122" rx="4" fill="currentColor" opacity="0.13" />
      <path d="M79 42c-10 10-14 22-14 34v10h28V76c0-12-4-24-14-34Z" fill="currentColor" opacity="0.16" />
      <path d="M79 34v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.25" />
      <circle cx="79" cy="30" r="3.2" fill="currentColor" opacity="0.3" />
      <rect x="270" y="98" width="18" height="102" rx="3" fill="currentColor" opacity="0.11" />
      <path d="M279 68c-8 8-11 17-11 28v8h22v-8c0-11-3-20-11-28Z" fill="currentColor" opacity="0.14" />
      <rect x="152" y="148" width="56" height="52" rx="4" fill="currentColor" opacity="0.1" />
      <path d="M152 148h56v-10c-8 6-20 10-28 10s-20-4-28-10v10Z" fill="currentColor" opacity="0.14" />
      <path d="M40 200h280" stroke="currentColor" strokeWidth="2" opacity="0.1" />
    </svg>
  );
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
  const [govId, setGovId] = useState(() => getSelectedGovernorate().id);
  const [govOpen, setGovOpen] = useState(false);

  useEffect(() => {
    applyPageSeo({
      path: "/prayer-times",
      title: "مواقيت الصلاة، الكويت | المجلس العلمي",
      description: "مواقيت صلاة دقيقة لجميع مناطق الكويت، الفجر والظهر والعصر والمغرب والعشاء مع العد التنازلي.",
      keywords: ["مواقيت الصلاة", "صلاة الكويت", "أوقات الصلاة", "الفجر", "الأذان"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "مواقيت الصلاة في الكويت",
          url: "https://www.majlisilm.com/prayer-times",
          description: "مواقيت الصلوات الخمس لجميع مناطق الكويت محسوبة فلكياً",
          about: {
            "@type": "Thing",
            name: "مواقيت الصلاة",
            description: "أوقات الصلوات الخمس الفجر والظهر والعصر والمغرب والعشاء",
          },
          provider: { "@type": "Organization", name: "المجلس العلمي", url: "https://www.majlisilm.com" },
          areaServed: { "@type": "Country", name: "الكويت" },
        },
      ],
    });
  }, []);

  const { data, countdown, loading, reload } = usePrayerCountdown(govId);
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);
  const gov = KUWAIT_GOVERNORATES.find((g) => g.id === govId) ?? KUWAIT_GOVERNORATES[0];

  function handleGov(id: string) {
    setSelectedGovernorate(id);
    setGovId(id);
    setPinnedKey(null);
    setGovOpen(false);
  }

  if (loading) {
    return (
      <div className="pts-screen" dir="rtl">
        <h1 className="pts-title">الصلاة</h1>
        <div className="pts-skeleton" aria-busy="true">جارٍ تحميل المواقيت…</div>
      </div>
    );
  }

  if (!countdown?.next) {
    return (
      <div className="pts-screen" dir="rtl">
        <h1 className="pts-title">الصلاة</h1>
        <p className="pts-error" role="alert">تعذّر تحميل مواقيت الصلاة، تحقق من الاتصال.</p>
        <button type="button" className="pts-retry" onClick={reload} aria-label="إعادة محاولة تحميل المواقيت">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const prayers: PrayerSlot[] = (data?.prayers ?? []).filter((p) => p.time);
  const nowInfo = kuwaitNowSeconds();

  const inGrace = !pinnedKey && countdown.sinceSeconds != null;
  const ranKey = countdown.next.key;

  const displayKey = pinnedKey ?? (inGrace ? ranKey : countdown.next.key);
  const displayItem = prayers.find((p) => p.key === displayKey);
  const displayName = PRAYER_AR[displayKey] ?? countdown.next.name;

  let displayHms: string;
  let isTomorrow = false;
  if (pinnedKey && pinnedKey !== countdown.next.key) {
    const { seconds, isTomorrow: tmrw } = secondsUntilPrayer(displayItem?.minutes ?? null);
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
  const gregStr = kuwaitDateReadable();

  return (
    <div className="pts-screen" dir="rtl">
      <header className="pts-header">
        <button
          type="button"
          className="pts-location"
          onClick={() => setGovOpen((v) => !v)}
          aria-expanded={govOpen}
          aria-controls="pts-gov-panel"
        >
          <MapPin size={15} strokeWidth={2} aria-hidden="true" />
          <span>الكويت · {gov.name}</span>
        </button>
        <div className="pts-dates">
          {hijriStr && <span>{hijriStr}</span>}
          <span className="pts-dates__sep" aria-hidden="true">·</span>
          <span>{gregStr}</span>
        </div>
        <h1 className="pts-title sr-only">مواقيت الصلاة</h1>
      </header>

      {govOpen && (
        <div id="pts-gov-panel" className="pts-gov" role="tablist" aria-label="اختيار المحافظة">
          {KUWAIT_GOVERNORATES.map((g) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              className={`pts-gov__chip${govId === g.id ? " pts-gov__chip--active" : ""}`}
              onClick={() => handleGov(g.id)}
              aria-selected={govId === g.id}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      <section className="pts-hero" aria-label="العداد التنازلي">
        <MosqueSilhouette />
        <div className="pts-hero__content">
          <p className="pts-hero__label">{heroLabel}</p>
          <h2 className="pts-hero__name" key={displayKey}>
            {displayKey === "Sunrise" ? displayName : `صلاة ${displayName}`}
          </h2>
          <div
            className="pts-hero__countdown"
            dir="ltr"
            aria-live="polite"
            aria-atomic="true"
            aria-label={`الوقت: ${displayHms}`}
            key={displayHms}
          >
            {displayHms}
          </div>
          {inGrace && !pinnedKey && (
            <p className="pts-hero__hint">حتى مرور ٣٥ دقيقة ثم الانتقال للصلاة التالية</p>
          )}
          {pinnedKey && pinnedKey !== countdown.next.key && (
            <div className="pts-hero__actions">
              {isTomorrow && <span className="pts-badge">غداً</span>}
              <button type="button" className="pts-hero__reset" onClick={() => setPinnedKey(null)}>
                العودة للصلاة القادمة
              </button>
            </div>
          )}
        </div>
      </section>

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
                aria-label={`${PRAYER_AR[p.key] ?? p.name}، ${displayTime24(p)}، ${status}`}
              >
                <span className="pts-row__meta">
                  <span className="pts-row__name">{PRAYER_AR[p.key] ?? p.name}</span>
                  <span className="pts-row__status">{status}</span>
                </span>
                <span className="pts-row__time" dir="ltr">{displayTime24(p)}</span>
              </button>
            );
          })}
        </nav>
      )}

      <nav className="pts-dock" aria-label="أدوات الصلاة">
        <Link href="/qibla" className="pts-dock__item">
          <span className="pts-dock__icon"><Compass size={20} strokeWidth={1.7} /></span>
          <span>القبلة</span>
        </Link>
        <Link href="/adhan-settings" className="pts-dock__item">
          <span className="pts-dock__icon"><Bell size={20} strokeWidth={1.7} /></span>
          <span>تنبيهات الأذان</span>
        </Link>
      </nav>
    </div>
  );
}
