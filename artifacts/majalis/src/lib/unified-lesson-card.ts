import { resolveLessonPosterUrl } from "@/lib/lesson-image";
import { cleanDisplayText } from "./display-text";
import { extractLessonSchedule } from "./lesson-display";
import { formatSheikhName } from "./sheikh-name";
import {
  computeNextOccurrenceMs,
  formatGregorianDate,
  formatHijriDate,
  formatRelativeTime,
  formatShortLessonTime,
} from "./lesson-time";
import type { ActivityType, KuwaitLessonRecord } from "./kuwait-lessons";
import { getRelativeStatusLabel } from "./kuwait-lessons";

export type UnifiedLesson = {
  id: string;
  title: string;
  sheikhName: string;
  sheikhImage?: string;
  lessonImage?: string;
  category: string;
  day: string;
  time: string;
  mosque: string;
  region: string;
  governorate: string;
  sortKey: number;
  nextOccurrenceMs: number;
  statusLabel: string;
  detailsHref: string;
  note?: string;
  description?: string;
  archived?: boolean;
  gregorianDate?: string;
  hijriDate?: string;
  activityType?: ActivityType;
  sessionCount?: number;
  linkedLessons?: string[];
  hasLiveStream?: boolean;
  hasRecording?: boolean;
  mapsUrl?: string;
  streamUrl?: string;
  siteUrl?: string;
  qrCodeUrl?: string;
  keywords?: string[];
};

export function fromKuwaitLesson(lesson: KuwaitLessonRecord, archived = false): UnifiedLesson {
  return {
    id: lesson.id,
    title: cleanDisplayText(lesson.title),
    sheikhName: formatSheikhName(lesson.sheikhName.replace(/^الشيخ(?:ة)?:\s*/u, "")) || cleanDisplayText(lesson.sheikhName),
    sheikhImage: lesson.sheikhImage,
    lessonImage: resolveLessonPosterUrl(lesson.lessonImage),
    category: cleanDisplayText(lesson.category) || "أخرى",
    day: cleanDisplayText(lesson.day),
    time: formatShortLessonTime(lesson.time),
    mosque: cleanDisplayText(lesson.mosque),
    region: cleanDisplayText(lesson.region),
    governorate: cleanDisplayText(lesson.governorate),
    sortKey: lesson.nextOccurrenceMs,
    nextOccurrenceMs: lesson.nextOccurrenceMs,
    statusLabel: getRelativeStatusLabel(lesson, archived),
    detailsHref: `/lessons/${lesson.id}`,
    note: lesson.note ? cleanDisplayText(lesson.note) : undefined,
    description: lesson.description ? cleanDisplayText(lesson.description) : undefined,
    archived,
    gregorianDate: lesson.gregorianDate,
    hijriDate: lesson.hijriDate,
    activityType: lesson.activityType,
    sessionCount: lesson.sessionCount,
    linkedLessons: lesson.linkedLessons,
    hasLiveStream: lesson.hasLiveStream,
    hasRecording: lesson.hasRecording,
    mapsUrl: lesson.mapsUrl,
    streamUrl: lesson.streamUrl,
    siteUrl: lesson.siteUrl,
    qrCodeUrl: lesson.qrCodeUrl,
    keywords: lesson.keywords,
  };
}

