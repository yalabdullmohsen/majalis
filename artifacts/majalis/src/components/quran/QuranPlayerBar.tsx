import { useState } from "react";
import { RECITERS } from "@/lib/quran-audio";
import type { PlayerState } from "@/hooks/useAyahPlayer";

type Props = {
  surahName: string;
  surahNum: number;
  totalAyahs: number;
  currentAyah: number | null;
  playerState: PlayerState;
  reciterId: string;
  fontScale: number;
  showAyahNumbers: boolean;
  prevSurah: number | null;
  nextSurah: number | null;
  onReciterChange: (id: string) => void;
  onFontScale: (delta: number) => void;
  onToggleAyahNumbers: () => void;
  onPrevSurah: () => void;
  onNextSurah: () => void;
  onStop: () => void;
  onPlayFromAyah: (ayah: number) => void;
  onPause: () => void;
  onResume: () => void;
};

const STATE_LABEL: Record<PlayerState, string> = {
  idle: "توقف",
  loading: "جاري التحميل…",
  playing: "يُشغِّل",
  paused: "متوقف مؤقتاً",
  error: "خطأ في التحميل",
};

export function QuranPlayerBar(p: Props) {
  const [reciterOpen, setReciterOpen] = useState(false);
  const currentReciter = RECITERS.find((r) => r.id === p.reciterId);

  return (
    <div className="qs-player-bar" role="region" aria-label="مشغّل القرآن">
      {/* Surah nav */}
      <div className="qs-player-bar__nav">
        <button
          type="button"
          className="qs-pb-btn"
          onClick={p.onPrevSurah}
          disabled={!p.prevSurah}
          aria-label="السورة السابقة"
        >
          ‹ سابقة
        </button>
        <span className="qs-pb-surah-name">{p.surahName}</span>
        <button
          type="button"
          className="qs-pb-btn"
          onClick={p.onNextSurah}
          disabled={!p.nextSurah}
          aria-label="السورة التالية"
        >
          تالية ›
        </button>
      </div>

      {/* Player status */}
      <div className="qs-player-bar__status">
        {p.currentAyah !== null ? (
          <>
            <span className="qs-pb-state-label qs-pb-state-label--active">
              {STATE_LABEL[p.playerState]}
            </span>
            <span className="qs-pb-ayah-info">
              آية {p.currentAyah} / {p.totalAyahs}
            </span>
            {p.playerState === "playing" && (
              <button type="button" className="qs-pb-btn qs-pb-btn--primary" onClick={p.onPause}>
                ❚❚ إيقاف
              </button>
            )}
            {p.playerState === "paused" && (
              <button type="button" className="qs-pb-btn qs-pb-btn--primary" onClick={p.onResume}>
                ▶ استئناف
              </button>
            )}
            <button type="button" className="qs-pb-btn" onClick={p.onStop}>
              ■ إيقاف كلي
            </button>
          </>
        ) : (
          <span className="qs-pb-state-label">اضغط ▶ على أي آية للتشغيل</span>
        )}
      </div>

      {/* Settings row */}
      <div className="qs-player-bar__settings">
        {/* Reciter picker */}
        <div className="qs-reciter-picker">
          <button
            type="button"
            className="qs-pb-btn qs-reciter-picker__toggle"
            onClick={() => setReciterOpen((v) => !v)}
            aria-expanded={reciterOpen}
          >
            القارئ: {currentReciter?.nameAr ?? "—"}
          </button>
          {reciterOpen && (
            <div className="qs-reciter-picker__dropdown" role="listbox" aria-label="اختر القارئ">
              {RECITERS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="option"
                  aria-selected={r.id === p.reciterId}
                  className={`qs-reciter-option${r.id === p.reciterId ? " is-selected" : ""}`}
                  onClick={() => { p.onReciterChange(r.id); setReciterOpen(false); }}
                >
                  {r.nameAr}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font size */}
        <div className="qs-pb-font-ctrl" aria-label="حجم الخط">
          <button type="button" className="qs-pb-btn" onClick={() => p.onFontScale(-2)} aria-label="تصغير الخط">أ-</button>
          <button type="button" className="qs-pb-btn" onClick={() => p.onFontScale(+2)} aria-label="تكبير الخط">أ+</button>
        </div>

        {/* Ayah numbers toggle */}
        <label className="qs-pb-toggle" aria-label="إظهار أرقام الآيات">
          <input
            type="checkbox"
            checked={p.showAyahNumbers}
            onChange={p.onToggleAyahNumbers}
          />
          أرقام الآيات
        </label>
      </div>
    </div>
  );
}
