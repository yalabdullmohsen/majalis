/**
 * شيت سفلي لمشغّل التفسير الصوتي — سرعة، ±١٥ث، قائمة مقاطع، إغلاق أسفل.
 * يظهر فقط عند وجود مقطع مفعّل؛ بلا أزرار ميتة.
 */
import { useEffect, useState } from "react";
import {
  displayScholarLabel,
  findTafsirAudioForAyah,
  findTafsirAudioForSurah,
  loadTafsirAudioCatalog,
  persistTafsirPlaybackRate,
  playTafsirAudioClip,
  readTafsirPlaybackRate,
  stopTafsirAudio,
  TAFSIR_AUDIO_RATES,
  type TafsirAudioClip,
} from "@/features/mushaf/tafsir-audio";

type Props = {
  open: boolean;
  onClose: () => void;
  surah: number;
  ayah?: number;
};

export default function TafsirAudioSheet({ open, onClose, surah, ayah }: Props) {
  const [clips, setClips] = useState<TafsirAudioClip[]>([]);
  const [active, setActive] = useState<TafsirAudioClip | null>(null);
  const [rate, setRate] = useState(readTafsirPlaybackRate());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void loadTafsirAudioCatalog().then((all) => {
      if (cancelled) return;
      const enabled = all.filter((c) => c.enabled && c.streamUrl);
      const forScope =
        ayah != null
          ? enabled.filter((c) => findTafsirAudioForAyah([c], surah, ayah))
          : enabled.filter((c) => findTafsirAudioForSurah([c], surah));
      const list = forScope.length ? forScope : enabled.filter((c) => c.surah === surah);
      setClips(list);
      setActive(list[0] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [open, surah, ayah]);

  if (!open) return null;

  const play = async (clip: TafsirAudioClip) => {
    setBusy(true);
    setMsg(null);
    setActive(clip);
    const res = await playTafsirAudioClip(clip, { ayah, resume: true });
    if (!res.ok) setMsg(res.reason ?? "تعذّر التشغيل");
    setBusy(false);
  };

  const seekBy = async (delta: number) => {
    try {
      const { getAudioEngine } = await import("@/core/audio/AudioEngine");
      const eng = getAudioEngine();
      const snap = eng.getSnapshot?.();
      const t = typeof snap?.currentTime === "number" ? snap.currentTime : 0;
      eng.seek(Math.max(0, t + delta));
    } catch {
      /* ignore */
    }
  };

  const changeRate = async (r: number) => {
    setRate(r);
    persistTafsirPlaybackRate(r);
    try {
      const { getAudioEngine } = await import("@/core/audio/AudioEngine");
      await getAudioEngine().setPlaybackRate(r);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <button
        type="button"
        aria-label="إغلاق الخلفية"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          border: 0,
          padding: 0,
          margin: 0,
          background: "transparent",
          cursor: "pointer",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="تفسير صوتي"
        dir="rtl"
        tabIndex={-1}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 520,
          maxHeight: "78vh",
          overflow: "auto",
          background: "var(--color-surface, #fff)",
          borderRadius: "16px 16px 0 0",
          padding: "1rem 1rem 1.25rem",
          boxShadow: "0 -8px 28px rgba(0,0,0,0.12)",
        }}
      >
        <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.15rem" }}>تفسير صوتي</h2>
        {active ? (
          <p style={{ margin: "0 0 0.75rem", color: "var(--color-muted, #6b6560)", fontSize: "0.9rem" }}>
            {displayScholarLabel(active)}
            {active.attributionVerified ? ` · ${active.titleAr}` : ""}
            {active.license ? ` · ${active.license}` : ""}
          </p>
        ) : (
          <p style={{ margin: "0 0 0.75rem", color: "var(--color-muted, #6b6560)" }}>
            لا يتوفر مقطع مفعّل ومرخّص لهذه الآية/السورة حالياً.
          </p>
        )}

        {clips.length > 0 && (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <button type="button" className="ds-btn ds-btn--primary" disabled={busy || !active} onClick={() => active && void play(active)}>
                تشغيل
              </button>
              <button type="button" className="ds-btn ds-btn--secondary" onClick={() => void seekBy(-15)}>
                −١٥ث
              </button>
              <button type="button" className="ds-btn ds-btn--secondary" onClick={() => void seekBy(15)}>
                +١٥ث
              </button>
              <button
                type="button"
                className="ds-btn ds-btn--secondary"
                onClick={() => void stopTafsirAudio()}
              >
                إيقاف
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.85rem" }} role="group" aria-label="سرعة التشغيل">
              {TAFSIR_AUDIO_RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`search-suggestion-chip${rate === r ? " is-active" : ""}`}
                  onClick={() => void changeRate(r)}
                >
                  {r}×
                </button>
              ))}
            </div>

            <h3 style={{ fontSize: "0.95rem", margin: "0 0 0.4rem" }}>المقاطع</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {clips.map((c) => (
                <li key={c.id} style={{ marginBottom: "0.4rem" }}>
                  <button
                    type="button"
                    className="ds-btn ds-btn--secondary"
                    style={{ width: "100%", textAlign: "right" }}
                    disabled={busy}
                    onClick={() => void play(c)}
                  >
                    {c.titleAr} — {displayScholarLabel(c)}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {msg && <p role="status" style={{ color: "var(--color-danger, #b33)", marginTop: "0.5rem" }}>{msg}</p>}

        <button
          type="button"
          className="ds-btn ds-btn--secondary"
          style={{ width: "100%", marginTop: "1rem" }}
          onClick={onClose}
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
