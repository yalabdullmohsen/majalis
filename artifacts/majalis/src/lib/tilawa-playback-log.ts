/**
 * Structured tilawa playback diagnostics (console + optional window buffer).
 * Prefer console.info("[tilawa]", ...) from AudioEngine for entry-budget safety;
 * call logTilawa from lazy UI when a persistent buffer is needed.
 */
export type TilawaLogPhase =
  | "play_request"
  | "session_kick"
  | "session_ok"
  | "session_fail"
  | "url_try"
  | "url_ok"
  | "url_fail"
  | "state"
  | "timeout"
  | "gesture_blocked";

export type TilawaLogEvent = {
  phase: TilawaLogPhase;
  t: number;
  surah?: number;
  ayah?: number;
  reciterId?: string;
  url?: string;
  status?: number | string;
  ms?: number;
  state?: string;
  reason?: string;
  detail?: string;
};

const MAX = 80;
const buffer: TilawaLogEvent[] = [];

declare global {
  interface Window {
    __MAJALIS_TILAWA_LOG__?: TilawaLogEvent[];
  }
}

export function logTilawa(event: Omit<TilawaLogEvent, "t">): void {
  const row: TilawaLogEvent = { ...event, t: Date.now() };
  buffer.push(row);
  if (buffer.length > MAX) buffer.shift();
  if (typeof window !== "undefined") {
    window.__MAJALIS_TILAWA_LOG__ = buffer.slice();
  }
  console.info("[tilawa]", {
    phase: row.phase,
    surah: row.surah,
    ayah: row.ayah,
    reciterId: row.reciterId,
    url: row.url,
    status: row.status,
    ms: row.ms,
    state: row.state,
    reason: row.reason,
    detail: row.detail,
  });
}

export function getTilawaLog(): readonly TilawaLogEvent[] {
  return buffer.slice();
}

export function __resetTilawaLogForTests(): void {
  buffer.length = 0;
  if (typeof window !== "undefined") delete window.__MAJALIS_TILAWA_LOG__;
}
