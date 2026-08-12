import { useEffect, useState } from "react";
import { Bell, BellRing, Sparkles } from "lucide-react";
import {
  loadPrayerAlertPrefs,
  patchPrayerAlertPrefs,
  hasAskedNotificationPermission,
  markNotificationPermissionAsked,
  PRE_ALERT_MINUTE_OPTIONS,
  type PrayerAlertPreferences,
  type PreAlertMinutes,
} from "@/lib/prayer-alert-preferences";
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  type PermissionStatus,
} from "@/lib/prayer-local-notifications";
import { areLiveActivitiesSupported } from "@/lib/plugins/prayer-live-activity";
import {
  PRAYER_SOUND_PROFILE_OPTIONS,
  type PrayerSoundProfile,
} from "@/lib/prayer-notification-sounds";

function MiniToggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`ads-toggle rounded-full icon-only${checked ? " is-on" : ""}${disabled ? " is-disabled" : ""}`}
    >
      <span className="ads-toggle__thumb" />
    </button>
  );
}

/**
 * بطاقة إعدادات "تنبيه الصلاة القادمة": شريط داخل التطبيق + Live Activity +
 * إشعار قبل الصلاة/عند دخول الوقت. لا يُطلَب إذن الإشعارات هنا تلقائياً —
 * تُعرَض شارة شرح الفائدة أولاً، ولا يُرسَل الطلب الفعلي إلا بضغطة المستخدم.
 */
