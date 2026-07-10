import { useEffect } from "react";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { GeometricPattern } from "@/components/design/GeometricPattern";
import { ShareButtons } from "@/components/ContentActions";
import type { PrayerSlot } from "@/lib/prayer-times";
import { applyPageSeo } from "@/lib/seo";

const PRAYER_AR: Record<string, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

export default function PrayerCountdownPage() {
  const { data, countdown, loading } = usePrayerCountdown();

  useEffect(() => {
    applyPageSeo({
      path: "/prayer-countdown",
      title: "العد التنازلي للصلاة | المجلس العلمي",
      description: "عد تنازلي لوقت الصلاة القادمة، الفجر والظهر والعصر والمغرب والعشاء في الكويت.",
      keywords: ["عد تنازلي صلاة", "وقت الصلاة", "الصلاة القادمة", "مواقيت الكويت", "أذان"],
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "العد التنازلي للصلاة", url: "https://majlisilm.com/prayer-countdown", about: { "@type": "Thing", name: "مواقيت الصلاة في الكويت" } }],
    });
  }, []);

  if (loading) {
    return (
      <div className="prayer-countdown-page" dir="rtl">
        <p className="pcp-loading-msg">جارٍ تحميل المواقيت…</p>
      </div>
    );
  }

  if (!data?.prayers?.length || !countdown) {
    return (
      <div className="prayer-countdown-page" dir="rtl">
        <p className="pcp-error-msg">تعذّر تحميل مواقيت الصلاة، تحقق من الاتصال.</p>
      </div>
    );
  }

  const obligatory = data.prayers.filter(
    (p: PrayerSlot) => p.obligatory || p.key === "Sunrise",
  );

  return (
    <div className="prayer-countdown-page" dir="rtl">
      {/* خلفية زخرفية هادئة */}
      <div className="prayer-countdown-page__bg">
        <GeometricPattern pattern="stars" color="var(--majalis-emerald)" opacity={1} />
      </div>

      {/* الصلاة القادمة / فترة ما بعد الأذان */}
      {countdown.next && (
        <>
          {countdown.sinceSeconds != null ? (
            <>
              <p className="prayer-countdown__next-label pcp-elapsed-label">وقت {PRAYER_AR[countdown.next.key] ?? countdown.next.key}</p>
              <h1 className="prayer-countdown__next-name font-display">
                {PRAYER_AR[countdown.next.key] ?? countdown.next.key}
              </h1>
              <div className="prayer-countdown__elapsed" aria-live="polite">
                مضى على الأذان {Math.floor(countdown.sinceSeconds / 60)} دقيقة
              </div>
            </>
          ) : (
            <>
              <p className="prayer-countdown__next-label">الصلاة القادمة</p>
              <h1 className="prayer-countdown__next-name font-display">
                {PRAYER_AR[countdown.next.key] ?? countdown.next.key}
              </h1>
              <div className="prayer-countdown__timer" dir="ltr">
                {countdown.remainingHms ?? "--:--:--"}
              </div>
            </>
          )}
        </>
      )}

      {/* الصلاة المنقضية */}
      {countdown.sinceSeconds == null && countdown.previous && (
        <div className="prayer-countdown__prev">
          <span>{PRAYER_AR[countdown.previous.key] ?? countdown.previous.key}</span>
          <span className="pcp-expired">انقضت</span>
        </div>
      )}

      {/* شبكة المواقيت */}
      <div className="prayer-countdown__slots">
        {obligatory.map((p: PrayerSlot) => {
          const isNext = countdown.next?.key === p.key;
          const isPrev = countdown.previous?.key === p.key;
          return (
            <div key={p.key} className={`prayer-slot-chip${isNext ? " prayer-slot-chip--next" : ""}${isPrev && !isNext ? " prayer-slot-chip--prev" : ""}`}>
              <span className="prayer-slot-chip__name">{PRAYER_AR[p.key] ?? p.key}</span>
              <span className="prayer-slot-chip__time">{p.time24}</span>
            </div>
          );
        })}
      </div>

      <p className="pcp-city-label">
        {data.city} · {data.source}
      </p>

      <div className="twh-share">
        <ShareButtons title="العد التنازلي للصلاة — المجلس العلمي" url="https://majlisilm.com/prayer-countdown" />
      </div>
    </div>
  );
}
