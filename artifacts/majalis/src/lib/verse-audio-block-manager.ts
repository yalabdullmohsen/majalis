/**
 * Multi-Verse Audio Block Linking Manager.
 * Combines a contiguous range of N ayahs into one continuous playback block
 * with block-level repetition for Huffaz contextual memorization.
 * Builds on ayah-loop-controller; does not replace it.
 */

import {
  advanceAfterAyahEnded,
  createLoopRuntime,
  normalizeLoopConfig,
  type AyahLoopAdvance,
  type AyahLoopConfig,
  type AyahLoopRuntime,
} from "@/lib/ayah-loop-controller";
import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";

export type VerseAudioBlock = {
  surah: number;
  /** Inclusive start ayah */
  startAyah: number;
  /** Inclusive end ayah */
  endAyah: number;
  /** Verses per continuous block (chunk size within the range) */
  blockSize: number;
  /** How many times to repeat each block before advancing */
  blockRepeats: number;
  /** Silent delay between ayahs inside a block (ms) */
  interAyahDelayMs: number;
  /** Silent delay after a full block before repeat/next (ms) */
  interBlockDelayMs: number;
};

export type VerseBlockRuntime = {
  block: VerseAudioBlock;
  /** 0-based index of the active sub-block within the range */
  blockIndex: number;
  /** Completed repeats of the current sub-block */
  blockRepeatDone: number;
  /** Active ayah within the current sub-block */
  currentAyah: number;
  /** Nested single-pass loop for the current sub-block */
  loop: AyahLoopRuntime;
  active: boolean;
};

export type VerseBlockAdvance =
  | { action: "play"; ayah: number; delayMs: number; blockIndex: number }
  | { action: "done" };

const LS_KEY = "majalis-verse-audio-blocks-v1";
const IDB_KEY = "verse-audio-blocks-v1";

export function normalizeVerseAudioBlock(
  partial: Partial<VerseAudioBlock> & { surah: number; startAyah: number },
  totalAyahs: number,
): VerseAudioBlock {
  const base = normalizeLoopConfig(
    {
      startAyah: partial.startAyah,
      endAyah: partial.endAyah,
      repeatCount: 1,
      delayMs: partial.interAyahDelayMs ?? 200,
    },
    totalAyahs,
  );
  const span = base.endAyah - base.startAyah + 1;
  const blockSize = Math.max(1, Math.min(span, Math.floor(partial.blockSize ?? Math.min(3, span))));
  const blockRepeats = Math.max(1, Math.min(20, Math.floor(partial.blockRepeats ?? 3)));
  return {
    surah: Math.max(1, Math.min(114, Math.floor(partial.surah))),
    startAyah: base.startAyah,
    endAyah: base.endAyah,
    blockSize,
    blockRepeats,
    interAyahDelayMs: base.delayMs,
    interBlockDelayMs: Math.max(0, Math.min(30_000, Math.floor(partial.interBlockDelayMs ?? 800))),
  };
}

export function countBlocksInRange(block: VerseAudioBlock): number {
  const span = block.endAyah - block.startAyah + 1;
  return Math.ceil(span / block.blockSize);
}

export function blockBoundsAt(
  block: VerseAudioBlock,
  blockIndex: number,
): { start: number; end: number } | null {
  const total = countBlocksInRange(block);
  if (blockIndex < 0 || blockIndex >= total) return null;
  const start = block.startAyah + blockIndex * block.blockSize;
  const end = Math.min(block.endAyah, start + block.blockSize - 1);
  return { start, end };
}

function loopConfigForSubBlock(block: VerseAudioBlock, blockIndex: number): AyahLoopConfig | null {
  const bounds = blockBoundsAt(block, blockIndex);
  if (!bounds) return null;
  return {
    startAyah: bounds.start,
    endAyah: bounds.end,
    repeatCount: 1, // one pass; outer manager handles block repeats
    delayMs: block.interAyahDelayMs,
  };
}

export function createVerseBlockRuntime(block: VerseAudioBlock): VerseBlockRuntime {
  const cfg = loopConfigForSubBlock(block, 0)!;
  return {
    block,
    blockIndex: 0,
    blockRepeatDone: 0,
    currentAyah: cfg.startAyah,
    loop: createLoopRuntime(cfg),
    active: true,
  };
}

