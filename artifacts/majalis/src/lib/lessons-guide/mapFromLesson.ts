import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { KUWAIT_TZ, isLessonInProgress, isOccurrencePast } from "@/lib/lesson-time";
import { isOnlineVenue } from "@/lib/lessons/lessonNormalize";
import { isMapEligible, parseExplicitCoordsFromMapsUrl } from "./geo";
import type {
  LessonsGuidePublicationState,
  LessonsGuideScheduleStatus,
  LessonsGuideSourceStatus,
  ScheduledLessonGuideItem,
} from "./types";

function publicationFromRecord(lesson: KuwaitLessonRecord): LessonsGuidePublicationState {
  if (lesson.archivedAt) return "archived";
  return "public";
}

function sourceFromRecord(lesson: KuwaitLessonRecord): LessonsGuideSourceStatus {
  if (lesson.source === "supabase" || lesson.source === "seed") return lesson.source;
  return "unknown";
}

function scheduleStatus(
  lesson: KuwaitLessonRecord,
  now: Date,
): LessonsGuideScheduleStatus {
  if (lesson.archivedAt) return "completed";
  const next = lesson.nextOccurrenceMs;
  if (!Number.isFinite(next) || next <= 0) return "completed";
  if (isLessonInProgress(lesson.day, lesson.time, now)) return "live";
  if (
    isOccurrencePast(lesson.day, lesson.time, Boolean(lesson.recurring), now) &&
    !lesson.recurring
  ) {
    return "completed";
  }
  return "upcoming";
}

function hasValidUpcomingOccurrence(lesson: KuwaitLessonRecord, nowMs: number): boolean {
  const next = lesson.nextOccurrenceMs;
  if (!Number.isFinite(next) || next <= 0) return false;
  if (next < nowMs - 60_000 && !isLessonInProgress(lesson.day, lesson.time, new Date(nowMs))) {
    return false;
  }
  const dayOk = Boolean(String(lesson.day || "").trim());
  const timeOk = Boolean(String(lesson.time || "").trim());
  return dayOk && timeOk;
}

/**
 * محوّل من سجل الدرس الحالي → عقد الدليل.
 * لا يخترع مكانًا ولا إحداثيات ولا محاضرًا.
 */
export function toScheduledLessonGuideItem(
  lesson: KuwaitLessonRecord,
  opts?: { nowMs?: number; favorite?: boolean },
): ScheduledLessonGuideItem {
  const nowMs = opts?.nowMs ?? Date.now();
  const now = new Date(nowMs);
  const coords = parseExplicitCoordsFromMapsUrl(lesson.mapsUrl);
  const mapEligible = isMapEligible(coords);
  const status = scheduleStatus(lesson, now);
  const publicationState = publicationFromRecord(lesson);
  const timelineUpcomingEligible =
    publicationState === "public" &&
    (status === "upcoming" || status === "live") &&
    hasValidUpcomingOccurrence(lesson, nowMs);

  const locationName = String(lesson.mosque || "").trim() || undefined;
  const online =
    lesson.streamUrl ||
    (isOnlineVenue(lesson.mosque, lesson.region) ? lesson.siteUrl : undefined);

  const speaker = String(lesson.sheikhName || "").trim() || undefined;

  return {
    lessonId: lesson.id,
    title: lesson.title,
    description: lesson.description || lesson.note,
    categoryId: lesson.category || undefined,
    date: lesson.startDate || lesson.gregorianDate || undefined,
    startTime: lesson.time || undefined,
    endTime: undefined,
    timezone: KUWAIT_TZ,
    status,
    locationName,
    address: [lesson.region, lesson.governorate].filter(Boolean).join(" — ") || undefined,
    latitude: coords?.latitude,
    longitude: coords?.longitude,
    onlineUrl: online || undefined,
    reminderEnabled: false,
    favorite: opts?.favorite === true,
    publicationState,
    sourceStatus: sourceFromRecord(lesson),
    nextOccurrenceMs: Number.isFinite(lesson.nextOccurrenceMs)
      ? lesson.nextOccurrenceMs
      : undefined,
    mapEligible,
    timelineUpcomingEligible,
    speakerName: speaker,
  };
}

/** عناصر للخط الزمني: قادمة/حية عامة فقط */
export function filterTimelineUpcoming(
  items: ScheduledLessonGuideItem[],
): ScheduledLessonGuideItem[] {
  return items.filter(
    (i) =>
      i.timelineUpcomingEligible &&
      i.publicationState === "public" &&
      i.status !== "draft" &&
      i.status !== "cancelled",
  );
}

/** نقاط الخريطة: إحداثيات موثّقة فقط */
export function filterMapPins(items: ScheduledLessonGuideItem[]): ScheduledLessonGuideItem[] {
  return items.filter(
    (i) =>
      i.mapEligible &&
      i.publicationState === "public" &&
      i.status !== "draft" &&
      i.status !== "cancelled" &&
      typeof i.latitude === "number" &&
      typeof i.longitude === "number",
  );
}
