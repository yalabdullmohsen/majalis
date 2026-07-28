/**
 * Multi-verse audio block grouping + loop helpers for memorization.
 */

import {
  advanceAfterAyahEnded,
  createLoopRuntime,
  normalizeLoopConfig,
  type AyahLoopConfig,
  type AyahLoopRuntime,
} from "@/lib/ayah-loop-controller";
import { idbPut, OFFLINE_STORES } from "@/lib/offline-db";

export type VerseAudioBlock = {
  surah: number;
  startAyah: number;
  endAyah: number;
  blockSize: number;
  blockRepeats: number;
  interAyahDelayMs: number;
  interBlockDelayMs: number;
};

export type VerseBlockRuntime = {
  block: VerseAudioBlock;
  blockIndex: number;
  blockRepeatDone: number;
  currentAyah: number;
  loop: AyahLoopRuntime;
  active: boolean;
};

export type VerseBlockAdvance =
  | { action: "play"; ayah: number; delayMs: number; blockIndex: number }
  | { action: "done" };

const LS_KEY = "majalis-verse-audio-blocks-v1";

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
  return {
    surah: Math.max(1, Math.min(114, Math.floor(partial.surah))),
    startAyah: base.startAyah,
    endAyah: base.endAyah,
    blockSize,
    blockRepeats: Math.max(1, Math.min(20, Math.floor(partial.blockRepeats ?? 3))),
    interAyahDelayMs: base.delayMs,
    interBlockDelayMs: Math.max(0, Math.min(30_000, Math.floor(partial.interBlockDelayMs ?? 800))),
  };
}

export function countBlocksInRange(block: VerseAudioBlock): number {
  return Math.ceil((block.endAyah - block.startAyah + 1) / block.blockSize);
}

export function blockBoundsAt(
  block: VerseAudioBlock,
  blockIndex: number,
): { start: number; end: number } | null {
  if (blockIndex < 0 || blockIndex >= countBlocksInRange(block)) return null;
  const start = block.startAyah + blockIndex * block.blockSize;
  const end = Math.min(block.endAyah, start + block.blockSize - 1);
  return { start, end };
}

function loopFor(block: VerseAudioBlock, blockIndex: number): AyahLoopConfig | null {
  const b = blockBoundsAt(block, blockIndex);
  if (!b) return null;
  return { startAyah: b.start, endAyah: b.end, repeatCount: 1, delayMs: block.interAyahDelayMs };
}

export function createVerseBlockRuntime(block: VerseAudioBlock): VerseBlockRuntime {
  const cfg = loopFor(block, 0)!;
  return {
    block,
    blockIndex: 0,
    blockRepeatDone: 0,
    currentAyah: cfg.startAyah,
    loop: createLoopRuntime(cfg),
    active: true,
  };
}

export function advanceAfterBlockAyahEnded(
  runtime: VerseBlockRuntime,
  justFinishedAyah: number,
): { runtime: VerseBlockRuntime; next: VerseBlockAdvance } {
  if (!runtime.active) return { runtime, next: { action: "done" } };
  const { next, runtime: inner } = advanceAfterAyahEnded(runtime.loop, justFinishedAyah);
  if (next.action === "play") {
    return {
      runtime: { ...runtime, loop: inner, currentAyah: next.ayah },
      next: { action: "play", ayah: next.ayah, delayMs: next.delayMs, blockIndex: runtime.blockIndex },
    };
  }
  const blockRepeatDone = runtime.blockRepeatDone + 1;
  if (blockRepeatDone < runtime.block.blockRepeats) {
    const cfg = loopFor(runtime.block, runtime.blockIndex)!;
    return {
      runtime: {
        ...runtime,
        blockRepeatDone,
        loop: createLoopRuntime(cfg),
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
  const nextIndex = runtime.blockIndex + 1;
  const nextCfg = loopFor(runtime.block, nextIndex);
  if (!nextCfg) {
    return { runtime: { ...runtime, active: false, blockRepeatDone, loop: inner }, next: { action: "done" } };
  }
  return {
    runtime: {
      ...runtime,
      blockIndex: nextIndex,
      blockRepeatDone: 0,
      loop: createLoopRuntime(nextCfg),
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

export function persistVerseBlockPref(block: VerseAudioBlock): void {
  try {
    const key = `${block.surah}:${block.startAyah}-${block.endAyah}`;
    const map = JSON.parse(localStorage.getItem(LS_KEY) || "{}") as Record<string, unknown>;
    map[key] = { ...block, updatedAt: new Date().toISOString() };
    localStorage.setItem(LS_KEY, JSON.stringify(map));
    void idbPut(OFFLINE_STORES.meta, "verse-audio-blocks-v1", map).catch(() => undefined);
  } catch {
    /* ignore */
  }
}

export type { AyahLoopConfig };
