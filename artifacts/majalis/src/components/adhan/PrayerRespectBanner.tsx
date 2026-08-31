import { useEffect, useState } from "react";
import { VolumeX, X } from "lucide-react";
import { useSharedPrayerCountdown } from "@/components/prayer/PrayerCountdownProvider";
import { ADHAN_EVENT_NAME, type AdhanEvent } from "@/lib/adhan-events";
import { PRAYER_ALERT_EVENT_NAME, type PrayerAlertEvent } from "@/lib/prayer-alert-events";
import {
  isRespectReminderDismissed,
  dismissRespectReminder,
  loadPrayerAlertPrefs,
} from "@/lib/prayer-alert-preferences";
import {
  isWithinPrayerRespectWindow,
  pickPrayerRespectMessage,
  type PrayerRespectMessage,
} from "@/lib/prayer-respect-nudge";

function respectNudgeEnabled(): boolean {
  const prefs = loadPrayerAlertPrefs();
  return prefs.alertsEnabled && prefs.postReminderEnabled;
}

/**
 * شريط تذكير احترام وقت الصلاة — ظاهر من الأذان حتى ١٠ دقائق بعده
 * (ما لم يغلقه المستخدم لتلك الصلاة). يعتمد العدّ التنازلي المشترك
 * ويستمع أيضًا لأحداث الأذان/دخول الوقت للظهور فورًا.
 */
export function PrayerRespectBanner() {
  const { countdown } = useSharedPrayerCountdown();
  const [forcedKey, setForcedKey] = useState<string | null>(null);
  const [forcedAt, setForcedAt] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [prefsOn, setPrefsOn] = useState(() => respectNudgeEnabled());
  const [message, setMessage] = useState<PrayerRespectMessage>(() =>
    pickPrayerRespectMessage("Fajr", 0),
  );

  useEffect(() => {
    const refresh = () => setPrefsOn(respectNudgeEnabled());
    window.addEventListener("majalis:prayer-alert-prefs-changed", refresh);
    return () => window.removeEventListener("majalis:prayer-alert-prefs-changed", refresh);
  }, []);

  const sinceFromCountdown = countdown?.sinceSeconds ?? null;
  const keyFromCountdown =
    sinceFromCountdown != null && countdown?.next?.key ? countdown.next.key : null;

  const sinceForced =
    forcedKey && forcedAt != null
      ? Math.max(0, Math.floor((nowMs - forcedAt) / 1000))
      : null;

  const activeKey =
    sinceFromCountdown != null && keyFromCountdown
      ? keyFromCountdown
      : sinceForced != null && isWithinPrayerRespectWindow(sinceForced)
        ? forcedKey
        : null;

  const sinceSeconds =
    activeKey && keyFromCountdown === activeKey && sinceFromCountdown != null
      ? sinceFromCountdown
      : activeKey && forcedKey === activeKey && sinceForced != null
        ? sinceForced
        : null;

  const inWindow = isWithinPrayerRespectWindow(sinceSeconds);
  const dismissed = activeKey ? isRespectReminderDismissed(activeKey) : true;
  const visible = Boolean(prefsOn && activeKey && inWindow && !dismissed);

  useEffect(() => {
    const onPrayerAlert = (e: Event) => {
      const detail = (e as CustomEvent<PrayerAlertEvent>).detail;
      if (!detail || detail.type !== "entered") return;
      if (!respectNudgeEnabled()) return;
      if (isRespectReminderDismissed(detail.prayerKey)) return;
      setForcedKey(detail.prayerKey);
      setForcedAt(detail.prayerTimeEpochMs || Date.now());
      setNowMs(Date.now());
    };
    const onAdhan = (e: Event) => {
      const detail = (e as CustomEvent<AdhanEvent>).detail;
      if (!detail || detail.type !== "adhan") return;
      if (!respectNudgeEnabled()) return;
      if (isRespectReminderDismissed(detail.prayerKey)) return;
      setForcedKey(detail.prayerKey);
      setForcedAt(Date.now());
      setNowMs(Date.now());
    };
    window.addEventListener(PRAYER_ALERT_EVENT_NAME, onPrayerAlert);
    window.addEventListener(ADHAN_EVENT_NAME, onAdhan);
    return () => {
      window.removeEventListener(PRAYER_ALERT_EVENT_NAME, onPrayerAlert);
      window.removeEventListener(ADHAN_EVENT_NAME, onAdhan);
    };
  }, []);

  useEffect(() => {
    if (!forcedKey || forcedAt == null) return;
    if (sinceFromCountdown != null && keyFromCountdown === forcedKey) {
      setForcedKey(null);
      setForcedAt(null);
      return;
    }
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [forcedKey, forcedAt, sinceFromCountdown, keyFromCountdown]);

  useEffect(() => {
    if (forcedKey && sinceForced != null && !isWithinPrayerRespectWindow(sinceForced)) {
      setForcedKey(null);
      setForcedAt(null);
    }
  }, [forcedKey, sinceForced]);

  useEffect(() => {
    if (!visible || !activeKey || sinceSeconds == null) return;
    const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(new Date());
    setMessage(pickPrayerRespectMessage(activeKey, sinceSeconds, dayKey));
  }, [visible, activeKey, sinceSeconds]);

  if (!visible || !activeKey) return null;

  return (
    <div className="anb-stack" role="region" aria-label="تذكير احترام وقت الصلاة" aria-live="polite">
      <div className="anb-toast anb-toast--reminder" role="alert">
        <span className="anb-toast__emoji" aria-hidden="true">
          <VolumeX size={22} strokeWidth={2} />
        </span>
        <div className="anb-toast__body">
          <p className="anb-toast__title">{message.title}</p>
          <p className="anb-toast__sub">{message.body}</p>
        </div>
        <div className="anb-toast__actions">
          <button
            type="button"
            onClick={() => {
              dismissRespectReminder(activeKey);
              setForcedKey(null);
              setForcedAt(null);
            }}
            className="anb-btn anb-btn--close"
            aria-label="إغلاق التذكير"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrayerRespectBanner;
