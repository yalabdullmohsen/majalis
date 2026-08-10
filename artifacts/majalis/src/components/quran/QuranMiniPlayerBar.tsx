/**
 * شريط تلاوة مصغّر فوق الشريط السفلي — يستمر عبر التنقّل عبر AudioEngine.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { AudioEngine, type AudioEngineSnapshot } from "@/core/audio/AudioEngine";
import { getSurahMeta } from "@/lib/quran-api";
import { getReciter } from "@/lib/quran-audio";
import { ayahKeyToPage } from "@/lib/quran-my-bookmarks";
import { toArabicDigits } from "@/lib/utils";
import {
  hideMiniPlayer,
  stopMiniPlayer,
  subscribeMiniPlayer,
} from "@/lib/quran-mini-player";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { useMediaSession } from "@/hooks/useMediaSession";
import "@/styles/components/quran-mini-player.css";

function formatClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "٠:٠٠";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${toArabicDigits(m)}:${toArabicDigits(String(s).padStart(2, "0"))}`;
}

function rateLabel(rate: number): string {
  if (Math.abs(rate - 1.25) < 0.01) return "1.25×";
  if (Math.abs(rate - 1.5) < 0.01) return "1.5×";
  return "1×";
}

export function QuranMiniPlayerBar() {
  const [location, navigate] = useLocation();
  const [visible, setVisible] = useState(false);
  const [snap, setSnap] = useState<AudioEngineSnapshot>(() =>
    AudioEngine.getInstance().getSnapshot(),
  );

  useEffect(() => subscribeMiniPlayer((s) => setVisible(s.visible)), []);

  useEffect(() => {
    const engine = AudioEngine.getInstance();
    return engine.onSnapshot(setSnap);
  }, []);

  const surahForSession = snap.surah != null ? getSurahMeta(snap.surah).name : "";
  const playing = snap.playerState === "playing" || snap.playerState === "buffering";
  useMediaSession(
    visible && snap.surah != null && snap.ayah != null
      ? {
          title: `${surahForSession} — آية ${toArabicDigits(snap.ayah)}`,
          artist: getReciter(snap.reciterId).nameAr,
          playing,
          onPlay: () => {
            if (snap.surah != null && snap.ayah != null) {
              void AudioEngine.getInstance().togglePlay(snap.surah, snap.ayah);
            }
          },
          onPause: () => AudioEngine.getInstance().pause(),
          onStop: () => stopMiniPlayer(),
          onNext: () => {
            void AudioEngine.getInstance().skipNext();
          },
          onPrevious: () => {
            void AudioEngine.getInstance().skipPrev();
          },
        }
      : null,
  );

  useEffect(() => {
    if (isImmersiveChromePath(location) && visible) {
      hideMiniPlayer();
    }
  }, [location, visible]);

  if (!visible || isImmersiveChromePath(location)) return null;
  if (snap.surah == null || snap.ayah == null) return null;

  const surahName = getSurahMeta(snap.surah).name.replace(/^سُورَةُ\s*/u, "");
  const page = ayahKeyToPage(`${snap.surah}:${snap.ayah}`);
  const duration = snap.duration > 0 ? snap.duration : 0;
  const progress = duration > 0 ? Math.min(1, snap.currentTime / duration) : 0;
  const engine = AudioEngine.getInstance();

  return (
    <div className="quran-mini-player" role="region" aria-label="تشغيل التلاوة">
      <button
        type="button"
        className="quran-mini-player__meta"
        onClick={() => navigate(`/mushaf/page/${page}?ayah=${snap.surah}:${snap.ayah}`)}
      >
        <strong>{surahName}</strong>
        <span>آية {toArabicDigits(snap.ayah)}</span>
      </button>

      <div className="quran-mini-player__controls">
        <button
          type="button"
          className="quran-mini-player__btn"
          aria-label="الآية السابقة"
          onClick={() => void engine.skipPrev()}
        >
          <SkipBack size={18} />
        </button>
        <button
          type="button"
          className="quran-mini-player__toggle"
          aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
          onClick={() => {
            if (snap.surah != null && snap.ayah != null) {
              void engine.togglePlay(snap.surah, snap.ayah);
            }
          }}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          type="button"
          className="quran-mini-player__btn"
          aria-label="الآية التالية"
          onClick={() => void engine.skipNext()}
        >
          <SkipForward size={18} />
        </button>
        <button
          type="button"
          className="quran-mini-player__rate"
          aria-label={`سرعة التشغيل ${rateLabel(snap.playbackRate)}`}
          onClick={() => engine.cycleMiniPlayerRate()}
        >
          {rateLabel(snap.playbackRate)}
        </button>
      </div>

      <div className="quran-mini-player__seek">
        <span className="quran-mini-player__time" aria-hidden="true">
          {formatClock(snap.currentTime)}
        </span>
        <input
          type="range"
          className="quran-mini-player__range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={Number.isFinite(snap.currentTime) ? snap.currentTime : 0}
          disabled={duration <= 0}
          aria-label="شريط التقدم"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(snap.currentTime)}
          style={{ ["--qmp-progress" as string]: String(progress) }}
          onChange={(e) => engine.seek(Number(e.target.value))}
        />
        <span className="quran-mini-player__time" aria-hidden="true">
          {formatClock(duration)}
        </span>
      </div>

      <button
        type="button"
        className="quran-mini-player__close"
        aria-label="إيقاف وإغلاق المشغّل"
        onClick={() => stopMiniPlayer()}
      >
        <X size={18} />
      </button>
    </div>
  );
}
