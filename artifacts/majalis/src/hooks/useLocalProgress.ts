import { useCallback, useState } from "react";
import type { LPProgress } from "@/lib/learning-path-service";

const KEY = "lp_local_progress";

function load(): Record<string, LPProgress> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); }
  catch { return {}; }
}

function persist(data: Record<string, LPProgress>) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

export function useLocalProgress() {
  const [raw, setRaw] = useState<Record<string, LPProgress>>(() => load());

  const getStatus = useCallback(
    (bookId: string) => raw[bookId]?.status ?? "not_started",
    [raw],
  );

  const startBook = useCallback((bookId: string) => {
    setRaw((prev) => {
      const next = {
        ...prev,
        [bookId]: {
          book_id: bookId,
          status: "in_progress" as const,
          progress_percent: 10,
          started_at: prev[bookId]?.started_at ?? new Date().toISOString(),
          completed_at: null,
        },
      };
      persist(next);
      return next;
    });
  }, []);

  const completeBook = useCallback((bookId: string) => {
    setRaw((prev) => {
      const next = {
        ...prev,
        [bookId]: {
          book_id: bookId,
          status: "completed" as const,
          progress_percent: 100,
          started_at: prev[bookId]?.started_at ?? new Date().toISOString(),
          completed_at: new Date().toISOString(),
        },
      };
      persist(next);
      return next;
    });
  }, []);

  const progressList: LPProgress[] = Object.values(raw);

  return { getStatus, startBook, completeBook, progressList };
}
