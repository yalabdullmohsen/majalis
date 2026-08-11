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
import {
  KUWAIT_GOVERNORATES,
  getSelectedGovernorate,
  setSelectedGovernorate,
} from "@/lib/prayer-times";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { applyPageSeo } from "@/lib/seo";
import { undismissFridayBanner } from "@/lib/friday-prayer";
import { computeNotificationDiagnostics, type NotificationDiagnostics } from "@/lib/notification-diagnostics";
import { isIOS, isNative } from "@/lib/capacitor-utils";
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
    granted: { label: "مفعّل ✓", cls: "ads-perm--ok" },
    denied: { label: "محجوب ✕", cls: "ads-perm--err" },
    default: { label: "لم يُطلب بعد", cls: "ads-perm--warn" },
    prompt: { label: "لم يُطلب بعد", cls: "ads-perm--warn" },
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
                    { mode: "takbir" as const, label: "تكبيرات فقط" },
                    { mode: "silent" as const, label: "إشعار صامت" },
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

  useEffect(() => {
    if (!diagnosticsOpen) return;
    let cancelled = false;
    computeNotificationDiagnostics(prayerData ?? null).then((d) => { if (!cancelled) setDiagnostics(d); });
    return () => { cancelled = true; };
  }, [diagnosticsOpen, prayerData, prefs]);

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

      {/* الموقع */}
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

      {/* الإعداد العام */}
      <section className="ads-card" aria-labelledby="ads-general-head">
        <div className="ads-card__head" id="ads-general-head">
          <Music size={15} strokeWidth={2} aria-hidden="true" />
          <span>الإعداد العام</span>
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
              الافتراضي «قصير» (تنبيه واحد). لا يُفعَّل الوضع الكامل تلقائيًا.
              {isNative && isIOS && prefs.playbackMode === "full" ? (
                <> على iOS يعني الوضع الكامل عدة إشعارات متتابعة (حتى ٤ مقاطع).</>
              ) : null}
              {" "}«صامت مع إشعار» يُبقي التنبيه بلا صوت.
            </p>
          </div>

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

          <div className="ads-row" style={{ marginTop: "0.55rem" }}>
            <div>
              <div className="ads-global-label">تجاوز الوضع الصامت</div>
              <div className="ads-global-desc">خيار صريح — قد لا يعمل على كل الأجهزة</div>
            </div>
            <Toggle
              checked={prefs.bypassSilentMode}
              onChange={(v) => {
                setPrefs(patchAdhanPrefs({ bypassSilentMode: v }));
                flashSaved();
              }}
              id="bypass-silent-toggle"
              label="تجاوز الوضع الصامت"
            />
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
          <span>الصلوات</span>
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

      <PrayerAlertSettingsCard />

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
          <div className="ads-row">
            <span className="ads-adhan-desc" style={{ margin: 0 }}>إذن الموقع الجغرافي</span>
            <LocationPermBadge />
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
