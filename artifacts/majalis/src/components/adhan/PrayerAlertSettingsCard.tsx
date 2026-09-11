import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
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
import { isNative } from "@/lib/capacitor-utils";
import { haptics } from "@/lib/haptics";
import { SettingsToggleRow } from "@/components/design-system/SettingsList";
import {
  loadAdhanPrefs,
  patchAdhanPrefs,
  patchPrayerPrefs,
  PRAYER_KEYS,
  type AdvanceMinutes,
} from "@/lib/adhan-preferences";

/**
 * بطاقة إشعارات الصلاة: تفعيل، تنبيه قبل، مدة، دخول الوقت.
 * تغيير التفضيلات يطلق majalis:prayer-alert-prefs-changed فيعيد App الجدولة.
 */
export function PrayerAlertSettingsCard() {
  const [prefs, setPrefs] = useState<PrayerAlertPreferences>(() => loadPrayerAlertPrefs());
  const [vibrateEnabled, setVibrateEnabled] = useState(() => loadAdhanPrefs().vibrateEnabled);
  const [permission, setPermission] = useState<PermissionStatus>("prompt");
  const [showExplainer, setShowExplainer] = useState(false);

  useEffect(() => {
    getNotificationPermissionStatus().then(setPermission);
  }, []);

  const patch = (p: Partial<PrayerAlertPreferences>) => {
    setPrefs(patchPrayerAlertPrefs(p));
  };

  const applyGlobalMinutes = (minutes: PreAlertMinutes) => {
    const prev = prefs.preAlertMinutes;
    patch({ preAlertMinutes: minutes });
    const adhan = loadAdhanPrefs();
    for (const key of PRAYER_KEYS) {
      if (adhan.prayers[key].advanceMinutes === prev) {
        patchPrayerPrefs(key, { advanceMinutes: minutes as AdvanceMinutes });
      }
    }
  };

  const openSystemSettings = async () => {
    try {
      if (isNative) {
        window.location.href = "app-settings:";
      }
    } catch {
      /* ignore */
    }
  };

  const doRequestPermission = async (): Promise<PermissionStatus> => {
    markNotificationPermissionAsked();
    await requestNotificationPermission();
    const status = await getNotificationPermissionStatus();
    setPermission(status);
    setShowExplainer(false);
    return status;
  };

  const handleEnableAlerts = (v: boolean) => {
    if (!v) {
      patch({ alertsEnabled: false });
      return;
    }
    if (permission === "denied") {
      void openSystemSettings();
      return;
    }
    if (permission === "prompt" && !hasAskedNotificationPermission()) {
      setShowExplainer(true);
      return;
    }
    if (permission === "prompt") {
      void doRequestPermission().then((status) => {
        if (status === "granted" || status === "unsupported") {
          patch({ alertsEnabled: true });
        }
      });
      return;
    }
    patch({ alertsEnabled: true });
  };

  const alertsOn = prefs.alertsEnabled;
  const permissionHint =
    permission === "denied"
      ? "محجوب من إعدادات النظام — يحتاج تفعيل"
      : permission === "granted"
        ? "الإذن مفعّل"
        : permission === "prompt"
          ? "يحتاج تفعيل الإذن"
          : "جدولة تنبيهات المواقيت";

  return (
    <div className="soft-card soft-card--on-light ads-card">
        <div className="ads-card__head">
        <BellRing size={15} strokeWidth={2} />
        <span>تنبيهات الصلاة</span>
      </div>
      <div className="ads-card__body">
        {showExplainer && (
          <div className="pasc-explainer">
            <Bell size={16} strokeWidth={2} />
            <div>
              <p className="pasc-explainer__title">تفعيل تنبيهات الصلاة</p>
              <p className="pasc-explainer__desc">
                لننبّهك قبل الصلاة وعند دخول وقتها، حتى لو كان التطبيق مغلقًا.
              </p>
              <div className="pasc-explainer__actions">
                <button
                  type="button"
                  className="ads-pill-btn"
                  onClick={() => {
                    void doRequestPermission().then((status) => {
                      if (status === "granted" || status === "unsupported") {
                        patch({ alertsEnabled: true });
                      }
                    });
                  }}
                >
                  تفعيل الإشعارات
                </button>
                <button
                  type="button"
                  className="ads-pill-btn-ghost"
                  onClick={() => setShowExplainer(false)}
                >
                  لاحقًا
                </button>
              </div>
            </div>
          </div>
        )}

        <SettingsToggleRow
          id="prayer-alerts-enabled"
          title="تفعيل تنبيهات الصلاة"
          description={permissionHint}
          checked={prefs.alertsEnabled}
          onChange={(v) => {
            haptics.selection();
            handleEnableAlerts(v);
          }}
        />

        <SettingsToggleRow
          id="prayer-pre-alert"
          title="تنبيه قبل الصلاة"
          description="إشعار قبل الموعد"
          checked={prefs.preAlertEnabled}
          onChange={(v) => {
            haptics.selection();
            patch({ preAlertEnabled: v });
          }}
          disabled={!alertsOn}
        />

        {alertsOn && prefs.preAlertEnabled ? (
          <div className="ads-row-sep ads-row-sep--stack">
            <div>
              <div className="ads-global-label">مدة التنبيه السابق</div>
              <div className="ads-global-desc">5 / 10 / 15 / 30 دقيقة</div>
            </div>
            <div className="ads-chip-scroll" role="group" aria-label="مدة التنبيه قبل الصلاة">
              {PRE_ALERT_MINUTE_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => applyGlobalMinutes(m)}
                  className={`ads-chip${prefs.preAlertMinutes === m ? " is-active" : ""}`}
                >
                  {m === 0 ? "بدون" : `${m} د`}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <SettingsToggleRow
          id="prayer-enter-alert"
          title="تفعيل الأذان عند دخول الوقت"
          description="إشعار فور دخول وقت كل صلاة"
          checked={prefs.enterAlertEnabled}
          onChange={(v) => {
            haptics.selection();
            patch({ enterAlertEnabled: v });
          }}
          disabled={!alertsOn}
        />

        <SettingsToggleRow
          id="prayer-post-reminder"
          title="تذكير الصامت بعد الأذان"
          description="تذكير بعد دخول الوقت"
          checked={prefs.postReminderEnabled}
          onChange={(v) => {
            haptics.selection();
            patch({ postReminderEnabled: v });
          }}
          disabled={!alertsOn}
        />

        <SettingsToggleRow
          id="prayer-vibrate"
          title="اهتزاز مع التنبيه"
          description="نبضة لمسية عند أذان الصلاة"
          checked={vibrateEnabled}
          onChange={(v) => {
            haptics.selection();
            setVibrateEnabled(v);
            patchAdhanPrefs({ vibrateEnabled: v });
          }}
          disabled={!alertsOn}
        />
      </div>
    </div>
  );
}

export default PrayerAlertSettingsCard;
