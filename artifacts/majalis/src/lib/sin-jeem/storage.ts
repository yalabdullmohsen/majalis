import type { GameSession } from "./types";

const SESSION_KEY = "sin-jeem-session";

export function saveSession(session: GameSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore quota */
  }
}

export function loadSession(): GameSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as GameSession) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function trackPlayer(_name: string): void {
  /* player tracking is server-side only */
}

export function getPlayerCount(): number {
  return 0;
}

export function loadLocalStats(): { matchCount: number; playerCount: number } {
  return { matchCount: 0, playerCount: 0 };
}
