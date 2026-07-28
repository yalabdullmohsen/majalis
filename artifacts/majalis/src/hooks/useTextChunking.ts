import { useCallback, useEffect, useMemo, useState } from "react";
import {
  advanceChunk,
  chunkText,
  initChunkProgress,
  loadChunkProgress,
  loadChunkProgressAsync,
  setChunkIndex,
  type ChunkProgressState,
  type ContentChunk,
  type ChunkingOptions,
} from "@/lib/text-chunking-service";

/** Fast-reading chunking — logic only. */
export function useTextChunking(
  contentId: string,
  text: string,
  opts?: ChunkingOptions,
) {
  const chunks: ContentChunk[] = useMemo(
    () => chunkText(text, opts),
    [text, opts?.targetChars, opts?.preferBoundaries],
  );

  const [progress, setProgress] = useState<ChunkProgressState | null>(() =>
    contentId ? loadChunkProgress(contentId) : null,
  );

  useEffect(() => {
    if (!contentId || !chunks.length) return;
    const init = initChunkProgress(contentId, chunks.length);
    setProgress(init);
    void loadChunkProgressAsync(contentId).then((p) => {
      if (p) setProgress(p);
    });
  }, [contentId, chunks.length]);

  const current = chunks[progress?.currentChunk ?? 0] ?? null;

  const next = useCallback(
    (dwellMs?: number) => {
      if (!contentId || !current) return null;
      const updated = advanceChunk(contentId, {
        dwellMs,
        wordsRead: current.wordCount,
      });
      setProgress(updated);
      return updated;
    },
    [contentId, current],
  );

  const goTo = useCallback(
    (index: number) => {
      if (!contentId) return null;
      const updated = setChunkIndex(contentId, index);
      setProgress(updated);
      return updated;
    },
    [contentId],
  );

  return { chunks, progress, current, next, goTo };
}
