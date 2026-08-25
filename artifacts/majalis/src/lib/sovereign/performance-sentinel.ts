/**
 * مراقب أداء فوري — أوقات الإطار، الذاكرة، استجابة الخيط.
 * يُشغَّل بأولوية منخفضة ويُحرّر caches عند تجاوز العتبات.
 */
import { FRAME_BUDGET_MS } from "@/lib/sovereign/frame-budget";
import { getPowerSaverState, scheduleNonCriticalWork } from "@/lib/power-saver-engine";
import {
  readMemorySnapshot,
  purgeUnderMemoryPressure,
  subscribeMemoryPressure,
} from "@/lib/memory-pressure";

export type FrameHealthSnapshot = {
  avgFrameMs: number;
  p95FrameMs: number;
  droppedFrames: number;
  memoryLevel: string;
  throttleActive: boolean;
  at: number;
};

const FRAME_SAMPLES = 48;
const DROP_THRESHOLD_MS = FRAME_BUDGET_MS * 2.5;
const PURGE_COOLDOWN_MS = 45_000;

let started = false;
let rafId = 0;
let lastTs = 0;
const samples: number[] = [];
let droppedFrames = 0;
let lastPurgeAt = 0;
let throttleActive = false;
let snapshot: FrameHealthSnapshot = {
  avgFrameMs: 0,
  p95FrameMs: 0,
  droppedFrames: 0,
  memoryLevel: "normal",
  throttleActive: false,
  at: Date.now(),
};

function recompute(): void {
  if (!samples.length) return;
  const sorted = [...samples].sort((a, b) => a - b);
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? avg;
  const mem = readMemorySnapshot();
  snapshot = {
    avgFrameMs: Math.round(avg * 10) / 10,
    p95FrameMs: Math.round(p95 * 10) / 10,
    droppedFrames,
    memoryLevel: mem.level,
    throttleActive,
    at: Date.now(),
  };
}

function maybeRecover(): void {
  const mem = readMemorySnapshot();
  const saver = getPowerSaverState();
  const stressed =
    mem.level === "critical" ||
    mem.level === "moderate" ||
    snapshot.p95FrameMs > DROP_THRESHOLD_MS ||
    saver.mode === "aggressive";

  throttleActive = stressed;
  if (typeof document !== "undefined") {
    document.documentElement.dataset.perfThrottle = stressed ? "1" : "0";
  }

  const now = Date.now();
  if (stressed && now - lastPurgeAt > PURGE_COOLDOWN_MS) {
    lastPurgeAt = now;
    scheduleNonCriticalWork(() => {
      void purgeUnderMemoryPressure("critical");
    });
  }
}

function tick(ts: number): void {
  if (lastTs > 0) {
    const delta = ts - lastTs;
    samples.push(delta);
    if (samples.length > FRAME_SAMPLES) samples.shift();
    if (delta > DROP_THRESHOLD_MS) droppedFrames += 1;
    if (samples.length >= 8) {
      recompute();
      maybeRecover();
    }
  }
  lastTs = ts;
  rafId = requestAnimationFrame(tick);
}

export function getFrameHealthSnapshot(): FrameHealthSnapshot {
  return snapshot;
}

export function startPerformanceSentinel(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  lastTs = 0;
  rafId = requestAnimationFrame(tick);
  subscribeMemoryPressure(() => {
    recompute();
    maybeRecover();
  });
}

export function stopPerformanceSentinelForTests(): void {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  started = false;
  samples.length = 0;
  droppedFrames = 0;
  throttleActive = false;
}
