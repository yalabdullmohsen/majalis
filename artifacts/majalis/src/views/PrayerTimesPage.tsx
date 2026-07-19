import { useEffect, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { Link } from "wouter";
import { Bell, Compass, Moon, RotateCw, Star, Sun, SunDim, Sunset, Sunrise } from "lucide-react";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import type { LucideIcon } from "lucide-react";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import {
  KUWAIT_GOVERNORATES,
  getSelectedGovernorate,
  setSelectedGovernorate,
  type PrayerSlot,
} from "@/lib/prayer-times";

const PRAYER_AR: Record<string, string> = {
  Fajr:    "الفجر",
  Sunrise: "الشروق",
  Dhuhr:   "الظهر",
  Asr:     "العصر",
  Maghrib: "المغرب",
  Isha:    "العشاء",
};

const PRAYER_ICON: Record<string, LucideIcon> = {
  Fajr:    Moon,
  Sunrise: Sunrise,
  Dhuhr:   Sun,
  Asr:     SunDim,
  Maghrib: Sunset,
  Isha:    Star,
};

const HIJRI_MONTHS = [
  "محرم","صفر","ربيع الأول","ربيع الآخر",
  "جمادى الأولى","جمادى الآخرة","رجب","شعبان",
  "رمضان","شوال","ذو القعدة","ذو الحجة",
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

// ── الوقت الحالي بتوقيت الكويت (ثوانٍ منذ منتصف الليل) ──
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

// ── حساب الثواني المتبقية لصلاة بحسب minutes ──
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

export default function PrayerTimesPage() {
  const [govId, setGovId] = useState(() => getSelectedGovernorate().id);

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
  const { data, countdown, loading } = usePrayerCountdown(govId);
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);

  function handleGov(id: string) {
    setSelectedGovernorate(id);
    setGovId(id);
    setPinnedKey(null);
  }

  if (loading) {
    return (
      <div className="pt-wrap" dir="rtl">
        <div className="pt-skeleton" aria-busy="true">
          <div className="pt-skeleton__label">جارٍ تحميل المواقيت…</div>
        </div>
      </div>
    );
  }

  if (!countdown?.next) {
    return (
      <div className="pt-wrap" dir="rtl">
        <p className="pt-error">تعذّر تحميل مواقيت الصلاة، تحقق من الاتصال.</p>
      </div>
    );
  }

  const prayers: PrayerSlot[] = (data?.prayers ?? []).filter((p) => p.time);
  const nowInfo = kuwaitNowSeconds();

  const inGrace = !pinnedKey && countdown.sinceSeconds != null;
  const sinceMinutes = inGrace ? Math.floor((countdown.sinceSeconds ?? 0) / 60) : 0;

  // During grace: find the actual next prayer (after the one that rang)
  const ranKey = countdown.next.key;
  const OBLIGATORY_KEYS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const ranIdx = OBLIGATORY_KEYS.indexOf(ranKey);
  const actualNextKey = inGrace
    ? (ranIdx >= 0 ? OBLIGATORY_KEYS[(ranIdx + 1) % OBLIGATORY_KEYS.length] : null)
    : null;

  const displayKey  = pinnedKey ?? (inGrace && actualNextKey ? actualNextKey : countdown.next.key);
  const displayItem = prayers.find((p) => p.key === displayKey);
  const displayName = PRAYER_AR[displayKey] ?? countdown.next.name;
  const displayTime = displayItem?.time ?? countdown.next.time;

  let displayHms: string;
  let isTomorrow = false;
  if (pinnedKey && pinnedKey !== countdown.next.key) {
    const { seconds, isTomorrow: tmrw } = secondsUntilPrayer(displayItem?.minutes ?? null);
    displayHms = formatHms(seconds);
    isTomorrow = tmrw;
  } else if (inGrace && countdown.graceNextHms) {
    displayHms = countdown.graceNextHms;
    isTomorrow = (displayItem?.minutes ?? Infinity) < nowInfo.totalMinutes;
  } else {
    displayHms = countdown.remainingHms ?? "--:--:--";
  }

  const isNext   = (key: string) => key === countdown.next?.key;
  const isPinned = (key: string) => key === displayKey;
  const isPast   = (p: PrayerSlot) =>
    p.minutes != null && p.minutes < nowInfo.totalMinutes && !isNext(p.key);

  const hijriStr = formatHijri(data?.date?.hijri ?? null);
  const gregStr  = kuwaitDateReadable();

  return (
    <div className="pt-wrap" dir="rtl">

      {/* ── التاريخ ── */}
      <div className="pt-date-row">
        {hijriStr && <span className="pt-date-hijri">{hijriStr}</span>}
        <span className="pt-date-sep" aria-hidden="true">·</span>
        <span className="pt-date-greg">{gregStr}</span>
      </div>

      {/* ── العداد الرئيسي ── */}
      <section className="pt-hero" aria-label="العداد التنازلي">
        <div className="pt-hero__label">
          {pinnedKey && pinnedKey !== countdown.next.key
            ? "الوقت المتبقي لـ"
            : inGrace
              ? `مضى على أذان ${PRAYER_AR[ranKey] ?? countdown.next.name} ${sinceMinutes} دقيقة · الصلاة القادمة`
              : "الصلاة القادمة"}
        </div>
        <h1 className="pt-hero__name" key={displayKey}>
          <span className="pt-hero__icon" aria-hidden="true">
            {(() => { const I = PRAYER_ICON[displayKey] ?? Sunset; return <I size={36} strokeWidth={1.5} />; })()}
          </span>
          {displayName}
        </h1>
        <div className="pt-hero__time">{displayTime}</div>
        <div
          className="pt-hero__countdown"
          dir="ltr"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`الوقت المتبقي: ${displayHms}`}
          key={displayHms}
        >
          {displayHms}
        </div>
        <div className="pt-hero__hint">
          {pinnedKey && pinnedKey !== countdown.next.key ? (
            <span className="pt-hero__hint-inner">
              {isTomorrow && <span className="pt-tomorrow-badge">غداً</span>}
              <button type="button" className="pt-hero__reset" onClick={() => setPinnedKey(null)}>
                العودة للصلاة القادمة
              </button>
            </span>
          ) : "الوقت المتبقي"}
        </div>
      </section>

      {/* ── شريط الصلوات ── */}
      {prayers.length > 0 && (
        <nav className="pt-prayers" aria-label="صلوات اليوم">
          {prayers.map((p) => (
            <button
              key={p.key}
              type="button"
              className={[
                "pt-prayer",
                isNext(p.key)   ? "pt-prayer--next"   : "",
                isPinned(p.key) ? "pt-prayer--pinned" : "",
                isPast(p)       ? "pt-prayer--past"   : "",
                p.key === "Sunrise" ? "pt-prayer--sunrise" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => setPinnedKey(p.key === pinnedKey ? null : p.key)}
              aria-pressed={isPinned(p.key)}
              aria-label={`صلاة ${PRAYER_AR[p.key] ?? p.name}${p.key === "Sunrise" ? " (غير مفروضة)" : ""}، ${p.time}`}
            >
              <span className="pt-prayer__icon" aria-hidden="true">
                {(() => { const I = PRAYER_ICON[p.key] ?? Sunset; return <I size={20} strokeWidth={1.6} />; })()}
              </span>
              <span className="pt-prayer__name">{PRAYER_AR[p.key] ?? p.name}</span>
              <span className="pt-prayer__time">{p.time}</span>
              {isPast(p) && <span className="pt-prayer__done" aria-label="انتهت">✓</span>}
            </button>
          ))}
        </nav>
      )}

      {/* ── اختيار المحافظة ── */}
      <div className="pt-gov-section">
        <p className="pt-gov-label">المحافظة</p>
        <div className="pt-gov-chips" role="tablist" aria-label="اختيار المحافظة">
          {KUWAIT_GOVERNORATES.map((gov) => (
            <button
              key={gov.id}
              role="tab"
              type="button"
              className={`pt-gov-chip${govId === gov.id ? " pt-gov-chip--active" : ""}`}
              onClick={() => handleGov(gov.id)}
              aria-selected={govId === gov.id}
            >
              {gov.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── روابط سريعة ── */}
      <div className="pt-quick-links">
        <Link href="/qibla" className="pt-quick-link">
          <Compass size={16} strokeWidth={1.8} aria-hidden="true" /> اتجاه القبلة
        </Link>
        <Link href="/tasbih" className="pt-quick-link">
          <RotateCw size={16} strokeWidth={1.8} aria-hidden="true" /> التسبيح
        </Link>
        <Link href="/salah-guide?tab=maratib" className="pt-quick-link">
          <Star size={16} strokeWidth={1.8} aria-hidden="true" /> مراتب المصلين
        </Link>
        <Link href="/salah-guide?tab=suwar" className="pt-quick-link">
          <Moon size={16} strokeWidth={1.8} aria-hidden="true" /> سور الصلاة والنوافل
        </Link>
        <Link href="/adhan-settings" className="pt-quick-link">
          <Bell size={16} strokeWidth={1.8} aria-hidden="true" /> إعدادات الأذان والتنبيهات
        </Link>
      </div>

      <div className="twh-share">
        <ShareButtons title="مواقيت الصلاة — المجلس العلمي" url="https://www.majlisilm.com/prayer-times" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="fiqh" title="اختبر معلوماتك في أحكام الصلاة" count={4} />
      </div>
    </div>
  );
}
