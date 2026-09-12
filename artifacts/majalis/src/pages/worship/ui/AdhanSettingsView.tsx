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
import { previewAdhanUrl, previewNotificationTone, stopAppAudio } from "@/lib/audio/preview-helpers";
import { subscribeAppAudio } from "@/lib/audio/app-audio-coordinator";
import { invalidatePrayerNativeSchedule } from "@/lib/prayer-alert-scheduler";
import { PrayerAlertSettingsCard } from "@/components/adhan/PrayerAlertSettingsCard";
import { AudioPromptsSettingsCard } from "@/components/adhan/AudioPromptsSettingsCard";
import {
  listAvailableSettingsSounds,
  getSettingsSoundOption,
  rememberSettingsSoundSelection,
  resolveSelectedAdhanSoundId,
  resolveSelectedToneSoundId,
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
  playAndroidAdhanNow,
} from "@/lib/adhan-android-alarm";
import { getMuezzin } from "@/lib/adhan-audio";
import { resolveAdhanClip } from "@/lib/adhan-playback-modes";
import { loadNotifPrefs, saveNotifPrefs } from "@/lib/local-notifications";
import "@/styles/pages/adhan-settings.css";
import { UtilityScreen } from "@/components/design-system/screens";
import { SettingsToggleRow } from "@/components/design-system/SettingsList";

const ADVANCE_OPTIONS: AdvanceMinutes[] = [0, 5, 10, 15, 30];


/** أدوات مطور/تشخيص — لا تُعرض في الإصدار العام. */
function useAdhanDeveloperTools(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    return new URLSearchParams(window.location.search).get("adhanDebug") === "1";
  } catch {
    return false;
  }
}

const PRAYER_ICON_MAP: Record<string, LucideIcon> = {
  Moon, Sun, CloudSun, Sunset, CloudMoon,
};

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

function AndroidAdhanNativeCard({
  selectedMuezzinId,
}: {
  selectedMuezzinId: string;
}) {
  const showDeveloperTools = useAdhanDeveloperTools();
  const [perm, setPerm] = useState<{ exactAlarm: boolean; battery: boolean } | null>(null);
  const [permBusy, setPermBusy] = useState(false);
  const [fgsBusy, setFgsBusy] = useState(false);
  const [fgsMsg, setFgsMsg] = useState<string | null>(null);

  const refreshPerm = () => {
    void getAndroidAdhanPermissionStatus().then(setPerm);
  };

  useEffect(() => {
    if (!isAdhanAndroidAlarmAvailable()) return;
    refreshPerm();
  }, []);

  if (!isAdhanAndroidAlarmAvailable()) return null;

  async function handleBatteryCheck() {
    setPermBusy(true);
    await openAndroidBatteryOptimizationSettings();
    refreshPerm();
    setPermBusy(false);
  }

  async function handleExactAlarmCheck() {
    setPermBusy(true);
    await openAndroidExactAlarmSettings();
    refreshPerm();
    setPermBusy(false);
  }

  async function handleFgsTest() {
    setFgsBusy(true);
    setFgsMsg(null);
    const muezzin = getMuezzin(selectedMuezzinId);
    const clip = resolveAdhanClip(muezzin, { isFajr: false, mode: "full" });
    if (!clip) {
      setFgsMsg("تعذّر تجهيز ملف الأذان المحلي.");
      setFgsBusy(false);
      return;
    }
    const ok = await playAndroidAdhanNow({
      url: clip.url,
      title: "تجربة الأذان",
      prayerKey: "dhuhr",
    });
    setFgsMsg(
      ok
        ? "تُشغَّل الخدمة الأمامية — الأذان كاملاً حتى النهاية (ملف محلي)."
        : "تعذّر تشغيل خدمة الأذان على هذا الجهاز.",
    );
    setFgsBusy(false);
  }

  return (
    <section className="soft-card soft-card--on-light ads-card" aria-labelledby="ads-android-native-head">
      <div className="ads-card__head" id="ads-android-native-head">
        <Bell size={15} strokeWidth={2} aria-hidden="true" />
        <span>حماية تشغيل الخلفية (أندroid)</span>
      </div>
      <div className="ads-card__body">
        <p className="ads-adhan-desc" role="note">
          الأذان الكامل يُجدول عبر منبه دقيق وخدمة أمامية — بلا اعتماد على الشبكة لحظة الصلاة.
          تجاوز زر الصامت على iOS غير متاح دون امتياز Apple الرسمي.
        </p>
        <div className="ads-row">
          <span>منبه دقيق (Exact Alarm)</span>
          <PermissionBadge
            value={perm?.exactAlarm ? "granted" : perm ? "denied" : "default"}
          />
        </div>
        <div className="ads-row">
          <span>استثناء تحسين البطارية</span>
          <PermissionBadge
            value={perm?.battery ? "granted" : perm ? "denied" : "default"}
          />
        </div>
        <div className="ads-prayer-muezzin-btns ads-sound-test-row">
          {showDeveloperTools ? (
            <>
            <button
            type="button"
            className="ads-pill-btn"
            disabled={permBusy}
            onClick={() => void handleExactAlarmCheck()}
          >
            فحص المنبه الدقيق
          </button>
          <button
            type="button"
            className="ads-pill-btn"
            disabled={permBusy}
            onClick={() => void handleBatteryCheck()}
          >
            فحص حماية البطارية
          </button>
          <button
            type="button"
            className="ads-pill-btn"
            disabled={fgsBusy}
            onClick={() => void handleFgsTest()}
          >
            {fgsBusy ? "…" : "تجربة خدمة الأذان"}
          </button>
            </>
          ) : null}
        </div>
        {fgsMsg ? (
          <p className="ads-adhan-desc" role="status">
            {fgsMsg}
          </p>
        ) : null}
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
    <div className={`ads-style-card ads-style-card--compact${selected ? " is-selected" : ""}`}>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        className="ads-style-card__select"
        onClick={onSelect}
      >
        <span className="ads-style-card__name">{opt.label}</span>
        {selected ? <span className="ads-style-card__badge" data-selected="1">مختار</span> : null}
      </button>
      {opt.playbackMode !== "silent" ? (
        <button
          type="button"
          className={`ads-style-card__preview${playing ? " is-playing" : ""}`}
          onClick={onListen}
          aria-label={`معاينة — ${opt.label}`}
        >
          <Volume2 size={14} aria-hidden="true" />
          {playing ? "إيقاف" : "معاينة"}
        </button>
      ) : null}
    </div>
  );
}

