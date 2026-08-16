import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, CloudMoon, CloudSun, MapPin, Moon, Music, Bell, Sunrise, Sun, Sunset, Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  loadAdhanPrefs,
  patchAdhanPrefs,
  patchPrayerPrefs,
  applyDefaultMuezzinToAllPrayers,
  PRAYER_KEYS,
  PRAYER_ARABIC,
  PRAYER_ICON,
  getEffectiveMuezzinId,
  type AdhanPreferences,
  type AdhanDeliveryMode,
  type PrayerKey,
  type AdvanceMinutes,
} from "@/lib/adhan-preferences";
import { getMuezzin, hasFajrAdhan, stopAdhan } from "@/lib/adhan-audio";
import {
  CRITICAL_ALERTS_ENTITLEMENT_PRESENT,
  getAdhanAudioDebugSnapshot,
  getAudioDiagnostics,
  playAdhanPreview,
  preloadAdhanSounds,
  probeAdhanAssetExists,
  stopAdhanPreview,
  testFullAdhan,
  validateAudioAssets,
  type AdhanStyleId,
} from "@/lib/adhan-audio-service";
import { fireTestLocalNotification, fireTestSequentialAdhan, TEST_NOTIFICATION_DELAY_MS } from "@/lib/notifications/test-trigger";
import { invalidatePrayerNativeSchedule } from "@/lib/prayer-alert-scheduler";
import {
  ADHAN_PLAYBACK_MODES,
  ADHAN_PLAYBACK_MODE_LABELS,
  type AdhanPlaybackMode,
} from "@/lib/adhan-playback-modes";
import {
  downloadAdhanFullClips,
  clearAdhanFullDownloads,
  formatAdhanDownloadCap,
  getAdhanDownloadUsage,
  ensureOfflineAdhanPack,
} from "@/lib/adhan-downloads";
import { MuezzinPicker } from "@/components/adhan/MuezzinPicker";
import { PrayerAlertSettingsCard } from "@/components/adhan/PrayerAlertSettingsCard";
import { listBundledAdhanSoundPaths } from "@/lib/adhan-offline-assets";
import {
  FEATURED_ADHAN_STYLE_IDS,
  FEATURED_ADHAN_STYLE_LABELS,
  type FeaturedAdhanStyleId,
} from "@/lib/adhan-featured-styles";
import {
  KUWAIT_GOVERNORATES,
  getSelectedGovernorate,
  setSelectedGovernorate,
  fetchPrayerTimes,
} from "@/lib/prayer-times";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { applyPageSeo } from "@/lib/seo";
import { undismissFridayBanner } from "@/lib/friday-prayer";
import { computeNotificationDiagnostics, type NotificationDiagnostics } from "@/lib/notification-diagnostics";
import { isIOS, isNative } from "@/lib/capacitor-utils";
import { loadNotifPrefs, saveNotifPrefs } from "@/lib/local-notifications";
import "@/styles/pages/adhan-settings.css";

const ADVANCE_OPTIONS: AdvanceMinutes[] = [0, 5, 10, 15, 20, 30];

const PRAYER_ICON_MAP: Record<string, LucideIcon> = {
  Moon, Sun, CloudSun, Sunset, CloudMoon,
};

/** مفتاح قياسي — class rounded-full icon-only لاستثناء قواعد 44px العامة */
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

function AdvanceChips({
  value,
  onChange,
  ariaLabel,
}: {
  value: AdvanceMinutes | null;
  onChange: (m: AdvanceMinutes) => void;
  ariaLabel: string;
}) {
  return (
    <div className="ads-chip-scroll" role="group" aria-label={ariaLabel}>
      {ADVANCE_OPTIONS.map((min) => (
        <button
          key={min}
          type="button"
          onClick={() => onChange(min)}
          className={`ads-chip${value === min ? " is-active" : ""}`}
        >
          {min === 0 ? "بدون" : `${min} د`}
        </button>
      ))}
    </div>
  );
}

function AdhanDownloadRow({ onFlash }: { onFlash: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const usage = getAdhanDownloadUsage();
  const usedMb = (usage.totalBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="ads-row" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.45rem" }}>
      <div>
        <div className="ads-global-label">تنزيل النسخ الكاملة (اختياري)</div>
        <div className="ads-global-desc">
          سقف {formatAdhanDownloadCap()} — المستخدم حاليًا ≈ {usedMb} ميغابايت. يُحذف مع حذف الحساب.
        </div>
      </div>
      <div className="ads-prayer-muezzin-btns">
        <button
          type="button"
          className="ads-pill-btn"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setMsg("");
            void ensureOfflineAdhanPack().then((r) =>
              downloadAdhanFullClips().then((d) => ({ ...d, cached: r.cached })),
            ).then((r) => {
              setBusy(false);
              setMsg(
                r.ok
                  ? "اكتمل التنزيل الأوفلاين"
                  : r.reason === "cap_reached"
                    ? "وصل السقف — احذف ثم أعد المحاولة"
                    : "تعذّر التنزيل",
              );
              onFlash();
            });
          }}
        >
          {busy ? "جارٍ…" : "تنزيل"}
        </button>
        <button
          type="button"
          className="ads-pill-btn-ghost"
          disabled={busy || usage.totalBytes === 0}
          onClick={() => {
            void clearAdhanFullDownloads().then(() => {
              setMsg("تم الحذف");
              onFlash();
            });
          }}
        >
          حذف التخزين
        </button>
      </div>
      {msg ? <p className="ads-adhan-desc">{msg}</p> : null}
    </div>
  );
}

type PermissionState = "granted" | "denied" | "default" | "prompt" | "unsupported";

