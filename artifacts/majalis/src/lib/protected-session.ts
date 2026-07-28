/**
 * Protected reading / audio session flag — blocks forced SW reloads mid-session.
 */

const FLAG = "__majalis_protected_session__";
const EVENT = "majalis-protected-session";

export type ProtectedSessionKind = "quran-audio" | "adhkar" | "matn-reading" | "generic";

type SessionState = {
  active: boolean;
  kind: ProtectedSessionKind | null;
  startedAt: number;
};

function read(): SessionState {
  try {
    const w = window as unknown as Record<string, SessionState | undefined>;
    return w[FLAG] || { active: false, kind: null, startedAt: 0 };
  } catch {
    return { active: false, kind: null, startedAt: 0 };
  }
}

function write(state: SessionState): void {
  try {
    const w = window as unknown as Record<string, SessionState>;
    w[FLAG] = state;
    window.dispatchEvent(new CustomEvent(EVENT, { detail: state }));
  } catch {
    /* ignore */
  }
}

export function beginProtectedSession(kind: ProtectedSessionKind = "generic"): void {
  if (typeof window === "undefined") return;
  write({ active: true, kind, startedAt: Date.now() });
}

export function endProtectedSession(): void {
  if (typeof window === "undefined") return;
  write({ active: false, kind: null, startedAt: 0 });
}

export function isProtectedSession(): boolean {
  if (typeof window === "undefined") return false;
  return read().active === true;
}

export function getProtectedSession(): SessionState {
  return read();
}

export function onProtectedSessionChange(handler: (state: SessionState) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const fn = (ev: Event) => {
    const detail = (ev as CustomEvent<SessionState>).detail;
    handler(detail || read());
  };
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

export const PROTECTED_SESSION_EVENT = EVENT;
