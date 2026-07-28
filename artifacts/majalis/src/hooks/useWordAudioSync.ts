/**
 * مزامنة كلمة↔صوت — يفضّل طوابع زمنية حقيقية ثم التقدير المتساوي.
 */
import { useEffect, useRef, useState, type RefObject } from "react";
import { loadWordTimestamps } from "@/lib/ayah-word-timestamps";

export function useWordAudioSync(
  audioRef: RefObject<HTMLAudioElement | null>,
  opts: {
    playing: boolean;
    wordCount: number;
    surah?: number;
    ayah?: number | null;
    reciterId?: string;
    /** عند توفر طوابع زمنية (ثوانٍ من بداية الآية) تُفضَّل على التقسيم المتساوي. */
    wordTimestamps?: number[] | null;
  },
): number | null {
  const { playing, wordCount, wordTimestamps, surah, ayah, reciterId } = opts;
  const [wordIndex, setWordIndex] = useState<number | null>(null);
  const [resolvedTs, setResolvedTs] = useState<number[] | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setResolvedTs(null);
    if (!playing || !surah || !ayah || !reciterId || wordCount <= 0) return;
    let alive = true;
    const audio = audioRef.current;
    const duration = audio && Number.isFinite(audio.duration) ? audio.duration : undefined;
    void loadWordTimestamps(surah, ayah, wordCount, reciterId, duration).then((ts) => {
      if (alive) setResolvedTs(ts);
    });
    return () => { alive = false; };
  }, [audioRef, playing, wordCount, surah, ayah, reciterId]);

  useEffect(() => {
    if (!playing || wordCount <= 0) {
      setWordIndex(null);
      return;
    }

    const stamps = wordTimestamps && wordTimestamps.length === wordCount
      ? wordTimestamps
      : resolvedTs && resolvedTs.length === wordCount
        ? resolvedTs
        : null;

    const tick = () => {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const t = audio.currentTime;
      let idx: number;
      if (stamps) {
        idx = 0;
        for (let i = 0; i < stamps.length; i++) {
          if (t >= (stamps[i] ?? 0)) idx = i;
          else break;
        }
      } else {
        const ratio = Math.min(1, Math.max(0, t / audio.duration));
        idx = Math.min(wordCount - 1, Math.floor(ratio * wordCount));
      }
      setWordIndex((prev) => (prev === idx ? prev : idx));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [audioRef, playing, wordCount, wordTimestamps, resolvedTs]);

  return wordIndex;
}
