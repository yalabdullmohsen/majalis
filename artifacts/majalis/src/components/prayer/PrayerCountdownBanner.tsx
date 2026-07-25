import { useEffect, useState } from "react";
import { Link } from "wouter";
import { X } from "lucide-react";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { useNumerals } from "@/hooks/useNumerals";
import { PRE_ALERT_MINUTES, isBannerDismissedFor, dismissBannerFor } from "@/lib/prayer-alert-preferences";

const PRAYER_ICON_EMOJI: Record<string, string> = {
  "الفجر": "🌙",
  "الظهر": "☀️",
  "العصر": "🌤️",
  "المغرب": "🌇",
  "العشاء": "🌌",
};

/**
 * شريط عدّ تنازلي دائم يظهر تلقائياً في آخر ١٥ دقيقة قبل أي صلاة، أسفل شريط
 * التنقّل مباشرة (تدفّق مستند عادي — لا يغطي العنوان ولا الأزرار مطلقاً).
 * قابل للإغلاق يدوياً، ويعود تلقائياً مع الصلاة التالية (الإغلاق مرتبط بمفتاح
 * الصلاة الحالية فقط عبر sessionStorage).
 */
export function PrayerCountdownBanner() {
  const { countdown } = usePrayerCountdown();
  const fmt = useNumerals();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  const inGrace = countdown?.sinceSeconds != null;
  const displaySlot = inGrace ? countdown?.graceNextSlot : countdown?.next;
  const remainingSeconds = inGrace
    ? (countdown?.graceNextSeconds ?? null)
    : countdown
    ? Math.round(countdown.remainingMs / 1000)
    : null;

  const minutesRemaining = remainingSeconds != null ? Math.ceil(remainingSeconds / 60) : null;
  const prayerKey = displaySlot?.key ?? null;

  useEffect(() => {
    if (prayerKey && isBannerDismissedFor(prayerKey)) setDismissedKey(prayerKey);
  }, [prayerKey]);

  if (!displaySlot || minutesRemaining == null) return null;
  if (minutesRemaining <= 0 || minutesRemaining > PRE_ALERT_MINUTES) return null;
  if (prayerKey && dismissedKey === prayerKey) return null;

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
          {PRAYER_ICON_EMOJI[displaySlot.name] ?? "🕌"}
        </span>
        <span className="pcb-bar__text">
          متبقي {fmt(minutesRemaining)} {minutesRemaining === 1 ? "دقيقة" : "دقائق"} على صلاة {displaySlot.name}
        </span>
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
