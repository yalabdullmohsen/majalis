/**
 * إعدادات الأذان — أربعة أنواع فقط (مكة/المدينة × كامل/مختصر).
 * داخل التطبيق: M4A من /audio/adhan.
 * إشعار iOS: CAF قصير من حزمة Sounds. لا يُعرض خيار تجاوز الرنين لأنه غير مدعوم.
 */
import { useEffect, useRef, useState } from "react";
import {
  CloudMoon, CloudSun, MapPin, Moon, Music, Bell, Sun, Sunset,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  loadAdhanPrefs,
  patchAdhanPrefs,
  patchPrayerPrefs,
  PRAYER_KEYS,
  PRAYER_ARABIC,
  PRAYER_ICON,
  getEffectiveMuezzinId,
  getEffectivePlaybackMode,
  type AdhanPreferences,
  type PrayerKey,
  type AdvanceMinutes,
} from "@/lib/adhan-preferences";
import {
  playAdhanPreview,
  probeAdhanAssetExists,
  stopAdhanPreview,
} from "@/lib/adhan-audio-service";
import { invalidatePrayerNativeSchedule } from "@/lib/prayer-alert-scheduler";
import { PrayerAlertSettingsCard } from "@/components/adhan/PrayerAlertSettingsCard";
import {
  SELECTABLE_ADHAN_TYPES,
  getSelectableAdhanType,
  typeIdFromPrefs,
  type SelectableAdhanTypeId,
} from "@/lib/adhan-selectable-types";
import {
  KUWAIT_GOVERNORATES,
  getSelectedGovernorate,
  setSelectedGovernorate,
  fetchPrayerTimes,
} from "@/lib/prayer-times";
import { applyPageSeo } from "@/lib/seo";
import { isNative } from "@/lib/capacitor-utils";
import "@/styles/pages/adhan-settings.css";

const ADVANCE_OPTIONS: AdvanceMinutes[] = [0, 5, 10, 15, 20];

const PRAYER_ICON_MAP: Record<string, LucideIcon> = {
  Moon, Sun, CloudSun, Sunset, CloudMoon,
};

function Toggle({
  checked,
  onChange,
  id,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      id={id}
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
    granted: { label: "مسموح", cls: "ads-perm--ok" },
    denied: { label: "غير مسموح", cls: "ads-perm--err" },
    default: { label: "غير محدد", cls: "ads-perm--warn" },
    prompt: { label: "غير محدد", cls: "ads-perm--warn" },
    unsupported: { label: "غير محدد", cls: "ads-perm--muted" },
  };
  const { label, cls } = MAP[value];
  return <span className={`ads-perm-badge ${cls}`}>{label}</span>;
}

function LocationPermBadge() {
  const [state, setState] = useState<PermissionState>("default");
  useEffect(() => {
    if (!navigator.permissions) { setState("unsupported"); return; }
    navigator.permissions.query({ name: "geolocation" }).then((res) => {
      setState(res.state as PermissionState);
      res.onchange = () => setState(res.state as PermissionState);
    }).catch(() => setState("unsupported"));
  }, []);
  return <PermissionBadge value={state} />;
}

function NotificationPermBadge() {
  const [state, setState] = useState<PermissionState>("default");
  useEffect(() => {
    let cancelled = false;
    void import("@/lib/prayer-local-notifications").then(({ getNotificationPermissionStatus }) =>
      getNotificationPermissionStatus().then((status) => {
        if (cancelled) return;
        if (status === "prompt") setState("prompt");
        else setState(status);
      }),
    );
    return () => { cancelled = true; };
  }, []);
  return <PermissionBadge value={state} />;
}

