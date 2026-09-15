/**
 * لوحة قنوات سُنّة — موافقة مستقلة + هدوء + إيقاف غير الضروري.
 * الصلاة تبقى مستقلة (رابط لإعدادات الأذان).
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  CHANNEL_POLICIES,
  SUNNAH_NOTIFICATION_CHANNELS,
  type ChannelCadence,
  type SunnahNotificationChannel,
  disableAllNonEssentialChannels,
  getSystemNotificationPermission,
  isChannelEffectivelyEnabled,
  loadSunnahNotificationPrefs,
  requestSystemNotificationPermissionFromUserGesture,
  saveSunnahNotificationPrefs,
  openSystemNotificationSettings,
  trackNotificationTelemetry,
  updateSunnahChannel,
  type SunnahNotificationPrefs,
} from "@/lib/sunnah-notifications";

const CADENCE_LABELS: Record<ChannelCadence, string> = {
  immediate: "فوري",
  daily_digest: "ملخص يومي",
  weekly_digest: "ملخص أسبوعي",
};

function PermissionHint({ state }: { state: string }) {
  if (state === "granted") return <p className="notif-row__sub">إذن النظام: ممنوح.</p>;
  if (state === "denied") {
    return (
      <div className="notif-row__sub">
        <p>إذن النظام مرفوض نهائيًا. افتح إعدادات الجهاز لتفعيل إشعارات «سُنّة».</p>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => void openSystemNotificationSettings()}
        >
          فتح إعدادات النظام
        </button>
      </div>
    );
  }
  if (state === "unsupported") {
    return <p className="notif-row__sub">هذا السطح لا يدعم إذن الإشعارات.</p>;
  }
  return (
    <p className="notif-row__sub">
      لا نطلب إذن النظام عند أول تشغيل. سيُطلب فقط بعد تفعيل قناة تحتاج الإذن.
    </p>
  );
}

export function SunnahChannelsPanel() {
  const [prefs, setPrefs] = useState<SunnahNotificationPrefs>(() => loadSunnahNotificationPrefs());
  const [perm, setPerm] = useState<string>("prompt");

  useEffect(() => {
    void getSystemNotificationPermission().then(setPerm);
  }, []);

  const persist = (next: SunnahNotificationPrefs) => {
    saveSunnahNotificationPrefs(next);
    setPrefs(loadSunnahNotificationPrefs());
  };

  const onToggleChannel = async (channel: SunnahNotificationChannel, enabled: boolean) => {
    if (enabled && CHANNEL_POLICIES[channel].requiresExplicitOptIn && perm !== "granted") {
      const nextPerm = await requestSystemNotificationPermissionFromUserGesture();
      setPerm(nextPerm);
      if (nextPerm !== "granted") return;
    }
    const next = updateSunnahChannel(channel, { enabled });
    setPrefs(next);
    if (!enabled) {
      trackNotificationTelemetry("category_disabled", { channel });
    }
  };

  return (
    <section className="soft-card soft-card--on-light notif-card" aria-label="قنوات إشعارات سُنّة">
      <h2 className="notif-card__title">قنوات سُنّة</h2>
      <p className="notif-row__sub" style={{ marginBottom: "0.75rem" }}>
        إشعارات اختيارية ومفيدة وقابلة للتحكم. تنبيهات الصلاة مستقلة ولا تُوقف مع المحتوى.
      </p>

      <PermissionHint state={perm} />

      <div className="notif-row" style={{ marginTop: "0.75rem" }}>
        <div className="notif-row__text">
          <strong>المفتاح العام لغير الضروري</strong>
          <span className="notif-row__sub">لا يؤثر على الصلاة أو التشغيلية الضرورية.</span>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={prefs.nonEssentialMasterEnabled}
            onChange={(e) =>
              persist({ ...prefs, nonEssentialMasterEnabled: e.target.checked })
            }
            aria-label="المفتاح العام لغير الضروري"
          />
          <span className="switch__slider" />
        </label>
      </div>

      {SUNNAH_NOTIFICATION_CHANNELS.map((channel) => {
        const policy = CHANNEL_POLICIES[channel];
        const ch = prefs.channels[channel];
        const effective = isChannelEffectivelyEnabled(prefs, channel);
        return (
          <div key={channel} className="notif-row" style={{ alignItems: "flex-start" }}>
            <div className="notif-row__text">
              <strong>{policy.labelAr}</strong>
              <span className="notif-row__sub">{policy.descriptionAr}</span>
              <span className="notif-row__sub">
                المصدر: {policy.transport === "local" ? "محلي" : "دفع"}
                {channel === "prayer" ? " · " : ""}
                {channel === "prayer" ? (
                  <Link href="/adhan-settings">إعدادات الأذان</Link>
                ) : null}
              </span>
              {policy.supportedCadences.length > 1 && ch.enabled ? (
                <label className="notif-row__sub" style={{ display: "block", marginTop: 6 }}>
                  التكرار:{" "}
                  <select
                    value={ch.cadence}
                    onChange={(e) =>
                      setPrefs(
                        updateSunnahChannel(channel, {
                          cadence: e.target.value as ChannelCadence,
                        }),
                      )
                    }
                    aria-label={`تكرار ${policy.labelAr}`}
                  >
                    {policy.supportedCadences.map((c) => (
                      <option key={c} value={c}>
                        {CADENCE_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {!effective && ch.enabled ? (
                <span className="notif-row__sub">يتطلب تشغيل المفتاح العام لغير الضروري.</span>
              ) : null}
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={ch.enabled}
                onChange={(e) => void onToggleChannel(channel, e.target.checked)}
                aria-label={policy.labelAr}
              />
              <span className="switch__slider" />
            </label>
          </div>
        );
      })}

      <div className="notif-row" style={{ marginTop: "0.5rem" }}>
        <div className="notif-row__text">
          <strong>ساعات الهدوء</strong>
          <span className="notif-row__sub">
            افتراضيًا من 10 مساءً إلى 8 صباحًا — تؤجّل غير الضروري فقط.
          </span>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={prefs.quietHours.enabled}
            onChange={(e) =>
              persist({
                ...prefs,
                quietHours: { ...prefs.quietHours, enabled: e.target.checked },
              })
            }
            aria-label="ساعات الهدوء"
          />
          <span className="switch__slider" />
        </label>
      </div>

      {prefs.quietHours.enabled ? (
        <div className="nsp-field" style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <label>
            من
            <input
              type="number"
              min={0}
              max={23}
              value={prefs.quietHours.startHour}
              onChange={(e) =>
                persist({
                  ...prefs,
                  quietHours: {
                    ...prefs.quietHours,
                    startHour: Number(e.target.value),
                  },
                })
              }
              aria-label="بداية ساعات الهدوء"
            />
          </label>
          <label>
            إلى
            <input
              type="number"
              min={0}
              max={23}
              value={prefs.quietHours.endHour}
              onChange={(e) =>
                persist({
                  ...prefs,
                  quietHours: {
                    ...prefs.quietHours,
                    endHour: Number(e.target.value),
                  },
                })
              }
              aria-label="نهاية ساعات الهدوء"
            />
          </label>
        </div>
      ) : null}

      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => {
          setPrefs(disableAllNonEssentialChannels());
          trackNotificationTelemetry("category_disabled", { channel: "all_non_essential" });
        }}
      >
        إيقاف جميع الإشعارات غير الضرورية
      </button>
    </section>
  );
}
