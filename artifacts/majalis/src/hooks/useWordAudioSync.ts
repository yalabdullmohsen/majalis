/**
 * مزامنة كلمة↔صوت تقريبية عندما لا تتوفر طوابع زمنية لكلمة.
 * يقسم مدة الآية على عدد الكلمات ويحدّث الفهرس عبر rAF.
 */
import { useEffect, useRef, useState, type RefObject } from "react";

export function useWordAudioSync(
  audioRef: RefObject<HTMLAudioElement | null>,
  opts: {
    playing: boolean;
    wordCount: number;
    /** عند توفر طوابع زمنية (ثوانٍ من بداية الآية) تُفضَّل على التقسيم المتساوي. */
    wordTimestamps?: number[] | null;
  },
): number | null {
  const { playing, wordCount, wordTimestamps } = opts;
  const [wordIndex, setWordIndex] = useState<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing || wordCount <= 0) {
      setWordIndex(null);
      return;
    }

    const tick = () => {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const t = audio.currentTime;
      let idx: number;
      if (wordTimestamps && wordTimestamps.length === wordCount) {
        idx = 0;
        for (let i = 0; i < wordTimestamps.length; i++) {
          if (t >= (wordTimestamps[i] ?? 0)) idx = i;
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
  }, [audioRef, playing, wordCount, wordTimestamps]);

  return wordIndex;
}
