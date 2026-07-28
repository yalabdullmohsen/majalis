import { useEffect, useRef, useState } from "react";
import type { Ayah } from "@/lib/quran-api";
import { withScrollAnchorStability } from "@/lib/scroll-anchor-stability";
import { markJourneyStart, endJourney } from "@/lib/journey-perf";

const CHUNK_SIZE = 60;

/**
 * Renders ayahs in progressive chunks using IntersectionObserver.
 * Preserves the continuous inline mushaf layout while avoiding
 * DOM bloat for long surahs (e.g. Al-Baqarah with 286 ayahs).
 *
 * Part 17: scroll-anchor stability across chunk recycling (no CSS changes).
 */
export function useAyahChunks(ayahs: Ayah[], targetAyah: number) {
  const totalChunks = Math.ceil(ayahs.length / CHUNK_SIZE);

  // Start with the chunk that contains the target ayah
  const startChunk = Math.max(0, Math.floor((targetAyah - 1) / CHUNK_SIZE));
  // Show one chunk before the target for context, plus the target chunk
  const initialChunks = Math.min(totalChunks, startChunk + 2);

  const [visibleChunks, setVisibleChunks] = useState(initialChunks || 1);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const ttfvMarked = useRef(false);

  // Reset visible chunks when surah changes
  useEffect(() => {
    withScrollAnchorStability(() => {
      setVisibleChunks(initialChunks || 1);
    });
    ttfvMarked.current = false;
    markJourneyStart("ttfv-interactive");
  }, [ayahs, initialChunks]);

  // First interactive verse budget
  useEffect(() => {
    if (ttfvMarked.current) return;
    if (visibleChunks > 0 && ayahs.length > 0) {
      ttfvMarked.current = true;
      endJourney("ttfv-interactive");
    }
  }, [visibleChunks, ayahs.length]);

  // IntersectionObserver: load next chunk when sentinel enters viewport
  useEffect(() => {
    if (visibleChunks >= totalChunks) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          withScrollAnchorStability(
            () => {
              setVisibleChunks((v) => Math.min(v + 1, totalChunks));
            },
            sentinel,
          );
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
