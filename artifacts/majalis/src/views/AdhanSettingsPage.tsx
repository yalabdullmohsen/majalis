import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Sunrise, Music, Bell, ChevronLeft } from "lucide-react";
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
import {
  KUWAIT_GOVERNORATES,
  getSelectedGovernorate,
  setSelectedGovernorate,
} from "@/lib/prayer-times";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";

const ADVANCE_OPTIONS: AdvanceMinutes[] = [0, 5, 10, 15, 20, 30];

// ── أنماط مشتركة ────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "var(--msk-canvas-1, #fff)",
  borderRadius: "1rem",
  border: "1px solid var(--msk-border)",
  overflow: "hidden",
  marginBottom: "1.25rem",
};

const cardHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.75rem 1rem 0.625rem",
  borderBottom: "1px solid var(--msk-border)",
  color: "var(--msk-gold)",
  fontSize: "0.8125rem",
  fontWeight: 700,
};

const cardBody: React.CSSProperties = {
  padding: "0.875rem 1rem",
};

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  minHeight: 44,
};

const rowSep: React.CSSProperties = {
  ...row,
  borderBottom: "1px solid var(--msk-border)",
  paddingBottom: "0.75rem",
  marginBottom: "0.75rem",
};

// ── مفتاح Toggle ─────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width: 44,
        height: 26,
        borderRadius: 999,
        border: "none",
        background: checked ? "var(--msk-gold)" : "var(--msk-border)",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          transition: "transform 0.2s",
          transform: checked ? "translateX(20px)" : "translateX(3px)",
        }}
      />
    </button>
  );
}

// ── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function AdhanSettingsPage() {
  const [prefs, setPrefs] = useState<AdhanPreferences>(() => loadAdhanPrefs());
  const [pickerFor, setPickerFor] = useState<PrayerKey | "default" | null>(null);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // اختيار المحافظة
  const [selectedGovId, setSelectedGovId] = useState(
    () => getSelectedGovernorate().id,
  );

  // وقت الشروق من hook مواقيت الصلاة
  const { data: prayerData } = usePrayerCountdown(selectedGovId);
  const sunriseTime =
    prayerData?.prayers.find((p: { key: string }) => p.key === "Sunrise")
      ?.time ?? null;

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
    <div
      style={{
        direction: "rtl",
        maxWidth: 600,
        margin: "0 auto",
        padding: "1.25rem 1rem 5rem",
      }}
    >
      {/* العنوان */}
      <h1
        style={{
          fontSize: "1.25rem",
          fontWeight: 800,
          color: "var(--msk-text)",
          marginBottom: "0.2rem",
        }}
      >
        إعدادات الأذان
      </h1>
      <p
        style={{
          fontSize: "0.82rem",
          color: "var(--msk-text-2)",
          marginBottom: "1.25rem",
        }}
      >
        خصّص المؤذن والتنبيهات لكل صلاة بشكل مستقل.
      </p>

      {/* رسالة حفظ */}
      {saved && (
        <div
          style={{
            background: "var(--msk-gold-dim)",
            border: "1px solid var(--msk-gold-border)",
            borderRadius: "0.75rem",
            padding: "0.5rem 0.875rem",
            marginBottom: "1rem",
            fontSize: "0.82rem",
            color: "var(--msk-gold)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <span>✓</span> تم الحفظ
        </div>
      )}

      {/* ══ مجموعة الموقع ══════════════════════════════════════════ */}
      <div style={card}>
        <div style={cardHeader}>
          <MapPin size={15} strokeWidth={2} />
          <span>الموقع</span>
        </div>
        <div style={cardBody}>
          {/* اختيار المحافظة */}
          <div style={rowSep}>
            <label
              htmlFor="gov-select"
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--msk-text)",
              }}
            >
              المحافظة
            </label>
            <select
              id="gov-select"
              value={selectedGovId}
              onChange={(e) => handleGovChange(e.target.value)}
              style={{
                border: "1.5px solid var(--msk-border)",
                borderRadius: "0.625rem",
                padding: "0.35rem 0.75rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--msk-text)",
                background: "var(--msk-canvas)",
                fontFamily: "inherit",
                cursor: "pointer",
                minWidth: 130,
              }}
            >
              {KUWAIT_GOVERNORATES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* وقت الشروق — للعرض فقط */}
          <div style={row}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                color: "var(--msk-text)",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              <Sunrise
                size={16}
                strokeWidth={2}
                style={{ color: "#D97706" }}
              />
              الشروق
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 400,
                  color: "var(--msk-text-3)",
                  background: "var(--msk-canvas-2)",
                  borderRadius: 999,
                  padding: "0.1rem 0.4rem",
                }}
              >
                وقت الكراهة
              </span>
            </div>
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "#D97706",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {sunriseTime ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ══ مجموعة الأذان ══════════════════════════════════════════ */}
      <div style={card}>
        <div style={cardHeader}>
          <Music size={15} strokeWidth={2} />
          <span>الأذان</span>
        </div>
        <div style={cardBody}>
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--msk-text-2)",
              marginBottom: "0.75rem",
            }}
          >
            المؤذن الافتراضي — يُستخدم لجميع الصلوات ما لم تخصّص مؤذناً لكل صلاة.
          </p>

          <div style={row}>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "var(--msk-text)",
                }}
              >
                {defaultMuezzin.name}
              </div>
              <div
                style={{ fontSize: "0.75rem", color: "var(--msk-text-2)" }}
              >
                {defaultMuezzin.origin} · {defaultMuezzin.style}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPickerFor("default")}
              style={pillBtn}
            >
              تغيير
            </button>
          </div>

          {/* روابط سريعة */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginTop: "1rem",
            }}
          >
            <Link href="/muezzins" style={{ flex: 1, textDecoration: "none" }}>
              <div style={quickLink}>
                <span style={{ fontSize: "0.82rem", color: "var(--msk-gold)", fontWeight: 600 }}>
                  مكتبة المؤذنين
                </span>
                <ChevronLeft size={14} style={{ color: "var(--msk-text-3)" }} />
              </div>
            </Link>
            <Link href="/upload" style={{ textDecoration: "none" }}>
              <div style={{ ...quickLink, color: "var(--msk-text-2)" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                  ارفع أذانك
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ══ مجموعة الإشعارات ══════════════════════════════════════ */}
      <div style={card}>
        <div style={cardHeader}>
          <Bell size={15} strokeWidth={2} />
          <span>الإشعارات</span>
        </div>
        <div style={cardBody}>
          {/* مفتاح عام */}
          <div style={rowSep}>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  color: "var(--msk-text)",
                }}
              >
                تفعيل إشعارات الأذان
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--msk-text-2)",
                  marginTop: "0.1rem",
                }}
              >
                تشغيل الأذان وإرسال تنبيه عند كل وقت صلاة
              </div>
            </div>
            <Toggle
              checked={prefs.globalEnabled}
              onChange={toggleGlobal}
              id="global-toggle"
            />
          </div>

          {!prefs.globalEnabled && (
            <div
              style={{
                fontSize: "0.78rem",
                color: "var(--msk-gold)",
                background: "var(--msk-gold-dim)",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                marginBottom: "0.875rem",
              }}
            >
              الإشعارات معطلة — لن يُشغَّل أذان ولن تصل تنبيهات.
            </div>
          )}

          {/* إعدادات كل صلاة */}
          {PRAYER_KEYS.map((key, idx) => {
            const p = prefs.prayers[key];
            const effectiveMuezzinId = getEffectiveMuezzinId(prefs, key);
            const muezzin = getMuezzin(effectiveMuezzinId);
            const hasOverride = !!p.muezzinId;
            const isLast = idx === PRAYER_KEYS.length - 1;

            return (
              <div
                key={key}
                style={{
                  borderBottom: isLast ? "none" : "1px solid var(--msk-border)",
                  paddingBottom: isLast ? 0 : "0.875rem",
                  marginBottom: isLast ? 0 : "0.875rem",
                  opacity: p.enabled ? 1 : 0.55,
                  transition: "opacity 0.15s",
                }}
              >
                {/* صف الصلاة + toggle */}
                <div style={row}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span style={{ fontSize: "1.05rem" }}>
                      {PRAYER_ICON[key]}
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color: "var(--msk-text)",
                      }}
                    >
                      {PRAYER_ARABIC[key]}
                    </span>
                  </div>
                  <Toggle
                    checked={p.enabled}
                    onChange={(v) => togglePrayer(key, v)}
                  />
                </div>

                {/* تفاصيل إضافية عند التفعيل */}
                {p.enabled && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      paddingRight: "1.75rem",
                    }}
                  >
                    {/* المؤذن */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "0.375rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--msk-text-2)",
                        }}
                      >
                        {muezzin.name}
                        {!hasOverride && (
                          <span
                            style={{
                              fontSize: "0.68rem",
                              color: "var(--msk-text-3)",
                              marginRight: "0.3rem",
                            }}
                          >
                            (افتراضي)
                          </span>
                        )}
                      </span>
                      <div style={{ display: "flex", gap: "0.3rem" }}>
                        <button
                          type="button"
                          onClick={() => setPickerFor(key)}
                          style={pillBtn}
                        >
                          تغيير
                        </button>
                        {hasOverride && (
                          <button
                            type="button"
                            onClick={() => {
                              patchPrayerPrefs(key, { muezzinId: "" });
                              refresh();
                            }}
                            style={pillBtnGhost}
                          >
                            إلغاء
                          </button>
                        )}
                      </div>
                    </div>

                    {/* تنبيه مسبق */}
                    <div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--msk-text-3)",
                          marginBottom: "0.25rem",
                        }}
                      >
                        تنبيه مسبق
                      </div>
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                        {ADVANCE_OPTIONS.map((min) => (
                          <button
                            key={min}
                            type="button"
                            onClick={() => setAdvance(key, min)}
                            style={{
                              padding: "0.2rem 0.55rem",
                              borderRadius: "999px",
                              border: "1.5px solid",
                              borderColor:
                                p.advanceMinutes === min
                                  ? "var(--msk-gold)"
                                  : "var(--msk-border)",
                              background:
                                p.advanceMinutes === min
                                  ? "var(--msk-gold)"
                                  : "transparent",
                              color:
                                p.advanceMinutes === min
                                  ? "var(--msk-canvas)"
                                  : "var(--msk-text-2)",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              transition: "all 0.15s",
                            }}
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

      {/* Muezzin Picker Modal */}
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

// ── أنماط الأزرار المشتركة ───────────────────────────────────────────────────
const pillBtn: React.CSSProperties = {
  padding: "0.28rem 0.7rem",
  borderRadius: "999px",
  border: "1.5px solid var(--msk-gold-border)",
  background: "var(--msk-gold-dim)",
  color: "var(--msk-gold)",
  fontSize: "0.78rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "all 0.15s",
  flexShrink: 0,
};

const pillBtnGhost: React.CSSProperties = {
  padding: "0.28rem 0.7rem",
  borderRadius: "999px",
  border: "1.5px solid var(--msk-border)",
  background: "transparent",
  color: "var(--msk-text-2)",
  fontSize: "0.78rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "all 0.15s",
  flexShrink: 0,
};

const quickLink: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0.55rem 0.75rem",
  background: "var(--msk-canvas-2)",
  border: "1px solid var(--msk-border)",
  borderRadius: "0.625rem",
  cursor: "pointer",
};