export default function AdhanSettingsPage() {
  const showDeveloperTools = useAdhanDeveloperTools();
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
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusLines, setStatusLines] = useState<string[] | null>(null);

  const soundOptions = useMemo(() => listAvailableSettingsSounds(), []);
  const selectedAdhanSoundId = resolveSelectedAdhanSoundId(prefs.defaultMuezzinId);
  const selectedToneSoundId = resolveSelectedToneSoundId(alertPrefs.soundProfile);

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
      void stopAppAudio("leave");
    },
    [],
  );

  useEffect(() => {
    return subscribeAppAudio((snap) => {
      if (snap.phase === "idle" || snap.phase === "failed" || snap.phase === "interrupted") {
        setPlayingId(null);
      }
    });
  }, []);

  function flashSaved() {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setSaved(true);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  }

  function selectSound(opt: SettingsSoundOption) {
    rememberSettingsSoundSelection(opt);
    if (opt.group === "adhan") {
      setPrefs(
        patchAdhanPrefs({
          defaultMuezzinId: opt.muezzinId,
          playbackMode: "short",
          iosSequentialFullAdhan: false,
        }),
      );
    } else {
      setPrefs(
        patchAdhanPrefs({
          playbackMode: opt.playbackMode === "silent" ? "silent" : prefs.playbackMode === "full" ? "short" : prefs.playbackMode,
          iosSequentialFullAdhan: false,
        }),
      );
      setAlertPrefs(patchPrayerAlertPrefs({ soundProfile: opt.soundProfile }));
    }
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
      setSoundMsg("الصامت لا يشغّل معاينة صوتية.");
      return;
    }
    stopAdhanPreview();
    await stopAppAudio("user");
    setPlayingId(opt.id);
    setSoundMsg(null);
    try {
      if (opt.previewUrl) {
        const res =
          opt.group === "tone"
            ? await previewNotificationTone(
                `settings-tone-${opt.id}`,
                opt.previewUrl,
                "adhan-settings",
              )
            : await previewAdhanUrl(
                `settings-adhan-${opt.id}`,
                opt.previewUrl,
                "adhan-settings",
                15_000,
              );
        if (!res.ok) {
          setPlayingId(null);
          setSoundMsg(res.error ?? "تعذّر تشغيل المعاينة.");
          return;
        }
        setSoundMsg(
          opt.group === "tone"
            ? "معاينة صوت الإشعار داخل التطبيق."
            : "معاينة الأذان داخل التطبيق.",
        );
        return;
      }
      const result = await playAdhanPreview(opt.muezzinId, "short", prefs.volume ?? 1);
      if (!result.ok) {
        setSoundMsg("فشل التشغيل: تعذّر المعاينة — تجربة الصوت الافتراضي.");
        const fallback = await playAdhanPreview("makkah", "short", prefs.volume ?? 1);
        if (!fallback.ok) setPlayingId(null);
      }
    } catch {
      setPlayingId(null);
      setSoundMsg("تعذّر تشغيل المعاينة.");
    }
  }

  async function runSoundTest() {
    const opt = getSettingsSoundOption(selectedToneSoundId) ?? getSettingsSoundOption(selectedAdhanSoundId) ?? soundOptions[0];
    if (!opt) return;
    await listenToSound(opt);
  }

  async function runNotifSoundTest() {
    setNotifTestMsg(null);
    try {
      const { fireTestLocalNotification } = await import("@/lib/notifications/test-trigger");
      const res = await fireTestLocalNotification(10_000);
      if (!res.ok) {
        setNotifTestMsg(
          res.reason === "permission"
            ? "فعّل إذن الإشعارات أولًا من بطاقة تنبيهات الصلاة."
            : "تعذّر جدولة إشعار الاختبار.",
        );
        return;
      }
      setNotifTestMsg("سيصل إشعار قصير خلال ١٠ ثوانٍ.");
    } catch {
      setNotifTestMsg("تعذّر اختبار الإشعار.");
    }
  }

  async function runAdhanStatusCheck() {
    setStatusBusy(true);
    setStatusLines(null);
    try {
      const [{ getNotificationPermissionStatus, listPendingPrayerNotifications }, { getAudioDiagnostics }, { loadPrayerScheduleStatus, formatScheduleStatusAr }] =
        await Promise.all([
          import("@/lib/prayer-local-notifications"),
          import("@/lib/adhan-audio-service"),
          import("@/lib/prayer-schedule-status").catch(async () => ({
            loadPrayerScheduleStatus: () => null,
            formatScheduleStatusAr: () => "حالة الجدولة: غير متاحة",
          })),
        ]);
      const perm = await getNotificationPermissionStatus();
      const pending = await listPendingPrayerNotifications();
      const diag = getAudioDiagnostics();
      const scheduleNote = formatScheduleStatusAr(loadPrayerScheduleStatus());
      setStatusLines([
        `إذن الإشعارات: ${perm}`,
        `الإشعارات المجدولة: ${pending.count}`,
        scheduleNote,
        `آخر نجاح تشغيل: ${diag.lastSuccessAt ?? "—"}`,
        `آخر خطأ صوت: ${diag.lastError ?? "—"}`,
      ]);
    } catch {
      setStatusLines(["تعذّر فحص حالة الأذان."]);
    } finally {
      setStatusBusy(false);
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
    <UtilityScreen compose="mark">
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

      <section className="soft-card soft-card--on-light ads-card" aria-labelledby="ads-loc-head">
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

      <section className="soft-card soft-card--on-light ads-card" aria-labelledby="ads-sound-head">
        <div className="ads-card__head" id="ads-sound-head">
          <Music size={15} strokeWidth={2} aria-hidden="true" />
          <span>أصوات الصلاة</span>
        </div>
        <div className="ads-card__body">
          <p className="ads-gov-label">الأذان داخل التطبيق</p>
          <div className="ads-style-grid" role="radiogroup" aria-label="الأذان داخل التطبيق">
            {adhanSounds.map((opt) => (
              <SoundOptionCard
                key={opt.id}
                opt={opt}
                selected={selectedAdhanSoundId === opt.id}
                playing={playingId === opt.id}
                onSelect={() => selectSound(opt)}
                onListen={() => void listenToSound(opt)}
              />
            ))}
          </div>

          <p className="ads-gov-label" style={{ marginTop: "0.85rem" }}>صوت إشعار الصلاة</p>
          <div className="ads-style-grid" role="radiogroup" aria-label="صوت إشعار الصلاة">
            {toneSounds.map((opt) => (
              <SoundOptionCard
                key={opt.id}
                opt={opt}
                selected={selectedToneSoundId === opt.id}
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

      <AudioPromptsSettingsCard />

      <section className="soft-card soft-card--on-light ads-card" aria-labelledby="ads-faith-head">
        <div className="ads-card__head" id="ads-faith-head">
          <Bell size={15} strokeWidth={2} aria-hidden="true" />
          <span>تذكيرات إيمانية</span>
        </div>
        <div className="ads-card__body">
                      <SettingsToggleRow
              id="adhan-iqamah"
              title="تفعيل الإقامة"
              checked={prefs.iqamahEnabled}
              onChange={setGlobalIqamah}
            />
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
                      <SettingsToggleRow
              id="adhan-adhkar"
              title="تذكير الأذكار"
              checked={notifPrefs.adhkarReminder}
              onChange={(v) => {
                const next = { ...notifPrefs, adhkarReminder: v };
                saveNotifPrefs(next);
                setNotifPrefs(next);
                flashSaved();
              }}
            />
                      <SettingsToggleRow
              id="adhan-dhikr-phrase"
              title="تذكير الذكر"
              checked={notifPrefs.dhikrPhraseReminder}
              onChange={(v) => {
                const next = { ...notifPrefs, dhikrPhraseReminder: v };
                saveNotifPrefs(next);
                setNotifPrefs(next);
                flashSaved();
              }}
            />
        </div>
      </section>

      <section className="soft-card soft-card--on-light ads-card" aria-labelledby="ads-prayers-head">
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
                <div className="ads-prayer-row__head">
                  <Icon size={16} strokeWidth={2} aria-hidden="true" />
                  <span className="ads-prayer-row__name">{PRAYER_ARABIC[key]}</span>
                </div>
                <SettingsToggleRow
                  id={`adhan-prayer-${key}-enabled`}
                  title="تشغيل التنبيه"
                  checked={p.enabled}
                  onChange={(v) => togglePrayer(key, v)}
                />
                <SettingsToggleRow
                  id={`adhan-prayer-${key}-iqamah`}
                  title="تنبيه الإقامة"
                  checked={Boolean(prefs.iqamahEnabled && p.iqamahEnabled)}
                  onChange={(v) => togglePrayerIqamah(key, v)}
                  disabled={!p.enabled || !prefs.iqamahEnabled}
                />
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

      <AndroidAdhanNativeCard selectedMuezzinId={prefs.defaultMuezzinId} />

      <section className="soft-card soft-card--on-light ads-card" aria-labelledby="ads-test-head">
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
              {playingId ? "إيقاف الصوت" : "معاينة الصوت"}
            </button>
            <button type="button" className="ads-pill-btn" onClick={() => void runNotifSoundTest()}>
              اختبار الإشعار بعد ١٠ ثوانٍ
            </button>
            {showDeveloperTools ? (
            <>
            <button
              type="button"
              className="ads-pill-btn"
              disabled={statusBusy}
              onClick={() => void runAdhanStatusCheck()}
            >
              {statusBusy ? "…" : "فحص حالة الأذان"}
            </button>
            <button
              type="button"
              className="ads-pill-btn ads-reschedule-btn"
              disabled={rescheduleBusy}
              onClick={() => void runRescheduleAlerts()}
            >
              {rescheduleBusy ? "…" : "إعادة جدولة التنبيهات"}
            </button>
            <button
              type="button"
              className="ads-pill-btn"
              disabled={rescheduleBusy}
              onClick={() => void runPurgeAndReschedule()}
            >
              حذف القديمة وإعادة الضبط
            </button>
            </>
          ) : null}
            </div>
          {notifTestMsg ? <p className="ads-adhan-desc" role="status">{notifTestMsg}</p> : null}
          {statusLines ? (
            <ul className="ads-adhan-desc" role="status">
              {statusLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          {rescheduleMsg ? <p className="ads-adhan-desc" role="status">{rescheduleMsg}</p> : null}
        </div>
      </section>
    </div>
    </UtilityScreen>
  );
}
