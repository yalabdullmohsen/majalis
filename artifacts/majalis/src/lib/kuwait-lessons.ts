import { GOVERNORATES } from "@/lib/theme";
import { resolveLessonPosterUrl } from "@/lib/lesson-image";
import { normalizeActivityType } from "@/lib/activity-label";
import { arabicIncludes } from "@/lib/arabic-search";
import { resolveLessonSheikhImage } from "@/lib/sheikh-image";
import { cleanDisplayText } from "@/lib/display-text";
import { resolveGovernorateForUi, resolveRegion, displayGovernorate } from "@/lib/kuwait-regions";
import { formatSheikhName, sheikhNameKey, stripSheikhPrefix } from "@/lib/sheikh-name";
import {
  cleanTimeText,
  computeNextOccurrenceMs,
  formatGregorianDate,
  formatHijriDate,
  formatRelativeTime,
  formatLessonTimeDisplay,
  isOccurrencePast,
  parseTimeToMinutes,
  resolvePrayerRank,
} from "@/lib/lesson-time";

export type ActivityType = "درس" | "دورة";

export type KuwaitLessonRecord = {
  id: string;
  title: string;
  sheikhName: string;
  sheikhImage?: string;
  lessonImage?: string;
  governorate: string;
  region: string;
  mosque: string;
  day: string;
  time: string;
  category: string;
  note?: string;
  description?: string;
  keywords?: string[];
  endDate?: string | null;
  startDate?: string | null;
  sortKey: number;
  nextOccurrenceMs: number;
  gregorianDate?: string;
  hijriDate?: string;
  activityType: ActivityType;
  sessionCount?: number;
  linkedLessons?: string[];
  hasLiveStream?: boolean;
  hasRecording?: boolean;
  mapsUrl?: string;
  streamUrl?: string;
  siteUrl?: string;
  qrCodeUrl?: string;
  recurring?: boolean;
  courseId?: string;
  isCourse?: boolean;
  source?: "supabase" | "seed";
  archivedAt?: string | null;
  prayerRank?: string;
  timeDisplay?: string;
};

export type KuwaitLessonFilters = {
  search: string;
  governorate: string;
  region: string;
  mosque: string;
  sheikh: string;
  day: string;
  category: string;
  timeSlot: string;
  activityType: string;
  hasLiveStream: boolean | null;
  contentKind: string;
};

