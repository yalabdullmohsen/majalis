/**
 * Methodological Learning Track Tracker.
 * Tracks progress through structured paths (Matn, Fiqh stages, Hadith collections).
 * Persists lesson pointers in LS + IndexedDB for auto-resume.
 */

import { MASARAT, type Masar } from "@/lib/masarat-data";
import { computeCourseProgress, resolveItemState } from "@/lib/learning-paths/engine";
import type { CompletionEvent, LearningItem } from "@/lib/learning-paths/types";
import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";

export type TrackKind = "masar" | "matn" | "fiqh" | "hadith" | "custom";

export type TrackLesson = {
  id: string;
  title: string;
  href?: string;
  description?: string;
};

export type LearningTrackDefinition = {
  id: string;
  kind: TrackKind;
  title: string;
  subtitle?: string;
  lessons: TrackLesson[];
};

export type TrackProgressState = {
  trackId: string;
  /** Completed lesson ids */
  completedLessonIds: string[];
  /** Pointer to current / next lesson */
  currentLessonId: string | null;
  startedAt: string;
  updatedAt: string;
};

export type TrackProgressSnapshot = {
  track: LearningTrackDefinition;
  progress: TrackProgressState;
  completionPercent: number;
  resumeLesson: TrackLesson | null;
  nextLesson: TrackLesson | null;
};

const LS_KEY = "majalis-learning-track-progress-v1";
const IDB_KEY = "learning-track-progress-v1";

/** Built-in methodological tracks (Matn / Fiqh / Hadith) + MASARAT. */
export const BUILTIN_LEARNING_TRACKS: LearningTrackDefinition[] = [
  ...MASARAT.map((m: Masar): LearningTrackDefinition => ({
    id: `masar:${m.id}`,
    kind: "masar",
    title: m.title,
    subtitle: m.subtitle,
    lessons: m.steps.map((s) => ({
      id: s.id,
      title: s.title,
      href: s.href,
      description: s.description,
    })),
  })),
  {
    id: "matn:ajrumiyya",
    kind: "matn",
    title: "متن الآجرومية",
    subtitle: "أساس النحو لطالب العلم",
    lessons: [
      { id: "aj-1", title: "المقدمة وأنواع الكلام", href: "/arabic-language" },
      { id: "aj-2", title: "باب الإعراب", href: "/arabic-language" },
      { id: "aj-3", title: "باب المعرفة والنكرة", href: "/arabic-language" },
      { id: "aj-4", title: "باب المبتدأ والخبر", href: "/arabic-language" },
      { id: "aj-5", title: "مراجعة شاملة", href: "/arabic-language" },
    ],
  },
  {
    id: "fiqh:ubudah-stages",
    kind: "fiqh",
    title: "مراحل فقه العبادات",
    subtitle: "طهارة → صلاة → زكاة → صيام → حج",
    lessons: [
      { id: "fq-1", title: "الطهارة", href: "/fiqh/taharah" },
      { id: "fq-2", title: "الصلاة", href: "/fiqh/salah" },
      { id: "fq-3", title: "الزكاة", href: "/fiqh/zakat" },
      { id: "fq-4", title: "الصيام", href: "/fiqh/sawm" },
      { id: "fq-5", title: "الحج والعمرة", href: "/fiqh/hajj" },
    ],
  },
  {
    id: "hadith:arbaeen",
    kind: "hadith",
    title: "الأربعون النووية",
    subtitle: "مجموعة أحاديث أصولية",
    lessons: Array.from({ length: 42 }, (_, i) => ({
      id: `nawawi-${i + 1}`,
      title: `الحديث ${i + 1}`,
      href: "/arbaeen-nawawi",
    })),
  },
];

function readAllProgress(): Record<string, TrackProgressState> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, TrackProgressState>) : {};
  } catch {
    return {};
  }
}

function writeAllProgress(map: Record<string, TrackProgressState>): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_KEY, map).catch(() => undefined);
}

export function getTrackDefinition(trackId: string): LearningTrackDefinition | undefined {
  return BUILTIN_LEARNING_TRACKS.find((t) => t.id === trackId);
}

