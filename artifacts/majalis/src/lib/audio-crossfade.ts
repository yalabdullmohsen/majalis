/**
 * Silent WebAudio buffer transitions — eliminate pop/click on ayah/reciter swaps.
 * Uses GainNode ramps when AudioContext is available; volume fallback otherwise.
 * Logic-only — no UI.
 */

export type AudioTransitionHandle = {
  /** Fade out → swap src → play → fade in. */
  transitionTo: (url: string, opts?: { playbackRate?: number }) => Promise<void>;
  /** Instant mute (hardware-safe) before hard stop. */
  silence: () => void;
  /** Restore audible gain after silence. */
  unsilence: () => void;
  dispose: () => void;
  /** True when routed through WebAudio graph. */
  usingWebAudio: () => boolean;
};

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const FADE_OUT_SEC = 0.018;
const FADE_IN_SEC = 0.028;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Attach a one-shot MediaElementSource + GainNode graph to an HTMLAudioElement.
 * Call at most once per element (Web Audio constraint).
 */
export function attachAudioTransitionController(
  audio: HTMLAudioElement,
): AudioTransitionHandle {
  let ctx: AudioContext | null = null;
  let gain: GainNode | null = null;
  let source: MediaElementAudioSourceNode | null = null;
  let disposed = false;
  let graphReady = false;

  const ensureGraph = (): boolean => {
    if (disposed) return false;
    if (graphReady) return true;
    try {
      const AC =
        typeof AudioContext !== "undefined"
          ? AudioContext
          : (window as WebkitWindow).webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      gain = ctx.createGain();
      gain.gain.value = 1;
      source = ctx.createMediaElementSource(audio);
      source.connect(gain);
      gain.connect(ctx.destination);
      graphReady = true;
      return true;
    } catch {
      graphReady = false;
      ctx = null;
      gain = null;
      source = null;
      return false;
    }
  };

  const resumeCtx = async () => {
    if (!ctx) return;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
  };

  const rampGain = (to: number, durationSec: number) => {
    if (!ctx || !gain) return;
    const now = ctx.currentTime;
    try {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value || 0.0001), now);
      gain.gain.linearRampToValueAtTime(Math.max(0.0001, to), now + durationSec);
    } catch {
      try {
        gain.gain.value = to;
      } catch {
        /* ignore */
      }
    }
  };

  return {
    usingWebAudio: () => graphReady,

    silence: () => {
      if (ensureGraph() && gain && ctx) {
        void resumeCtx();
        rampGain(0.0001, FADE_OUT_SEC);
      } else {
        try {
          audio.volume = 0;
        } catch {
          /* ignore */
        }
      }
    },

    unsilence: () => {
      if (graphReady && gain && ctx) {
        void resumeCtx();
        rampGain(1, FADE_IN_SEC);
      } else {
        try {
          audio.volume = 1;
        } catch {
          /* ignore */
        }
      }
    },

    transitionTo: async (url: string, opts?: { playbackRate?: number }) => {
      if (disposed) return;
      const useWa = ensureGraph();
      await resumeCtx();

      if (useWa) {
        rampGain(0.0001, FADE_OUT_SEC);
        await sleep(Math.ceil(FADE_OUT_SEC * 1000));
      } else {
        try {
          audio.volume = 0;
        } catch {
          /* ignore */
        }
      }

      try {
        audio.pause();
      } catch {
        /* ignore */
      }

      audio.src = url;
      if (opts?.playbackRate != null) {
        try {
          audio.playbackRate = opts.playbackRate;
        } catch {
          /* ignore */
        }
      }

      try {
        audio.load();
      } catch {
        /* ignore */
      }

      try {
        await audio.play();
      } catch {
        /* caller handles play rejection via error listeners */
      }

      if (useWa) {
        rampGain(1, FADE_IN_SEC);
      } else {
        try {
          audio.volume = 1;
        } catch {
          /* ignore */
        }
      }
    },

    dispose: () => {
      disposed = true;
      try {
        source?.disconnect();
      } catch {
        /* ignore */
      }
      try {
        gain?.disconnect();
      } catch {
        /* ignore */
      }
      try {
        void ctx?.close();
      } catch {
        /* ignore */
      }
      source = null;
      gain = null;
      ctx = null;
      graphReady = false;
    },
  };
}
