/**
 * شريط تلاوة مصغّر فوق الشريط السفلي — يظهر عند الخروج من المصحف أثناء التشغيل.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Pause, Play, X } from "lucide-react";
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
      <button
        type="button"
        className="quran-mini-player__toggle"
        aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
        onClick={() => {
          const engine = AudioEngine.getInstance();
          if (snap.surah != null && snap.ayah != null) {
            void engine.togglePlay(snap.surah, snap.ayah);
          }
        }}
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>
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
