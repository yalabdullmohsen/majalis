/**
 * تحقق مراجع القرآن قبل الحفظ — بلا نص قرآني.
 */
import { MUSHAF_PAGE_MAX, MUSHAF_PAGE_MIN } from "@/lib/quran-last-page";
import type {
  MarkerColorToken,
  MarkerType,
  MemorizationStatus,
  QuranJourney,
  QuranMarker,
  QuranMemorizationState,
  QuranReadingSession,
  QuranReference,
  JourneyStatus,
  JourneyType,
  ReadingCompletionState,
  SyncState,
} from "./types";
import { QURAN_JOURNEY_SCHEMA_VERSION } from "./types";

const SURAH_AYAH_COUNTS: readonly number[] = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53,
  89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12,
  12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26,
  30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

const MARKER_TYPES: ReadonlySet<string> = new Set([
  "wird",
  "hifz",
  "review",
  "tadabbur",
  "lesson",
  "custom",
]);

const COLOR_TOKENS: ReadonlySet<string> = new Set([
  "marker-wird",
  "marker-hifz",
  "marker-review",
  "marker-tadabbur",
  "marker-lesson",
  "marker-custom-slate",
  "marker-custom-teal",
  "marker-custom-rose",
]);

const JOURNEY_TYPES: ReadonlySet<string> = new Set([
  "tilawah",
  "ramadan",
  "tadabbur",
  "review",
  "custom",
]);

const JOURNEY_STATUSES: ReadonlySet<string> = new Set([
  "active",
  "paused",
  "completed",
  "archived",
]);

const MEM_STATUSES: ReadonlySet<string> = new Set([
  "new",
  "learning",
  "memorized",
  "needs_review",
  "mastered",
]);

const SYNC_STATES: ReadonlySet<string> = new Set([
  "local",
  "pending",
  "synced",
  "conflict",
]);

const COMPLETION: ReadonlySet<string> = new Set([
  "started",
  "committed",
  "abandoned",
]);

export type ValidateOk<T> = { ok: true; value: T };
export type ValidateErr = { ok: false; error: string };
export type ValidateResult<T> = ValidateOk<T> | ValidateErr;

export function ayahCountForSurah(surah: number): number {
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) return 0;
  return SURAH_AYAH_COUNTS[surah - 1] ?? 0;
}

export function isValidSurahAyah(surah: number, ayah: number): boolean {
  const max = ayahCountForSurah(surah);
  return max > 0 && Number.isInteger(ayah) && ayah >= 1 && ayah <= max;
}

export function isValidPage(page: number): boolean {
  return (
    Number.isInteger(page) &&
    page >= MUSHAF_PAGE_MIN &&
    page <= MUSHAF_PAGE_MAX
  );
}

export function validateReference(
  ref: Partial<QuranReference> | null | undefined,
): ValidateResult<QuranReference> {
  if (!ref || typeof ref !== "object") {
    return { ok: false, error: "مرجع غير صالح" };
  }
  const surahNumber = Number(ref.surahNumber);
  const ayahNumber = Number(ref.ayahNumber);
  const pageNumber = Number(ref.pageNumber);
  if (!isValidSurahAyah(surahNumber, ayahNumber)) {
    return { ok: false, error: "سورة أو آية غير صالحة" };
  }
  if (!isValidPage(pageNumber)) {
    return { ok: false, error: "صفحة خارج 1–604" };
  }
  return {
    ok: true,
    value: { surahNumber, ayahNumber, pageNumber },
  };
}

function asIso(v: unknown, fallback: string): string {
  if (typeof v === "string" && v.trim() && !Number.isNaN(Date.parse(v))) {
    return v;
  }
  return fallback;
}

function asSync(v: unknown): SyncState {
  return typeof v === "string" && SYNC_STATES.has(v) ? (v as SyncState) : "local";
}

function stripQuranTextFields(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    if (/^(text|ayahText|quranText|verseText|uthmani)$/i.test(key)) {
      delete obj[key];
    }
  }
}

export function validateMarker(
  raw: unknown,
  localOwnerId: string,
): ValidateResult<QuranMarker> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "فاصل غير صالح" };
  }
  const o = { ...(raw as Record<string, unknown>) };
  stripQuranTextFields(o);
  const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : "";
  if (!id) return { ok: false, error: "معرّف فاصل مطلوب" };
  const surahNumber = Number(o.surahNumber);
  const ayahNumber = Number(o.ayahNumber);
  const pageNumber = Number(o.pageNumber);
  if (!isValidSurahAyah(surahNumber, ayahNumber)) {
    return { ok: false, error: "سورة أو آية غير صالحة" };
  }
  if (!isValidPage(pageNumber)) {
    return { ok: false, error: "صفحة خارج 1–604" };
  }
  if (typeof o.markerType !== "string" || !MARKER_TYPES.has(o.markerType)) {
    return { ok: false, error: "نوع فاصل غير معروف" };
  }
  if (typeof o.colorToken !== "string" || !COLOR_TOKENS.has(o.colorToken)) {
    return { ok: false, error: "لون غير مسموح" };
  }
  const title = typeof o.title === "string" ? o.title.trim().slice(0, 96) : "";
  const note = typeof o.note === "string" ? o.note.trim().slice(0, 2000) : "";
  const now = new Date().toISOString();
  return {
    ok: true,
    value: {
      id,
      userId: typeof o.userId === "string" ? o.userId : null,
      localOwnerId:
        typeof o.localOwnerId === "string" && o.localOwnerId
          ? o.localOwnerId
          : localOwnerId,
      surahNumber,
      ayahNumber,
      pageNumber,
      markerType: o.markerType as MarkerType,
      colorToken: o.colorToken as MarkerColorToken,
      title,
      note,
      createdAt: asIso(o.createdAt, now),
      updatedAt: asIso(o.updatedAt, now),
      archivedAt:
        typeof o.archivedAt === "string" && o.archivedAt ? o.archivedAt : null,
      syncState: asSync(o.syncState),
      sourceVersion: QURAN_JOURNEY_SCHEMA_VERSION,
    },
  };
}

