"use client";

import { useCallback, useEffect, useState } from "react";
import { TAJWEED_LESSONS } from "@/lib/quran-tajweed";

const STORAGE_KEY = "majalis-tajweed-progress-v1";

function readCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeCompleted(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function useTajweedProgress() {
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setCompleted(readCompleted());
  }, []);

  const total = TAJWEED_LESSONS.length;
  const completedCount = completed.size;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const milestones = [0, 20, 40, 60, 80, 100].map((m) => ({
    value: m,
    reached: percent >= m,
  }));

  const markComplete = useCallback((lessonId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(lessonId);
      writeCompleted(next);
      return next;
    });
  }, []);

  const isComplete = useCallback((lessonId: string) => completed.has(lessonId), [completed]);

  const resetProgress = useCallback(() => {
    setCompleted(new Set());
    writeCompleted(new Set());
  }, []);

  return { completedCount, total, percent, milestones, markComplete, isComplete, resetProgress };
}
