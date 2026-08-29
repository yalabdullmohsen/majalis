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
import {
  loadAdhanPrefs,
  patchAdhanPrefs,
  patchPrayerPrefs,
  PRAYER_KEYS,
  type AdvanceMinutes,
} from "@/lib/adhan-preferences";

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
      onClick={() => {
        haptics.selection();
        onChange(!checked);
      }}
      className={`ads-toggle rounded-full icon-only${checked ? " is-on" : ""}${disabled ? " is-disabled" : ""}`}
    >
      <span className="ads-toggle__thumb" />
    </button>
  );
}

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

  return (
    <div className="ads-card">
        <div className="ads-card__head">
        <BellRing size={15} strokeWidth={2} />
        <span>تنبيهات الصلاة والأذان</span>
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

        <div className="ads-row-sep">
          <div>
            <div className="ads-global-label">تفعيل تنبيهات الصلاة</div>
            <div className="ads-global-desc">
              {permission === "denied"
                ? "محجوب من إعدادات النظام — يحتاج تفعيل"
                : permission === "granted"
                  ? "الإذن مفعّل"
                  : permission === "prompt"
                    ? "يحتاج تفعيل الإذن"
                    : "جدولة تنبيهات المواقيت"}
            </div>
          </div>
          <MiniToggle
            checked={prefs.alertsEnabled}
            onChange={handleEnableAlerts}
            label="تفعيل تنبيهات الصلاة"
          />
        </div>

        <div className={`ads-row-sep${alertsOn ? "" : " is-disabled"}`}>
          <div>
            <div className="ads-global-label">تنبيه قبل الصلاة</div>
            <div className="ads-global-desc">إشعار قبل الموعد</div>
          </div>
          <MiniToggle
            checked={prefs.preAlertEnabled}
            onChange={(v) => patch({ preAlertEnabled: v })}
            label="تنبيه قبل الصلاة"
            disabled={!alertsOn}
          />
        </div>

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

        <div className={`ads-row-sep${alertsOn ? "" : " is-disabled"}`}>
          <div>
            <div className="ads-global-label">تفعيل الأذان عند دخول الوقت</div>
            <div className="ads-global-desc">إشعار فور دخول وقت كل صلاة</div>
          </div>
          <MiniToggle
            checked={prefs.enterAlertEnabled}
            onChange={(v) => patch({ enterAlertEnabled: v })}
            label="تفعيل الأذان عند دخول الوقت"
            disabled={!alertsOn}
          />
        </div>

        <div className={`ads-row-sep${alertsOn ? "" : " is-disabled"}`}>
          <div>
            <div className="ads-global-label">اهتزاز مع التنبيه</div>
            <div className="ads-global-desc">نبضة لمسية عند أذان الصلاة</div>
          </div>
          <MiniToggle
            checked={vibrateEnabled}
            onChange={(v) => {
              setVibrateEnabled(v);
              patchAdhanPrefs({ vibrateEnabled: v });
            }}
            label="اهتزاز مع التنبيه"
            disabled={!alertsOn}
          />
        </div>
      </div>
    </div>
  );
}

export default PrayerAlertSettingsCard;
