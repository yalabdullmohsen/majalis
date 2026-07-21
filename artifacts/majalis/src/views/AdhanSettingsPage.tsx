import { useCallback, useEffect, useRef, useState } from "react";
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
import { requestPrayerNotificationPermission } from "@/lib/adhan-scheduler";

const ADVANCE_OPTIONS: AdvanceMinutes[] = [0, 5, 10, 15, 20, 30];

export default function AdhanSettingsPage() {
  const [prefs, setPrefs] = useState<AdhanPreferences>(() => loadAdhanPrefs());
  const [pickerFor, setPickerFor] = useState<PrayerKey | "default" | null>(null);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current); }, []);

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

  async function enableBrowserNotifications() {
    const granted = await requestPrayerNotificationPermission();
    const next = patchAdhanPrefs({ ...prefs, browserNotificationsEnabled: granted });
    setPrefs(next);
    flashSaved();
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

  const defaultMuezzin = getMuezzin(prefs.defaultMuezzinId);

  return (
    <div style={{ direction: "rtl", maxWidth: 600, margin: "0 auto", padding: "1.25rem 1rem 4rem" }}>
      <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#134a3a", marginBottom: "0.25rem" }}>
        🕌 إعدادات الأذان
      </h1>
      <p style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: "0.875rem" }}>
        خصّص المؤذن والتنبيهات لكل صلاة بشكل مستقل.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <Link href="/muezzins" style={{ flex: 1 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            padding: "0.65rem 0.875rem",
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: "0.75rem",
            cursor: "pointer", textDecoration: "none",
          }}>
            <span style={{ fontSize: "1rem" }}>🎙️</span>
            <span style={{ fontSize: "0.82rem", color: "#134a3a", fontWeight: 600 }}>
              مكتبة المؤذنين
            </span>
            <span style={{ marginRight: "auto", color: "#6b7280", fontSize: "0.8rem" }}>←</span>
          </div>
        </Link>
        <Link href="/upload">
          <div style={{
            display: "flex", alignItems: "center", gap: "0.35rem",
            padding: "0.65rem 0.875rem",
            background: "#eff6ff", border: "1px solid #bfdbfe",
            borderRadius: "0.75rem",
            cursor: "pointer", textDecoration: "none",
            whiteSpace: "nowrap",
          }}>
            <span style={{ fontSize: "0.9rem" }}>📤</span>
            <span style={{ fontSize: "0.82rem", color: "#1d4ed8", fontWeight: 600 }}>
              ارفع أذانك
            </span>
          </div>
        </Link>
      </div>

      {saved && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.5rem", padding: "0.5rem 0.875rem", marginBottom: "1rem", fontSize: "0.82rem", color: "#065f46", fontWeight: 600 }}>
          ✓ تم الحفظ
        </div>
      )}

      {/* ── Master Toggle ───────────────────────────────────────── */}
      <Section title="🔔 الإشعارات">
        <ToggleRow
          label="تفعيل إشعارات الأذان"
          desc="تشغيل الأذان وإرسال تنبيه عند كل وقت صلاة"
          checked={prefs.globalEnabled}
          onChange={toggleGlobal}
        />
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
          <p style={{ margin: "0 0 0.65rem", fontSize: "0.78rem", lineHeight: 1.7, color: "#4b5563" }}>
            نطلب إذن النظام فقط لإرسال تذكير الصلاة عندما لا تكون الصفحة أمامك. يمكنك إيقافه
            في أي وقت، ولن يحوّل التطبيق الهاتف إلى الوضع الصامت تلقائيًا.
          </p>
          <button type="button" onClick={enableBrowserNotifications} style={smallBtn("#134a3a")}>
            {prefs.browserNotificationsEnabled ? "الإشعارات مفعّلة" : "تفعيل إشعارات النظام"}
          </button>
        </div>
        <div style={{ marginTop: "0.9rem" }}>
          <ToggleRow
            label="تذكير الوضع الصامت"
            desc="إرسال التذكير بصمت قبل الصلاة وعند دخول وقتها"
            checked={prefs.silentReminderEnabled}
            onChange={(enabled) => setPrefs(patchAdhanPrefs({ ...prefs, silentReminderEnabled: enabled }))}
          />
        </div>
        {!prefs.globalEnabled && (
          <div style={{ fontSize: "0.78rem", color: "#b45309", background: "#fefce8", padding: "0.5rem 0.75rem", borderRadius: "0.4rem", marginTop: "0.5rem" }}>
            الإشعارات معطلة — لن يُشغَّل أذان ولن تصل تنبيهات.
          </div>
        )}
      </Section>

      {/* ── Default Muezzin ─────────────────────────────────────── */}
      <Section title="🎙️ المؤذن الافتراضي">
        <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.75rem" }}>
          يُستخدم لجميع الصلوات ما لم تحدد مؤذناً مختلفاً لكل صلاة.
        </p>
        <MuezzinRow
          name={defaultMuezzin.name}
          origin={defaultMuezzin.origin}
          style={defaultMuezzin.style}
          onPick={() => setPickerFor("default")}
        />
      </Section>

      {/* ── Per-Prayer Settings ──────────────────────────────────── */}
      <Section title="⏰ إعدادات كل صلاة">
        {PRAYER_KEYS.map((key) => {
          const p = prefs.prayers[key];
          const effectiveMuezzinId = getEffectiveMuezzinId(prefs, key);
          const muezzin = getMuezzin(effectiveMuezzinId);
          const hasOverride = !!p.muezzinId;
          return (
            <div key={key} style={{
              borderRadius: "0.75rem",
              border: `1.5px solid ${p.enabled ? "#e5e7eb" : "#f3f4f6"}`,
              padding: "0.875rem 1rem",
              marginBottom: "0.75rem",
              background: p.enabled ? "#fff" : "#fafafa",
              opacity: p.enabled ? 1 : 0.7,
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>{PRAYER_ICON[key]}</span>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827" }}>
                    {PRAYER_ARABIC[key]}
                  </span>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "0.8rem", color: "#374151" }}>
                  <input
                    type="checkbox"
                    checked={p.enabled}
                    onChange={(e) => togglePrayer(key, e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "#134a3a" }}
                  />
                  {p.enabled ? "مفعّل" : "معطّل"}
                </label>
              </div>

              {p.enabled && (
                <>
                  {/* Muezzin */}
                  <div style={{ marginBottom: "0.625rem" }}>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.3rem" }}>المؤذن</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.85rem", color: "#111827" }}>
                        {muezzin.name}
                        {!hasOverride && <span style={{ fontSize: "0.7rem", color: "#9ca3af", marginRight: "0.35rem" }}>(افتراضي)</span>}
                      </span>
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button type="button" onClick={() => setPickerFor(key)} style={smallBtn("#134a3a")}>
                          تغيير
                        </button>
                        {hasOverride && (
                          <button type="button" onClick={() => { patchPrayerPrefs(key, { muezzinId: "" }); refresh(); }} style={smallBtn("#6b7280")}>
                            إلغاء
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Advance reminder */}
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.3rem" }}>
                      تنبيه مسبق
                    </div>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {ADVANCE_OPTIONS.map((min) => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => setAdvance(key, min)}
                          style={{
                            padding: "0.25rem 0.6rem",
                            borderRadius: "999px",
                            border: "1.5px solid",
                            borderColor: p.advanceMinutes === min ? "#134a3a" : "#e5e7eb",
                            background: p.advanceMinutes === min ? "#134a3a" : "#fff",
                            color: p.advanceMinutes === min ? "#fff" : "#374151",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          {min === 0 ? "بدون" : `${min} د`}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </Section>

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#374151", margin: "0 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </h2>
      <div style={{ background: "#fff", borderRadius: "0.875rem", border: "1px solid #e5e7eb", padding: "0.875rem 1rem" }}>
        {children}
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: "0.25rem", width: 18, height: 18, accentColor: "#134a3a", flexShrink: 0 }}
      />
      <div>
        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}>{label}</div>
        <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.1rem" }}>{desc}</div>
      </div>
    </label>
  );
}

function MuezzinRow({ name, origin, style: muStyle, onPick }: {
  name: string; origin: string; style: string; onPick: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{name}</div>
        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{origin} · {muStyle}</div>
      </div>
      <button type="button" onClick={onPick} style={smallBtn("#134a3a")}>
        تغيير
      </button>
    </div>
  );
}

function smallBtn(bg: string) {
  return {
    padding: "0.3rem 0.75rem",
    borderRadius: "0.4rem",
    border: "none",
    background: bg,
    color: "#fff",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  } as const;
}