export function fromDbLesson(lesson: {
  id: string;
  title: string;
  category?: string;
  mosque?: string;
  city?: string;
  region?: string;
  description?: string;
  schedule?: string;
  day_of_week?: string;
  lesson_time?: string;
  speaker_name?: string;
  sheikhs?: { name?: string };
  sortKey?: number;
  stream_url?: string;
  maps_url?: string;
  website_url?: string;
  recording_url?: string;
  live_url?: string;
  book_url?: string;
  video_url?: string;
  audio_url?: string;
  poster_image_url?: string;
  activity_type?: string;
  is_course?: boolean;
  course_id?: string;
  session_count?: number;
  linked_titles?: string[];
  external_key?: string;
}): UnifiedLesson {
  const sheikhName = lesson.sheikhs?.name || lesson.speaker_name || "";
  const { day, time } = extractLessonSchedule(lesson);
  const nextMs = computeNextOccurrenceMs(day, time);
  const nextDate = new Date(nextMs);

  return {
    id: lesson.id,
    title: cleanDisplayText(lesson.title),
    sheikhName: formatSheikhName(sheikhName),
    category: cleanDisplayText(lesson.category) || "أخرى",
    day: cleanDisplayText(day),
    time: formatShortLessonTime(time),
    mosque: cleanDisplayText(lesson.mosque),
    region: cleanDisplayText(lesson.region),
    governorate: cleanDisplayText(lesson.city),
    sortKey: lesson.sortKey ?? nextMs,
    nextOccurrenceMs: nextMs,
    statusLabel: formatRelativeTime(nextMs),
    detailsHref: `/lessons/${lesson.id}`,
    note: lesson.description ? cleanDisplayText(lesson.description) : undefined,
    description: lesson.description ? cleanDisplayText(lesson.description) : undefined,
    gregorianDate: day ? formatGregorianDate(nextDate) : undefined,
    hijriDate: day ? formatHijriDate(nextDate) : undefined,
    hasLiveStream: Boolean(lesson.live_url || lesson.stream_url),
    hasRecording: Boolean(lesson.video_url || lesson.audio_url || lesson.recording_url),
    mapsUrl: lesson.maps_url,
    streamUrl: lesson.live_url || lesson.stream_url,
    siteUrl: lesson.book_url || lesson.website_url,
    activityType: (lesson.activity_type as UnifiedLesson["activityType"]) || "درس",
  };
}

export function buildLessonCopyText(lesson: UnifiedLesson): string {
  const lines = [
    lesson.title,
    lesson.sheikhName,
    lesson.activityType ? `نوع النشاط: ${lesson.activityType}` : "",
    `التصنيف: ${lesson.category}`,
    lesson.day ? `اليوم: ${lesson.day}` : "",
    lesson.gregorianDate ? `التاريخ: ${lesson.gregorianDate}` : "",
    lesson.hijriDate ? `التاريخ الهجري: ${lesson.hijriDate}` : "",
    lesson.time ? `الوقت: ${lesson.time}` : "",
    lesson.mosque ? `المكان: ${lesson.mosque}` : "",
    lesson.region ? `المنطقة: ${lesson.region}` : "",
    lesson.governorate ? `المحافظة: ${lesson.governorate}` : "",
    lesson.hasLiveStream ? "يوجد بث مباشر" : "",
    lesson.hasRecording ? "يوجد تسجيل" : "",
    `الحالة: ${lesson.statusLabel}`,
  ].filter(Boolean);

  if (lesson.note) lines.push(lesson.note);
  lines.push("", "المجلس العلمي");
  return lines.join("\n");
}

export function buildLessonShareUrl(lesson: UnifiedLesson): string {
  if (typeof window === "undefined") return lesson.detailsHref;
  return `${window.location.origin}${lesson.detailsHref}`;
}

export function prominenceClass(sortKey: number, archived?: boolean): string {
  if (archived) return "lesson-unified-card--archived";
  const now = Date.now();
  const diffHours = (sortKey - now) / (60 * 60 * 1000);
  if (diffHours <= 0) return "lesson-unified-card--today";
  if (diffHours <= 24) return "lesson-unified-card--soon";
  return "";
}

export function buildCalendarIcsFromUnified(lesson: UnifiedLesson): string {
  const start = new Date(lesson.nextOccurrenceMs);
  const y = start.getUTCFullYear();
  const m = String(start.getUTCMonth() + 1).padStart(2, "0");
  const d = String(start.getUTCDate()).padStart(2, "0");
  const dt = `${y}${m}${d}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AlMajlisAlIlmi//Lessons//AR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${lesson.id}@majlisilm.com`,
    `DTSTAMP:${dt}T120000Z`,
    `DTSTART;VALUE=DATE:${dt}`,
    `SUMMARY:${lesson.title} — ${lesson.sheikhName}`,
    `DESCRIPTION:${(lesson.description || lesson.note || "").replace(/\n/g, " ")}`,
    `LOCATION:${lesson.mosque}، ${lesson.region}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function downloadUnifiedCalendar(lesson: UnifiedLesson) {
  const blob = new Blob([buildCalendarIcsFromUnified(lesson)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `درس-${lesson.title}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