/**
 * After an ayah ends inside a multi-verse block, decide next play.
 * Pure — caller applies delayMs.
 */
export function advanceAfterBlockAyahEnded(
  runtime: VerseBlockRuntime,
  justFinishedAyah: number,
): { runtime: VerseBlockRuntime; next: VerseBlockAdvance } {
  if (!runtime.active) {
    return { runtime, next: { action: "done" } };
  }

  const { next, runtime: inner } = advanceAfterAyahEnded(runtime.loop, justFinishedAyah);

  if (next.action === "play") {
    return {
      runtime: {
        ...runtime,
        loop: inner,
        currentAyah: next.ayah,
      },
      next: {
        action: "play",
        ayah: next.ayah,
        delayMs: next.delayMs,
        blockIndex: runtime.blockIndex,
      },
    };
  }

  // Finished one pass of the current sub-block
  const blockRepeatDone = runtime.blockRepeatDone + 1;
  if (blockRepeatDone < runtime.block.blockRepeats) {
    const cfg = loopConfigForSubBlock(runtime.block, runtime.blockIndex)!;
    const loop = createLoopRuntime(cfg);
    return {
      runtime: {
        ...runtime,
        blockRepeatDone,
        loop,
        currentAyah: cfg.startAyah,
      },
      next: {
        action: "play",
        ayah: cfg.startAyah,
        delayMs: runtime.block.interBlockDelayMs,
        blockIndex: runtime.blockIndex,
      },
    };
  }

  // Advance to next sub-block
  const nextIndex = runtime.blockIndex + 1;
  const nextCfg = loopConfigForSubBlock(runtime.block, nextIndex);
  if (!nextCfg) {
    return {
      runtime: { ...runtime, active: false, blockRepeatDone, loop: inner },
      next: { action: "done" },
    };
  }

  const loop = createLoopRuntime(nextCfg);
  return {
    runtime: {
      ...runtime,
      blockIndex: nextIndex,
      blockRepeatDone: 0,
      loop,
      currentAyah: nextCfg.startAyah,
      active: true,
    },
    next: {
      action: "play",
      ayah: nextCfg.startAyah,
      delayMs: runtime.block.interBlockDelayMs,
      blockIndex: nextIndex,
    },
  };
}

export type SavedVerseBlockPref = {
  surah: number;
  startAyah: number;
  endAyah: number;
  blockSize: number;
  blockRepeats: number;
  updatedAt: string;
};

function readPrefs(): Record<string, SavedVerseBlockPref> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SavedVerseBlockPref>) : {};
  } catch {
    return {};
  }
}

function writePrefs(map: Record<string, SavedVerseBlockPref>): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_KEY, map).catch(() => undefined);
}

export function saveVerseBlockPref(pref: Omit<SavedVerseBlockPref, "updatedAt">): SavedVerseBlockPref {
  const key = `${pref.surah}:${pref.startAyah}-${pref.endAyah}`;
  const full: SavedVerseBlockPref = { ...pref, updatedAt: new Date().toISOString() };
  const map = readPrefs();
  map[key] = full;
  writePrefs(map);
  return full;
}

export function loadVerseBlockPref(surah: number, startAyah: number, endAyah: number): SavedVerseBlockPref | null {
  return readPrefs()[`${surah}:${startAyah}-${endAyah}`] || null;
}

export async function loadVerseBlockPrefsAsync(): Promise<Record<string, SavedVerseBlockPref>> {
  try {
    const fromIdb = await idbGetValue<Record<string, SavedVerseBlockPref>>(OFFLINE_STORES.meta, IDB_KEY);
    if (fromIdb) {
      writePrefs({ ...readPrefs(), ...fromIdb });
      return fromIdb;
    }
  } catch {
    /* fall through */
  }
  return readPrefs();
}

/** Convert a VerseAudioBlock into a classic AyahLoopConfig for single-pass range play. */
export function verseBlockToLoopConfig(block: VerseAudioBlock): AyahLoopConfig {
  return {
    startAyah: block.startAyah,
    endAyah: block.endAyah,
    repeatCount: block.blockRepeats,
    delayMs: block.interAyahDelayMs,
  };
}