export const KUWAIT_DAYS = [
  "الكل",
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

export const KUWAIT_CATEGORIES = [
  "الكل",
  "تفسير",
  "فقه",
  "عقيدة",
  "حديث",
  "سيرة",
  "تجويد",
  "تأصيل",
  "أخرى",
];

export const ACTIVITY_TYPES = ["الكل", "درس", "دورة"] as const;
export const CONTENT_KINDS = ["الكل", "دورة", "درس"] as const;

function normalizeText(value: string) {
  return String(value || "").trim().toLowerCase();
}

function lessonDedupeKey(lesson: KuwaitLessonRecord) {
  return [
    normalizeText(lesson.title),
    sheikhNameKey(lesson.sheikhName),
    normalizeText(lesson.mosque),
    normalizeText(lesson.day),
    normalizeText(lesson.time),
    normalizeText(lesson.governorate),
  ].join("|");
}

function parseDayFromSchedule(schedule?: string): string {
  if (!schedule?.trim()) return "";
  const day = KUWAIT_DAYS.find((d) => d !== "الكل" && schedule.includes(d));
  return day || schedule.trim();
}

function activityFromRow(row: any): ActivityType {
  if (row.is_course) return "دورة";
  return normalizeActivityType(row.activity_type);
}

function enrichScheduleFields(
  lesson: Omit<KuwaitLessonRecord, "sortKey" | "nextOccurrenceMs"> & {
    sortKey?: number;
    nextOccurrenceMs?: number;
  },
): KuwaitLessonRecord {
  const recurring = lesson.recurring !== false;
  const nextMs = lesson.nextOccurrenceMs ?? computeNextOccurrenceMs(lesson.day, lesson.time);
  const nextDate = new Date(nextMs);

  return {
    ...lesson,
    time: cleanTimeText(lesson.time),
    timeDisplay: formatLessonTimeDisplay(lesson.time),
    prayerRank: lesson.prayerRank,
    sheikhName:
      formatSheikhName(stripSheikhPrefix(lesson.sheikhName)) ||
      cleanDisplayText(String(lesson.sheikhName || "")) ||
      "غير محدد",
    sortKey: lesson.sortKey ?? nextMs,
    nextOccurrenceMs: nextMs,
    gregorianDate: lesson.gregorianDate || (lesson.day ? formatGregorianDate(nextDate) : undefined),
    hijriDate: lesson.hijriDate || (lesson.day ? formatHijriDate(nextDate) : undefined),
    recurring,
  };
}

/** تحويل صف Supabase أو Seed إلى نموذج العرض الموحد. */
export function mapLessonRow(row: any): KuwaitLessonRecord {
  const day = row.day_of_week || row.day || parseDayFromSchedule(row.schedule);
  const rawSheikh = row.sheikhs?.name || row.speaker_name || "";
  const region = resolveRegion(row.region || "");
  const governorate = displayGovernorate(
    resolveGovernorateForUi(row.city || "", row.region || row.city || ""),
  );
  const tags = Array.isArray(row.keywords) ? row.keywords : Array.isArray(row.tags) ? row.tags : [];
  const delivery = String(row.delivery || "");
  const hasLiveStream =
    Boolean(row.live_url) ||
    tags.some((t: string) => /بث|مباشر|live/i.test(t)) ||
    /بث|مباشر|live/i.test(delivery);

  const id = String(row.external_key || row.id || "");
  const rawTime = row.lesson_time || row.schedule || "";
  const prayerRank = resolvePrayerRank(row);

  return enrichScheduleFields({
    id,
    title: row.title,
    sheikhName: rawSheikh,
    sheikhImage: row.sheikh_image_url || resolveLessonSheikhImage(row),
    lessonImage: resolveLessonPosterUrl(row.poster_image_url),
    governorate,
    region,
    mosque: row.mosque || "",
    day,
    time: rawTime,
    prayerRank,
    category: row.category || "أخرى",
    note: row.description || undefined,
    description: row.description || undefined,
    keywords: tags,
    endDate: row.end_date || null,
    startDate: row.start_date || null,
    activityType: activityFromRow(row),
    sessionCount: row.session_count,
    linkedLessons: row.linked_titles,
    hasLiveStream,
    hasRecording: Boolean(row.video_url || row.audio_url),
    mapsUrl: row.maps_url,
    streamUrl: row.live_url,
    siteUrl: row.book_url,
    isCourse: Boolean(row.is_course),
    courseId: row.course_id,
    recurring: row.is_recurring !== false && !row.end_date,
    archivedAt: row.archived_at || null,
  });
}

function isExpired(lesson: KuwaitLessonRecord): boolean {
  if (lesson.archivedAt) return true;
  if (lesson.endDate) {
    const end = new Date(`${lesson.endDate}T23:59:59+03:00`);
    if (!Number.isNaN(end.getTime()) && end.getTime() < Date.now()) return true;
  }

  if (lesson.recurring === false && lesson.startDate) {
    const start = new Date(`${lesson.startDate}T23:59:59+03:00`);
    if (!Number.isNaN(start.getTime()) && start.getTime() < Date.now()) return true;
  }

  if (lesson.day && isOccurrencePast(lesson.day, lesson.time, lesson.recurring !== false)) {
    return lesson.recurring === false;
  }

  return false;
}

export function splitKuwaitLessons(lessons: KuwaitLessonRecord[]) {
  const active: KuwaitLessonRecord[] = [];
  const archived: KuwaitLessonRecord[] = [];
  for (const lesson of lessons) {
    if (isExpired(lesson)) archived.push(lesson);
    else active.push(lesson);
  }
  return {
    active: sortKuwaitLessons(active),
    archived: sortKuwaitLessons(archived),
  };
}

export function dedupeKuwaitLessons(lessons: KuwaitLessonRecord[]): KuwaitLessonRecord[] {
  const seen = new Set<string>();
  const result: KuwaitLessonRecord[] = [];
  for (const lesson of lessons) {
    const key = lessonDedupeKey(lesson);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(lesson);
  }
  return result;
}

export function sortKuwaitLessons(lessons: KuwaitLessonRecord[]): KuwaitLessonRecord[] {
  return [...lessons].sort((a, b) => {
    if (a.nextOccurrenceMs !== b.nextOccurrenceMs) return a.nextOccurrenceMs - b.nextOccurrenceMs;
    const gov = a.governorate.localeCompare(b.governorate, "ar");
    if (gov !== 0) return gov;
    const sheikh = a.sheikhName.localeCompare(b.sheikhName, "ar");
    if (sheikh !== 0) return sheikh;
    return a.title.localeCompare(b.title, "ar");
  });
}

function matchesTimeSlot(time: string, slot: string): boolean {
  if (slot === "الكل") return true;
  const minutes = parseTimeToMinutes(time);
  if (minutes == null) return true;
  if (slot === "صباحاً") return minutes < 12 * 60;
  if (slot === "ظهراً") return minutes >= 12 * 60 && minutes < 15 * 60;
  if (slot === "عصراً") return minutes >= 15 * 60 && minutes < 18 * 60;
  if (slot === "مساءً") return minutes >= 18 * 60;
  return true;
}

export function filterKuwaitLessons(
  lessons: KuwaitLessonRecord[],
  filters: KuwaitLessonFilters,
): KuwaitLessonRecord[] {
  const search = normalizeText(filters.search);

  return lessons.filter((lesson) => {
    if (filters.governorate !== "كل المحافظات" && lesson.governorate !== filters.governorate) return false;
    if (filters.region !== "كل المناطق" && lesson.region !== filters.region) return false;
    if (filters.mosque !== "كل المساجد" && !normalizeText(lesson.mosque).includes(normalizeText(filters.mosque))) {
      return false;
    }
    if (filters.sheikh !== "كل المشايخ" && sheikhNameKey(lesson.sheikhName) !== sheikhNameKey(filters.sheikh)) {
      return false;
    }
    if (filters.day !== "الكل" && lesson.day !== filters.day) return false;
    if (filters.category !== "الكل" && lesson.category !== filters.category) return false;
    if (filters.activityType !== "الكل" && lesson.activityType !== filters.activityType) return false;
    if (filters.contentKind !== "الكل") {
      if (filters.contentKind === "دورة" && !lesson.isCourse && lesson.activityType !== "دورة") return false;
      if (filters.contentKind === "درس" && (lesson.isCourse || lesson.activityType === "دورة")) return false;
    }
    if (filters.hasLiveStream === true && !lesson.hasLiveStream) return false;
    if (filters.hasLiveStream === false && lesson.hasLiveStream) return false;
    if (!matchesTimeSlot(lesson.time, filters.timeSlot)) return false;

    if (search) {
      if (!arabicMatchLesson(lesson, search)) return false;
    }
    return true;
  });
}

function arabicMatchLesson(lesson: KuwaitLessonRecord, search: string): boolean {
  return arabicIncludes(
    [
      lesson.title,
      lesson.sheikhName,
      lesson.mosque,
      lesson.region,
      lesson.governorate,
      lesson.day,
      lesson.time,
      lesson.category,
      lesson.activityType,
      lesson.note,
      lesson.description,
      ...(lesson.keywords || []),
      ...(lesson.linkedLessons || []),
    ]
      .filter(Boolean)
      .join(" "),
    search,
  );
}

export function buildSearchSuggestions(lessons: KuwaitLessonRecord[], query: string, limit = 8): string[] {
  const q = normalizeText(query);
  if (!q || q.length < 2) return [];

  const pool = new Set<string>();
  for (const lesson of lessons) {
    [lesson.title, stripSheikhLabel(lesson.sheikhName), lesson.mosque, lesson.region, lesson.governorate, lesson.category]
      .filter(Boolean)
      .forEach((v) => pool.add(v));
    (lesson.keywords || []).forEach((k) => pool.add(k));
  }

  return Array.from(pool)
    .filter((item) => normalizeText(item).includes(q))
    .sort((a, b) => a.localeCompare(b, "ar"))
    .slice(0, limit);
}

function stripSheikhLabel(name: string) {
  return name.replace(/^الشيخ:\s*/u, "").trim();
}

export function extractFilterOptions(lessons: KuwaitLessonRecord[]) {
  const regions = new Set<string>();
  const mosques = new Set<string>();
  const sheikhs = new Set<string>();

  for (const lesson of lessons) {
    if (lesson.region) regions.add(lesson.region);
    if (lesson.mosque) mosques.add(lesson.mosque);
    if (lesson.sheikhName) sheikhs.add(stripSheikhLabel(lesson.sheikhName));
  }

  return {
    governorates: ["كل المحافظات", ...GOVERNORATES],
    regions: ["كل المناطق", ...Array.from(regions).sort((a, b) => a.localeCompare(b, "ar"))],
    mosques: ["كل المساجد", ...Array.from(mosques).sort((a, b) => a.localeCompare(b, "ar"))],
    sheikhs: ["كل المشايخ", ...Array.from(sheikhs).sort((a, b) => a.localeCompare(b, "ar"))],
    days: KUWAIT_DAYS,
    categories: KUWAIT_CATEGORIES,
    timeSlots: ["الكل", "صباحاً", "ظهراً", "عصراً", "مساءً"],
    activityTypes: [...ACTIVITY_TYPES],
    contentKinds: [...CONTENT_KINDS],
  };
}

export const DEFAULT_KUWAIT_FILTERS: KuwaitLessonFilters = {
  search: "",
  governorate: "كل المحافظات",
  region: "كل المناطق",
  mosque: "كل المساجد",
  sheikh: "كل المشايخ",
  day: "الكل",
  category: "الكل",
  timeSlot: "الكل",
  activityType: "الكل",
  hasLiveStream: null,
  contentKind: "الكل",
};

export function getRelativeStatusLabel(lesson: KuwaitLessonRecord, archived = false): string {
  if (archived) return "منتهٍ";
  return formatRelativeTime(lesson.nextOccurrenceMs);
}