export function PrayerAlertSettingsCard() {
  const [prefs, setPrefs] = useState<PrayerAlertPreferences>(() => loadPrayerAlertPrefs());
  const [permission, setPermission] = useState<PermissionStatus>("prompt");
  const [showExplainer, setShowExplainer] = useState(false);
  const [liveActivitySupported, setLiveActivitySupported] = useState(false);

  useEffect(() => {
    getNotificationPermissionStatus().then(setPermission);
    areLiveActivitiesSupported().then(setLiveActivitySupported);
  }, []);

  const patch = (p: Partial<PrayerAlertPreferences>) => {
    setPrefs(patchPrayerAlertPrefs(p));
  };

  const handleEnableClick = () => {
    if (permission === "prompt" && !hasAskedNotificationPermission()) {
      setShowExplainer(true);
      return;
    }
    void doRequestPermission();
  };

  const doRequestPermission = async () => {
    markNotificationPermissionAsked();
    await requestNotificationPermission();
    // أعد الفحص الفعلي — الإلغاء/التأجيل ليس بالضرورة "denied".
    const status = await getNotificationPermissionStatus();
    setPermission(status);
    setShowExplainer(false);
  };

  const alertsOn = prefs.alertsEnabled;
  const preMinutes = prefs.preAlertMinutes;

  return (
    <div className="ads-card">
      <div className="ads-card__head">
        <BellRing size={15} strokeWidth={2} />
        <span>تنبيه الصلاة القادمة</span>
      </div>
      <div className="ads-card__body">
        <p className="ads-adhan-desc">
          إشعارات قصيرة قبل الصلاة وعند دخول الوقت، مع نصوص متنوعة وصوت مناسب لشاشة القفل.
        </p>

        {showExplainer && (
          <div className="pasc-explainer">
            <Bell size={16} strokeWidth={2} />
            <div>
              <p className="pasc-explainer__title">لماذا نطلب إذن الإشعارات؟</p>
              <p className="pasc-explainer__desc">
                لتنبيهك قبل كل صلاة بـ{preMinutes} دقيقة وعند دخول وقتها، حتى لو كان
                التطبيق مغلقاً. يمكنك تعطيل هذا لاحقاً في أي وقت.
              </p>
              <div className="pasc-explainer__actions">
                <button type="button" className="ads-pill-btn" onClick={doRequestPermission}>
                  تفعيل الإشعارات
                </button>
                <button
                  type="button"
                  className="ads-pill-btn-ghost"
                  onClick={() => setShowExplainer(false)}
                >
                  لاحقاً
                </button>
              </div>
            </div>
          </div>
        )}

        {!showExplainer && permission !== "granted" && permission !== "unsupported" && (
          <div className="ads-row-sep">
            <div>
              <div className="ads-global-label">إذن الإشعارات</div>
              <div className="ads-global-desc">
                {permission === "denied"
                  ? "محجوب من إعدادات النظام — افتح الإعدادات ← المجلس العلمي ← الإشعارات"
                  : "لم يُفعَّل بعد"}
              </div>
            </div>
            {permission === "prompt" && (
              <button type="button" className="ads-pill-btn" onClick={handleEnableClick}>
                تفعيل
              </button>
            )}
          </div>
        )}

        <div className="ads-row-sep">
          <div>
            <div className="ads-global-label">إشعارات الصلاة</div>
            <div className="ads-global-desc">تفعيل أو إيقاف كل تنبيهات مواقيت الصلاة</div>
          </div>
          <MiniToggle
            checked={prefs.alertsEnabled}
            onChange={(v) => patch({ alertsEnabled: v })}
            label="إشعارات الصلاة"
          />
        </div>

        <div className={`ads-row-sep${alertsOn ? "" : " is-disabled"}`}>
          <div>
            <div className="ads-global-label">تنبيه قبل الصلاة</div>
            <div className="ads-global-desc">شريط وإشعار قبل الموعد</div>
          </div>
          <MiniToggle
            checked={prefs.preAlertEnabled}
            onChange={(v) => patch({ preAlertEnabled: v })}
            label="تنبيه قبل الصلاة"
            disabled={!alertsOn}
          />
        </div>

        {alertsOn && prefs.preAlertEnabled && (
          <div className="ads-row-sep">
            <div>
              <div className="ads-global-label">مدة التذكير قبل الصلاة</div>
              <div className="ads-global-desc">متى يصل الإشعار المسبق</div>
            </div>
            <select
              className="ads-gov-select"
              aria-label="مدة التذكير قبل الصلاة"
              value={prefs.preAlertMinutes}
              onChange={(e) =>
                patch({ preAlertMinutes: Number(e.target.value) as PreAlertMinutes })
              }
            >
              {PRE_ALERT_MINUTE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} دقائق
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={`ads-row-sep${alertsOn ? "" : " is-disabled"}`}>
          <div>
            <div className="ads-global-label">تنبيه دخول الوقت</div>
            <div className="ads-global-desc">إشعار فور دخول وقت كل صلاة</div>
          </div>
          <MiniToggle
            checked={prefs.enterAlertEnabled}
            onChange={(v) => patch({ enterAlertEnabled: v })}
            label="تنبيه دخول الوقت"
            disabled={!alertsOn}
          />
        </div>

        <div className={`ads-row-sep${alertsOn ? "" : " is-disabled"}`}>
          <div>
            <div className="ads-global-label">تذكير خفيف بعد الصلاة</div>
            <div className="ads-global-desc">تنبيه لطيف بعد دخول الوقت بقليل</div>
          </div>
          <MiniToggle
            checked={prefs.postReminderEnabled}
            onChange={(v) => patch({ postReminderEnabled: v })}
            label="تذكير خفيف بعد الصلاة"
            disabled={!alertsOn}
          />
        </div>

        {alertsOn && (
          <div className="ads-row-sep">
            <div>
              <div className="ads-global-label">صوت الإشعار</div>
              <div className="ads-global-desc">
                {PRAYER_SOUND_PROFILE_OPTIONS.find((o) => o.id === prefs.soundProfile)?.hint ??
                  "صوت النظام حتى تُضاف ملفات مخصصة"}
              </div>
            </div>
            <select
              className="ads-gov-select"
              aria-label="صوت إشعار الصلاة"
              value={prefs.soundProfile}
              onChange={(e) =>
                patch({ soundProfile: e.target.value as PrayerSoundProfile })
              }
            >
              {PRAYER_SOUND_PROFILE_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="ads-row-sep">
          <div>
            <div className="ads-global-label">
              <Sparkles size={13} strokeWidth={2} style={{ display: "inline", marginLeft: 4 }} />
              Live Activity
            </div>
            <div className="ads-global-desc">
              {liveActivitySupported
                ? "عرض العدّ التنازلي في Dynamic Island وشاشة القفل"
                : "غير مدعومة على هذا الجهاز — يُستخدَم الشريط والإشعار بدلاً منها"}
            </div>
          </div>
          <MiniToggle
            checked={prefs.liveActivitiesEnabled && liveActivitySupported}
            onChange={(v) => patch({ liveActivitiesEnabled: v })}
            label="Live Activity"
            disabled={!liveActivitySupported}
          />
        </div>
      </div>
    </div>
  );
}

export default PrayerAlertSettingsCard;
