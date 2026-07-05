import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { MUEZZINS, previewAdhan, stopAdhan } from "@/lib/adhan-audio";
import { loadFavorites, toggleFavorite } from "@/lib/muezzin-favorites";
import { patchAdhanPrefs, loadAdhanPrefs } from "@/lib/adhan-preferences";

const STYLE_COLOR: Record<string, { bg: string; text: string }> = {
  "خاشع":    { bg: "#f0fdf4", text: "#065f46" },
  "رسمي":    { bg: "#eff6ff", text: "#1d4ed8" },
  "تقليدي":  { bg: "#faf5ff", text: "#6d28d9" },
  "كلاسيكي": { bg: "#fff7ed", text: "#0E6E52" },
};

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}م`;
  if (n >= 1_000) return `${Math.round(n / 1000)}ك`;
  return String(n);
}

export default function MuezzinFavoritesPage() {
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [savedDefault, setSavedDefault] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    stopAdhan();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
  }, []);

  const defaultMuezzinId = loadAdhanPrefs().defaultMuezzinId;

  const favList = MUEZZINS.filter((m) => favorites.has(m.id));

  function handleRemove(id: string) {
    toggleFavorite(id);
    setFavorites(loadFavorites());
  }

  function handlePreview(id: string, _audioUrl: string) {
    if (previewing === id) {
      stopAdhan();
      setPreviewing(null);
      return;
    }
    stopAdhan();
    const m = MUEZZINS.find((m) => m.id === id);
    if (!m) return;
    const audio = previewAdhan(m);
    setPreviewing(id);
    audio.addEventListener("ended", () => setPreviewing(null), { once: true });
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => setPreviewing((p) => (p === id ? null : p)), 16_000);
  }

  function handleSetDefault(id: string) {
    patchAdhanPrefs({ defaultMuezzinId: id });
    if (timerRef.current) clearTimeout(timerRef.current);
    setSavedDefault(true);
    timerRef.current = setTimeout(() => setSavedDefault(false), 2500);
  }

  return (
    <div style={{ direction: "rtl", maxWidth: 600, margin: "0 auto", padding: "1.25rem 1rem 5rem" }}>
      {/* Back */}
      <Link href="/muezzins">
        <button type="button" style={backBtn}>← مكتبة المؤذنين</button>
      </Link>

      <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--majalis-ink, #EDE9DD)", margin: "0 0 0.25rem" }}>
        ❤️ المؤذنون المفضلون
      </h1>
      <p style={{ fontSize: "0.82rem", color: "var(--majalis-ink-muted, #9BA3B5)", marginBottom: "1.25rem" }}>
        {favList.length > 0
          ? `${favList.length} مؤذن في قائمة مفضلتك`
          : "لا يوجد مؤذنون مفضلون بعد — اضغط 🤍 في الصفحة الرئيسية لإضافتهم."}
      </p>

      {savedDefault && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "0.6rem", padding: "0.6rem 0.875rem", marginBottom: "1rem", fontSize: "0.82rem", color: "#065f46", fontWeight: 600 }}>
          ✓ تم تعيين المؤذن الافتراضي بنجاح
        </div>
      )}

      {favList.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🤍</div>
          <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>قائمة مفضلتك فارغة</p>
          <Link href="/muezzins">
            <button type="button" style={{
              marginTop: "0.75rem",
              padding: "0.6rem 1.5rem",
              borderRadius: "0.6rem",
              border: "none",
              background: "#134a3a",
              color: "#fff",
              fontFamily: "inherit",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}>
              استكشف المؤذنين
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {favList.map((m) => {
            const sc = STYLE_COLOR[m.style] ?? { bg: "#f9fafb", text: "#374151" };
            const isPlaying = previewing === m.id;
            const isDefault = defaultMuezzinId === m.id;
            return (
              <div key={m.id} style={{
                background: "#fff",
                borderRadius: "1rem",
                border: "1.5px solid #fca5a5",
                padding: "1rem",
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
              }}>
                {/* Icon */}
                <div style={{
                  width: 46, height: 46, borderRadius: "50%",
                  background: "#f0fdf4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.3rem", flexShrink: 0,
                }}>
                  🎙️
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--majalis-ink, #EDE9DD)" }}>
                    {m.name}
                    {isDefault && (
                      <span style={{ marginRight: "0.4rem", fontSize: "0.65rem", background: "#134a3a", color: "#fff", padding: "0.1rem 0.4rem", borderRadius: "999px" }}>
                        افتراضي
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--majalis-ink-muted, #9BA3B5)" }}>
                    📍 {m.origin} · {m.country}
                  </div>
                  <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
                    <span style={{ padding: "0.15rem 0.45rem", borderRadius: "999px", fontSize: "0.65rem", fontWeight: 600, background: sc.bg, color: sc.text }}>
                      {m.style}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600 }}>
                      ★ {m.rating}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                      {formatNum(m.followers)} متابع
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handlePreview(m.id, m.audioUrl)}
                    style={{
                      width: 34, height: 34, borderRadius: "50%",
                      border: "none",
                      background: isPlaying ? "#ef4444" : "#134a3a",
                      color: "#fff", cursor: "pointer", fontSize: "0.85rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    title={isPlaying ? "إيقاف" : "معاينة"}
                  >
                    {isPlaying ? "⏹" : "▶"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(m.id)}
                    style={{
                      width: 34, height: 34, borderRadius: "50%",
                      border: "1.5px solid #fca5a5",
                      background: "#fff", color: "#ef4444",
                      cursor: "pointer", fontSize: "0.85rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    title="إزالة من المفضلة"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}

          {/* Set default from favorites */}
          <div style={{ background: "#f8fafc", borderRadius: "0.875rem", border: "1px solid #e5e7eb", padding: "1rem", marginTop: "0.5rem" }}>
            <p style={{ fontSize: "0.8rem", color: "#374151", fontWeight: 600, margin: "0 0 0.75rem" }}>
              تعيين مؤذن افتراضي من المفضلة:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {favList.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.82rem", color: "#374151" }}>{m.name}</span>
                  {defaultMuezzinId === m.id ? (
                    <span style={{ fontSize: "0.72rem", color: "#065f46", fontWeight: 600 }}>✓ افتراضي حالياً</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(m.id)}
                      style={{
                        padding: "0.25rem 0.65rem",
                        borderRadius: "0.4rem",
                        border: "none",
                        background: "#134a3a",
                        color: "#fff",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      تعيين
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const backBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  marginBottom: "1rem",
  padding: "0.4rem 0.875rem",
  borderRadius: "0.5rem",
  border: "1.5px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  fontSize: "0.8rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
