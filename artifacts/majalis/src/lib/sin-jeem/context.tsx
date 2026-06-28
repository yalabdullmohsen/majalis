import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { GameSession, MatchConfig } from "./types";
import { createSession } from "./engine";
import { clearSession, loadSession, saveSession } from "./storage";
import { getAllSinJeemQuestions } from "./questions-bank";

interface GameContextValue {
  session: GameSession | null;
  startGame: (config: MatchConfig) => void;
  updateSession: (session: GameSession) => void;
  endGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<GameSession | null>(() => loadSession());

  const startGame = useCallback((config: MatchConfig) => {
    const s = createSession(config, getAllSinJeemQuestions());
    setSession(s);
    saveSession(s);
  }, []);

  const updateSession = useCallback((s: GameSession) => {
    setSession(s);
    saveSession(s);
  }, []);

  const endGame = useCallback(() => {
    setSession(null);
    clearSession();
  }, []);

  const value = useMemo(
    () => ({ session, startGame, updateSession, endGame }),
    [session, startGame, updateSession, endGame],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
