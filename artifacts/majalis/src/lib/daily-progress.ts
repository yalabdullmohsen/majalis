const STORAGE_KEY = "majalis-daily-progress-v1";

export type ProgressTaskId =
  | "wird"
  | "morning-adhkar"
  | "evening-adhkar"
  | "nawafil"
  | "tasbih"
  | "quran";

export type ProgressTask = {
  id: ProgressTaskId;
  label: string;
  href: string;
  target: number;
};

export const PROGRESS_TASKS: ProgressTask[] = [
  { id: "wird", label: "الورد اليومي", href: "/daily-wird", target: 1 },
  { id: "morning-adhkar", label: "أذكار الصباح", href: "/adhkar?cat=morning", target: 1 },
  { id: "evening-adhkar", label: "أذكار المساء", href: "/adhkar?cat=evening", target: 1 },
  { id: "nawafil", label: "النوافل", href: "/adhkar?cat=salah", target: 1 },
  { id: "tasbih", label: "التسبيح", href: "/tasbih", target: 100 },
  { id: "quran", label: "قراءة القرآن", href: "/quran-hub", target: 1 },
];

type DayProgress = Record<ProgressTaskId, number>;

function todayKey() {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuwait",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function readStore(): Record<string, DayProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, DayProgress>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

export function getTodayProgress(): DayProgress {
  const store = readStore();
  const key = todayKey();
  return store[key] || {
    wird: 0,
    "morning-adhkar": 0,
    "evening-adhkar": 0,
    nawafil: 0,
    tasbih: 0,
    quran: 0,
  };
}

export function setTaskProgress(taskId: ProgressTaskId, value: number) {
  const store = { ...readStore() };
  const key = todayKey();
  const prev = getTodayProgress();
  const day = { ...prev };
  day[taskId] = Math.max(0, value);
  store[key] = day;
  writeStore(store);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("majalis-progress-updated"));
    void import("@/lib/offline-action-queue")
      .then((m) => m.enqueueOfflineAction("progress_set", { taskId, value: day[taskId] }))
      .catch(() => {});
    // Streak logic (no UI change) — fire-and-forget dynamic import
    void import("@/lib/user-streak").then(({ recordUserActivity }) => {
      const activityMap: Partial<Record<ProgressTaskId, "quran" | "adhkar" | "wird" | "tasbih">> = {
        quran: "quran",
        wird: "wird",
        tasbih: "tasbih",
        "morning-adhkar": "adhkar",
        "evening-adhkar": "adhkar",
        nawafil: "adhkar",
      };
      const activity = activityMap[taskId] || "goal";
      const task = PROGRESS_TASKS.find((t) => t.id === taskId);
      const wasDone = task ? (prev[taskId] || 0) >= task.target : false;
      const nowDone = task ? day[taskId] >= task.target : false;
      const dayComplete = PROGRESS_TASKS.every((t) => (day[t.id] || 0) >= t.target);
      recordUserActivity(activity, { completedGoal: (!wasDone && nowDone) || dayComplete });
    });
  }
}

export function incrementTaskProgress(taskId: ProgressTaskId, delta = 1) {
  const current = getTodayProgress()[taskId] || 0;
  setTaskProgress(taskId, current + delta);
}

export function getTaskStats(task: ProgressTask, progress: DayProgress) {
  const done = progress[task.id] || 0;
  const target = task.target;
  const percent = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  const remaining = Math.max(0, target - done);
  return { done, target, percent, remaining };
}
