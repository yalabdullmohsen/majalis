import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { loadAdhanPrefs, patchAdhanPrefs, PRAYER_ARABIC } from "@/lib/adhan-preferences";
import { getMuezzin } from "@/lib/adhan-audio";

export function HomeAdhanWidget() {
  const { data, countdown } = usePrayerCountdown();
  const [prefs, setPrefs] = useState(() => loadAdhanPrefs());
  const [toggling, setToggling] = useState(false);
  const togglingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPrefs(loadAdhanPrefs());
  }, []);

  useEffect(() => () => { if (togglingTimerRef.current) clearTimeout(togglingTimerRef.current); }, []);

  function toggleNotifications() {
    setToggling(true);
    const next = patchAdhanPrefs({ globalEnabled: !prefs.globalEnabled });
    setPrefs(next);
    if (togglingTimerRef.current) clearTimeout(togglingTimerRef.current);
    togglingTimerRef.current = setTimeout(() => setToggling(false), 600);
  }

  const muezzin = getMuezzin(prefs.defaultMuezzinId);
  const nextPrayer = countdown?.next;
  const remaining = countdown?.remainingHms;

  if (!data || !nextPrayer) return null;

  return (
    <div className="had-wrap">
      <div className="had-bg-deco" />

      <div className="had-inner">
        <div className="had-header">
          <div className="had-header__label">
            <span className="had-header__icon">🕌</span>
            <span className="had-header__text">مواقيت الصلاة</span>
          </div>
          <button
            type="button"
            onClick={toggleNotifications}
            title={prefs.globalEnabled ? "إيقاف إشعارات الأذان" : "تفعيل إشعارات الأذان"}
            className={`had-notif-btn${prefs.globalEnabled ? " had-notif-btn--on" : ""}${toggling ? " had-notif-btn--toggling" : ""}`}
          >
            <span className="had-notif-btn__icon">{prefs.globalEnabled ? "🔔" : "🔕"}</span>
            <span>{prefs.globalEnabled ? "إشعارات مفعّلة" : "إشعارات متوقفة"}</span>
          </button>
        </div>

        <div className="had-countdown">
          <div className="had-countdown__label">الصلاة القادمة</div>
          <div className="had-countdown__row">
            <span className="had-countdown__name">
              {PRAYER_ARABIC[nextPrayer.key as keyof typeof PRAYER_ARABIC] ?? nextPrayer.name}
            </span>
            <span className="had-countdown__time">{remaining}</span>
          </div>
          {nextPrayer.time && (
            <div className="had-countdown__exact">في تمام الساعة {nextPrayer.time}</div>
          )}
        </div>

        {data.prayers && (
          <div className="had-prayers-row">
            {data.prayers
              .filter((p) => ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].includes(p.key))
              .map((p) => {
                const isNext = nextPrayer.key === p.key;
                return (
                  <div key={p.key} className={`had-prayer-cell${isNext ? " had-prayer-cell--next" : ""}`}>
                    <div className="had-prayer-cell__name">{p.name}</div>
                    <div className="had-prayer-cell__time">{p.time}</div>
                  </div>
                );
              })}
          </div>
        )}

        <div className="had-footer">
          <div className="had-footer__muezzin">
            <span>🎙️</span>
            <span>{muezzin.name}</span>
          </div>
          <div className="had-footer__links">
            <Link href="/prayer-times">
              <span className="had-footer__link">كل المواقيت</span>
            </Link>
            <span className="had-footer__dot">·</span>
            <Link href="/adhan-settings">
              <span className="had-footer__link">إعدادات الأذان</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