export function listLearningTracks(kind?: TrackKind): LearningTrackDefinition[] {
  return kind
    ? BUILTIN_LEARNING_TRACKS.filter((t) => t.kind === kind)
    : [...BUILTIN_LEARNING_TRACKS];
}

export function loadTrackProgress(trackId: string): TrackProgressState {
  const map = readAllProgress();
  if (map[trackId]) return map[trackId];
  const track = getTrackDefinition(trackId);
  const first = track?.lessons[0]?.id ?? null;
  return {
    trackId,
    completedLessonIds: [],
    currentLessonId: first,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function saveTrackProgress(state: TrackProgressState): TrackProgressState {
  const next = { ...state, updatedAt: new Date().toISOString() };
  const map = readAllProgress();
  map[state.trackId] = next;
  writeAllProgress(map);
  return next;
}

export async function loadAllTrackProgressAsync(): Promise<Record<string, TrackProgressState>> {
  try {
    const fromIdb = await idbGetValue<Record<string, TrackProgressState>>(
      OFFLINE_STORES.meta,
      IDB_KEY,
    );
    if (fromIdb && typeof fromIdb === "object") {
      writeAllProgress(fromIdb);
      return fromIdb;
    }
  } catch {
    /* fall through */
  }
  return readAllProgress();
}

export function computeTrackCompletionPercent(
  track: LearningTrackDefinition,
  progress: TrackProgressState,
): number {
  if (!track.lessons.length) return 0;
  const done = progress.completedLessonIds.filter((id) =>
    track.lessons.some((l) => l.id === id),
  ).length;
  return Math.round((done / track.lessons.length) * 100);
}

/** Mark lesson complete and advance pointer to next incomplete lesson. */
export function completeTrackLesson(
  trackId: string,
  lessonId: string,
): TrackProgressSnapshot | null {
  const track = getTrackDefinition(trackId);
  if (!track) return null;
  const progress = loadTrackProgress(trackId);
  if (!progress.completedLessonIds.includes(lessonId)) {
    progress.completedLessonIds = [...progress.completedLessonIds, lessonId];
  }
  const next = track.lessons.find((l) => !progress.completedLessonIds.includes(l.id));
  progress.currentLessonId = next?.id ?? lessonId;
  const saved = saveTrackProgress(progress);
  return snapshotTrack(track, saved);
}

export function setTrackLessonPointer(trackId: string, lessonId: string): TrackProgressState {
  const progress = loadTrackProgress(trackId);
  progress.currentLessonId = lessonId;
  return saveTrackProgress(progress);
}

export function snapshotTrack(
  track: LearningTrackDefinition,
  progress: TrackProgressState = loadTrackProgress(track.id),
): TrackProgressSnapshot {
  const resume =
    track.lessons.find((l) => l.id === progress.currentLessonId) ||
    track.lessons.find((l) => !progress.completedLessonIds.includes(l.id)) ||
    null;
  const next =
    track.lessons.find(
      (l) => l.id !== resume?.id && !progress.completedLessonIds.includes(l.id),
    ) || null;
  return {
    track,
    progress,
    completionPercent: computeTrackCompletionPercent(track, progress),
    resumeLesson: resume,
    nextLesson: next,
  };
}

/** Resume payload for app launch — all in-progress tracks. */
export function getResumePointers(): TrackProgressSnapshot[] {
  const map = readAllProgress();
  const out: TrackProgressSnapshot[] = [];
  for (const track of BUILTIN_LEARNING_TRACKS) {
    const progress = map[track.id] || loadTrackProgress(track.id);
    if (!progress.completedLessonIds.length && !map[track.id]) continue;
    const snap = snapshotTrack(track, progress);
    if (snap.completionPercent < 100) out.push(snap);
  }
  return out.sort((a, b) => b.progress.updatedAt.localeCompare(a.progress.updatedAt));
}

/**
 * Bridge to pure learning-paths engine when courses/items are available.
 */
export function computeEngineCoursePercent(
  items: LearningItem[],
  events: CompletionEvent[],
): number {
  return computeCourseProgress(items, events);
}

export function resolveEngineItemState(events: CompletionEvent[]) {
  return resolveItemState(events);
}
