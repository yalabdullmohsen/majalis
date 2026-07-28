/**
 * Part 21 — Adaptive network connection heartbeat with jitter suppressor.
 * Scales poll / sync intervals from network + battery + visibility, and
 * applies exponential backoff with full jitter on reconnect bursts.
 * Logic-only — no UI.
 */

export type HeartbeatNetworkHint = {
  online: boolean;
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
};

export type HeartbeatBatteryHint = {
  level: number | null;
  charging: boolean | null;
};

export type HeartbeatPolicy = {
  /** Base interval before jitter (ms). */
  intervalMs: number;
  /** Suggested delay until next tick after jitter (ms). */
  nextDelayMs: number;
  reasons: string[];
  backoffStep: number;
};

export type AdaptiveHeartbeatOptions = {
  /** Healthy-path base interval (default 30 min). */
  baseIntervalMs?: number;
  /** Floor interval (default 2 min). */
  minIntervalMs?: number;
  /** Ceiling interval (default 6 h). */
  maxIntervalMs?: number;
  /** Max exponential backoff steps after failures / reconnect storms. */
  maxBackoffSteps?: number;
  /** Tick callback — return false to signal failure (triggers backoff). */
  onTick: () => void | boolean | Promise<void | boolean>;
  /** Optional external hints (tests). */
  getNetwork?: () => HeartbeatNetworkHint;
  getBattery?: () => HeartbeatBatteryHint;
  getHidden?: () => boolean;
  /** Injected RNG 0..1 for jitter (tests). */
  random?: () => number;
  /** Injected clock (tests). */
  now?: () => number;
};

const DEFAULT_BASE = 30 * 60 * 1000;
const DEFAULT_MIN = 2 * 60 * 1000;
const DEFAULT_MAX = 6 * 60 * 60 * 1000;

function readNetwork(): HeartbeatNetworkHint {
  if (typeof navigator === "undefined") return { online: true };
  const conn = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean; downlink?: number };
    }
  ).connection;
  return {
    online: navigator.onLine !== false,
    effectiveType: conn?.effectiveType,
    saveData: conn?.saveData,
    downlink: conn?.downlink,
  };
}

function readBatterySync(): HeartbeatBatteryHint {
  // Sync snapshot — async Battery API is bound separately by callers if needed.
  return { level: null, charging: null };
}

