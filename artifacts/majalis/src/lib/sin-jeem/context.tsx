import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { GameSession, MatchConfig } from "./types";
import { createSession, createSessionFromQuestions } from "./engine";
import { getAllSinJeemQuestions } from "./questions-bank";
import { buildSessionQuestions } from "./session-builder";
import { clearSession, loadSession, saveSession } from "./storage";

interface GameContextValue {
  session: GameSession | null;
  starting: boolean;
  startGame: (config: MatchConfig) => Promise<void>;
  updateSession: (session: GameSession) => void;
  endGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [session, setSession] = useState<GameSession | null>(() => loadSession());
  const [starting, setStarting] = useState(false);

  const startGame = useCallback(
    async (config: MatchConfig) => {
      setStarting(true);
      try {
        const userId = user?.id ?? null;
        if (userId) {
          const { questions, meta } = await buildSessionQuestions(config, userId);
          const s = createSessionFromQuestions(config, questions, {
            adaptiveDifficulty: meta.adaptiveDifficulty,
            cycleNumber: meta.cycleNumber,
            allSeen: meta.allSeen,
            source: meta.source,
          });
          setSession(s);
          saveSession(s);
          return;
        }
        const s = createSession(config, getAllSinJeemQuestions());
        setSession(s);
        saveSession(s);
      } finally {
        setStarting(false);
      }
    },
    [user?.id],
  );

  const updateSession = useCallback((s: GameSession) => {
    setSession(s);
    saveSession(s);
  }, []);

  const endGame = useCallback(() => {
    setSession(null);
    clearSession();
  }, []);

  const value = useMemo(
    () => ({ session, starting, startGame, updateSession, endGame }),
    [session, starting, startGame, updateSession, endGame],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
