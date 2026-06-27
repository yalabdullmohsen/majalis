import type { QuranAudioState } from "@/hooks/useQuranAudio";

type Props = {
  audio: QuranAudioState;
  onPrevSurah?: () => void;
  onNextSurah?: () => void;
};

export function QuranAudioPlayer({ audio, onPrevSurah, onNextSurah }: Props) {
  const {
    audioRef, reciter, playing, togglePlay, currentTime, duration, seek,
    rate, setRate, loop, setLoop, formatTime, setPickerOpen,
  } = audio;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <section className="quran-v2-player ui-card" aria-label="مشغل التلاوة">
      <audio ref={audioRef} preload="metadata" className="sr-only" />

      <div className="quran-v2-player__reciter">
        <button type="button" className="quran-v2-player__reciter-btn" onClick={() => setPickerOpen(true)}>
          <span className="quran-v2-reciter-card__avatar">{reciter.name.slice(0, 2)}</span>
          <span>
            <strong>{reciter.name}</strong>
            <small>{reciter.bio.slice(0, 60)}…</small>
          </span>
        </button>
      </div>

      <div className="quran-v2-player__controls">
        <button type="button" className="quran-v2-player__btn" onClick={onPrevSurah} aria-label="السورة السابقة">⏮</button>
        <button type="button" className="quran-v2-player__btn quran-v2-player__btn--main" onClick={togglePlay} aria-label={playing ? "إيقاف" : "تشغيل"}>
          {playing ? "⏸" : "▶"}
        </button>
        <button type="button" className="quran-v2-player__btn" onClick={onNextSurah} aria-label="السورة التالية">⏭</button>
      </div>

      <div className="quran-v2-player__progress">
        <span className="quran-v2-player__time">{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className="quran-v2-player__slider"
          aria-label="شريط التقدم"
        />
        <span className="quran-v2-player__time">{formatTime(duration)}</span>
      </div>

      <div className="quran-v2-player__extras">
        <label>
          السرعة
          <select
            value={rate}
            onChange={(e) => setRate(Number(e.target.value) as 0.75 | 1 | 1.25 | 1.5)}
            aria-label="سرعة التشغيل"
          >
            <option value={0.75}>0.75×</option>
            <option value={1}>1×</option>
            <option value={1.25}>1.25×</option>
            <option value={1.5}>1.5×</option>
          </select>
        </label>
        <button
          type="button"
          className={`quran-v2-player__chip${loop ? " is-active" : ""}`}
          onClick={() => setLoop(!loop)}
        >
          تكرار
        </button>
      </div>
    </section>
  );
}
