import { useEffect, useState } from "react";
import { Link } from "wouter";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { loadAdhanPrefs, patchAdhanPrefs, PRAYER_ARABIC } from "@/lib/adhan-preferences";
import { getMuezzin } from "@/lib/adhan-audio";

export function HomeAdhanWidget() {
  const { data, countdown } = usePrayerCountdown();
  const [prefs, setPrefs] = useState(() => loadAdhanPrefs());
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setPrefs(loadAdhanPrefs());
  }, []);

  function toggleNotifications() {
    setToggling(true);
    const next = patchAdhanPrefs({ globalEnabled: !prefs.globalEnabled });
    setPrefs(next);
    setTimeout(() => setToggling(false), 600);
  }

  const muezzin = getMuezzin(prefs.defaultMuezzinId);
  const nextPrayer = countdown?.next;
  const remaining = countdown?.remainingHms;

  if (!data || !nextPrayer) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #0f4730 0%, #134a3a 60%, #1a6b4a 100%)",
      borderRadius: "1.25rem",
      padding: "1.25rem",
      color: "#fff",
      position: "relative",
      overflow: "hidden",
      marginBottom: "1.5rem",
    }}>
      {/* Background decoration */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
        backgroundSize: "16px 16px",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.1rem" }}>🕌</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, opacity: 0.85, letterSpacing: "0.04em" }}>
              مواقيت الصلاة
            </span>
          </div>
          {/* Notification toggle */}
          <button
            type="button"
            onClick={toggleNotifications}
            title={prefs.globalEnabled ? "إيقاف إشعارات الأذان" : "تفعيل إشعارات الأذان"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.3rem 0.65rem",
              borderRadius: "999px",
              border: `1.5px solid ${prefs.globalEnabled ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)"}`,
              background: prefs.globalEnabled ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
              color: "#fff",
              fontSize: "0.72rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
              opacity: toggling ? 0.6 : 1,
            }}
          >
            <span style={{ fontSize: "0.85rem" }}>{prefs.globalEnabled ? "🔔" : "🔕"}</span>
            <span>{prefs.globalEnabled ? "إشعارات مفعّلة" : "إشعارات متوقفة"}</span>
          </button>
        </div>

        {/* Next prayer countdown */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.75rem", opacity: 0.7, marginBottom: "0.2rem" }}>الصلاة القادمة</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.6rem", fontWeight: 800 }}>
              {PRAYER_ARABIC[nextPrayer.key as keyof typeof PRAYER_ARABIC] ?? nextPrayer.name}
            </span>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, opacity: 0.9, fontVariantNumeric: "tabular-nums" }}>
              {remaining}
            </span>
          </div>
          {nextPrayer.time && (
            <div style={{ fontSize: "0.72rem", opacity: 0.65, marginTop: "0.15rem" }}>
              في تمام الساعة {nextPrayer.time}
            </div>
          )}
        </div>

        {/* Prayer times row */}
        {data.prayers && (
          <div style={{
            display: "flex",
            gap: "0.5rem",
            overflowX: "auto",
            marginBottom: "1rem",
            paddingBottom: "0.25rem",
          }}>
            {data.prayers
              .filter((p) => ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].includes(p.key))
              .map((p) => {
                const isNext = nextPrayer.key === p.key;
                return (
                  <div key={p.key} style={{
                    flexShrink: 0,
                    background: isNext ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)",
                    borderRadius: "0.6rem",
                    padding: "0.4rem 0.6rem",
                    textAlign: "center",
                    border: isNext ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
                    minWidth: "3.5rem",
                  }}>
                    <div style={{ fontSize: "0.65rem", opacity: 0.75, marginBottom: "0.15rem" }}>{p.name}</div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{p.time}</div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.72rem", opacity: 0.8 }}>
            <span>🎙️</span>
            <span>{muezzin.name}</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href="/prayer-times">
              <span style={{
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.85)",
                fontWeight: 600,
                textDecoration: "underline",
                cursor: "pointer",
              }}>
                كل المواقيت
              </span>
            </Link>
            <span style={{ opacity: 0.4 }}>·</span>
            <Link href="/adhan-settings">
              <span style={{
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.85)",
                fontWeight: 600,
                textDecoration: "underline",
                cursor: "pointer",
              }}>
                إعدادات الأذان
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
