/**
 * Reusable object pools — eliminate per-frame / per-tick allocations.
 * Logic-only — no UI.
 */

export type Pool<T> = {
  acquire: () => T;
  release: (item: T) => void;
  size: () => number;
  clear: () => void;
};

/**
 * Fixed-capacity object pool. Factory creates items; reset prepares for reuse.
 */
export function createObjectPool<T>(
  factory: () => T,
  reset: (item: T) => void,
  maxSize = 32,
): Pool<T> {
  const free: T[] = [];
  return {
    acquire: () => {
      const item = free.pop();
      if (item) return item;
      return factory();
    },
    release: (item: T) => {
      if (free.length >= maxSize) return;
      try {
        reset(item);
        free.push(item);
      } catch {
        /* drop */
      }
    },
    size: () => free.length,
    clear: () => {
      free.length = 0;
    },
  };
}

/** Mutable scratch for audio resume ticks — avoid `{...}` every interval. */
export type AudioResumeScratch = {
  surah: number;
  ayah: number;
  currentTime: number;
  reciterId?: string;
  updatedAt: number;
};

export const audioResumePool = createObjectPool<AudioResumeScratch>(
  () => ({ surah: 1, ayah: 1, currentTime: 0, updatedAt: 0 }),
  (o) => {
    o.surah = 1;
    o.ayah = 1;
    o.currentTime = 0;
    o.reciterId = undefined;
    o.updatedAt = 0;
  },
  8,
);

/** Scratch number arrays for search / highlight index lists. */
export const indexListPool = createObjectPool<number[]>(
  () => [],
  (a) => {
    a.length = 0;
  },
  16,
);

/** Scratch string arrays for Arabic variant expansion. */
export const stringListPool = createObjectPool<string[]>(
  () => [],
  (a) => {
    a.length = 0;
  },
  24,
);

/**
 * Fill a pooled AudioResumeScratch and return a plain frozen-enough copy
 * only when persistence needs ownership; otherwise mutate in place for staging.
 */
export function fillAudioResumeScratch(
  surah: number,
  ayah: number,
  currentTime: number,
  reciterId: string | undefined,
  updatedAt: number,
): AudioResumeScratch {
  const o = audioResumePool.acquire();
  o.surah = surah;
  o.ayah = ayah;
  o.currentTime = currentTime;
  o.reciterId = reciterId;
  o.updatedAt = updatedAt;
  return o;
}

export function releaseAudioResumeScratch(o: AudioResumeScratch): void {
  audioResumePool.release(o);
}
