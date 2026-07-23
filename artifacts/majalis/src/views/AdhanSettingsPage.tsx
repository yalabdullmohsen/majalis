import { useCallback, useEffect, useRef, useState } from "react";
import { CloudMoon, CloudSun, MapPin, Moon, Music, Bell, Sunrise, Sun, Sunset, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import {
  loadAdhanPrefs,
  patchAdhanPrefs,
  patchPrayerPrefs,
  PRAYER_KEYS,
  PRAYER_ARABIC,
  PRAYER_ICON,
  getEffectiveMuezzinId,
  type AdhanPreferences,
  type PrayerKey,
  type AdvanceMinutes,
} from "@/lib/adhan-preferences";
import { getMuezzin, stopAdhan } from "@/lib/adhan-audio";
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

const ADVANCE_OPTIONS: AdvanceMinutes[] = [0, 5, 10, 15, 20, 30];

const PRAYER_ICON_MAP: Record<string, LucideIcon> = {
  Moon, Sun, CloudSun, Sunset, CloudMoon,
};

function Toggle({
  checked,
  onChange,
  id,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      id={id}
      onClick={() => onChange(!checked)}
      className={`ads-toggle${checked ? " is-on" : ""}`}
    >
      <span className="ads-toggle__thumb" />
    </button>
  );
}

// "default" من Notification.permission و"prompt" من navigator.permissions.query()
// يمثّلان نفس الحالة (لم يُطلب الإذن بعد) لكن باسمين مختلفين حسب الـ API.
type PermissionState = "granted" | "denied" | "default" | "prompt" | "unsupported";

function PermissionBadge({ value }: { value: PermissionState }) {
  const MAP: Record<PermissionState, { label: string; cls: string }> = {
    granted:     { label: "مفعّل ✓",        cls: "ads-perm--ok" },
    denied:      { label: "محجوب ✕",         cls: "ads-perm--err" },
    default:     { label: "لم يُطلب بعد",    cls: "ads-perm--warn" },
    prompt:      { label: "لم يُطلب بعد",    cls: "ads-perm--warn" },
    unsupported: { label: "غير مدعوم",       cls: "ads-perm--muted" },
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

export default function AdhanSettingsPage() {
  const [prefs, setPrefs] = useState<AdhanPreferences>(() => loadAdhanPrefs());
  const [pickerFor, setPickerFor] = useState<PrayerKey | "default" | null>(null);
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

  const refresh = useCallback(() => setPrefs(loadAdhanPrefs()), []);

  function flashSaved() {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setSaved(true);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  }

  function toggleGlobal(enabled: boolean) {
    const next = patchAdhanPrefs({ ...prefs, globalEnabled: enabled });
    setPrefs(next);
  }

  function setDefaultMuezzin(id: string) {
    const next = patchAdhanPrefs({ ...prefs, defaultMuezzinId: id });
    setPrefs(next);
    flashSaved();
  }

  function setPrayerMuezzin(key: PrayerKey, id: string) {
    const next = patchPrayerPrefs(key, { muezzinId: id });
    setPrefs(next);
    flashSaved();
  }

  function togglePrayer(key: PrayerKey, enabled: boolean) {
    const next = patchPrayerPrefs(key, { enabled });
    setPrefs(next);
  }

  function setAdvance(key: PrayerKey, minutes: AdvanceMinutes) {
    const next = patchPrayerPrefs(key, { advanceMinutes: minutes });
    setPrefs(next);
  }

  function handleGovChange(id: string) {
    setSelectedGovernorate(id);
    setSelectedGovId(id);
  }

  const defaultMuezzin = getMuezzin(prefs.defaultMuezzinId);

  return (
    <div className="ads-page">
      <h1 className="ads-title">إعدادات الأذان</h1>
      <p className="ads-subtitle">خصّص المؤذن والتنبيهات لكل صلاة بشكل مستقل.</p>

      {saved && (
        <div className="ads-saved">
          <span>✓</span> تم الحفظ
        </div>
      )}

      {/* ══ الموقع ══ */}
      <div className="ads-card">
        <div className="ads-card__head">
          <MapPin size={15} strokeWidth={2} />
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
              <Sunrise size={16} strokeWidth={2} color="#173D35" />
              الشروق
              <span className="ads-sunrise-tag">وقت الكراهة</span>
            </div>
            <span className="ads-sunrise-time">{sunriseTime ?? "—"}</span>
          </div>
        </div>
      </div>

      {/* ══ الأذان ══ */}
      <div className="ads-card">
        <div className="ads-card__head">
          <Music size={15} strokeWidth={2} />
          <span>الأذان</span>
        </div>
        <div className="ads-card__body">
          <p className="ads-adhan-desc">
            المؤذن الافتراضي، يُستخدم لجميع الصلوات ما لم تخصّص مؤذناً لكل صلاة.
          </p>

          <div className="ads-row">
            <div>
              <div className="ads-muezzin-name">{defaultMuezzin.name}</div>
              <div className="ads-muezzin-origin">
                {defaultMuezzin.origin} · {defaultMuezzin.style}
              </div>
            </div>
            <button type="button" onClick={() => setPickerFor("default")} className="ads-pill-btn">
              تغيير
            </button>
          </div>

          <div className="ads-quick-links">
            <Link href="/upload" className="ads-quick-link-anchor ads-quick-link-anchor--full">
              <div className="ads-quick-link ads-quick-link--upload">
                <span className="ads-quick-link__label">ارفع أذانك</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ══ الإشعارات ══ */}
      <div className="ads-card">
        <div className="ads-card__head">
          <Bell size={15} strokeWidth={2} />
          <span>الإشعارات</span>
        </div>
        <div className="ads-card__body">
          <div className="ads-row-sep">
            <div>
              <div className="ads-global-label">تفعيل إشعارات الأذان</div>
              <div className="ads-global-desc">تشغيل الأذان وإرسال تنبيه عند كل وقت صلاة</div>
            </div>
            <Toggle checked={prefs.globalEnabled} onChange={toggleGlobal} id="global-toggle" label="تفعيل إشعارات الأذان" />
          </div>

          {!prefs.globalEnabled && (
            <div className="ads-global-disabled">
              الإشعارات معطلة، لن يُشغَّل أذان ولن تصل تنبيهات.
            </div>
          )}

          {PRAYER_KEYS.map((key, idx) => {
            const p = prefs.prayers[key];
            const effectiveMuezzinId = getEffectiveMuezzinId(prefs, key);
            const muezzin = getMuezzin(effectiveMuezzinId);
            const hasOverride = !!p.muezzinId;
            const isLast = idx === PRAYER_KEYS.length - 1;

            return (
              <div
                key={key}
                className={`ads-prayer-item${isLast ? " is-last" : ""}${!p.enabled ? " is-disabled" : ""}`}
              >
                <div className="ads-row">
                  <div className="ads-prayer-icon-row">
                    {(() => { const I = PRAYER_ICON_MAP[PRAYER_ICON[key]] ?? Moon; return <I size={16} className="ads-prayer-icon" />; })()}
                    <span className="ads-prayer-name">{PRAYER_ARABIC[key]}</span>
                  </div>
                  <Toggle checked={p.enabled} onChange={(v) => togglePrayer(key, v)} label={`تفعيل أذان ${PRAYER_ARABIC[key]}`} />
                </div>

                {p.enabled && (
                  <div className="ads-prayer-details">
                    <div className="ads-prayer-muezzin-row">
                      <span className="ads-prayer-muezzin-name">
                        {muezzin.name}
                        {!hasOverride && (
                          <span className="ads-prayer-muezzin-override">(افتراضي)</span>
                        )}
                      </span>
                      <div className="ads-prayer-muezzin-btns">
                        <button type="button" onClick={() => setPickerFor(key)} className="ads-pill-btn">
                          تغيير
                        </button>
                        {hasOverride && (
                          <button
                            type="button"
                            onClick={() => { patchPrayerPrefs(key, { muezzinId: "" }); refresh(); }}
                            className="ads-pill-btn-ghost"
                          >
                            إلغاء
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="ads-advance-label">تنبيه مسبق</div>
                      <div className="ads-advance-row">
                        {ADVANCE_OPTIONS.map((min) => (
                          <button
                            key={min}
                            type="button"
                            onClick={() => setAdvance(key, min)}
                            className={`ads-advance-btn${p.advanceMinutes === min ? " is-active" : ""}`}
                          >
                            {min === 0 ? "بدون" : `${min} د`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <PrayerAlertSettingsCard />

      {/* ══ تذكير يوم الجمعة ══ */}
      <div className="ads-card">
        <div className="ads-card__head">
          <Star size={15} strokeWidth={2} />
          <span>تذكير يوم الجمعة</span>
        </div>
        <div className="ads-card__body">
          <div className="ads-row-sep">
            <div>
              <div className="ads-global-label">عرض إعلان ليلة الجمعة ويومها</div>
              <div className="ads-global-desc">
                يظهر شعار الآية الكريمة من مغرب الخميس حتى مغرب الجمعة
              </div>
            </div>
            <Toggle
              checked={prefs.fridayBannerEnabled}
              onChange={(v) => {
                const next = patchAdhanPrefs({ ...prefs, fridayBannerEnabled: v });
                setPrefs(next);
                // إذا أُعيد التفعيل نمسح الإغلاق السابق للجلسة
                if (v) undismissFridayBanner();
              }}
              id="friday-banner-toggle"
              label="عرض إعلان ليلة الجمعة ويومها"
            />
          </div>
          <p className="ads-adhan-desc">
            الآية المعروضة: «إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا» — الأحزاب: ٥٦
          </p>
        </div>
      </div>

      {/* ══ حالة الأذونات ══ */}
      <div className="ads-card">
        <div className="ads-card__head">
          <Bell size={15} strokeWidth={2} />
          <span>حالة الأذونات</span>
        </div>
        <div className="ads-card__body">
          <div className="ads-row-sep">
            <span className="ads-adhan-desc">إذن الإشعارات</span>
            <PermissionBadge value={
              "Notification" in window
                ? Notification.permission === "granted" ? "granted"
                : Notification.permission === "denied" ? "denied" : "default"
                : "unsupported"
            } />
          </div>
          <div className="ads-row">
            <span className="ads-adhan-desc">إذن الموقع الجغرافي</span>
            <LocationPermBadge />
          </div>
        </div>
      </div>

      {/* ══ تشخيص: لماذا لا تصلني تنبيهات؟ ══ */}
      <div className="ads-card">
        <button
          type="button"
          className="ads-row-sep ads-diagnostics-toggle"
          onClick={() => setDiagnosticsOpen((v) => !v)}
          aria-expanded={diagnosticsOpen}
        >
          <div className="ads-card__head" style={{ margin: 0 }}>
            <Bell size={15} strokeWidth={2} />
            <span>لماذا لا تصلني تنبيهات؟</span>
          </div>
          <span aria-hidden="true">{diagnosticsOpen ? "▲" : "▼"}</span>
        </button>
        {diagnosticsOpen && (
          <div className="ads-card__body">
            {!diagnostics ? (
              <p className="ads-adhan-desc">جارٍ الفحص…</p>
            ) : (
              <>
                <div className="ads-row-sep">
                  <span className="ads-adhan-desc">الصلاة القادمة</span>
                  <span>{diagnostics.nextPrayer ? `${diagnostics.nextPrayer.name} — ${diagnostics.nextPrayer.time}` : "—"}</span>
                </div>
                <div className="ads-row-sep">
                  <span className="ads-adhan-desc">تنبيه هذه الصلاة</span>
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
                      {diagnostics.blockingReasons.map((r, i) => (
                        <li key={i} className="ads-adhan-desc">{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {pickerFor && (
        <MuezzinPicker
          selected={
            pickerFor === "default"
              ? prefs.defaultMuezzinId
              : getEffectiveMuezzinId(prefs, pickerFor as PrayerKey)
          }
          onSelect={(id) => {
            stopAdhan();
            if (pickerFor === "default") setDefaultMuezzin(id);
            else setPrayerMuezzin(pickerFor as PrayerKey, id);
          }}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  );
}
