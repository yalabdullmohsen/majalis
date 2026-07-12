import { useEffect, useMemo, useState } from "react";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { loadAdhanPrefs } from "@/lib/adhan-preferences";
import {
  getFridayWindowStatus,
  isFridayBannerDismissed,
  dismissFridayBanner,
} from "@/lib/friday-prayer";

export function FridayBanner() {
  const [enabled, setEnabled] = useState(() => loadAdhanPrefs().fridayBannerEnabled);
  const [dismissed, setDismissed] = useState(() => isFridayBannerDismissed());
  const { data } = usePrayerCountdown();

  const maghribMinutes = useMemo(
    () => data?.prayers?.find((p) => p.key === "Maghrib")?.minutes ?? null,
    [data],
  );

  const status = useMemo(
    () => getFridayWindowStatus(maghribMinutes),
    [maghribMinutes],
  );

  // Reload prefs when user changes settings without page reload
  useEffect(() => {
    const onStorage = () => setEnabled(loadAdhanPrefs().fridayBannerEnabled);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!enabled || dismissed || !status.inWindow) return null;

  function handleDismiss() {
    dismissFridayBanner();
    setDismissed(true);
  }

  return (
    <div className="frb-wrap" dir="rtl" role="region" aria-label="تذكير يوم الجمعة">
      {/* زخرفة هندسية علوية */}
      <div className="frb-geo" aria-hidden="true">
        <svg width="100%" height="4" viewBox="0 0 400 4" preserveAspectRatio="none">
          <path
            d="M0,2 Q100,0 200,2 Q300,4 400,2"
            fill="none"
            stroke="rgba(250,248,242,0.35)"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <button
        type="button"
        className="frb-dismiss"
        onClick={handleDismiss}
        aria-label="إغلاق تذكير يوم الجمعة"
        title="إغلاق"
      >
        ✕
      </button>

      <div className="frb-inner">
        {/* علامة الجمعة */}
        <div className="frb-badge" aria-hidden="true">
          {status.phase === "laylat-jumuah" ? "ليلة الجمعة" : "يوم الجمعة"}
        </div>

        {/* الآية الكريمة */}
        <p className="frb-ayah" lang="ar">
          إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ
          {" "}
          <span className="frb-ayah-pause" aria-hidden="true">۞</span>
          {" "}
          يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا
        </p>

        {/* المرجع */}
        <span className="frb-ref">الأحزاب: ٥٦</span>

        {/* الحث */}
        <p className="frb-hadith">
          أكثِروا من الصلاة والسلام على رسول الله ﷺ في يوم الجمعة وليلتِه
        </p>
      </div>

      {/* زخرفة هندسية سفلية */}
      <div className="frb-geo frb-geo--bottom" aria-hidden="true">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <polygon
            points="30,3 36,18 51,18 39,27 44,42 30,33 16,42 21,27 9,18 24,18"
            fill="none"
            stroke="rgba(250,248,242,0.18)"
            strokeWidth="1"
          />
          <circle cx="30" cy="30" r="8" fill="none" stroke="rgba(250,248,242,0.12)" strokeWidth="0.8" />
        </svg>
      </div>
    </div>
  );
}
