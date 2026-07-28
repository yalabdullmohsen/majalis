/**
 * Ephemeral resource registry — canvases / audio disposers for pressure purge.
 * Components may register without UI changes; purge is logic-only.
 */
import { releaseCanvasResources } from "@/lib/canvas-gl-cleanup";
import { disposeAudioContextSafe } from "@/lib/quran-engine-teardown";

const canvasRefs = new Set<WeakRef<HTMLCanvasElement>>();
const audioDisposers = new Set<() => void>();
const audioContexts = new Set<WeakRef<AudioContext>>();

export function registerEphemeralCanvas(canvas: HTMLCanvasElement): () => void {
  const ref = new WeakRef(canvas);
  canvasRefs.add(ref);
  return () => canvasRefs.delete(ref);
}

export function registerAudioDisposer(dispose: () => void): () => void {
  audioDisposers.add(dispose);
  return () => audioDisposers.delete(dispose);
}

export function registerAudioContext(ctx: AudioContext): () => void {
  const ref = new WeakRef(ctx);
  audioContexts.add(ref);
  return () => audioContexts.delete(ref);
}

/** Purge off-screen / registered canvases and decoding nodes. */
export function purgeEphemeralMediaResources(): {
  canvases: number;
  audioDisposers: number;
  audioContexts: number;
} {
  let canvases = 0;
  for (const ref of [...canvasRefs]) {
    const el = ref.deref();
    if (!el) {
      canvasRefs.delete(ref);
      continue;
    }
    // Off-screen or zero-size → safe to release GPU buffers
    let offscreen = true;
    try {
      const rect = el.getBoundingClientRect();
      offscreen =
        rect.width < 1 ||
        rect.height < 1 ||
        rect.bottom < 0 ||
        rect.right < 0 ||
        rect.top > (typeof window !== "undefined" ? window.innerHeight : 0) ||
        rect.left > (typeof window !== "undefined" ? window.innerWidth : 0);
    } catch {
      offscreen = true;
    }
    if (offscreen) {
      releaseCanvasResources(el);
      canvases += 1;
    }
  }

  let disposedAudio = 0;
  for (const dispose of [...audioDisposers]) {
    try {
      dispose();
      disposedAudio += 1;
    } catch {
      /* ignore */
    }
  }
  audioDisposers.clear();

  let ctxClosed = 0;
  for (const ref of [...audioContexts]) {
    const ctx = ref.deref();
    audioContexts.delete(ref);
    if (!ctx) continue;
    disposeAudioContextSafe(ctx);
    ctxClosed += 1;
  }

  return { canvases, audioDisposers: disposedAudio, audioContexts: ctxClosed };
}

export function __resetEphemeralRegistryForTests(): void {
  canvasRefs.clear();
  audioDisposers.clear();
  audioContexts.clear();
}