function PermissionBadge({ value }: { value: PermissionState }) {
  const MAP: Record<PermissionState, { label: string; cls: string }> = {
    granted: { label: "مسموح", cls: "ads-perm--ok" },
    denied: { label: "مرفوض", cls: "ads-perm--err" },
    default: { label: "غير محدد", cls: "ads-perm--warn" },
    prompt: { label: "غير محدد", cls: "ads-perm--warn" },
    unsupported: { label: "غير مدعوم", cls: "ads-perm--muted" },
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

function AudioPermBadge() {
  const [state, setState] = useState<PermissionState>("default");
  useEffect(() => {
    // المتصفح لا يوفّر إذن صوت صريحًا — نعتبره جاهزًا بعد تفاعل المستخدم،
    // وننبّه عند autoplay المحظور عبر رسائل التشغيل.
    setState("granted");
  }, []);
  return <PermissionBadge value={state} />;
}

function FeaturedAdhanStyles({
  selectedId,
  volume,
  playbackMode,
  onSelect,
  onFlash,
}: {
  selectedId: string;
  volume: number;
  playbackMode: AdhanPlaybackMode;
  onSelect: (id: string) => void;
  onFlash: () => void;
}) {
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"ready" | "loading" | "playing" | "stopped" | "failed">("ready");

  const handlePreview = (id: FeaturedAdhanStyleId) => {
    if (previewing === id || loadingId === id) {
      stopAdhanPreview();
      setPreviewing(null);
      setLoadingId(null);
      setStatus("stopped");
      setError(null);
      return;
    }
    setError(null);
    setLoadingId(id);
    setStatus("loading");
    setPreviewing(null);
    void playAdhanPreview(id, playbackMode === "silent" ? "full" : playbackMode, volume).then((result) => {
      setLoadingId(null);
      if (!result.ok) {
        setPreviewing(null);
        setStatus("failed");
        setError(result.message || "تعذّر تشغيل الصوت. جرّب نوعًا آخر أو أعد التحميل.");
        return;
      }
      setPreviewing(id);
      setStatus("playing");
      result.audio.addEventListener(
        "ended",
        () => {
          setPreviewing((p) => (p === id ? null : p));
          setStatus("ready");
        },
        { once: true },
      );
    });
  };

  return (
    <section className="ads-card" aria-labelledby="ads-styles-head">
      <div className="ads-card__head" id="ads-styles-head">
        <Music size={15} strokeWidth={2} aria-hidden="true" />
        <span>أنواع الأذان</span>
      </div>
      <div className="ads-card__body">
        <p className="ads-adhan-desc">
          اختر نوع الأذان ثم جرّب الصوت فورًا. الحالة:{" "}
          {status === "ready"
            ? "جاهز"
            : status === "loading"
              ? "جار التحميل"
              : status === "playing"
                ? "جار التشغيل"
                : status === "stopped"
                  ? "متوقف"
                  : "فشل"}
          . الأذان الكامل مضمون داخل التطبيق؛ إشعارات النظام تخضع لقيود iOS.
        </p>
        <div className="ads-style-grid" role="list">
          {FEATURED_ADHAN_STYLE_IDS.map((id) => {
            const selected = selectedId === id;
            const playing = previewing === id;
            const loading = loadingId === id;
            return (
              <div
                key={id}
                role="listitem"
                className={`ads-style-card${selected ? " is-selected" : ""}`}
              >
                <button
                  type="button"
                  className="ads-style-card__select"
                  aria-pressed={selected}
                  onClick={() => {
                    onSelect(id);
                    onFlash();
                  }}
                >
                  <span className="ads-style-card__name">{FEATURED_ADHAN_STYLE_LABELS[id]}</span>
                  {selected ? <span className="ads-style-card__badge">مختار</span> : null}
                </button>
                <button
                  type="button"
                  className={`ads-style-card__preview${playing ? " is-playing" : ""}${loading ? " is-loading" : ""}`}
                  aria-label={
                    playing
                      ? `إيقاف تجربة ${FEATURED_ADHAN_STYLE_LABELS[id]}`
                      : `تجربة الصوت — ${FEATURED_ADHAN_STYLE_LABELS[id]}`
                  }
                  disabled={loading && !playing}
                  onClick={() => handlePreview(id)}
                >
                  {loading ? "جاري التحميل..." : playing ? "إيقاف" : "تجربة الصوت"}
                </button>
              </div>
            );
          })}
        </div>
        {error ? (
          <p className="ads-adhan-desc ads-audio-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function commonAdvance(prefs: AdhanPreferences): AdvanceMinutes | null {
  const vals = PRAYER_KEYS.map((k) => prefs.prayers[k].advanceMinutes);
  const first = vals[0] ?? 0;
  return vals.every((v) => v === first) ? first : null;
}

function PrayerCustomizeSheet({
  prayerKey,
  prefs,
  onClose,
  onFlash,
  onOpenMuezzin,
  onPrefs,
}: {
  prayerKey: PrayerKey;
  prefs: AdhanPreferences;
  onClose: () => void;
  onFlash: () => void;
  onOpenMuezzin: () => void;
  onPrefs: (p: AdhanPreferences) => void;
}) {
  const p = prefs.prayers[prayerKey];
  const muezzin = getMuezzin(getEffectiveMuezzinId(prefs, prayerKey));
  const hasOverride = !!p.muezzinId;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="ads-sheet-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ads-sheet" role="dialog" aria-modal="true" aria-label={`تخصيص ${PRAYER_ARABIC[prayerKey]}`}>
        <div className="ads-sheet__handle-row"><div className="ads-sheet__handle" /></div>
        <div className="ads-sheet__head">
          <h3 className="ads-sheet__title">تخصيص أذان {PRAYER_ARABIC[prayerKey]}</h3>
        </div>
        <div className="ads-sheet__body">
          <div className="ads-row">
            <div>
              <div className="ads-global-label">المؤذن</div>
              <div className="ads-global-desc">
                {muezzin.name}
                {hasOverride ? " · مخصّص" : " · من الإعداد العام"}
              </div>
            </div>
            <div className="ads-prayer-muezzin-btns">
              <button type="button" className="ads-pill-btn" onClick={onOpenMuezzin}>تغيير</button>
              {hasOverride ? (
                <button
                  type="button"
                  className="ads-pill-btn-ghost"
                  onClick={() => {
                    onPrefs(patchPrayerPrefs(prayerKey, { muezzinId: "" }));
                    onFlash();
                  }}
                >
                  إعادة للعام
                </button>
              ) : null}
            </div>
          </div>

          <div className="ads-field-gap">
            <div className="ads-global-label">تنبيه مسبق</div>
            <AdvanceChips
              value={p.advanceMinutes}
              ariaLabel={`تنبيه مسبق لـ ${PRAYER_ARABIC[prayerKey]}`}
              onChange={(minutes) => {
                onPrefs(patchPrayerPrefs(prayerKey, { advanceMinutes: minutes }));
                onFlash();
              }}
            />
          </div>

          <div className="ads-field-gap">
              <div className="ads-global-label">صيغة هذه الصلاة</div>
              <div className="ads-chip-scroll" role="group" aria-label="صيغة التشغيل لهذه الصلاة">
                {(
                  [
                    { mode: "" as const, label: "عام" },
                    { mode: "full" as const, label: "أذان كامل" },
                    { mode: "takbir" as const, label: "تكبيرتان فقط" },
                    { mode: "silent" as const, label: "تنبيه صامت" },
                    { mode: "off" as const, label: "إيقاف التنبيه" },
                  ]
                ).map(({ mode, label }) => {
                  const isOff = !p.enabled;
                  const active =
                    mode === "off"
                      ? isOff
                      : !isOff && (p.deliveryMode || "") === mode;
                  return (
                    <button
                      key={mode || "default"}
                      type="button"
                      className={`ads-chip${active ? " is-active" : ""}`}
                      onClick={() => {
                        if (mode === "off") {
                          onPrefs(patchPrayerPrefs(prayerKey, { enabled: false }));
                        } else {
                          onPrefs(
                            patchPrayerPrefs(prayerKey, {
                              enabled: true,
                              deliveryMode: mode as AdhanDeliveryMode | "",
                            }),
                          );
                        }
                        onFlash();
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {isNative && isIOS && (p.deliveryMode === "full" || (!p.deliveryMode && prefs.playbackMode === "full")) && p.enabled ? (
                <p className="ads-adhan-desc" style={{ marginTop: "0.5rem" }}>
                  الكامل على iOS = عدة إشعارات متتابعة.
                </p>
              ) : null}
            </div>
        </div>
        <div className="ads-sheet__foot">
          <button type="button" className="ads-sheet__close" onClick={onClose}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}

export default function AdhanSettingsPage() {
  const [prefs, setPrefs] = useState<AdhanPreferences>(() => loadAdhanPrefs());
  const [pickerFor, setPickerFor] = useState<PrayerKey | "default" | null>(null);
  const [customizeFor, setCustomizeFor] = useState<PrayerKey | null>(null);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedGovId, setSelectedGovId] = useState(
    () => getSelectedGovernorate().id,
  );

  const { data: prayerData } = usePrayerCountdown(selectedGovId);
  const [diagnostics, setDiagnostics] = useState<NotificationDiagnostics | null>(null);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [soundTestBusy, setSoundTestBusy] = useState(false);
  const [soundTestMsg, setSoundTestMsg] = useState<string | null>(null);
  const [rescheduleBusy, setRescheduleBusy] = useState(false);
  const [adhkarReminder, setAdhkarReminder] = useState(
    () => loadNotifPrefs().adhkarReminder,
  );
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugLines, setDebugLines] = useState<string[]>([]);
  const [diagExtra, setDiagExtra] = useState<{
    scheduledCount: number | null;
    fullMp3: boolean | null;
    bundleSound: string;
    audioDiag: ReturnType<typeof getAudioDiagnostics> | null;
  }>({ scheduledCount: null, fullMp3: null, bundleSound: "adhan-short-makkah.caf", audioDiag: null });

  const refreshDebug = async () => {
    const snap = getAdhanAudioDebugSnapshot();
    const muezzinId = prefs.defaultMuezzinId;
    const muezzin = getMuezzin(muezzinId);
    const paths = listBundledAdhanSoundPaths().slice(0, 6);
    const exists: string[] = [];
    for (const p of paths) {
      const ok = await probeAdhanAssetExists(p);
      exists.push(`${ok ? "✓" : "✗"} ${p}`);
    }
    let scheduled = "—";
    try {
      if (isNative) {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        const pending = await LocalNotifications.getPending();
        scheduled = `${pending.notifications?.length ?? 0} مجدولة`;
        console.info("[adhan-debug] pending", pending.notifications?.slice(0, 8));
      }
    } catch (e) {
      console.warn("[adhan-debug] pending notifications", e);
      scheduled = "تعذّر قراءة الجدولة";
    }
    const audioDiag = getAudioDiagnostics();
    setDebugLines([
      `المنصة: ${audioDiag.platform}`,
      `مؤذن: ${muezzin.name} (${muezzinId})`,
      `تشغيل: ${snap.playing ? "نعم" : "لا"}`,
      `صيغة آخر تشغيل: ${audioDiag.lastPlaybackMode ?? "—"}`,
      `جلسة أصلية: ${snap.nativeSession ? "نعم" : "لا"} (${audioDiag.nativeSessionMode})`,
      `Critical Alerts: ${CRITICAL_ALERTS_ENTITLEMENT_PRESENT ? "متوفر" : "غير متوفر"}`,
      `آخر مسار: ${snap.lastUrl ?? "—"}`,
      `آخر خطأ: ${snap.lastError ?? "—"}`,
      `آخر نجاح: ${audioDiag.lastSuccessAt ?? "—"}`,
      `آخر فشل: ${audioDiag.lastFailureAt ?? "—"}`,
      `وضع صامت: ${audioDiag.silentModeNote}`,
      `جدولة: ${scheduled}`,
      ...exists,
      ...audioDiag.attemptLog.slice(0, 6).map((l) => `محاولة: ${l}`),
    ]);
  };

  useEffect(() => {
    void preloadAdhanSounds();
  }, []);

  useEffect(() => {
    if (!diagnosticsOpen) return;
    let cancelled = false;
    computeNotificationDiagnostics(prayerData ?? null).then((d) => { if (!cancelled) setDiagnostics(d); });
    void (async () => {
      const assets = await validateAudioAssets();
      const audioDiag = getAudioDiagnostics();
      let scheduledCount: number | null = null;
      try {
        if (isNative) {
          const { listScheduledPrayerNotifications } = await import("@/lib/prayer-notification-service");
          const pending = await listScheduledPrayerNotifications();
          scheduledCount = pending.length;
        }
      } catch (e) {
        console.warn("[adhan-settings] list scheduled failed", e);
        scheduledCount = null;
      }
      if (!cancelled) {
        const style = (prefs.defaultMuezzinId || "makkah") as string;
        const short =
          style === "madinah" || style === "egypt" || style === "aqsa" || style === "takbeerat"
            ? style
            : "makkah";
        const fullOk = assets.some((a) => a.playable && a.filePath.includes(style === "alharam" ? "haram" : style));
        setDiagExtra({
          scheduledCount,
          fullMp3: fullOk || assets.some((a) => a.playable),
          bundleSound: `adhan-short-${short}.caf`,
          audioDiag,
        });
      }
    })();
    return () => { cancelled = true; };
  }, [diagnosticsOpen, prayerData, prefs]);

  useEffect(() => {
    invalidatePrayerNativeSchedule();
  }, [
    prefs.defaultMuezzinId,
    prefs.playbackMode,
    prefs.iosSequentialFullAdhan,
    prefs.globalEnabled,
    prefs.iqamahEnabled,
    prefs.iqamahDelayMinutes,
    prefs.volume,
    selectedGovId,
    prefs.prayers,
  ]);

  const sunriseTime =
    prayerData?.prayers.find((p: { key: string }) => p.key === "Sunrise")
      ?.time ?? null;

  useEffect(() => {
    void ensureOfflineAdhanPack({ muezzinId: prefs.defaultMuezzinId }).catch(() => undefined);
  }, [prefs.defaultMuezzinId]);

  useEffect(() => {
    applyPageSeo({
      path: "/adhan-settings",
      title: "إعدادات الأذان | المجلس العلمي",

      description: "خصّص إعدادات الأذان، اختر المؤذن والمحافظة وأوقات التنبيه لكل صلاة.",
      keywords: ["إعدادات أذان", "تنبيه الصلاة", "أوقات الصلاة", "مؤذن", "الكويت"],
      robots: "noindex, follow",
    });
  }, []);

  useEffect(
    () => () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    },
    [],
  );

  function flashSaved() {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setSaved(true);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  }

  function toggleGlobal(enabled: boolean) {
    setPrefs(patchAdhanPrefs({ ...prefs, globalEnabled: enabled }));
    flashSaved();
  }

  function setDefaultMuezzin(id: string) {
    setPrefs(patchAdhanPrefs({ ...prefs, defaultMuezzinId: id }));
    flashSaved();
  }

  function setPrayerMuezzin(key: PrayerKey, id: string) {
    if (key === "fajr" && !hasFajrAdhan(getMuezzin(id))) return;
    setPrefs(patchPrayerPrefs(key, { muezzinId: id }));
    flashSaved();
  }

  function togglePrayer(key: PrayerKey, enabled: boolean) {
    setPrefs(patchPrayerPrefs(key, { enabled }));
    flashSaved();
  }

  function setGlobalAdvance(minutes: AdvanceMinutes) {
    let next = loadAdhanPrefs();
    for (const key of PRAYER_KEYS) {
      next = patchPrayerPrefs(key, { advanceMinutes: minutes });
    }
    setPrefs(next);
    flashSaved();
  }

  function handleGovChange(id: string) {
    setSelectedGovernorate(id);
    setSelectedGovId(id);
  }

  async function runRescheduleAlerts() {
    setRescheduleBusy(true);
    setTestMsg(null);
    try {
      invalidatePrayerNativeSchedule();
      const payload = await fetchPrayerTimes(selectedGovId);
      const { startPrayerAlertScheduler } = await import("@/lib/prayer-alert-scheduler");
      await startPrayerAlertScheduler(payload, { forceNativeReschedule: true });
      await import("@/lib/adhan-scheduler").then((m) => m.startAdhanScheduler(payload));
      setTestMsg(
        isNative
          ? "أُعيدت جدولة تنبيهات الأذان لليوم والغد."
          : "أُعيدت الجدولة — على الويب تعمل أثناء فتح الصفحة.",
      );
      flashSaved();
    } catch {
      setTestMsg("تعذّرت إعادة جدولة التنبيهات. حاول مرة أخرى.");
    } finally {
      setRescheduleBusy(false);
    }
  }

  function toggleAdhkarReminder(enabled: boolean) {
    const next = { ...loadNotifPrefs(), adhkarReminder: enabled };
    saveNotifPrefs(next);
    setAdhkarReminder(enabled);
    if (enabled) {
      void import("@/lib/smart-local-notifications").then((m) => {
        void m.syncSmartLocalNotifications().catch(() => undefined);
      }).catch(() => undefined);
    }
    flashSaved();
  }

  const defaultMuezzin = getMuezzin(prefs.defaultMuezzinId);
  const sharedAdvance = useMemo(() => commonAdvance(prefs), [prefs]);

  return (
    <div className="ads-page">
      <h1 className="ads-title">إعدادات الأذان</h1>
      <p className="ads-subtitle">إعداد عام سريع، وتخصيص دقيق لكل صلاة عند الحاجة.</p>

      {saved ? (
        <div className="ads-toast" role="status" aria-live="polite">
          <span aria-hidden="true">✓</span> تم الحفظ
        </div>
      ) : null}

      {/* الموقع والحساب */}
      <section className="ads-card" aria-labelledby="ads-loc-head">
        <div className="ads-card__head" id="ads-loc-head">
          <MapPin size={15} strokeWidth={2} aria-hidden="true" />
          <span>الموقع والحساب</span>
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
          <div className="ads-row">
            <div className="ads-sunrise-inner">
              <Sunrise size={16} strokeWidth={2} color="var(--mj-brand-deep)" aria-hidden="true" />
              الشروق
              <span className="ads-sunrise-tag">وقت الكراهة</span>
            </div>
            <span className="ads-sunrise-time">{sunriseTime ?? "—"}</span>
          </div>
        </div>
      </section>

      <FeaturedAdhanStyles
        selectedId={prefs.defaultMuezzinId}
        volume={prefs.volume ?? 1}
        playbackMode={prefs.playbackMode || "full"}
        onSelect={setDefaultMuezzin}
        onFlash={flashSaved}
      />

      {/* الأذان العام */}
      <section className="ads-card" aria-labelledby="ads-general-head">
        <div className="ads-card__head" id="ads-general-head">
          <Music size={15} strokeWidth={2} aria-hidden="true" />
          <span>الأذان العام</span>
        </div>
        <div className="ads-card__body">
          <p className="ads-adhan-desc">
            يُطبَّق على كل الصلوات ما لم تخصّص صلاةً من القائمة أدناه.
          </p>

          <div className="ads-row">
            <div>
              <div className="ads-muezzin-name">
                {defaultMuezzin.name}
                <span className="ads-prayer-muezzin-override"> (افتراضي)</span>
              </div>
              <div className="ads-muezzin-origin">
                {[defaultMuezzin.origin, defaultMuezzin.style].filter(Boolean).join(" · ")}
                {" · "}
                صيغة التشغيل: {ADHAN_PLAYBACK_MODE_LABELS[prefs.playbackMode]}
              </div>
            </div>
            <button type="button" onClick={() => setPickerFor("default")} className="ads-pill-btn">
              تغيير
            </button>
          </div>

          <div className="ads-field-gap">
            <div className="ads-global-label">صيغة التشغيل</div>
            <div className="ads-playback-modes" role="radiogroup" aria-label="صيغة تشغيل الأذان">
              {ADHAN_PLAYBACK_MODES.map((mode) => (
                <label key={mode} className="ads-playback-mode">
                  <input
                    type="radio"
                    name="adhan-playback-mode"
                    value={mode}
                    checked={prefs.playbackMode === mode}
                    onChange={() => {
                      setPrefs(patchAdhanPrefs({ playbackMode: mode as AdhanPlaybackMode }));
                      flashSaved();
                    }}
                  />
                  <span>{ADHAN_PLAYBACK_MODE_LABELS[mode]}</span>
                </label>
              ))}
            </div>
            <p className="ads-global-desc" style={{ marginTop: "0.45rem" }}>
              الافتراضي «قصير» (إشعار واحد بصوت CAF من الحزمة). الأذان الكامل يُسمع داخل التطبيق.
              {" "}«صامت مع إشعار» يُبقي التنبيه بلا صوت.
            </p>
          </div>

          {isNative && isIOS ? (
            <div className="ads-field-gap">
              <div className="ads-row">
                <div>
                  <div className="ads-global-label">أذان متتابع تجريبي</div>
                  <div className="ads-global-desc">
                    قد لا يكون التشغيل متصلًا ١٠٠٪ على iOS بسبب قيود النظام والصامت والتركيز.
                    المقاطع: عند الوقت ثم بعد ٢٩ث / ٥٨ث / ٨٧ث.
                  </div>
                </div>
                <Toggle
                  checked={prefs.iosSequentialFullAdhan}
                  onChange={(v) => {
                    setPrefs(patchAdhanPrefs({ iosSequentialFullAdhan: v }));
                    flashSaved();
                    void invalidatePrayerNativeSchedule();
                  }}
                  id="ios-seq-toggle"
                  label="أذان متتابع تجريبي"
                />
              </div>
            </div>
          ) : null}

          <div className="ads-field-gap">
            <div className="ads-global-label">تنبيه مسبق</div>
            <div className="ads-global-desc">يُطبَّق على الصلوات الخمس — يمكن تخصيصه لكل صلاة من الشيت.</div>
            <AdvanceChips
              value={sharedAdvance}
              ariaLabel="تنبيه مسبق عام"
              onChange={setGlobalAdvance}
            />
          </div>

          <div className="ads-field-gap">
            <div className="ads-row">
              <div>
                <div className="ads-global-label">تفعيل إشعارات الأذان</div>
                <div className="ads-global-desc">تشغيل الأذان والتنبيه عند دخول الوقت</div>
              </div>
              <Toggle
                checked={prefs.globalEnabled}
                onChange={toggleGlobal}
                id="global-toggle"
                label="تفعيل إشعارات الأذان"
              />
            </div>
            {!prefs.globalEnabled ? (
              <div className="ads-global-disabled" style={{ marginTop: "0.65rem", marginBottom: 0 }}>
                الإشعارات معطلة، لن يُشغَّل أذان ولن تصل تنبيهات.
              </div>
            ) : null}
          </div>

          <div className="ads-field-gap">
            <div className="ads-row">
              <div>
                <div className="ads-global-label">الإقامة (اختياري)</div>
                <div className="ads-global-desc">مقطع ثالث إن توفّر للتسجيل المختار</div>
              </div>
              <Toggle
                checked={prefs.iqamahEnabled}
                onChange={(v) => {
                  setPrefs(patchAdhanPrefs({ iqamahEnabled: v }));
                  flashSaved();
                }}
                id="iqamah-toggle"
                label="تفعيل الإقامة"
              />
            </div>
          </div>

          {prefs.iqamahEnabled ? (
            <div className="ads-row" style={{ marginTop: "0.55rem" }}>
              <div>
                <div className="ads-global-label">تأخير تنبيه الإقامة</div>
                <div className="ads-global-desc">بالدقائق بعد الأذان (٠ = مع الأذان)</div>
              </div>
              <select
                className="ads-select"
                value={prefs.iqamahDelayMinutes}
                aria-label="تأخير تنبيه الإقامة"
                onChange={(e) => {
                  const v = Number(e.target.value) as 0 | 5 | 10 | 15;
                  setPrefs(patchAdhanPrefs({ iqamahDelayMinutes: v }));
                  flashSaved();
                }}
              >
                {[0, 5, 10, 15].map((m) => (
                  <option key={m} value={m}>{m === 0 ? "مع الأذان" : `${m} د`}</option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="ads-field-gap">
            <div className="ads-row">
              <div>
                <div className="ads-global-label">تذكير أذكار الصباح والمساء</div>
                <div className="ads-global-desc">اختياري — يُجدول مع الإشعارات الذكية</div>
              </div>
              <Toggle
                checked={adhkarReminder}
                onChange={toggleAdhkarReminder}
                id="adhkar-reminder-toggle"
                label="تذكير أذكار الصباح والمساء"
              />
            </div>
          </div>

          <div className="ads-field-gap">
            <div className="ads-row">
              <div>
                <div className="ads-global-label">مستوى الصوت</div>
                <div className="ads-global-desc">مستقل عن صوت النظام قدر الإمكان</div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((prefs.volume ?? 1) * 100)}
                aria-label="مستوى صوت الأذان"
                onChange={(e) => {
                  setPrefs(patchAdhanPrefs({ volume: Number(e.target.value) / 100 }));
                  flashSaved();
                }}
              />
            </div>
          </div>

          <div className="ads-row" style={{ marginTop: "0.55rem" }}>
            <div>
              <div className="ads-global-label">اهتزاز مع الأذان</div>
              <div className="ads-global-desc">نبضة قصيرة عند دخول الوقت</div>
            </div>
            <Toggle
              checked={prefs.vibrateEnabled}
              onChange={(v) => {
                setPrefs(patchAdhanPrefs({ vibrateEnabled: v }));
                flashSaved();
              }}
              id="vibrate-toggle"
              label="اهتزاز مع الأذان"
            />
          </div>

          <div className="ads-field-gap" style={{ marginTop: "0.55rem" }}>
            <div className="ads-global-label">الوضع الصامت وFocus</div>
            <p className="ads-adhan-desc" style={{ margin: "0.35rem 0 0" }}>
              {CRITICAL_ALERTS_ENTITLEMENT_PRESENT
                ? "يمكن طلب Critical Alerts لتجاوز بعض قيود الصامت/Focus عند توفر الامتياز من Apple."
                : "قد يُكتم الصوت في الوضع الصامت أو Focus على iOS، ولا يمكن تجاوزه إلا بصلاحية Critical Alerts من Apple. يتطلب موافقة Critical Alerts من Apple — غير متوفر لهذا التطبيق. الأذان الكامل يعمل داخل التطبيق عند فتحه."}
            </p>
            {!CRITICAL_ALERTS_ENTITLEMENT_PRESENT ? (
              <button
                type="button"
                className="ads-pill-btn-ghost"
                disabled
                aria-disabled="true"
                title="يتطلب موافقة Apple لصلاحية Critical Alerts"
                style={{ marginTop: "0.45rem", opacity: 0.55 }}
              >
                تجاوز الصامت/Focus (معطّل)
              </button>
            ) : null}
          </div>

          <div className="ads-field-gap">
            <div className="ads-row">
              <div>
                <div className="ads-global-label">تطبيق المؤذن على كل الصلوات</div>
                <div className="ads-global-desc">يمسح التخصيص لكل صلاة ويعتمد الافتراضي</div>
              </div>
              <button
                type="button"
                className="ads-pill-btn"
                onClick={() => {
                  setPrefs(applyDefaultMuezzinToAllPrayers(prefs.defaultMuezzinId));
                  flashSaved();
                }}
              >
                تطبيق
              </button>
            </div>
          </div>

          <div className="ads-field-gap">
            <AdhanDownloadRow onFlash={flashSaved} />
          </div>
        </div>
      </section>

      {/* الصلوات الخمس — مضغوطة */}
      <section className="ads-card" aria-labelledby="ads-prayers-head">
        <div className="ads-card__head" id="ads-prayers-head">
          <Bell size={15} strokeWidth={2} aria-hidden="true" />
          <span>تخصيص كل صلاة</span>
        </div>
        <div className="ads-card__body">
          <p className="ads-adhan-desc">اضغط الصف لتخصيص المؤذن أو التنبيه. المفتاح يفعّل/يعطّل الأذان.</p>
          <div className="ads-prayer-list">
            {PRAYER_KEYS.map((key) => {
              const p = prefs.prayers[key];
              const muezzin = getMuezzin(getEffectiveMuezzinId(prefs, key));
              const Icon = PRAYER_ICON_MAP[PRAYER_ICON[key]] ?? Moon;
              return (
                <div
                  key={key}
                  className={`ads-prayer-row${p.enabled ? "" : " is-disabled"}`}
                >
                  <button
                    type="button"
                    className="ads-prayer-row__main"
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", color: "inherit", textAlign: "start", flex: 1, minWidth: 0 }}
                    onClick={() => setCustomizeFor(key)}
                    aria-label={`تخصيص أذان ${PRAYER_ARABIC[key]}`}
                  >
                    <Icon size={16} className="ads-prayer-icon" aria-hidden="true" />
                    <span className="ads-prayer-row__text">
                      <span className="ads-prayer-row__name">{PRAYER_ARABIC[key]}</span>
                      <span className="ads-prayer-row__meta">
                        {muezzin.name}
                        {p.advanceMinutes > 0 ? ` · قبل ${p.advanceMinutes} د` : ""}
                      </span>
                    </span>
                    <ChevronLeft size={16} className="ads-prayer-row__chev" aria-hidden="true" />
                  </button>
                  <div className="ads-prayer-row__actions">
                    <Toggle
                      checked={p.enabled}
                      onChange={(v) => togglePrayer(key, v)}
                      label={`تفعيل أذان ${PRAYER_ARABIC[key]}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="ads-card" aria-labelledby="ads-sound-test-head">
        <div className="ads-card__head" id="ads-sound-test-head">
          <Music size={15} strokeWidth={2} aria-hidden="true" />
          <span>اختبار الصوت والتشخيص</span>
        </div>
        <div className="ads-card__body">
          <p className="ads-adhan-desc">
            يشغّل الأذان الكامل داخل التطبيق عبر جلسة AVAudioSession (playback).
            قد يُكتم الصوت في الوضع الصامت أو Focus على iOS، ولا يمكن تجاوزه إلا بصلاحية Critical Alerts من Apple.
          </p>
          <div className="ads-row-sep">
            <div>
              <div className="ads-global-label">اختبار الصوت</div>
              <div className="ads-global-desc">
                تشغيل فوري للمؤذن الافتراضي (~٢٠ث) مع عرض الخطأ إن فشل
              </div>
            </div>
            <div className="ads-prayer-muezzin-btns">
              <button
                type="button"
                className="ads-pill-btn"
                disabled={soundTestBusy}
                onClick={() => {
                  setSoundTestBusy(true);
                  setSoundTestMsg(null);
                  const mode = prefs.playbackMode || "full";
                  if (mode === "silent") {
                    setSoundTestBusy(false);
                    setSoundTestMsg("صيغة صامتة — لا صوت داخل التطبيق. استخدم تجربة صوت بنمط كامل/قصير.");
                    return;
                  }
                  void playAdhanPreview(prefs.defaultMuezzinId, mode, prefs.volume ?? 0.9).then((r) => {
                    setSoundTestBusy(false);
                    const now = new Date().toISOString();
                    if (r.ok) {
                      setSoundTestMsg("يعمل الصوت ✓");
                      setPrefs(
                        patchAdhanPrefs({
                          lastTestedMuezzinId: prefs.defaultMuezzinId,
                          lastTestSuccessAt: now,
                          lastTestFailureAt: null,
                          lastTestFailureReason: null,
                        }),
                      );
                    } else {
                      setSoundTestMsg(`فشل: ${r.message}`);
                      setPrefs(
                        patchAdhanPrefs({
                          lastTestedMuezzinId: prefs.defaultMuezzinId,
                          lastTestFailureAt: now,
                          lastTestFailureReason: r.message,
                        }),
                      );
                    }
                  });
                }}
              >
                {soundTestBusy ? "جاري التحميل..." : "اختبار الصوت"}
              </button>
              <button
                type="button"
                className="ads-pill-btn-ghost"
                onClick={() => {
                  stopAdhanPreview();
                  setSoundTestMsg("توقّف الصوت");
                }}
              >
                إيقاف
              </button>
            </div>
          </div>
          {soundTestMsg ? (
            <p className="ads-adhan-desc" role="status">
              {soundTestMsg}
            </p>
          ) : null}
          <div className="ads-row-sep">
            <div>
              <div className="ads-global-label">لوحة تشخيص الأذان</div>
              <div className="ads-global-desc">الإذن، الجدولة، المؤذن، ووجود الملفات</div>
            </div>
            <button
              type="button"
              className="ads-pill-btn"
              onClick={() => {
                const next = !debugOpen;
                setDebugOpen(next);
                if (next) void refreshDebug();
              }}
            >
              {debugOpen ? "إخفاء" : "عرض"}
            </button>
          </div>
          {debugOpen ? (
            <div>
              <ul className="ads-adhan-desc" style={{ margin: 0, paddingInlineStart: "1.1rem" }}>
                {debugLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="ads-prayer-muezzin-btns" style={{ marginTop: "0.55rem" }}>
                <button
                  type="button"
                  className="ads-pill-btn"
                  onClick={() => {
                    const report = [
                      ...debugLines,
                      `prefs.lastTest=${prefs.lastTestedMuezzinId ?? "—"}`,
                      `prefs.lastOk=${prefs.lastTestSuccessAt ?? "—"}`,
                      `prefs.lastFail=${prefs.lastTestFailureAt ?? "—"} ${prefs.lastTestFailureReason ?? ""}`,
                    ].join("\n");
                    void navigator.clipboard?.writeText(report).then(
                      () => setSoundTestMsg("تم نسخ تقرير التشخيص"),
                      (err) => {
                        console.warn("[adhan-debug] clipboard failed", err);
                        setSoundTestMsg("تعذّر نسخ التقرير");
                      },
                    );
                  }}
                >
                  نسخ تقرير التشخيص
                </button>
                <button
                  type="button"
                  className="ads-pill-btn-ghost"
                  onClick={() => {
                    stopAdhanPreview();
                    const next = patchAdhanPrefs({
                      defaultMuezzinId: "makkah",
                      playbackMode: "short",
                      volume: 1,
                      iosSequentialFullAdhan: false,
                      lastTestedMuezzinId: null,
                      lastTestSuccessAt: null,
                      lastTestFailureAt: null,
                      lastTestFailureReason: null,
                    });
                    setPrefs(next);
                    setSoundTestMsg("أُعيد ضبط إعدادات الأذان إلى الافتراضي");
                    flashSaved();
                    void refreshDebug();
                  }}
                >
                  إعادة ضبط إعدادات الأذان
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <PrayerAlertSettingsCard />

      <section className="ads-card" aria-labelledby="ads-test-head">
        <div className="ads-card__head" id="ads-test-head">
          <Bell size={15} strokeWidth={2} aria-hidden="true" />
          <span>اختبار وتشخيص</span>
        </div>
        <div className="ads-card__body">
          <p className="ads-adhan-desc">
            <strong>الصوت الكامل داخل التطبيق:</strong> يعمل من ملف MP3 عند فتح التطبيق.
            {" "}
            <strong>صوت الإشعار عند إغلاق التطبيق:</strong> ملفات CAF قصيرة (~٨ث) أو الأذان المتتابع التجريبي.
          </p>
          <div className="ads-prayer-muezzin-btns" style={{ marginTop: "0.5rem" }}>
            <button
              type="button"
              className="ads-pill-btn"
              disabled={testBusy}
              onClick={() => {
                setTestBusy(true);
                setTestMsg(null);
                const style = (prefs.defaultMuezzinId || "makkah") as AdhanStyleId;
                void testFullAdhan(style).then((r) => {
                  setTestBusy(false);
                  setTestMsg(
                    r.ok
                      ? "يُشغَّل الأذان الآن داخل التطبيق."
                      : `تعذّر التشغيل: ${r.message}`,
                  );
                });
              }}
            >
              اختبار الأذان الآن
            </button>
            <button
              type="button"
              className="ads-pill-btn"
              disabled={testBusy}
              onClick={() => {
                setTestBusy(true);
                setTestMsg(null);
                const style = (prefs.defaultMuezzinId || "makkah") as AdhanStyleId;
                void testFullAdhan(style).then((r) => {
                  setTestBusy(false);
                  setTestMsg(
                    r.ok
                      ? "يُشغَّل الأذان الكامل الآن داخل التطبيق."
                      : `تعذّر التشغيل: ${r.message}`,
                  );
                });
              }}
            >
              اختبار الأذان الكامل
            </button>
            <button
              type="button"
              className="ads-pill-btn"
              disabled={rescheduleBusy}
              onClick={() => void runRescheduleAlerts()}
            >
              {rescheduleBusy ? "جارٍ…" : "إعادة جدولة التنبيهات"}
            </button>
            <button
              type="button"
              className="ads-pill-btn"
              disabled={testBusy}
              onClick={() => {
                setTestBusy(true);
                setTestMsg(null);
                void fireTestLocalNotification(TEST_NOTIFICATION_DELAY_MS).then((r) => {
                  setTestBusy(false);
                  if (r.ok) {
                    setTestMsg(
                      `سيصل إشعار قصير بصوت CAF خلال ${Math.round((r.delayMs ?? TEST_NOTIFICATION_DELAY_MS) / 1000)} ثانية. جرّب الخلفية والمغلق والصامت.`,
                    );
                    return;
                  }
                  setTestMsg(
                    r.reason === "permission"
                      ? "يلزم تفعيل إذن الإشعارات أولًا."
                      : "تعذّر جدولة إشعار الاختبار.",
                  );
                });
              }}
            >
              اختبار إشعار قصير بعد 15 ثانية
            </button>
            <button
              type="button"
              className="ads-pill-btn"
              disabled={testBusy || !(isNative && isIOS)}
              onClick={() => {
                setTestBusy(true);
                setTestMsg(null);
                void fireTestSequentialAdhan().then((r) => {
                  setTestBusy(false);
                  if (r.ok) {
                    setTestMsg(
                      "جُدولت ٤ مقاطع متتابعة (كل ٢٩ث). قد لا يكون التشغيل متصلًا ١٠٠٪ بسبب قيود iOS والصامت والتركيز.",
                    );
                    return;
                  }
                  setTestMsg(
                    r.reason === "permission"
                      ? "يلزم تفعيل إذن الإشعارات أولًا."
                      : r.reason === "unsupported"
                        ? "الاختبار المتتابع على جهاز iOS أصلي فقط."
                        : "تعذّر جدولة الأذان المتتابع.",
                  );
                });
              }}
            >
              اختبار الأذان المتتابع
            </button>
            <button
              type="button"
              className="ads-pill-btn"
              onClick={() => stopAdhan()}
            >
              إيقاف الصوت
            </button>
          </div>
          {testMsg ? <p className="ads-adhan-desc" style={{ marginTop: "0.5rem" }}>{testMsg}</p> : null}
        </div>
      </section>

      <section className="ads-card" aria-labelledby="ads-ios-limits-head">
        <div className="ads-card__head" id="ads-ios-limits-head">
          <Bell size={15} strokeWidth={2} aria-hidden="true" />
          <span>الأذان المتتابع التجريبي وقيود iOS</span>
        </div>
        <div className="ads-card__body">
          <ul className="ads-adhan-desc" style={{ margin: 0, paddingInlineStart: "1.1rem", display: "grid", gap: "0.35rem" }}>
            <li>لا يُشغَّل أذان كامل من إشعار محلي والتطبيق مغلق تمامًا دون التجزئة التجريبية.</li>
            <li>صوت الإشعار الافتراضي من ملفات الحزمة القصيرة (حوالي ٨ ثوانٍ).</li>
            <li>لا يمكن تجاوز زر الصامت أو Focus دون Critical Alerts من Apple.</li>
            <li>قد لا يكون التشغيل المتتابع متصلًا ١٠٠٪ على iOS بسبب قيود النظام والصامت والتركيز.</li>
          </ul>
        </div>
      </section>

      <section className="ads-card" aria-labelledby="ads-friday-head">
        <div className="ads-card__head" id="ads-friday-head">
          <Star size={15} strokeWidth={2} aria-hidden="true" />
          <span>تذكير يوم الجمعة</span>
        </div>
        <div className="ads-card__body">
          <div className="ads-row">
            <div>
              <div className="ads-global-label">عرض إعلان ليلة الجمعة ويومها</div>
              <div className="ads-global-desc">
                يظهر شعار الآية من مغرب الخميس حتى مغرب الجمعة
              </div>
            </div>
            <Toggle
              checked={prefs.fridayBannerEnabled}
              onChange={(v) => {
                setPrefs(patchAdhanPrefs({ ...prefs, fridayBannerEnabled: v }));
                if (v) undismissFridayBanner();
                flashSaved();
              }}
              id="friday-banner-toggle"
              label="عرض إعلان ليلة الجمعة ويومها"
            />
          </div>
        </div>
      </section>

      <section className="ads-card" aria-labelledby="ads-perm-head">
        <div className="ads-card__head" id="ads-perm-head">
          <Bell size={15} strokeWidth={2} aria-hidden="true" />
          <span>حالة الأذونات</span>
        </div>
        <div className="ads-card__body">
          <div className="ads-row-sep">
            <span className="ads-adhan-desc" style={{ margin: 0 }}>إذن الإشعارات</span>
            <NotificationPermBadge />
          </div>
          <div className="ads-row-sep">
            <span className="ads-adhan-desc" style={{ margin: 0 }}>إذن الموقع الجغرافي</span>
            <LocationPermBadge />
          </div>
          <div className="ads-row">
            <span className="ads-adhan-desc" style={{ margin: 0 }}>جاهزية الصوت</span>
            <AudioPermBadge />
          </div>
        </div>
      </section>

      <section className="ads-card">
        <button
          type="button"
          className="ads-row-sep ads-diagnostics-toggle"
          onClick={() => setDiagnosticsOpen((v) => !v)}
          aria-expanded={diagnosticsOpen}
        >
          <div className="ads-card__head" style={{ margin: 0, border: "none", paddingInline: 0 }}>
            <Bell size={15} strokeWidth={2} aria-hidden="true" />
            <span>لماذا لا تصلني تنبيهات؟</span>
          </div>
          <span aria-hidden="true">{diagnosticsOpen ? "▲" : "▼"}</span>
        </button>
        {diagnosticsOpen ? (
          <div className="ads-card__body">
            {!diagnostics ? (
              <p className="ads-adhan-desc">جارٍ الفحص…</p>
            ) : (
              <>
                <div className="ads-row-sep">
                  <span className="ads-adhan-desc" style={{ margin: 0 }}>الصلاة القادمة</span>
                  <span>{diagnostics.nextPrayer ? `${diagnostics.nextPrayer.name} — ${diagnostics.nextPrayer.time}` : "—"}</span>
                </div>
                <div className="ads-row-sep">
                  <span className="ads-adhan-desc" style={{ margin: 0 }}>تنبيه هذه الصلاة</span>
                  <span>{diagnostics.nextPrayerEnabled ? "مفعّل ✓" : "معطّل ✕"}</span>
                </div>
                <div className="ads-row-sep">
                  <span className="ads-adhan-desc" style={{ margin: 0 }}>نمط الأذان</span>
                  <span>{prefs.defaultMuezzinId}</span>
                </div>
                <div className="ads-row-sep">
                  <span className="ads-adhan-desc" style={{ margin: 0 }}>صوت الإشعار</span>
                  <span>{diagExtra.bundleSound}</span>
                </div>
                <div className="ads-row-sep">
                  <span className="ads-adhan-desc" style={{ margin: 0 }}>إشعارات مجدولة</span>
                  <span>{diagExtra.scheduledCount == null ? "—" : diagExtra.scheduledCount}</span>
                </div>
                <div className="ads-row-sep">
                  <span className="ads-adhan-desc" style={{ margin: 0 }}>ملف الصوت الكامل</span>
                  <span>{diagExtra.fullMp3 == null ? "—" : diagExtra.fullMp3 ? "موجود ✓" : "غير موجود ✕"}</span>
                </div>
                <div className="ads-row-sep">
                  <span className="ads-adhan-desc" style={{ margin: 0 }}>صوت CAF في الحزمة</span>
                  <span>متوقع في Bundle: {diagExtra.bundleSound}</span>
                </div>
                {diagExtra.audioDiag ? (
                  <>
                    <div className="ads-row-sep">
                      <span className="ads-adhan-desc" style={{ margin: 0 }}>منصة التشغيل</span>
                      <span>{diagExtra.audioDiag.platform}</span>
                    </div>
                    <div className="ads-row-sep">
                      <span className="ads-adhan-desc" style={{ margin: 0 }}>جلسة الصوت</span>
                      <span>{diagExtra.audioDiag.nativeSessionMode}</span>
                    </div>
                    <div className="ads-row-sep">
                      <span className="ads-adhan-desc" style={{ margin: 0 }}>آخر خطأ صوت</span>
                      <span>{diagExtra.audioDiag.lastError ?? "—"}</span>
                    </div>
                    <p className="ads-adhan-desc ads-diag-mono" role="note">
                      {diagExtra.audioDiag.silentModeNote}
                    </p>
                  </>
                ) : null}
                {diagnostics.blockingReasons.length === 0 ? (
                  <p className="ads-adhan-desc" style={{ marginTop: ".5rem" }}>
                    لا يوجد سبب ظاهر يمنع وصول التنبيهات — كل الإعدادات سليمة.
                  </p>
                ) : (
                  <div style={{ marginTop: ".5rem" }}>
                    <p className="ads-adhan-desc"><strong>أسباب محتملة لعدم وصول التنبيه:</strong></p>
                    <ul style={{ margin: ".35rem 0 0", paddingInlineStart: "1.2rem", display: "flex", flexDirection: "column", gap: ".3rem" }}>
                      {diagnostics.blockingReasons.map((r) => (
                        <li key={r} className="ads-adhan-desc">{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}
      </section>

      {customizeFor ? (
        <PrayerCustomizeSheet
          prayerKey={customizeFor}
          prefs={prefs}
          onPrefs={setPrefs}
          onFlash={flashSaved}
          onClose={() => setCustomizeFor(null)}
          onOpenMuezzin={() => {
            setPickerFor(customizeFor);
          }}
        />
      ) : null}

      {pickerFor ? (
        <MuezzinPicker
          selected={
            pickerFor === "default"
              ? prefs.defaultMuezzinId
              : getEffectiveMuezzinId(prefs, pickerFor)
          }
          requireFajr={pickerFor === "fajr"}
          onSelect={(id) => {
            stopAdhan();
            if (pickerFor === "default") setDefaultMuezzin(id);
            else setPrayerMuezzin(pickerFor, id);
          }}
          onClose={() => setPickerFor(null)}
        />
      ) : null}
    </div>
  );
}