function readHidden(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

/**
 * Full jitter: delay = random(0, base * 2^step), clamped.
 * Suppresses thundering herds on reconnect.
 */
export function computeJitteredDelay(
  baseMs: number,
  backoffStep: number,
  opts?: {
    minMs?: number;
    maxMs?: number;
    random?: () => number;
  },
): number {
  const minMs = opts?.minMs ?? DEFAULT_MIN;
  const maxMs = opts?.maxMs ?? DEFAULT_MAX;
  const rnd = opts?.random ?? Math.random;
  const step = Math.max(0, Math.min(12, backoffStep | 0));
  const span = baseMs * Math.pow(2, step);
  const jittered = rnd() * span;
  return Math.round(Math.min(maxMs, Math.max(minMs, jittered)));
}

/**
 * Derive adaptive base interval from network / battery / visibility.
 */
export function computeHeartbeatInterval(
  hints: {
    network: HeartbeatNetworkHint;
    battery: HeartbeatBatteryHint;
    hidden: boolean;
  },
  opts?: {
    baseIntervalMs?: number;
    minIntervalMs?: number;
    maxIntervalMs?: number;
  },
): { intervalMs: number; reasons: string[] } {
  const base = opts?.baseIntervalMs ?? DEFAULT_BASE;
  const min = opts?.minIntervalMs ?? DEFAULT_MIN;
  const max = opts?.maxIntervalMs ?? DEFAULT_MAX;
  const reasons: string[] = [];
  let interval = base;

  if (!hints.network.online) {
    interval = max;
    reasons.push("offline");
  } else {
    const et = hints.network.effectiveType;
    if (et === "slow-2g" || et === "2g") {
      interval = Math.max(interval, base * 2);
      reasons.push(`net:${et}`);
    } else if (et === "3g") {
      interval = Math.max(interval, Math.round(base * 1.5));
      reasons.push("net:3g");
    }
    if (hints.network.saveData) {
      interval = Math.max(interval, Math.round(base * 1.5));
      reasons.push("save-data");
    }
    if (typeof hints.network.downlink === "number" && hints.network.downlink > 0 && hints.network.downlink < 0.5) {
      interval = Math.max(interval, base * 2);
      reasons.push("low-downlink");
    }
  }

  if (hints.battery.level != null && hints.battery.level < 0.2 && hints.battery.charging !== true) {
    interval = Math.max(interval, Math.round(base * 1.5));
    reasons.push(`battery:${Math.round(hints.battery.level * 100)}%`);
  }
  if (hints.battery.level != null && hints.battery.level < 0.1 && hints.battery.charging !== true) {
    interval = Math.max(interval, base * 2);
    reasons.push("battery-critical");
  }

  if (hints.hidden) {
    interval = Math.max(interval, Math.round(base * 2));
    reasons.push("hidden");
  }

  interval = Math.min(max, Math.max(min, interval));
  if (!reasons.length) reasons.push("healthy");
  return { intervalMs: interval, reasons };
}

export type AdaptiveHeartbeatHandle = {
  start: () => void;
  stop: () => void;
  /** Signal a reconnect burst — raises backoff + schedules jittered delay. */
  notifyReconnect: () => void;
  /** Signal tick success — decays backoff. */
  notifySuccess: () => void;
  /** Signal tick failure — raises backoff. */
  notifyFailure: () => void;
  getPolicy: () => HeartbeatPolicy;
  isRunning: () => boolean;
};

/**
 * Create an adaptive heartbeat scheduler (single timer, reschedules each tick).
 */
export function createAdaptiveHeartbeat(
  options: AdaptiveHeartbeatOptions,
): AdaptiveHeartbeatHandle {
  const baseIntervalMs = options.baseIntervalMs ?? DEFAULT_BASE;
  const minIntervalMs = options.minIntervalMs ?? DEFAULT_MIN;
  const maxIntervalMs = options.maxIntervalMs ?? DEFAULT_MAX;
  const maxBackoffSteps = options.maxBackoffSteps ?? 6;
  const random = options.random ?? Math.random;
  const getNetwork = options.getNetwork ?? readNetwork;
  const getBattery = options.getBattery ?? readBatterySync;
  const getHidden = options.getHidden ?? readHidden;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let backoffStep = 0;
  let lastPolicy: HeartbeatPolicy = {
    intervalMs: baseIntervalMs,
    nextDelayMs: baseIntervalMs,
    reasons: ["init"],
    backoffStep: 0,
  };

  const clearTimer = () => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const buildPolicy = (): HeartbeatPolicy => {
    const { intervalMs, reasons } = computeHeartbeatInterval(
      {
        network: getNetwork(),
        battery: getBattery(),
        hidden: getHidden(),
      },
      { baseIntervalMs, minIntervalMs, maxIntervalMs },
    );
    const nextDelayMs = computeJitteredDelay(intervalMs, backoffStep, {
      minMs: minIntervalMs,
      maxMs: maxIntervalMs,
      random,
    });
    lastPolicy = { intervalMs, nextDelayMs, reasons, backoffStep };
    return lastPolicy;
  };

  const schedule = () => {
    clearTimer();
    if (!running) return;
    const policy = buildPolicy();
    timer = setTimeout(() => {
      void (async () => {
        if (!running) return;
        let ok = true;
        try {
          const result = await options.onTick();
          if (result === false) ok = false;
        } catch {
          ok = false;
        }
        if (ok) {
          backoffStep = Math.max(0, backoffStep - 1);
        } else {
          backoffStep = Math.min(maxBackoffSteps, backoffStep + 1);
        }
        schedule();
      })();
    }, policy.nextDelayMs);
  };

  return {
    start() {
      if (running) return;
      running = true;
      schedule();
    },
    stop() {
      running = false;
      clearTimer();
    },
    notifyReconnect() {
      backoffStep = Math.min(maxBackoffSteps, backoffStep + 2);
      if (running) schedule();
    },
    notifySuccess() {
      backoffStep = Math.max(0, backoffStep - 1);
    },
    notifyFailure() {
      backoffStep = Math.min(maxBackoffSteps, backoffStep + 1);
      if (running) schedule();
    },
    getPolicy() {
      return { ...lastPolicy };
    },
    isRunning() {
      return running;
    },
  };
}
