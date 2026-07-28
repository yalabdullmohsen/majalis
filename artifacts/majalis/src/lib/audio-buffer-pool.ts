/**
 * Audio / PCM buffer object pool — recycle TypedArrays across verse transitions.
 * Avoids repeated allocate+GC during long listening sessions.
 * Logic-only — no UI.
 */

export type PooledFloat32 = {
  buffer: Float32Array;
  release: () => void;
};

export type PooledUint8 = {
  buffer: Uint8Array;
  release: () => void;
};

type PoolBucket<T extends ArrayBufferView> = {
  free: T[];
  capacity: number;
  created: number;
};

function makeFloatPool(byteLength: number, maxFree: number): PoolBucket<Float32Array> {
  return { free: [], capacity: byteLength / 4, created: 0 };
}

function makeUint8Pool(byteLength: number, maxFree: number): PoolBucket<Uint8Array> {
  return { free: [], capacity: byteLength, created: 0 };
}

const floatPools = new Map<number, PoolBucket<Float32Array>>();
const uint8Pools = new Map<number, PoolBucket<Uint8Array>>();
const MAX_FREE_PER_SIZE = 8;

function acquireFloat(samples: number): PooledFloat32 {
  const size = Math.max(1, samples | 0);
  let bucket = floatPools.get(size);
  if (!bucket) {
    bucket = makeFloatPool(size * 4, MAX_FREE_PER_SIZE);
    floatPools.set(size, bucket);
  }
  let buffer = bucket.free.pop();
  if (!buffer) {
    buffer = new Float32Array(size);
    bucket.created += 1;
  } else {
    buffer.fill(0);
  }
  let released = false;
  return {
    buffer,
    release: () => {
      if (released) return;
      released = true;
      if (bucket!.free.length < MAX_FREE_PER_SIZE) {
        bucket!.free.push(buffer!);
      }
    },
  };
}

function acquireUint8(bytes: number): PooledUint8 {
  const size = Math.max(1, bytes | 0);
  let bucket = uint8Pools.get(size);
  if (!bucket) {
    bucket = makeUint8Pool(size, MAX_FREE_PER_SIZE);
    uint8Pools.set(size, bucket);
  }
  let buffer = bucket.free.pop();
  if (!buffer) {
    buffer = new Uint8Array(size);
    bucket.created += 1;
  } else {
    buffer.fill(0);
  }
  let released = false;
  return {
    buffer,
    release: () => {
      if (released) return;
      released = true;
      if (bucket!.free.length < MAX_FREE_PER_SIZE) {
        bucket!.free.push(buffer!);
      }
    },
  };
}

/** Acquire a reusable Float32 PCM scratch buffer (cleared). */
export function acquirePcmFloat32(sampleCount: number): PooledFloat32 {
  return acquireFloat(sampleCount);
}

/** Acquire a reusable Uint8 scratch (e.g. analyser time-domain). */
export function acquireByteScratch(byteCount: number): PooledUint8 {
  return acquireUint8(byteCount);
}

/**
 * Lightweight HTMLAudioElement pool for dual-buffer / prefetch scenarios.
 * Does NOT create MediaElementSource (that can only attach once).
 */
const audioElements: HTMLAudioElement[] = [];
const MAX_AUDIO_ELEMENTS = 2;

export function acquireAudioElement(): HTMLAudioElement {
  const existing = audioElements.pop();
  if (existing) {
    try {
      existing.pause();
      existing.removeAttribute("src");
      existing.load();
    } catch {
      /* ignore */
    }
    return existing;
  }
  return new Audio();
}

export function releaseAudioElementToPool(audio: HTMLAudioElement): void {
  try {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    audio.onended = null;
    audio.onerror = null;
    audio.onplaying = null;
    audio.onpause = null;
  } catch {
    /* ignore */
  }
  if (audioElements.length < MAX_AUDIO_ELEMENTS) {
    audioElements.push(audio);
  }
}

export function getAudioPoolStats(): {
  floatBuckets: number;
  uint8Buckets: number;
  freeFloat: number;
  freeUint8: number;
  audioElements: number;
  createdFloat: number;
} {
  let freeFloat = 0;
  let freeUint8 = 0;
  let createdFloat = 0;
  for (const b of floatPools.values()) {
    freeFloat += b.free.length;
    createdFloat += b.created;
  }
  for (const b of uint8Pools.values()) freeUint8 += b.free.length;
  return {
    floatBuckets: floatPools.size,
    uint8Buckets: uint8Pools.size,
    freeFloat,
    freeUint8,
    audioElements: audioElements.length,
    createdFloat,
  };
}

export function resetAudioBufferPoolForTests(): void {
  floatPools.clear();
  uint8Pools.clear();
  audioElements.length = 0;
}