export default function AdhanSettingsPage() {
  const [prefs, setPrefs] = useState<AdhanPreferences>(() => loadAdhanPrefs());
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedGovId, setSelectedGovId] = useState(() => getSelectedGovernorate().id);
  const [playing, setPlaying] = useState(false);
  const [soundBusy, setSoundBusy] = useState(false);
  const [soundMsg, setSoundMsg] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState<boolean | null>(null);
  const [rescheduleBusy, setRescheduleBusy] = useState(false);
  const [rescheduleMsg, setRescheduleMsg] = useState<string | null>(null);

  const selectedTypeId = typeIdFromPrefs(prefs.defaultMuezzinId, prefs.playbackMode);
  const selectedType = getSelectableAdhanType(selectedTypeId);

  useEffect(() => {
    applyPageSeo({
      path: "/adhan-settings",
      title: "إعدادات الأذان | المجلس العلمي",
      description: "اختر أذان مكة أو المدينة، اختبر الصوت، وفعّل إشعارات الصلاة.",
      keywords: ["إعدادات أذان", "تنبيه الصلاة", "أذان مكة", "أذان المدينة"],
      robots: "noindex, follow",
    });
  }, []);

  useEffect(() => {
    invalidatePrayerNativeSchedule();
  }, [prefs.defaultMuezzinId, prefs.playbackMode, prefs.globalEnabled, prefs.prayers, selectedGovId]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) setAudioReady(false);
    }, 10_000);
    void probeAdhanAssetExists(selectedType.inAppUrl).then((ok) => {
      window.clearTimeout(timer);
      if (!cancelled) setAudioReady(ok);
    }).catch(() => {
      window.clearTimeout(timer);
      if (!cancelled) setAudioReady(false);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [selectedType.inAppUrl]);

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

  function selectType(id: SelectableAdhanTypeId) {
    const t = getSelectableAdhanType(id);
    setPrefs(patchAdhanPrefs({
      defaultMuezzinId: t.muezzinId,
      playbackMode: t.mode,
    }));
    flashSaved();
  }

  function togglePrayer(key: PrayerKey, enabled: boolean) {
    setPrefs(patchPrayerPrefs(key, { enabled }));
    flashSaved();
  }

  function setPrayerType(key: PrayerKey, value: string) {
    if (!value) {
      setPrefs(patchPrayerPrefs(key, { muezzinId: "", deliveryMode: "" }));
      flashSaved();
      return;
    }
    const t = getSelectableAdhanType(value);
    setPrefs(patchPrayerPrefs(key, { muezzinId: t.muezzinId, deliveryMode: t.mode }));
    flashSaved();
  }

  function setPrayerAdvance(key: PrayerKey, minutes: AdvanceMinutes) {
    setPrefs(patchPrayerPrefs(key, { advanceMinutes: minutes }));
    flashSaved();
  }

  function handleGovChange(id: string) {
    setSelectedGovernorate(id);
    setSelectedGovId(id);
  }

  async function runSoundTest() {
    if (playing || soundBusy) {
      stopAdhanPreview();
      setPlaying(false);
      setSoundBusy(false);
      setSoundMsg(null);
      return;
    }
    setSoundBusy(true);
    setSoundMsg(null);
    const result = await playAdhanPreview(selectedType.muezzinId, selectedType.mode, prefs.volume ?? 1);
    setSoundBusy(false);
    if (!result.ok) {
      setPlaying(false);
      setSoundMsg("تعذر تشغيل الصوت، جرّب نوعًا آخر.");
      return;
    }
    setPlaying(true);
    setSoundMsg("يعمل الآن");
    result.audio.addEventListener("ended", () => {
      setPlaying(false);
      setSoundMsg(null);
    }, { once: true });
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
          ? "أُعيدت جدولة تنبيهات الأذان لليوم والغد."
          : "أُعيدت الجدولة — على الويب تعمل أثناء فتح الصفحة.",
      );
      flashSaved();
    } catch {
      setRescheduleMsg("تعذّرت إعادة جدولة التنبيهات. حاول مرة أخرى.");
    } finally {
      setRescheduleBusy(false);
    }
  }

  return (
    <div className="ads-page">
      <h1 className="ads-title">إعدادات الأذان</h1>
      <p className="ads-subtitle">اختر الأذان، اختبر الصوت، وفعّل إشعارات الصلاة.</p>

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
              onChange={(e) => handleGovChange(e.target.value)}
              className="ads-gov-select"
            >
              {KUWAIT_GOVERNORATES.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="ads-card" aria-labelledby="ads-styles-head">
        <div className="ads-card__head" id="ads-styles-head">
          <Music size={15} strokeWidth={2} aria-hidden="true" />
          <span>اختيار الأذان</span>
        </div>
        <div className="ads-card__body">
          <div className="ads-style-grid" role="radiogroup" aria-label="نوع الأذان">
            {SELECTABLE_ADHAN_TYPES.map((t) => {
              const selected = selectedTypeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`ads-style-card${selected ? " is-selected" : ""}`}
                  onClick={() => selectType(t.id)}
                >
                  <span className="ads-style-card__name">{t.label}</span>
                  {selected ? <span className="ads-style-card__badge">مختار</span> : null}
                </button>
              );
            })}
          </div>
          <div className="ads-prayer-muezzin-btns ads-sound-test-row">
            <button
              type="button"
              className="ads-pill-btn"
              onClick={() => void runSoundTest()}
            >
              {soundBusy && !playing ? "…" : playing ? "إيقاف" : "اختبار الصوت"}
            </button>
          </div>
          {soundMsg ? (
            <p className={`ads-adhan-desc${playing ? "" : " ads-audio-error"}`} role="status">
              {soundMsg}
            </p>
          ) : null}
        </div>
      </section>

      <PrayerAlertSettingsCard />

      <section className="ads-card" aria-labelledby="ads-prayers-head">
        <div className="ads-card__head" id="ads-prayers-head">
          <Bell size={15} strokeWidth={2} aria-hidden="true" />
          <span>تخصيص كل صلاة</span>
        </div>
        <div className="ads-card__body ads-prayer-list">
          {PRAYER_KEYS.map((key) => {
            const Icon = PRAYER_ICON_MAP[PRAYER_ICON[key]] ?? Bell;
            const p = prefs.prayers[key];
            const effectiveId = typeIdFromPrefs(
              getEffectiveMuezzinId(prefs, key),
              getEffectivePlaybackMode(prefs, key),
            );
            const hasOverride = !!p.muezzinId || !!p.deliveryMode;
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
                    label={`${PRAYER_ARABIC[key]} — تشغيل الأذان`}
                  />
                </div>
                <label className="ads-gov-label" htmlFor={`ads-type-${key}`}>نوع الأذان</label>
                <select
                  id={`ads-type-${key}`}
                  className="ads-gov-select"
                  value={hasOverride ? effectiveId : ""}
                  onChange={(e) => setPrayerType(key, e.target.value)}
                  disabled={!p.enabled}
                >
                  <option value="">حسب الإعداد العام</option>
                  {SELECTABLE_ADHAN_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
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

      <section className="ads-card" aria-labelledby="ads-status-head">
        <div className="ads-card__head" id="ads-status-head">
          <Bell size={15} strokeWidth={2} aria-hidden="true" />
          <span>الحالة</span>
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
          <div className="ads-row">
            <span>حالة الصوت</span>
            <span className={`ads-perm-badge ${audioReady ? "ads-perm--ok" : "ads-perm--warn"}`}>
              {audioReady == null ? "…" : audioReady ? "جاهز" : "غير جاهز"}
            </span>
          </div>
          <button
            type="button"
            className="ads-pill-btn ads-reschedule-btn"
            disabled={rescheduleBusy}
            onClick={() => void runRescheduleAlerts()}
          >
            {rescheduleBusy ? "جارٍ…" : "إعادة جدولة التنبيهات"}
          </button>
          {rescheduleMsg ? <p className="ads-adhan-desc" role="status">{rescheduleMsg}</p> : null}
        </div>
      </section>
    </div>
  );
}
