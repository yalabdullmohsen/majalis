/**
 * حالة مجمّعة لشاشة الإشعارات والصوت — بلا سجلات موقع.
 */
import { loadPrayerNotificationPreferences } from "@/lib/prayer-notifications/preferences";
import {
  PRAYER_ALERT_STYLE_AR,
  PRAYER_NOTIFICATION_AR,
  PRAYER_NOTIFICATION_KEYS,
} from "@/lib/prayer-notifications/types";
import { loadSunnahNotificationPrefs } from "@/lib/sunnah-notifications/preferences";
import { getAdhanVoice } from "./adhan-catalog";
import { loadSunnahAudioPreferences } from "./preferences";
import { getMurattalReciter } from "./quran-murattal-catalog";

export type NotificationsAndSoundStatus = {
  prayerMasterEnabled: boolean;
  lastSuccessfulScheduleAt: string | null;
  enabledPrayersAr: string[];
  currentAdhanLabelAr: string;
  currentReciterLabelAr: string;
  quietHoursLabelAr: string;
  alertStylesSummaryAr: string;
};

export function getNotificationsAndSoundStatus(): NotificationsAndSoundStatus {
  const prayer = loadPrayerNotificationPreferences();
  const notif = loadSunnahNotificationPrefs();
  const audio = loadSunnahAudioPreferences();
  const voice = getAdhanVoice(audio.defaultAdhanVoiceId);
  const reciter = getMurattalReciter(audio.defaultMurattalReciterId);

  const enabledPrayersAr = PRAYER_NOTIFICATION_KEYS.filter(
    (k) => prayer.masterEnabled && prayer.prayers[k],
  ).map((k) => PRAYER_NOTIFICATION_AR[k]);

  const alertStylesSummaryAr = PRAYER_NOTIFICATION_KEYS.map(
    (k) =>
      `${PRAYER_NOTIFICATION_AR[k]}: ${PRAYER_ALERT_STYLE_AR[prayer.alertStyleByPrayer[k]]}`,
  ).join(" · ");

  const qh = notif.quietHours;
  const quietHoursLabelAr = qh.enabled
    ? `من ${qh.startHour}:00 إلى ${qh.endHour}:00`
    : "ساعات الهدوء متوقفة";

  return {
    prayerMasterEnabled: Boolean(prayer.masterEnabled && prayer.featureEnabled),
    lastSuccessfulScheduleAt: prayer.lastSuccessfulScheduleAt,
    enabledPrayersAr,
    currentAdhanLabelAr: voice?.labelAr ?? "غير محدد",
    currentReciterLabelAr: reciter?.nameAr ?? "غير محدد",
    quietHoursLabelAr,
    alertStylesSummaryAr,
  };
}
