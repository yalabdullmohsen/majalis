/**
 * Master polish — monomorphic object / TypedArray pools for hot loops.
 * Reuses fixed-shape objects and scratch buffers to avoid V8 deopts + GC.
 * Logic-only — no UI.
 */

/** Fixed-shape scratch object for scroll/audio tick samples (monomorphic). */
export type TickSample = {
  t: number;
  v: number;
  i: number;
  flag: number;
};

export function createTickSamplePool(size = 64): {
  acquire: () => TickSample;
  release: (s: TickSample) => void;
  size: () => number;
} {
  const free: TickSample[] = [];
  for (let i = 0; i < size; i++) {
    free.push({ t: 0, v: 0, i: 0, flag: 0 });
  }
  return {
    acquire() {
      const s = free.pop();
      if (s) {
        s.t = 0;
        s.v = 0;
        s.i = 0;
        s.flag = 0;
        return s;
      }
      return { t: 0, v: 0, i: 0, flag: 0 };
    },
    release(s) {
      if (free.length < size * 2) free.push(s);
    },
    size: () => free.length,
  };
}

/** Grow-only typed array scratch — stable V8 shape, never shrinks. */
export function createTypedArrayPool(initialBytes = 4096): {
  u8: (minBytes: number) => Uint8Array;
  f32: (minFloats: number) => Float32Array;
  capacity: () => number;
} {
  let u8buf = new Uint8Array(initialBytes);
  let f32buf = new Float32Array(Math.max(256, initialBytes >> 2));

  return {
    u8(minBytes) {
      if (u8buf.length < minBytes) {
        u8buf = new Uint8Array(Math.max(minBytes, Math.ceil(u8buf.length * 1.5)));
      }
      return u8buf.subarray(0, minBytes);
    },
    f32(minFloats) {
      if (f32buf.length < minFloats) {
        f32buf = new Float32Array(Math.max(minFloats, Math.ceil(f32buf.length * 1.5)));
      }
      return f32buf.subarray(0, minFloats);
    },
    capacity: () => u8buf.length,
  };
}

/** Shared process-wide pools for audio/search hot paths. */
export const GLOBAL_TICK_POOL = createTickSamplePool(128);
export const GLOBAL_TYPED_POOL = createTypedArrayPool(8192);

/**
 * Seal a plain config object so V8 keeps a monomorphic shape in hot comparisons.
 * Returns the same reference (mutates in place via Object.seal).
 */
export function sealMonomorphic<T extends object>(obj: T): T {
  try {
    return Object.seal(obj);
  } catch {
    return obj;
  }
}
