import { useEffect, useRef, useState } from "react";
import type { Ayah } from "@/lib/quran-api";

const CHUNK_SIZE = 60;

/**
 * Renders ayahs in progressive chunks using IntersectionObserver.
 * Preserves the continuous inline mushaf layout while avoiding
 * DOM bloat for long surahs (e.g. Al-Baqarah with 286 ayahs).
 */
export function useAyahChunks(ayahs: Ayah[], targetAyah: number) {
  const totalChunks = Math.ceil(ayahs.length / CHUNK_SIZE);

  // Start with the chunk that contains the target ayah
  const startChunk = Math.max(0, Math.floor((targetAyah - 1) / CHUNK_SIZE));
  // Show one chunk before the target for context, plus the target chunk
  const initialChunks = Math.min(totalChunks, startChunk + 2);

  const [visibleChunks, setVisibleChunks] = useState(initialChunks || 1);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset visible chunks when surah changes
  useEffect(() => {
    setVisibleChunks(initialChunks || 1);
  }, [ayahs, initialChunks]);

  // IntersectionObserver: load next chunk when sentinel enters viewport
  useEffect(() => {
    if (visibleChunks >= totalChunks) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleChunks((v) => Math.min(v + 1, totalChunks));
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [visibleChunks, totalChunks]);

  const visibleAyahs = ayahs.slice(0, visibleChunks * CHUNK_SIZE);
  const hasMore = visibleChunks < totalChunks;

  return { visibleAyahs, hasMore, sentinelRef, visibleChunks, totalChunks };
}
