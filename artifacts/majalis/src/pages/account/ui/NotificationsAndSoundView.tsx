/**
 * الإشعارات والصوت — مركز موحّد خفيف.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { UtilityScreen } from "@/components/design-system/screens";
import { SettingsList, SettingsToggleRow } from "@/components/design-system/SettingsList";
import {
  PRAYER_ALERT_STYLE_AR,
  PRAYER_ALERT_STYLES,
  PRAYER_NOTIFICATION_AR,
  PRAYER_NOTIFICATION_KEYS,
  type PrayerAlertStyle,
} from "@/lib/prayer-notifications/types";
import {
  loadPrayerNotificationPreferences,
  patchPrayerNotificationPreferences,
  syncLegacyTogglesFromUnified,
} from "@/lib/prayer-notifications/preferences";
import {
  loadSunnahNotificationPrefs,
  saveSunnahNotificationPrefs,
} from "@/lib/sunnah-notifications/preferences";
import {
  getNotificationsAndSoundStatus,
  listSelectableAdhanVoices,
  listMurattalReciters,
  loadSunnahAudioPreferences,
  patchSunnahAudioPreferences,
  type StreamQuality,
} from "@/lib/sunnah-audio-platform";
import "@/styles/pages/settings.css";

type PrayerPrefs = ReturnType<typeof loadPrayerNotificationPreferences>;

export default function NotificationsAndSoundView() {
  const [prayer, setPrayer] = useState<PrayerPrefs>(() => loadPrayerNotificationPreferences());
  const [audio, setAudio] = useState(() => loadSunnahAudioPreferences());
  const [notif, setNotif] = useState(() => loadSunnahNotificationPrefs());
  const status = useMemo(() => getNotificationsAndSoundStatus(), [prayer, audio, notif]);

  useEffect(() => {
    applyPageSeo({
      path: "/notifications-and-sound",
      title: "الإشعارات والصوت | سُنّة",
      description: "إدارة تنبيهات الصلاة، أصوات الأذان، التلاوات، وساعات الهدوء.",
      robots: "noindex, follow",
    });
  }, []);

  const savePrayer = (next: PrayerPrefs) => {
    setPrayer(next);
    syncLegacyTogglesFromUnified(next);
  };

  const voices = listSelectableAdhanVoices();
  const reciters = listMurattalReciters();

  return (
    <UtilityScreen>
      <LegalPageLayout eyebrow="الإعدادات" title="الإشعارات والصوت">
        <LegalSection title="الحالة">
          <ul className="settings-note" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li>تنبيهات الصلاة: {status.prayerMasterEnabled ? "مفعّلة" : "متوقفة"}</li>
            <li>المؤذن الحالي: {status.currentAdhanLabelAr}</li>
            <li>القارئ الحالي: {status.currentReciterLabelAr}</li>
            <li>ساعات الهدوء: {status.quietHoursLabelAr}</li>
            <li>
              آخر جدولة ناجحة:{" "}
              {status.lastSuccessfulScheduleAt
                ? new Date(status.lastSuccessfulScheduleAt).toLocaleString("ar")
                : "لا يوجد بعد"}
            </li>
            {status.enabledPrayersAr.length > 0 ? (
              <li>الصلوات المفعّلة: {status.enabledPrayersAr.join("، ")}</li>
            ) : null}
          </ul>
        </LegalSection>

        <LegalSection title="الصلاة">
          <SettingsToggleRow
            id="prayer-master"
            title="تشغيل تنبيهات الصلاة"
            description="قناة مستقلة — لا تُوقف مع إشعارات المحتوى"
            checked={prayer.masterEnabled}
            onChange={(v) => savePrayer(patchPrayerNotificationPreferences({ masterEnabled: v }))}
          />
          {PRAYER_NOTIFICATION_KEYS.map((key) => (
            <SettingsToggleRow
              key={key}
              id={`prayer-${key}`}
              title={PRAYER_NOTIFICATION_AR[key]}
              checked={Boolean(prayer.prayers[key])}
              onChange={(v) =>
                savePrayer(
                  patchPrayerNotificationPreferences({
                    prayers: { ...prayer.prayers, [key]: v },
                  }),
                )
              }
            />
          ))}
          <p className="settings-note">نوع التنبيه لكل صلاة</p>
          {PRAYER_NOTIFICATION_KEYS.map((key) => (
            <label key={`style-${key}`} className="settings-note" style={{ display: "block" }}>
              {PRAYER_NOTIFICATION_AR[key]}
              <select
                aria-label={`نوع تنبيه ${PRAYER_NOTIFICATION_AR[key]}`}
                value={prayer.alertStyleByPrayer[key]}
                onChange={(e) =>
                  savePrayer(
                    patchPrayerNotificationPreferences({
                      alertStyleByPrayer: {
                        ...prayer.alertStyleByPrayer,
                        [key]: e.target.value as PrayerAlertStyle,
                      },
                    }),
                  )
                }
              >
                {PRAYER_ALERT_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {PRAYER_ALERT_STYLE_AR[s]}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <SettingsList
            rows={[{ id: "adhan-full", title: "إعدادات الأذان التفصيلية", href: "/adhan-settings" }]}
          />
        </LegalSection>

        <LegalSection title="أصوات الأذان">
          <p className="settings-note">
            الملفات الكاملة لا تُضمَّن في الحزمة — بث أو تنزيل عند الطلب. الأسماء الشخصية معلّقة حتى
            توثيق الحقوق.
          </p>
          <label className="settings-note" style={{ display: "block" }}>
            الصوت الافتراضي
            <select
              aria-label="صوت الأذان الافتراضي"
              value={audio.defaultAdhanVoiceId}
              onChange={(e) => {
                const id = e.target.value;
                setAudio(
                  patchSunnahAudioPreferences({
                    defaultAdhanVoiceId: id,
                    adhanVoiceByPrayer: {
                      fajr: id,
                      dhuhr: id,
                      asr: id,
                      maghrib: id,
                      isha: id,
                    },
                  }),
                );
              }}
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.labelAr}
                </option>
              ))}
            </select>
          </label>
          {PRAYER_NOTIFICATION_KEYS.map((key) => (
            <label key={`voice-${key}`} className="settings-note" style={{ display: "block" }}>
              {PRAYER_NOTIFICATION_AR[key]}
              <select
                aria-label={`صوت أذان ${PRAYER_NOTIFICATION_AR[key]}`}
                value={audio.adhanVoiceByPrayer[key]}
                onChange={(e) =>
                  setAudio(
                    patchSunnahAudioPreferences({
                      adhanVoiceByPrayer: {
                        ...audio.adhanVoiceByPrayer,
                        [key]: e.target.value,
                      },
                    }),
                  )
                }
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.labelAr}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </LegalSection>

        <LegalSection title="التلاوات المرتّلة">
          <p className="settings-note">مرتل فقط — بث عند الطلب. التفعيل التجاري يتطلّب موافقة المالك.</p>
          <label className="settings-note" style={{ display: "block" }}>
            القارئ الحالي
            <select
              aria-label="قارئ التلاوة المرتّلة"
              value={audio.defaultMurattalReciterId}
              onChange={(e) =>
                setAudio(
                  patchSunnahAudioPreferences({ defaultMurattalReciterId: e.target.value }),
                )
              }
            >
              {reciters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nameAr}
                  {r.licenseStatus === "pending_owner_approval" ? " (معلّق قانونياً)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="settings-note" style={{ display: "block" }}>
            جودة البث
            <select
              aria-label="جودة بث التلاوة"
              value={audio.streamQuality}
              onChange={(e) =>
                setAudio(
                  patchSunnahAudioPreferences({
                    streamQuality: e.target.value as StreamQuality,
                  }),
                )
              }
            >
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="data_saver">توفير البيانات</option>
            </select>
          </label>
          <SettingsToggleRow
            id="offline-tilawa"
            title="تنزيل اختياري دون اتصال"
            description="لا يُفعَّل تلقائيًا — لا يضيف ملفات إلى الحزمة الابتدائية"
            checked={audio.offlineDownloadsEnabled}
            onChange={(v) =>
              setAudio(patchSunnahAudioPreferences({ offlineDownloadsEnabled: v }))
            }
          />
        </LegalSection>

        <LegalSection title="المحتوى والدروس">
          <p className="settings-note">
            حد أقصى: إشعار تعليمي واحد يوميًا + محتوى واحد يوميًا، مع تجميع في ملخص عند الحاجة.
          </p>
          <SettingsList
            rows={[
              {
                id: "notif-channels",
                title: "قنوات الإشعارات التفصيلية",
                href: "/notification-settings",
              },
            ]}
          />
        </LegalSection>

        <LegalSection title="ساعات الهدوء">
          <SettingsToggleRow
            id="quiet-hours"
            title="ساعات الهدوء"
            description="افتراضيًا من 10 مساءً إلى 8 صباحًا — لا تنطبق على تنبيهات الصلاة"
            checked={notif.quietHours.enabled}
            onChange={(v) => {
              const next = {
                ...notif,
                quietHours: { ...notif.quietHours, enabled: v },
              };
              saveSunnahNotificationPrefs(next);
              setNotif(next);
            }}
          />
          <p className="settings-note">{status.quietHoursLabelAr}</p>
        </LegalSection>

        <LegalSection title="روابط سريعة">
          <p className="settings-note">
            <Link href="/notification-settings">إعدادات الإشعارات</Link>
            {" · "}
            <Link href="/adhan-settings">إعدادات الأذان</Link>
          </p>
        </LegalSection>
      </LegalPageLayout>
    </UtilityScreen>
  );
}
