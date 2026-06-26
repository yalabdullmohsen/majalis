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
  { id: "quran", label: "قراءة القرآن", href: "/quran", target: 1 },
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
  const store = readStore();
  const key = todayKey();
  const day = getTodayProgress();
  day[taskId] = Math.max(0, value);
  store[key] = day;
  writeStore(store);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("majalis-progress-updated"));
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