export function validateJourney(
  raw: unknown,
): ValidateResult<QuranJourney> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "ختمة غير صالحة" };
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : "";
  if (!id) return { ok: false, error: "معرّف ختمة مطلوب" };
  const title =
    typeof o.title === "string" && o.title.trim()
      ? o.title.trim().slice(0, 96)
      : "ختمة";
  if (typeof o.journeyType !== "string" || !JOURNEY_TYPES.has(o.journeyType)) {
    return { ok: false, error: "نوع ختمة غير معروف" };
  }
  if (typeof o.status !== "string" || !JOURNEY_STATUSES.has(o.status)) {
    return { ok: false, error: "حالة ختمة غير معروفة" };
  }
  const start = validateReference(o.startReference as QuranReference);
  const target = validateReference(o.targetReference as QuranReference);
  const current = validateReference(o.currentReference as QuranReference);
  if (!start.ok) return start;
  if (!target.ok) return target;
  if (!current.ok) return current;
  const dailyTarget = Math.max(1, Math.min(60, Math.floor(Number(o.dailyTarget) || 1)));
  const preferredDays = Array.isArray(o.preferredDays)
    ? o.preferredDays
        .map((d) => Math.floor(Number(d)))
        .filter((d) => d >= 0 && d <= 6)
    : [];
  const now = new Date().toISOString();
  return {
    ok: true,
    value: {
      id,
      title,
      journeyType: o.journeyType as JourneyType,
      startReference: start.value,
      targetReference: target.value,
      currentReference: current.value,
      dailyTarget,
      preferredDays,
      status: o.status as JourneyStatus,
      createdAt: asIso(o.createdAt, now),
      updatedAt: asIso(o.updatedAt, now),
      completedAt:
        typeof o.completedAt === "string" && o.completedAt ? o.completedAt : null,
      syncState: asSync(o.syncState),
      sourceVersion: QURAN_JOURNEY_SCHEMA_VERSION,
    },
  };
}

export function validateMemorization(
  raw: unknown,
): ValidateResult<QuranMemorizationState> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "سجل حفظ غير صالح" };
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : "";
  if (!id) return { ok: false, error: "معرّف حفظ مطلوب" };
  const surahNumber = Number(o.surahNumber);
  const ayahStart = Number(o.ayahStart);
  const ayahEnd = Number(o.ayahEnd);
  if (!isValidSurahAyah(surahNumber, ayahStart) || !isValidSurahAyah(surahNumber, ayahEnd)) {
    return { ok: false, error: "نطاق حفظ غير صالح" };
  }
  if (ayahEnd < ayahStart) {
    return { ok: false, error: "نهاية النطاق قبل البداية" };
  }
  if (typeof o.status !== "string" || !MEM_STATUSES.has(o.status)) {
    return { ok: false, error: "حالة حفظ غير معروفة" };
  }
  const confidence = Math.min(5, Math.max(0, Math.floor(Number(o.confidence) || 0)));
  const reviewCount = Math.max(0, Math.floor(Number(o.reviewCount) || 0));
  return {
    ok: true,
    value: {
      id,
      surahNumber,
      ayahStart,
      ayahEnd,
      status: o.status as MemorizationStatus,
      lastReviewedAt:
        typeof o.lastReviewedAt === "string" ? o.lastReviewedAt : null,
      nextReviewAt: typeof o.nextReviewAt === "string" ? o.nextReviewAt : null,
      reviewCount,
      confidence,
      note: typeof o.note === "string" ? o.note.trim().slice(0, 2000) : "",
      syncState: asSync(o.syncState),
      sourceVersion: QURAN_JOURNEY_SCHEMA_VERSION,
    },
  };
}

export function validateReadingSession(
  raw: unknown,
): ValidateResult<QuranReadingSession> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "جلسة قراءة غير صالحة" };
  }
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : "";
  if (!id) return { ok: false, error: "معرّف جلسة مطلوب" };
  const startPage = Math.floor(Number(o.startPage));
  const endPage = Math.floor(Number(o.endPage));
  if (!isValidPage(startPage) || !isValidPage(endPage)) {
    return { ok: false, error: "صفحات الجلسة خارج 1–604" };
  }
  if (
    typeof o.completionState !== "string" ||
    !COMPLETION.has(o.completionState)
  ) {
    return { ok: false, error: "حالة إكمال غير معروفة" };
  }
  const pagesRead = Math.max(
    0,
    Math.floor(Number(o.pagesRead) || Math.abs(endPage - startPage) + 1),
  );
  const now = new Date().toISOString();
  return {
    ok: true,
    value: {
      id,
      startedAt: asIso(o.startedAt, now),
      endedAt: typeof o.endedAt === "string" ? o.endedAt : null,
      startPage,
      endPage,
      pagesRead,
      journeyId: typeof o.journeyId === "string" ? o.journeyId : null,
      completionState: o.completionState as ReadingCompletionState,
      syncState: asSync(o.syncState),
      sourceVersion: QURAN_JOURNEY_SCHEMA_VERSION,
    },
  };
}

export function defaultColorForMarkerType(type: MarkerType): MarkerColorToken {
  switch (type) {
    case "wird":
      return "marker-wird";
    case "hifz":
      return "marker-hifz";
    case "review":
      return "marker-review";
    case "tadabbur":
      return "marker-tadabbur";
    case "lesson":
      return "marker-lesson";
    default:
      return "marker-custom-slate";
  }
}
