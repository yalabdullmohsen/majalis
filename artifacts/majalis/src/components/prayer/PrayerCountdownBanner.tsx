import { useEffect, useState } from "react";
import { Link } from "wouter";
import { X } from "lucide-react";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { useNumerals } from "@/hooks/useNumerals";
import { PRE_ALERT_MINUTES, isBannerDismissedFor, dismissBannerFor } from "@/lib/prayer-alert-preferences";
import "@/styles/components/prayer-countdown-banner.css";

const PRAYER_ICON_EMOJI: Record<string, string> = {
  "الفجر": "🌙",
  "الظهر": "☀️",
  "العصر": "🌤️",
  "المغرب": "🌇",
  "العشاء": "🌌",
};

const POST_ADHAN_MAX_SEC = 35 * 60;

/**
 * شريط صلاة موحّد:
 * - قبل الصلاة بـ15 دقيقة: عدّ تنازلي
 * - بعد الأذان حتى 35 دقيقة: «مضى على الأذان»
 * - بعد ذلك يختفي ويعود شريط الصلاة القادمة عبر مسارات أخرى
 */
export function PrayerCountdownBanner() {
  const { countdown } = usePrayerCountdown();
  const fmt = useNumerals();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

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
  let text = "";

  if (inGrace && countdown.sinceSeconds != null && countdown.sinceSeconds <= POST_ADHAN_MAX_SEC) {
    mode = "elapsed";
    text = `مضى على أذان ${countdown.next.name}: ${countdown.sinceHms ?? ""}`;
  } else if (!inGrace) {
    const remainingSeconds = Math.round(countdown.remainingMs / 1000);
    const minutesRemaining = Math.ceil(remainingSeconds / 60);
    if (minutesRemaining > 0 && minutesRemaining <= PRE_ALERT_MINUTES) {
      mode = "countdown";
      text = `متبقي ${fmt(minutesRemaining)} ${minutesRemaining === 1 ? "دقيقة" : "دقائق"} على صلاة ${countdown.next.name}`;
    }
  }

  if (!mode) return null;

  const handleDismiss = () => {
    if (prayerKey) {
      dismissBannerFor(prayerKey);
      setDismissedKey(prayerKey);
    }
  };

  return (
    <div className="pcb-bar" role="status" aria-live="polite">
      <Link href="/prayer-times" className="pcb-bar__link">
        <span className="pcb-bar__icon" aria-hidden="true">
          {PRAYER_ICON_EMOJI[countdown.next.name] ?? "🕌"}
        </span>
        <span className="pcb-bar__text">{text}</span>
      </Link>
      <button
        type="button"
        className="pcb-bar__close"
        onClick={handleDismiss}
        aria-label="إخفاء تنبيه الصلاة"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default PrayerCountdownBanner;
