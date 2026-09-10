/**
 * استئناف موضع تسجيل الدرس محليًا (بدون اختراع تقدّم سحابي).
 */
import { readLocalJson, writeLocalJson } from "@/lib/safe-json";

const PREFIX = "majalis-lesson-audio-resume:";
const INDEX_KEY = "majalis-lesson-audio-resume-index-v1";

type LessonAudioResume = {
  lessonId: string;
  currentTime: number;
  updatedAt: number;
};

function isResume(v: unknown): v is LessonAudioResume {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.lessonId === "string" && Number.isFinite(Number(o.currentTime));
}

function storageKey(lessonId: string): string {
  return `${PREFIX}${lessonId}`;
}

function readIndex(): string[] {
  const raw = readLocalJson<string[]>(INDEX_KEY, [], (v): v is string[] => Array.isArray(v));
  return raw.filter((id) => typeof id === "string");
}

function writeIndex(ids: string[]): void {
  writeLocalJson(INDEX_KEY, ids.slice(0, 40));
}

export function loadLessonAudioResume(lessonId: string): number | null {
  if (!lessonId) return null;
  const row = readLocalJson<LessonAudioResume | null>(storageKey(lessonId), null, isResume);
  if (!row) return null;
  const t = Math.max(0, Number(row.currentTime) || 0);
  return t >= 3 ? t : null;
}

export function saveLessonAudioResume(lessonId: string, currentTime: number): void {
  if (!lessonId) return;
  const t = Math.max(0, Number(currentTime) || 0);
  if (t < 3) return;
  writeLocalJson(storageKey(lessonId), {
    lessonId,
    currentTime: t,
    updatedAt: Date.now(),
  } satisfies LessonAudioResume);
  const idx = readIndex().filter((id) => id !== lessonId);
  idx.unshift(lessonId);
  writeIndex(idx);
}

export function clearLessonAudioResume(lessonId: string): void {
  try {
    localStorage.removeItem(storageKey(lessonId));
  } catch {
    /* ignore */
  }
  writeIndex(readIndex().filter((id) => id !== lessonId));
}

export function clearAllLessonAudioResume(): void {
  for (const id of readIndex()) {
    try {
      localStorage.removeItem(storageKey(id));
    } catch {
      /* ignore */
    }
  }
  try {
    localStorage.removeItem(INDEX_KEY);
  } catch {
    /* ignore */
  }
}
