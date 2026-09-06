/**
 * إعدادات تنبيهات الصلاة — تنبيه أذان قصير متوافق مع iOS.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CloudMoon, CloudSun, MapPin, Moon, Music, Bell, Sun, Sunset, Volume2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  loadAdhanPrefs,
  patchAdhanPrefs,
  patchPrayerPrefs,
  PRAYER_KEYS,
  PRAYER_ARABIC,
  PRAYER_ICON,
  type AdhanPreferences,
  type PrayerKey,
  type AdvanceMinutes,
} from "@/lib/adhan-preferences";
import { playAdhanPreview, stopAdhanPreview } from "@/lib/adhan-audio-service";
import { invalidatePrayerNativeSchedule } from "@/lib/prayer-alert-scheduler";
import { PrayerAlertSettingsCard } from "@/components/adhan/PrayerAlertSettingsCard";
import {
  listAvailableSettingsSounds,
  getSettingsSoundOption,
  resolveSettingsSoundSelection,
  type SettingsSoundOption,
} from "@/lib/adhan-settings-sound-catalog";
import { loadPrayerAlertPrefs, patchPrayerAlertPrefs } from "@/lib/prayer-alert-preferences";
import { isNative } from "@/lib/capacitor-utils";
import {
  KUWAIT_GOVERNORATES,
  getSelectedGovernorate,
  setSelectedGovernorate,
  fetchPrayerTimes,
} from "@/lib/prayer-times";
import { applyPageSeo } from "@/lib/seo";
import {
  getAndroidAdhanPermissionStatus,
  isAdhanAndroidAlarmAvailable,
  openAndroidBatteryOptimizationSettings,
  openAndroidExactAlarmSettings,
} from "@/lib/adhan-android-alarm";
import { loadNotifPrefs, saveNotifPrefs } from "@/lib/local-notifications";
import "@/styles/pages/adhan-settings.css";

const ADVANCE_OPTIONS: AdvanceMinutes[] = [0, 5, 10, 15, 30];

const PRAYER_ICON_MAP: Record<string, LucideIcon> = {
  Moon, Sun, CloudSun, Sunset, CloudMoon,
};

function Toggle({
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
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      className={`ads-toggle rounded-full icon-only${checked ? " is-on" : ""}${disabled ? " is-disabled" : ""}`}
    >
      <span className="ads-toggle__thumb" />
    </button>
  );
}

type PermissionState = "granted" | "denied" | "default" | "prompt" | "unsupported";

function PermissionBadge({ value }: { value: PermissionState }) {
  const MAP: Record<PermissionState, { label: string; cls: string }> = {
    granted: { label: "مفعّل", cls: "ads-perm--ok" },
    denied: { label: "مرفوض", cls: "ads-perm--err" },
    default: { label: "يحتاج تفعيل", cls: "ads-perm--warn" },
    prompt: { label: "يحتاج تفعيل", cls: "ads-perm--warn" },
    unsupported: { label: "غير مدعوم", cls: "ads-perm--muted" },
  };
  const { label, cls } = MAP[value];
  return <span className={`ads-perm-badge ${cls}`}>{label}</span>;
}

function LocationPermBadge() {
  const [state, setState] = useState<PermissionState>("default");
  useEffect(() => {
    if (!navigator.permissions) {
      setState("unsupported");
      return;
    }
    let statusRef: PermissionStatus | null = null;
    let cancelled = false;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((res) => {
        if (cancelled) return;
        statusRef = res;
        setState(res.state as PermissionState);
        res.onchange = () => {
          if (!cancelled) setState(res.state as PermissionState);
        };
      })
      .catch(() => {
        if (!cancelled) setState("unsupported");
      });
    return () => {
      cancelled = true;
      if (statusRef) statusRef.onchange = null;
    };
  }, []);
  return <PermissionBadge value={state} />;
}

function NotificationPermBadge() {
  const [state, setState] = useState<PermissionState>("default");
  useEffect(() => {
    let cancelled = false;
    void import("@/lib/prayer-local-notifications").then(({ getNotificationPermissionStatus }) =>
      getNotificationPermissionStatus().then((status) => {
        if (!cancelled) setState(status === "prompt" ? "prompt" : status);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, []);
  return <PermissionBadge value={state} />;
}

function AndroidBackgroundCard() {
  const [perm, setPerm] = useState<{ exactAlarm: boolean; battery: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = () => {
    void getAndroidAdhanPermissionStatus().then(setPerm);
  };
  useEffect(() => {
    if (!isAdhanAndroidAlarmAvailable()) return;
    refresh();
  }, []);
  if (!isAdhanAndroidAlarmAvailable()) return null;
  return (
    <section className="ads-card" aria-labelledby="ads-android-head">
      <div className="ads-card__head" id="ads-android-head">
        <Bell size={15} strokeWidth={2} aria-hidden="true" />
        <span>حماية التنبيهات على أندرويد</span>
      </div>
      <div className="ads-card__body">
        <div className="ads-row">
          <span>المنبّه الدقيق</span>
          <PermissionBadge value={perm?.exactAlarm ? "granted" : perm ? "denied" : "default"} />
        </div>
        <div className="ads-row">
          <span>استثناء البطارية</span>
          <PermissionBadge value={perm?.battery ? "granted" : perm ? "denied" : "default"} />
        </div>
        <div className="ads-prayer-muezzin-btns ads-sound-test-row">
          <button
            type="button"
            className="ads-pill-btn"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void openAndroidExactAlarmSettings().finally(() => {
                refresh();
                setBusy(false);
              });
            }}
          >
            فحص المنبّه
          </button>
          <button
            type="button"
            className="ads-pill-btn"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void openAndroidBatteryOptimizationSettings().finally(() => {
                refresh();
                setBusy(false);
              });
            }}
          >
            فحص البطارية
          </button>
        </div>
      </div>
    </section>
  );
}

function SoundOptionCard({
  opt,
  selected,
  playing,
  onSelect,
  onListen,
}: {
  opt: SettingsSoundOption;
  selected: boolean;
  playing: boolean;
  onSelect: () => void;
  onListen: () => void;
}) {
  return (
    <div className={`ads-style-card${selected ? " is-selected" : ""}`}>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        className="ads-style-card__select"
        onClick={onSelect}
      >
        <span className="ads-style-card__name">{opt.label}</span>
        {selected ? <span className="ads-style-card__badge">مختار</span> : null}
      </button>
      {opt.playbackMode !== "silent" ? (
        <button
          type="button"
          className={`ads-style-card__preview${playing ? " is-playing" : ""}`}
          onClick={onListen}
          aria-label={`استماع — ${opt.label}`}
        >
          <Volume2 size={14} aria-hidden="true" />
          {playing ? "إيقاف" : "استماع"}
        </button>
      ) : null}
    </div>
  );
}

export default function AdhanSettingsPage() {
  const [prefs, setPrefs] = useState<AdhanPreferences>(() => {
    const loaded = loadAdhanPrefs();
    if (loaded.playbackMode === "full") {
      return patchAdhanPrefs({ playbackMode: "short", iosSequentialFullAdhan: false });
    }
    return loaded;
  });
  const [alertPrefs, setAlertPrefs] = useState(() => loadPrayerAlertPrefs());
  const [notifPrefs, setNotifPrefs] = useState(() => loadNotifPrefs());
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedGovId, setSelectedGovId] = useState(() => getSelectedGovernorate().id);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [soundMsg, setSoundMsg] = useState<string | null>(null);
  const [rescheduleBusy, setRescheduleBusy] = useState(false);
  const [rescheduleMsg, setRescheduleMsg] = useState<string | null>(null);
  const [notifTestMsg, setNotifTestMsg] = useState<string | null>(null);

  const soundOptions = useMemo(() => listAvailableSettingsSounds(), []);
  const selectedSoundId = resolveSettingsSoundSelection(
    prefs.defaultMuezzinId,
    prefs.playbackMode === "full" ? "short" : prefs.playbackMode,
    alertPrefs.soundProfile,
  );

  useEffect(() => {
    applyPageSeo({
      path: "/adhan-settings",
      title: "تنبيهات الصلاة | سُنّة",
      description: "فعّل تنبيهات الصلاة واختر صوت تنبيه قصير متوافق مع iOS.",
      keywords: ["تنبيهات الصلاة", "أذان", "إشعارات"],
      robots: "noindex, follow",
    });
  }, []);

  useEffect(() => {
    invalidatePrayerNativeSchedule();
  }, [
    prefs.defaultMuezzinId,
    prefs.playbackMode,
    prefs.globalEnabled,
    prefs.prayers,
    selectedGovId,
    alertPrefs.soundProfile,
  ]);

  useEffect(
    () => () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      stopAdhanPreview();
    },
    [],
  );

  function flashSaved() {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setSaved(true);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  }

  function selectSound(opt: SettingsSoundOption) {
    setPrefs(
      patchAdhanPrefs({
        defaultMuezzinId: opt.muezzinId,
        playbackMode: opt.playbackMode === "silent" ? "silent" : "short",
        iosSequentialFullAdhan: false,
      }),
    );
    setAlertPrefs(patchPrayerAlertPrefs({ soundProfile: opt.soundProfile }));
    flashSaved();
  }

  function togglePrayer(key: PrayerKey, enabled: boolean) {
    setPrefs(patchPrayerPrefs(key, { enabled }));
    flashSaved();
  }

  function togglePrayerIqamah(key: PrayerKey, iqamahEnabled: boolean) {
    setPrefs(
      patchAdhanPrefs({
        iqamahEnabled: iqamahEnabled ? true : prefs.iqamahEnabled,
        prayers: {
          ...prefs.prayers,
          [key]: { ...prefs.prayers[key], iqamahEnabled },
        },
      }),
    );
    flashSaved();
  }

  function setGlobalIqamah(enabled: boolean) {
    const prayers = { ...prefs.prayers };
    for (const key of PRAYER_KEYS) {
      prayers[key] = {
        ...prayers[key],
        iqamahEnabled: enabled ? prayers[key].enabled : false,
      };
    }
    setPrefs(patchAdhanPrefs({ iqamahEnabled: enabled, prayers }));
    flashSaved();
  }

  function setIqamahDelay(minutes: 0 | 5 | 10 | 15) {
    setPrefs(patchAdhanPrefs({ iqamahDelayMinutes: minutes }));
    flashSaved();
  }

  function setPrayerAdvance(key: PrayerKey, minutes: AdvanceMinutes) {
    setPrefs(patchPrayerPrefs(key, { advanceMinutes: minutes }));
    flashSaved();
  }

  async function handleGovChange(id: string) {
    setSelectedGovernorate(id);
    setSelectedGovId(id);
    flashSaved();
    await runRescheduleAlerts();
  }

  async function listenToSound(opt: SettingsSoundOption) {
    if (opt.playbackMode === "silent") {
      stopAdhanPreview();
      setPlayingId(null);
      setSoundMsg("صامت — بلا تشغيل");
      return;
    }
    if (playingId === opt.id) {
      stopAdhanPreview();
      setPlayingId(null);
      setSoundMsg(null);
      return;
    }
    setSoundMsg(null);
    const result = await playAdhanPreview(opt.muezzinId, "short", prefs.volume ?? 1);
    if (!result.ok) {
      setPlayingId(null);
      setSoundMsg("تعذّر الاستماع — تجربة الصوت الافتراضي.");
      const fallback = await playAdhanPreview("makkah", "short", prefs.volume ?? 1);
      if (fallback.ok) {
        setPlayingId(opt.id);
        fallback.audio.addEventListener("ended", () => setPlayingId(null), { once: true });
      }
      return;
    }
    setPlayingId(opt.id);
    result.audio.addEventListener("ended", () => setPlayingId(null), { once: true });
  }

  async function runSoundTest() {
    const opt = getSettingsSoundOption(selectedSoundId) ?? soundOptions[0];
    if (!opt) return;
    await listenToSound(opt);
  }

  async function runNotifSoundTest() {
    setNotifTestMsg(null);
    try {
      const { fireTestLocalNotification } = await import("@/lib/notifications/test-trigger");
      const res = await fireTestLocalNotification(15_000);
      if (!res.ok) {
        setNotifTestMsg(
          res.reason === "permission"
            ? "فعّل إذن الإشعارات أولًا من بطاقة تنبيهات الصلاة."
            : "تعذّر جدولة إشعار الاختبار.",
        );
        return;
      }
      setNotifTestMsg("سيصل إشعار قصير خلال ١٥ ثانية.");
    } catch {
      setNotifTestMsg("تعذّر اختبار الإشعار.");
    }
  }

  async function runRescheduleAlerts() {
    setRescheduleBusy(true);
    setRescheduleMsg(null);
    try {
      invalidatePrayerNativeSchedule();
      const payload = await fetchPrayerTimes(selectedGovId);
      const { startPrayerAlertScheduler } = await import("@/lib/prayer-alert-scheduler");
      await startPrayerAlertScheduler(payload, { forceNativeReschedule: true });
      await import("@/lib/adhan-scheduler").then((m) => m.startAdhanScheduler(payload));
      setRescheduleMsg(
        isNative
          ? "أُعيدت جدولة تنبيهات الصلاة لليوم والغد."
          : "أُعيدت الجدولة — على الويب تعمل أثناء فتح الصفحة.",
      );
      flashSaved();
    } catch {
      setRescheduleMsg("تعذّرت إعادة الجدولة. حاول مرة أخرى.");
    } finally {
      setRescheduleBusy(false);
    }
  }

  async function runPurgeAndReschedule() {
    setRescheduleBusy(true);
    setRescheduleMsg(null);
    try {
      const { cancelAllPrayerNativeNotifications } = await import("@/lib/prayer-local-notifications");
      await cancelAllPrayerNativeNotifications();
      invalidatePrayerNativeSchedule();
      const payload = await fetchPrayerTimes(selectedGovId);
      const { startPrayerAlertScheduler } = await import("@/lib/prayer-alert-scheduler");
      await startPrayerAlertScheduler(payload, { forceNativeReschedule: true });
      await import("@/lib/adhan-scheduler").then((m) => m.startAdhanScheduler(payload));
      setRescheduleMsg("حُذفت التنبيهات القديمة وأُعيد ضبطها.");
      flashSaved();
    } catch {
      setRescheduleMsg("تعذّر الحذف وإعادة الضبط.");
    } finally {
      setRescheduleBusy(false);
    }
  }

  const adhanSounds = soundOptions.filter((o) => o.group === "adhan");
  const toneSounds = soundOptions.filter((o) => o.group === "tone");

  return (
    <div className="ads-page">
      <h1 className="ads-title">تنبيهات الصلاة</h1>
      <p className="ads-subtitle">
        تنبيه أذان قصير متوافق مع iOS.
        {" "}
        <a href="/adhan-help" className="ads-help-link">مساعدة</a>
      </p>

      {saved ? (
        <div className="ads-toast" role="status" aria-live="polite">
          <span aria-hidden="true">✓</span> تم الحفظ
        </div>
      ) : null}

      <section className="ads-card" aria-labelledby="ads-loc-head">
        <div className="ads-card__head" id="ads-loc-head">
          <MapPin size={15} strokeWidth={2} aria-hidden="true" />
          <span>الموقع</span>
        </div>
        <div className="ads-card__body">
          <div className="ads-row-sep">
            <label htmlFor="gov-select" className="ads-gov-label">المحافظة</label>
            <select
              id="gov-select"
              value={selectedGovId}
              onChange={(e) => void handleGovChange(e.target.value)}
              className="ads-gov-select"
            >
              {KUWAIT_GOVERNORATES.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="ads-card" aria-labelledby="ads-sound-head">
        <div className="ads-card__head" id="ads-sound-head">
          <Music size={15} strokeWidth={2} aria-hidden="true" />
          <span>صوت التنبيه</span>
        </div>
        <div className="ads-card__body">
          <p className="ads-gov-label">أصوات الأذان</p>
          <div className="ads-style-grid" role="radiogroup" aria-label="أصوات الأذان">
            {adhanSounds.map((opt) => (
              <SoundOptionCard
                key={opt.id}
                opt={opt}
                selected={selectedSoundId === opt.id}
                playing={playingId === opt.id}
                onSelect={() => selectSound(opt)}
                onListen={() => void listenToSound(opt)}
              />
            ))}
          </div>

          <p className="ads-gov-label" style={{ marginTop: "0.85rem" }}>رنات التنبيه</p>
          <div className="ads-style-grid" role="radiogroup" aria-label="رنات التنبيه">
            {toneSounds.map((opt) => (
              <SoundOptionCard
                key={opt.id}
                opt={opt}
                selected={selectedSoundId === opt.id}
                playing={playingId === opt.id}
                onSelect={() => selectSound(opt)}
                onListen={() => void listenToSound(opt)}
              />
            ))}
          </div>
          {soundMsg ? <p className="ads-adhan-desc" role="status">{soundMsg}</p> : null}
        </div>
      </section>

      <PrayerAlertSettingsCard />

      <section className="ads-card" aria-labelledby="ads-faith-head">
        <div className="ads-card__head" id="ads-faith-head">
          <Bell size={15} strokeWidth={2} aria-hidden="true" />
          <span>تذكيرات إيمانية</span>
        </div>
        <div className="ads-card__body">
          <div className="ads-row">
            <span>تفعيل الإقامة</span>
            <Toggle
              checked={prefs.iqamahEnabled}
              onChange={setGlobalIqamah}
              label="تفعيل تنبيه الإقامة"
            />
          </div>
          {prefs.iqamahEnabled ? (
            <div className="ads-chip-scroll" role="group" aria-label="دقائق بعد الأذان للإقامة">
              {([0, 5, 10, 15] as const).map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setIqamahDelay(min)}
                  className={`ads-chip${prefs.iqamahDelayMinutes === min ? " is-active" : ""}`}
                >
                  {min === 0 ? "مع الأذان" : `${min} د`}
                </button>
              ))}
            </div>
          ) : null}
          <div className="ads-row">
            <span>تذكير الأذكار</span>
            <Toggle
              checked={notifPrefs.adhkarReminder}
              onChange={(v) => {
                const next = { ...notifPrefs, adhkarReminder: v };
                saveNotifPrefs(next);
                setNotifPrefs(next);
                flashSaved();
              }}
              label="تذكير الأذكار"
            />
          </div>
          <div className="ads-row">
            <span>تذكير الذكر</span>
            <Toggle
              checked={notifPrefs.dhikrPhraseReminder}
              onChange={(v) => {
                const next = { ...notifPrefs, dhikrPhraseReminder: v };
                saveNotifPrefs(next);
                setNotifPrefs(next);
                flashSaved();
              }}
              label="تذكير الذكر"
            />
          </div>
        </div>
      </section>

      <section className="ads-card" aria-labelledby="ads-prayers-head">
        <div className="ads-card__head" id="ads-prayers-head">
          <Bell size={15} strokeWidth={2} aria-hidden="true" />
          <span>تنبيهات الصلاة</span>
        </div>
        <div className="ads-card__body ads-prayer-list">
          {PRAYER_KEYS.map((key) => {
            const Icon = PRAYER_ICON_MAP[PRAYER_ICON[key]] ?? Bell;
            const p = prefs.prayers[key];
            return (
              <div key={key} className="ads-prayer-row">
                <div className="ads-prayer-row__top">
                  <span className="ads-prayer-row__name">
                    <Icon size={16} strokeWidth={2} aria-hidden="true" />
                    {PRAYER_ARABIC[key]}
                  </span>
                  <Toggle
                    checked={p.enabled}
                    onChange={(v) => togglePrayer(key, v)}
                    label={`${PRAYER_ARABIC[key]} — تشغيل التنبيه`}
                  />
                </div>
                <div className="ads-prayer-row__top">
                  <span className="ads-gov-label">الإقامة</span>
                  <Toggle
                    checked={Boolean(prefs.iqamahEnabled && p.iqamahEnabled)}
                    onChange={(v) => togglePrayerIqamah(key, v)}
                    label={`${PRAYER_ARABIC[key]} — تنبيه الإقامة`}
                    disabled={!p.enabled || !prefs.iqamahEnabled}
                  />
                </div>
                <div className="ads-chip-scroll" role="group" aria-label={`تنبيه قبل ${PRAYER_ARABIC[key]}`}>
                  {ADVANCE_OPTIONS.map((min) => (
                    <button
                      key={min}
                      type="button"
                      disabled={!p.enabled}
                      onClick={() => setPrayerAdvance(key, min)}
                      className={`ads-chip${p.advanceMinutes === min ? " is-active" : ""}`}
                    >
                      {min === 0 ? "بدون" : `${min} د`}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <AndroidBackgroundCard />

      <section className="ads-card" aria-labelledby="ads-test-head">
        <div className="ads-card__head" id="ads-test-head">
          <Bell size={15} strokeWidth={2} aria-hidden="true" />
          <span>اختبار الإشعارات</span>
        </div>
        <div className="ads-card__body">
          <div className="ads-row">
            <span>إذن الإشعارات</span>
            <NotificationPermBadge />
          </div>
          <div className="ads-row">
            <span>إذن الموقع</span>
            <LocationPermBadge />
          </div>
          <div className="ads-prayer-muezzin-btns ads-sound-test-row">
            <button type="button" className="ads-pill-btn" onClick={() => void runSoundTest()}>
              {playingId ? "إيقاف الصوت" : "اختبار الصوت"}
            </button>
            <button type="button" className="ads-pill-btn" onClick={() => void runNotifSoundTest()}>
              اختبار الإشعار
            </button>
            <button
              type="button"
              className="ads-pill-btn ads-reschedule-btn"
              disabled={rescheduleBusy}
              onClick={() => void runRescheduleAlerts()}
            >
              {rescheduleBusy ? "جارٍ…" : "إعادة جدولة التنبيهات"}
            </button>
            <button
              type="button"
              className="ads-pill-btn"
              disabled={rescheduleBusy}
              onClick={() => void runPurgeAndReschedule()}
            >
              حذف القديمة وإعادة الضبط
            </button>
          </div>
          {notifTestMsg ? <p className="ads-adhan-desc" role="status">{notifTestMsg}</p> : null}
          {rescheduleMsg ? <p className="ads-adhan-desc" role="status">{rescheduleMsg}</p> : null}
        </div>
      </section>
    </div>
  );
}
