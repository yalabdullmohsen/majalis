import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  X,
  Moon,
  Sun,
  CloudSun,
  Sunset,
  Stars,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import { useSharedPrayerCountdown } from "@/components/prayer/PrayerCountdownProvider";
import { PRE_ALERT_MINUTES, isBannerDismissedFor, dismissBannerFor, loadPrayerAlertPrefs } from "@/lib/prayer-alert-preferences";
import { formatAdhanRemainingPhrase } from "@/lib/prayer-ticker-copy";
import "@/styles/components/prayer-countdown-banner.css";

const PRAYER_ICONS: Record<string, LucideIcon> = {
  "الفجر": Moon,
  "الظهر": Sun,
  "العصر": CloudSun,
  "المغرب": Sunset,
  "العشاء": Stars,
};

const POST_ADHAN_MAX_SEC = 35 * 60;

/**
 * شريط صلاة موحّد:
 * - قبل الصلاة بـ15 دقيقة: عدّ تنازلي
 * - بعد الأذان حتى 35 دقيقة: «مضى على الأذان»
 * - بعد ذلك يختفي ويعود شريط الصلاة القادمة عبر مسارات أخرى
 */
export function PrayerCountdownBanner() {
  const { countdown } = useSharedPrayerCountdown();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const dismissTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (dismissTimer.current != null) window.clearTimeout(dismissTimer.current);
    };
  }, []);

  const inGrace = countdown?.sinceSeconds != null;
  const prayerKey = inGrace
    ? (countdown?.next?.key ?? null)
    : (countdown?.next?.key ?? null);

  useEffect(() => {
    if (prayerKey && isBannerDismissedFor(prayerKey)) setDismissedKey(prayerKey);
  }, [prayerKey]);

  if (!countdown?.next) return null;
  if (prayerKey && dismissedKey === prayerKey) return null;

  let mode: "countdown" | "elapsed" | null = null;
  let label = "";
  let timer = "";

  if (inGrace && countdown.sinceSeconds != null && countdown.sinceSeconds <= POST_ADHAN_MAX_SEC) {
    mode = "elapsed";
    label = `مضى على أذان ${countdown.next.name}`;
    timer = formatAdhanRemainingPhrase(countdown.sinceSeconds);
  } else if (!inGrace) {
    const remainingSeconds = Math.round(countdown.remainingMs / 1000);
    const minutesRemaining = Math.ceil(remainingSeconds / 60);
    const preWindow = loadPrayerAlertPrefs().preAlertMinutes || PRE_ALERT_MINUTES;
    if (minutesRemaining > 0 && minutesRemaining <= preWindow) {
      mode = "countdown";
      label = `متبقي على ${countdown.next.name}`;
      timer = formatAdhanRemainingPhrase(remainingSeconds);
    }
  }

  if (!mode) return null;

  const Icon = PRAYER_ICONS[countdown.next.name] ?? Landmark;

  const handleDismiss = () => {
    setLeaving(true);
    if (dismissTimer.current != null) window.clearTimeout(dismissTimer.current);
    dismissTimer.current = window.setTimeout(() => {
      dismissTimer.current = null;
      if (prayerKey) {
        dismissBannerFor(prayerKey);
        setDismissedKey(prayerKey);
      }
      setLeaving(false);
    }, 220);
  };

  return (
    <div
      className={`pcb-wrap${leaving ? " pcb-wrap--out" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className={`pcb-card pcb-card--${mode}`}>
        <Link href="/prayer-times" className="pcb-card__link">
          <span className="pcb-card__icon" aria-hidden="true">
            <Icon size={20} strokeWidth={2} />
          </span>
          <span className="pcb-card__copy">
            <span className="pcb-card__label">{label}</span>
            {timer ? (
              <span className="pcb-card__timer" dir="ltr">
                {timer}
              </span>
            ) : null}
          </span>
        </Link>
        <button
          type="button"
          className="pcb-card__close"
          onClick={handleDismiss}
          aria-label="إخفاء تنبيه الصلاة"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default PrayerCountdownBanner;
