/**
 * عقود بيانات رحلة القرآن — مراجع فقط، بلا نص قرآني داخل السجل.
 * schemaVersion يزيد عند تغيير شكل التخزين (ترحيل لاحق).
 */

export const QURAN_JOURNEY_SCHEMA_VERSION = 1 as const;

export type SyncState = "local" | "pending" | "synced" | "conflict";

export type MarkerType =
  | "wird"
  | "hifz"
  | "review"
  | "tadabbur"
  | "lesson"
  | "custom";

/** Tokens ألوان هادئة — لا ألوان عشوائية ضعيفة التباين. */
export type MarkerColorToken =
  | "marker-wird"
  | "marker-hifz"
  | "marker-review"
  | "marker-tadabbur"
  | "marker-lesson"
  | "marker-custom-slate"
  | "marker-custom-teal"
  | "marker-custom-rose";

export type QuranReference = {
  surahNumber: number;
  ayahNumber: number;
  pageNumber: number;
};

export type QuranMarker = {
  id: string;
  userId?: string | null;
  localOwnerId: string;
  surahNumber: number;
  ayahNumber: number;
  pageNumber: number;
  markerType: MarkerType;
  colorToken: MarkerColorToken;
  title: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  syncState: SyncState;
  sourceVersion: typeof QURAN_JOURNEY_SCHEMA_VERSION;
};

export type JourneyType =
  | "tilawah"
  | "ramadan"
  | "tadabbur"
  | "review"
  | "custom";

export type JourneyStatus = "active" | "paused" | "completed" | "archived";

export type QuranJourney = {
  id: string;
  title: string;
  journeyType: JourneyType;
  startReference: QuranReference;
  targetReference: QuranReference;
  currentReference: QuranReference;
  dailyTarget: number;
  preferredDays: number[];
  status: JourneyStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  syncState: SyncState;
  sourceVersion: typeof QURAN_JOURNEY_SCHEMA_VERSION;
};

export type MemorizationStatus =
  | "new"
  | "learning"
  | "memorized"
  | "needs_review"
  | "mastered";

export type QuranMemorizationState = {
  id: string;
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  status: MemorizationStatus;
  lastReviewedAt?: string | null;
  nextReviewAt?: string | null;
  reviewCount: number;
  confidence: number;
  note: string;
  syncState: SyncState;
  sourceVersion: typeof QURAN_JOURNEY_SCHEMA_VERSION;
};

export type ReadingCompletionState = "started" | "committed" | "abandoned";

export type QuranReadingSession = {
  id: string;
  startedAt: string;
  endedAt?: string | null;
  startPage: number;
  endPage: number;
  pagesRead: number;
  journeyId?: string | null;
  completionState: ReadingCompletionState;
  syncState: SyncState;
  sourceVersion: typeof QURAN_JOURNEY_SCHEMA_VERSION;
};

export type QuranJourneyStore = {
  schemaVersion: typeof QURAN_JOURNEY_SCHEMA_VERSION;
  localOwnerId: string;
  markers: QuranMarker[];
  journeys: QuranJourney[];
  memorization: QuranMemorizationState[];
  sessions: QuranReadingSession[];
  updatedAt: string;
};
