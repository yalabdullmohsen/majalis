import { useCallback, useRef, useState } from "react";
import {
  advanceAfterBlockAyahEnded,
  createVerseBlockRuntime,
  normalizeVerseAudioBlock,
  saveVerseBlockPref,
  type VerseAudioBlock,
  type VerseBlockAdvance,
  type VerseBlockRuntime,
} from "@/lib/verse-audio-block-manager";

/** Multi-verse audio block manager — logic only (wire into player separately). */
export function useVerseAudioBlocks(surahNum: number, totalAyahs: number) {
  const runtimeRef = useRef<VerseBlockRuntime | null>(null);
  const [runtime, setRuntime] = useState<VerseBlockRuntime | null>(null);
  const [lastAdvance, setLastAdvance] = useState<VerseBlockAdvance | null>(null);

  const startBlock = useCallback(
    (partial: Partial<VerseAudioBlock> & { startAyah: number }) => {
      const block = normalizeVerseAudioBlock({ ...partial, surah: surahNum }, totalAyahs);
      const rt = createVerseBlockRuntime(block);
      runtimeRef.current = rt;
      setRuntime(rt);
      saveVerseBlockPref({
        surah: block.surah,
        startAyah: block.startAyah,
        endAyah: block.endAyah,
        blockSize: block.blockSize,
        blockRepeats: block.blockRepeats,
      });
      return rt;
    },
    [surahNum, totalAyahs],
  );

  const onAyahEnded = useCallback((ayah: number) => {
    const current = runtimeRef.current;
    if (!current) return { action: "done" as const };
    const { runtime: nextRt, next } = advanceAfterBlockAyahEnded(current, ayah);
    runtimeRef.current = nextRt;
    setRuntime(nextRt);
    setLastAdvance(next);
    return next;
  }, []);

  const stop = useCallback(() => {
    runtimeRef.current = null;
    setRuntime(null);
    setLastAdvance(null);
  }, []);

  return { runtime, lastAdvance, startBlock, onAyahEnded, stop };
}
