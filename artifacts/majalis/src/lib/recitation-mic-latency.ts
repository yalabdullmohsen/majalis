/**
 * مُجمّع قياسات كمون التسميع — timestamps وحالات عامة فقط (بلا صوت/نص).
 */
export type MicLatencySample = {
  event: string;
  atMs: number;
  msFromButton?: number;
  msFromTap?: number;
  msFromFirstBuffer?: number;
  cold?: boolean;
};

export type MicLatencySummary = {
  samples: MicLatencySample[];
  coldStartButtonToFirstBufferMs: number | null;
  warmStartButtonToFirstBufferMs: number | null;
  coldStartButtonToFirstPartialMs: number | null;
  warmStartButtonToFirstPartialMs: number | null;
  lastTapToFirstBufferMs: number | null;
};

const MAX_SAMPLES = 64;

export function createMicLatencyTracker() {
  const samples: MicLatencySample[] = [];
  let buttonAt = 0;

  function markButton() {
    buttonAt = performance.now();
  }

  function record(event: string, extra: Partial<MicLatencySample> = {}) {
    const sample: MicLatencySample = {
      event,
      atMs: performance.now(),
      ...extra,
    };
    samples.push(sample);
    if (samples.length > MAX_SAMPLES) samples.shift();
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[recitation-latency]", event, {
        msFromButton: extra.msFromButton,
        msFromTap: extra.msFromTap,
        cold: extra.cold,
      });
    }
  }

  function ingestNative(payload: {
    event?: string;
    msFromButton?: number;
    msFromTap?: number;
    msFromFirstBuffer?: number;
    cold?: boolean;
  }) {
    if (!payload.event) return;
    record(payload.event, {
      msFromButton: payload.msFromButton,
      msFromTap: payload.msFromTap,
      msFromFirstBuffer: payload.msFromFirstBuffer,
      cold: payload.cold,
    });
  }

  function summarize(): MicLatencySummary {
    const firstBuffers = samples.filter((s) => s.event === "first_buffer");
    const firstPartials = samples.filter((s) => s.event === "first_partial");
    const coldBuf = firstBuffers.find((s) => s.cold === true);
    const warmBuf = [...firstBuffers].reverse().find((s) => s.cold === false);
    const coldPartial = firstPartials.find((s) => s.cold === true);
    const warmPartial = [...firstPartials].reverse().find((s) => s.cold === false);
    const lastTap = [...samples].reverse().find((s) => s.event === "first_buffer");

    return {
      samples: [...samples],
      coldStartButtonToFirstBufferMs: coldBuf?.msFromButton ?? null,
      warmStartButtonToFirstBufferMs: warmBuf?.msFromButton ?? null,
      coldStartButtonToFirstPartialMs: coldPartial?.msFromButton ?? null,
      warmStartButtonToFirstPartialMs: warmPartial?.msFromButton ?? null,
      lastTapToFirstBufferMs: lastTap?.msFromTap ?? null,
    };
  }

  function reset() {
    samples.length = 0;
    buttonAt = 0;
  }

  return { markButton, record, ingestNative, summarize, reset, get buttonAt() { return buttonAt; } };
}

/** أهداف الكمون (تشغيلات لاحقة دافئة). */
export const MIC_LATENCY_TARGETS = {
  buttonToCaptureMs: 300,
  sessionToFirstBufferMs: 150,
  buttonToFirstPartialMs: 800,
  noBufferTimeoutMs: 1000,
} as const;
