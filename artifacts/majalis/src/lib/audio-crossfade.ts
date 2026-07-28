/**
 * Master polish — silent audio crossfade between elements.
 * Eliminates click/pop on rapid reciter / verse switches via gain ramps.
 * Logic-only — no UI.
 */

export type CrossfadeHandle = {
  fadeOut: (audio: HTMLAudioElement, ms?: number) => Promise<void>;
  fadeIn: (audio: HTMLAudioElement, ms?: number) => Promise<void>;
  dispose: () => void;
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Create a crossfade helper using Web Audio GainNode when available,
 * else HTMLAudioElement.volume ramps (still silent enough for switches).
 */
export function createAudioCrossfade(): CrossfadeHandle {
  let ctx: AudioContext | null = null;
  const connected = new WeakMap<HTMLAudioElement, { source: MediaElementAudioSourceNode; gain: GainNode }>();

  const ensureCtx = () => {
    if (ctx) return ctx;
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      return ctx;
    } catch {
      return null;
    }
  };

  const ensureGraph = (audio: HTMLAudioElement) => {
    const c = ensureCtx();
    if (!c) return null;
    let g = connected.get(audio);
    if (g) return g;
    try {
      const source = c.createMediaElementSource(audio);
      const gain = c.createGain();
      gain.gain.value = 1;
      source.connect(gain);
      gain.connect(c.destination);
      g = { source, gain };
      connected.set(audio, g);
      return g;
    } catch {
      // Already connected elsewhere — fall back to volume
      return null;
    }
  };

  const rampVolume = (audio: HTMLAudioElement, from: number, to: number, ms: number) =>
    new Promise<void>((resolve) => {
      const start = performance.now();
      audio.volume = clamp01(from);
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / Math.max(1, ms));
        audio.volume = clamp01(from + (to - from) * t);
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });

  return {
    async fadeOut(audio, ms = 40) {
      const graph = ensureGraph(audio);
      if (graph && ctx) {
        try {
          await ctx.resume();
          const g = graph.gain.gain;
          const now = ctx.currentTime;
          g.cancelScheduledValues(now);
          g.setValueAtTime(g.value, now);
          g.linearRampToValueAtTime(0.0001, now + ms / 1000);
          await new Promise((r) => setTimeout(r, ms + 5));
          return;
        } catch {
          /* fall through */
        }
      }
      await rampVolume(audio, audio.volume || 1, 0, ms);
    },
    async fadeIn(audio, ms = 40) {
      const graph = ensureGraph(audio);
      if (graph && ctx) {
        try {
          await ctx.resume();
          const g = graph.gain.gain;
          const now = ctx.currentTime;
          g.cancelScheduledValues(now);
          g.setValueAtTime(0.0001, now);
          g.linearRampToValueAtTime(1, now + ms / 1000);
          await new Promise((r) => setTimeout(r, ms + 5));
          return;
        } catch {
          /* fall through */
        }
      }
      await rampVolume(audio, 0, 1, ms);
    },
    dispose() {
      try {
        void ctx?.close();
      } catch {
        /* ignore */
      }
      ctx = null;
    },
  };
}
