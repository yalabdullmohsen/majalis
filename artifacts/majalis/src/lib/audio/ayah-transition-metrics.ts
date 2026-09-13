/**
 * قياس فجوة الانتقال بين آيات التلاوة — سُنّة.
 */
export type AyahTransitionSample = {
  fromAyahId: string;
  toAyahId: string;
  currentAudioEndedAt: number;
  nextAudioRequestedAt: number;
  nextAudioStartedAt: number;
  transitionGapMs: number;
  nextFileCacheHit: boolean;
  playerRecreation: boolean;
  path: "preload-hit" | "cold-load" | "repeat-same";
};

const samples: AyahTransitionSample[] = [];
let lastEndedAt = 0;
let lastEndedAyahId = "";
let playerCreateCount = 0;

export function noteAudioSlotCreated(): void {
  playerCreateCount += 1;
}

export function getAudioSlotCreateCount(): number {
  return playerCreateCount;
}

export function resetAyahTransitionMetricsForTests(): void {
  samples.length = 0;
  lastEndedAt = 0;
  lastEndedAyahId = "";
  playerCreateCount = 0;
}

export function markAyahAudioEnded(ayahId: string, at = now()): void {
  lastEndedAt = at;
  lastEndedAyahId = ayahId;
}

export function markAyahTransitionRequested(_ayahId: string, at = now()): number {
  return at;
}

export function notePreloadReady(_ayahId: string): void {}

export function markAyahAudioStarted(input: {
  ayahId: string;
  cacheHit: boolean;
  path: AyahTransitionSample["path"];
  playerRecreation?: boolean;
  at?: number;
}): AyahTransitionSample | null {
  const at = input.at ?? now();
  if (!lastEndedAt || !lastEndedAyahId) return null;
  const sample: AyahTransitionSample = {
    fromAyahId: lastEndedAyahId,
    toAyahId: input.ayahId,
    currentAudioEndedAt: lastEndedAt,
    nextAudioRequestedAt: lastEndedAt,
    nextAudioStartedAt: at,
    transitionGapMs: Math.max(0, at - lastEndedAt),
    nextFileCacheHit: input.cacheHit,
    playerRecreation: Boolean(input.playerRecreation),
    path: input.path,
  };
  samples.push(sample);
  if (samples.length > 200) samples.shift();
  lastEndedAt = 0;
  lastEndedAyahId = "";
  return sample;
}

export function getAyahTransitionSamples(): readonly AyahTransitionSample[] {
  return samples;
}

export function summarizeAyahTransitions(): {
  count: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  preloadHitRate: number;
  playerRecreationCount: number;
} {
  const gaps = samples.map((s) => s.transitionGapMs).sort((a, b) => a - b);
  const n = gaps.length;
  const pct = (p: number) => (n ? gaps[Math.min(n - 1, Math.floor((p / 100) * n))]! : 0);
  const hits = samples.filter((s) => s.nextFileCacheHit).length;
  return {
    count: n,
    p50: pct(50),
    p95: pct(95),
    p99: pct(99),
    max: n ? gaps[n - 1]! : 0,
    preloadHitRate: n ? hits / n : 0,
    playerRecreationCount: playerCreateCount,
  };
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export const TECHNICAL_TRANSITION_GAP_BUDGET_MS = 120;

