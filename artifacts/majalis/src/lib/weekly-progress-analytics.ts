/**
 * Weekly Progress Analytics Generator (background aggregator, logic-only).
 * Builds an exportable payload from local streak / wird / flashcard stores.
 */
import { getUserStreak, type UserStreakState } from "@/lib/user-streak";
import { getDailyWirdState, type DailyWirdState } from "@/lib/quran-api";
import { localFlashStats } from "@/lib/flashcard-local-store";
import { getTodayProgress, PROGRESS_TASKS, type ProgressTaskId } from "@/lib/daily-progress";

export type WeeklyDayMetric = {
  date: string; // YYYY-MM-DD
  pagesRead: number;
  tasksCompleted: number;
  tasksTotal: number;
  active: boolean;
};

export type WeeklyProgressPayload = {
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
  streak: Pick<UserStreakState, "currentStreak" | "longestStreak" | "totalGoalsCompleted">;
  quranPagesThisWeek: number;
  quranPagesToday: number;
  flashcards: { totalReviewed: number; dueToday: number; masteredCount: number };
  daily: WeeklyDayMetric[];
  completionRate: number; // 0–1 across the week’s task slots
};

function dateKey(d: Date): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuwait",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay(); // 0=Sun
  // ISO-ish week starting Saturday (common Gulf UX) → shift so Saturday=0
  const satBased = (day + 1) % 7;
  x.setDate(x.getDate() - satBased);
  x.setHours(12, 0, 0, 0);
  return x;
}

function readProgressStore(): Record<string, Record<ProgressTaskId, number>> {
  try {
    const raw = localStorage.getItem("majalis-daily-progress-v1");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Aggregate the last 7 days of engagement into a clean exportable payload.
 */
export function buildWeeklyProgressAnalytics(
  userId = "local",
  now: Date = new Date(),
): WeeklyProgressPayload {
  try {
    const weekStartDate = startOfWeek(now);
    const daily: WeeklyDayMetric[] = [];
    const progressStore = readProgressStore();
    let wird: DailyWirdState;
    try {
      wird = getDailyWirdState();
    } catch {
      wird = {
        pagesPerDay: 2,
        currentSurah: 1,
        currentAyah: 1,
        completedToday: 0,
        lastDate: "",
        monthlyTotal: 0,
        streak: 0,
        weeklyLogs: {},
        totalPagesEver: 0,
      };
    }

    let quranPagesThisWeek = 0;
    let tasksDoneSlots = 0;
    let tasksTotalSlots = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStartDate);
      d.setDate(weekStartDate.getDate() + i);
      const key = dateKey(d);
      const pages = Number(wird.weeklyLogs?.[key] || 0);
      quranPagesThisWeek += pages;
      const dayProgress = progressStore[key] || ({} as Record<ProgressTaskId, number>);
      let tasksCompleted = 0;
      for (const t of PROGRESS_TASKS) {
        tasksTotalSlots += 1;
        if ((dayProgress[t.id] || 0) >= t.target) {
          tasksCompleted += 1;
          tasksDoneSlots += 1;
        }
      }
      daily.push({
        date: key,
        pagesRead: pages,
        tasksCompleted,
        tasksTotal: PROGRESS_TASKS.length,
        active: pages > 0 || tasksCompleted > 0,
      });
    }

    const streak = getUserStreak();
    const flash = localFlashStats(userId);
    const today = getTodayProgress();
    const todayKeyStr = dateKey(now);

    return {
      weekStart: dateKey(weekStartDate),
      weekEnd: daily[6]?.date || todayKeyStr,
      generatedAt: now.toISOString(),
      streak: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalGoalsCompleted: streak.totalGoalsCompleted,
      },
      quranPagesThisWeek,
      quranPagesToday: Number(wird.weeklyLogs?.[todayKeyStr] || wird.completedToday || 0),
      flashcards: flash,
      daily,
      completionRate: tasksTotalSlots > 0 ? tasksDoneSlots / tasksTotalSlots : 0,
    };
  } catch {
    const today = dateKey(now);
    return {
      weekStart: today,
      weekEnd: today,
      generatedAt: now.toISOString(),
      streak: { currentStreak: 0, longestStreak: 0, totalGoalsCompleted: 0 },
      quranPagesThisWeek: 0,
      quranPagesToday: 0,
      flashcards: { totalReviewed: 0, dueToday: 0, masteredCount: 0 },
      daily: [],
      completionRate: 0,
    };
  }
}

/** JSON string suitable for download / share (weekly summary export). */
export function exportWeeklyProgressJson(userId = "local"): string {
  return JSON.stringify(buildWeeklyProgressAnalytics(userId), null, 2);
}
