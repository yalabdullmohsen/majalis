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
import {
  getFeaturedHomeStatusLabel,
  getRelativeStatusLabel,
  isLessonComplete,
  type FeaturedHomeStatusLabel,
} from "./kuwait-lessons";
import {
  canonicalizeLessonPublicId,
  isOrphanKuwaitLessonHashId,
} from "./lesson-id-aliases";
import { findSeedLessonById } from "./lessons-seed";

export type UnifiedLesson = {
  id: string;
  title: string;
  sheikhName: string;
  organizerName?: string;
  sheikhImage?: string;
  lessonImage?: string;
  category: string;
  day: string;
  /** وقت العرض المختصر على البطاقة */
  time: string;
  /** الوقت الخام لحساب «جارٍ الآن» — لا يُمرَّر عبر formatShortLessonTime */
  scheduleTime: string;
  mosque: string;
  region: string;
  governorate: string;
  sortKey: number;
  nextOccurrenceMs: number;
  statusLabel: string;
  /** عند التعيين: تسمية مبسّطة ثابتة للرئيسية/المميز (يبدأ اليوم · مستمر · قادم) */
  featuredHomeStatus?: FeaturedHomeStatusLabel;
  /** فارغ إن لم يكن السجل قابلاً للعرض كصفحة تفاصيل منشورة */
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
  womenAttendance?: "متاح" | "men_only";
  womenAttendanceNote?: string;
};

/** حاجز دائم: لا رابط تفاصيل إلا لمعرّف موجود (بذرة أو مكتمل) وغير يتيم. */
export function resolveLessonDetailsHref(lesson: Pick<KuwaitLessonRecord, "id"> & Partial<KuwaitLessonRecord>): string {
  const canonical = canonicalizeLessonPublicId(lesson.id);
  if (!canonical || isOrphanKuwaitLessonHashId(canonical) || isOrphanKuwaitLessonHashId(lesson.id)) {
    return "";
  }
  const inSeed = Boolean(findSeedLessonById(canonical) || findSeedLessonById(lesson.id));
  const complete = isLessonComplete(lesson as KuwaitLessonRecord);
  if (!inSeed && !complete) return "";
  return `/lessons/${canonical}`;
}

export function fromKuwaitLesson(
  lesson: KuwaitLessonRecord,
  archived = false,
  options?: { featuredHome?: boolean },
): UnifiedLesson {
  const canonicalId = canonicalizeLessonPublicId(lesson.id) || lesson.id;
  return {
    id: canonicalId,
    title: cleanDisplayText(lesson.title),
    sheikhName: formatSheikhName(lesson.sheikhName.replace(/^الشيخ(?:ة)?:\s*/u, "")) || cleanDisplayText(lesson.sheikhName),
    organizerName: lesson.organizerName ? cleanDisplayText(lesson.organizerName) : undefined,
    sheikhImage: lesson.sheikhImage,
    lessonImage: resolveLessonPosterUrl(lesson.lessonImage),
    category: cleanDisplayText(lesson.category) || "",
    day: cleanDisplayText(lesson.day),
    time: formatShortLessonTime(lesson.time),
    scheduleTime: lesson.time,
    mosque: cleanDisplayText(lesson.mosque),
    region: cleanDisplayText(lesson.region),
    governorate: cleanDisplayText(lesson.governorate),
    sortKey: lesson.nextOccurrenceMs,
    nextOccurrenceMs: lesson.nextOccurrenceMs,
    statusLabel: getRelativeStatusLabel(lesson, archived),
    featuredHomeStatus: options?.featuredHome
      ? getFeaturedHomeStatusLabel(lesson) ?? undefined
      : undefined,
    detailsHref: resolveLessonDetailsHref({ ...lesson, id: canonicalId }),
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
    womenAttendance: lesson.womenAttendance,
    womenAttendanceNote: lesson.womenAttendanceNote,
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

  const publicId = canonicalizeLessonPublicId(lesson.external_key || lesson.id) || lesson.id;
  return {
    id: publicId,
    title: cleanDisplayText(lesson.title),
    sheikhName: formatSheikhName(sheikhName),
    category: cleanDisplayText(lesson.category) || "",
    day: cleanDisplayText(day),
    time: formatShortLessonTime(time),
    scheduleTime: time,
    mosque: cleanDisplayText(lesson.mosque),
    region: cleanDisplayText(lesson.region),
    governorate: cleanDisplayText(lesson.city),
    sortKey: lesson.sortKey ?? nextMs,
    nextOccurrenceMs: nextMs,
    statusLabel: formatRelativeTime(nextMs),
    detailsHref: resolveLessonDetailsHref({
      id: publicId,
      title: lesson.title,
      sheikhName,
      day,
      time,
    }),
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
  const ics = buildCalendarIcsFromUnified(lesson);
  const blob = new Blob([ics], {
    type: "text/calendar;charset=utf-8",
  });
  const filename = `درس-${lesson.title}.ics`;

  // Capacitor / iOS: مشاركة ملف التقويم عبر ورقة النظام إن أمكن
  void (async () => {
    try {
      const { isNative } = await import("@/lib/capacitor-utils");
      if (isNative && typeof navigator !== "undefined" && typeof navigator.share === "function") {
        const file = new File([blob], filename, { type: "text/calendar" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: lesson.title,
            text: `${lesson.title} — ${lesson.sheikhName}`,
          });
          return;
        }
      }
    } catch {
      /* fallback أدناه */
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  })();
}

/** فتح خرائط/بث خارج التطبيق عبر Browser على الأصلي. */
export function openLessonExternalUrl(url: string): void {
  void import("@/lib/capacitor-utils").then(({ openExternalUrl }) => {
    void openExternalUrl(url, { confirmLeave: true });
  });
}

export async function shareLesson(lesson: UnifiedLesson): Promise<void> {
  const url = buildLessonShareUrl(lesson);
  const text = `${lesson.title} — ${lesson.sheikhName}\n${url}`;
  try {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      await navigator.share({ title: lesson.title, text, url });
      return;
    }
  } catch {
    /* fall through */
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
}
