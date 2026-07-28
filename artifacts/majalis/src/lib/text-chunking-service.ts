/**
 * Fast-Reading & Dynamic Text Chunking Service.
 * Splits long Matn / Quran page text into mobile-friendly focus chunks.
 * Persists chunk progress + reading velocity in LS + IndexedDB.
 */

import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";

export type ContentChunk = {
  index: number;
  text: string;
  startOffset: number;
  endOffset: number;
  wordCount: number;
};

export type ChunkProgressState = {
  contentId: string;
  /** 0-based index of current chunk */
  currentChunk: number;
  totalChunks: number;
  /** Cumulative reading ms for this content */
  activeMs: number;
  /** words per minute estimate */
  velocityWpm: number;
  completed: boolean;
  updatedAt: string;
};

export type ChunkingOptions = {
  /** Target characters per chunk (mobile-friendly default ~420) */
  targetChars?: number;
  /** Prefer splitting on sentence/ayah boundaries */
  preferBoundaries?: boolean;
};

const LS_KEY = "majalis-chunk-progress-v1";
const IDB_KEY = "chunk-progress-v1";
const DEFAULT_CHARS = 420;

const BOUNDARY_RE = /([.!?؟۔\n]|\u06D6|\u06D7|\u06D8|\u06D9|\u06DA|\u06DB|\u06DC|\u06DD)/;

function readProgressMap(): Record<string, ChunkProgressState> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ChunkProgressState>) : {};
  } catch {
    return {};
  }
}

function writeProgressMap(map: Record<string, ChunkProgressState>): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_KEY, map).catch(() => undefined);
}

/**
 * Split long Arabic/Latin text into digestible chunks.
 */
export function chunkText(text: string, opts?: ChunkingOptions): ContentChunk[] {
  const raw = text.replace(/\r\n/g, "\n").trim();
  if (!raw) return [];
  const target = Math.max(120, opts?.targetChars ?? DEFAULT_CHARS);
  const prefer = opts?.preferBoundaries !== false;

  const chunks: ContentChunk[] = [];
  let i = 0;
  while (i < raw.length) {
    let end = Math.min(raw.length, i + target);
    if (prefer && end < raw.length) {
      const window = raw.slice(i, Math.min(raw.length, i + target + 80));
      let best = -1;
      for (let j = target; j < window.length; j++) {
        if (BOUNDARY_RE.test(window[j]) || /\s/.test(window[j])) {
          best = j + 1;
          if (BOUNDARY_RE.test(window[j])) break;
        }
      }
      // also look slightly before target for a clean break
      if (best < 0) {
        for (let j = Math.min(target, window.length - 1); j > target * 0.55; j--) {
          if (BOUNDARY_RE.test(window[j]) || window[j] === " ") {
            best = j + 1;
            break;
          }
        }
      }
      if (best > 0) end = i + best;
    }
    const slice = raw.slice(i, end).trim();
    if (slice) {
      chunks.push({
        index: chunks.length,
        text: slice,
        startOffset: i,
        endOffset: end,
        wordCount: slice.split(/\s+/).filter(Boolean).length,
      });
    }
    i = end;
    while (i < raw.length && /\s/.test(raw[i])) i++;
  }
  return chunks;
}

/**
 * Async chunking with main-thread yields for long Matn / tafseer bodies (Part 18).
 * Short texts stay on the sync fast path.
 */
export async function chunkTextAsync(text: string, opts?: ChunkingOptions): Promise<ContentChunk[]> {
  const raw = text.replace(/\r\n/g, "\n").trim();
  if (raw.length < 4_000) return chunkText(text, opts);
  const { yieldToMain } = await import("@/lib/yield-to-main");
  await yieldToMain();
  const mid = Math.floor(raw.length / 2);
  // Split work across two yields so long tasks stay under ~50ms
  const left = chunkText(raw.slice(0, mid), opts);
  await yieldToMain();
  const right = chunkText(raw.slice(mid), opts);
  const merged = [
    ...left,
    ...right.map((c, i) => ({
      ...c,
      index: left.length + i,
      startOffset: c.startOffset + mid,
      endOffset: c.endOffset + mid,
    })),
  ];
  return merged;
}

/** Chunk a list of ayahs/lines as separate units then pack into target-size groups. */
export function chunkLines(lines: string[], opts?: ChunkingOptions): ContentChunk[] {
  const joined = lines.map((l) => l.trim()).filter(Boolean).join("\n");
  return chunkText(joined, opts);
}

export function loadChunkProgress(contentId: string): ChunkProgressState | null {
  return readProgressMap()[contentId] || null;
}

export async function loadChunkProgressAsync(contentId: string): Promise<ChunkProgressState | null> {
  try {
    const map = await idbGetValue<Record<string, ChunkProgressState>>(OFFLINE_STORES.meta, IDB_KEY);
    if (map?.[contentId]) {
      writeProgressMap({ ...readProgressMap(), [contentId]: map[contentId] });
      return map[contentId];
    }
  } catch {
    /* fall through */
  }
  return loadChunkProgress(contentId);
}

export function saveChunkProgress(state: ChunkProgressState): ChunkProgressState {
  const next = { ...state, updatedAt: new Date().toISOString() };
  const map = readProgressMap();
  map[state.contentId] = next;
  writeProgressMap(map);
  return next;
}

export function initChunkProgress(contentId: string, totalChunks: number): ChunkProgressState {
  const existing = loadChunkProgress(contentId);
  if (existing && existing.totalChunks === totalChunks) return existing;
  return saveChunkProgress({
    contentId,
    currentChunk: 0,
    totalChunks,
    activeMs: 0,
    velocityWpm: 0,
    completed: false,
    updatedAt: new Date().toISOString(),
  });
}

export function advanceChunk(
  contentId: string,
  opts?: { dwellMs?: number; wordsRead?: number },
): ChunkProgressState | null {
  const state = loadChunkProgress(contentId);
  if (!state) return null;
  const dwell = Math.max(0, opts?.dwellMs ?? 0);
  const words = Math.max(0, opts?.wordsRead ?? 0);
  const activeMs = state.activeMs + dwell;
  let velocityWpm = state.velocityWpm;
  if (dwell > 0 && words > 0) {
    const instant = words / (dwell / 60_000);
    velocityWpm = velocityWpm > 0 ? velocityWpm * 0.7 + instant * 0.3 : instant;
  }
  const onLast = state.totalChunks <= 0 || state.currentChunk >= state.totalChunks - 1;
  const nextChunk = onLast ? Math.max(0, state.totalChunks - 1) : state.currentChunk + 1;
  return saveChunkProgress({
    ...state,
    currentChunk: nextChunk,
    activeMs,
    velocityWpm: Math.round(velocityWpm),
    completed: onLast || nextChunk >= state.totalChunks - 1,
  });
}

export function setChunkIndex(contentId: string, index: number): ChunkProgressState | null {
  const state = loadChunkProgress(contentId);
  if (!state) return null;
  const currentChunk = Math.max(0, Math.min(state.totalChunks - 1, index));
  return saveChunkProgress({
    ...state,
    currentChunk,
    completed: currentChunk >= state.totalChunks - 1,
  });
}
