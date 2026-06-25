import { GOVERNORATES } from "@/lib/theme";
import { KUWAIT_LESSONS } from "@/lib/home-content";
import { getKuwaitLessonsFromDb } from "@/lib/supabase";
import { resolveLessonSheikhImage } from "@/lib/sheikh-image";
import { resolveGovernorate, resolveRegion } from "@/lib/kuwait-regions";
import { formatSheikhName, sheikhNameKey } from "@/lib/sheikh-name";
import {
  cleanTimeText,
  computeNextOccurrenceMs,
  formatGregorianDate,
  formatHijriDate,
  formatRelativeTime,
  isOccurrencePast,
} from "@/lib/lesson-time";
import { cleanDisplayText } from "@/lib/display-text";
import { DEMO_COURSES, type Course } from "@/lib/current-lessons";
import { lessonAds, type LessonAd } from "@/lib/lesson-ads";

export type ActivityType = "درس" | "محاضرة" | "دورة";

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

export const ACTIVITY_TYPES = ["الكل", "درس", "محاضرة", "دورة"] as const;

export const CONTENT_KINDS = ["الكل", "دورة", "محاضرة", "درس"] as const;

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

function activityFromTags(tags: string[] = [], category?: string): ActivityType {
  if (tags.some((t) => t.includes("دورة"))) return "دورة";
  if (tags.some((t) => t.includes("محاضرة"))) return "محاضرة";
  if (category === "course") return "دورة";
  return "درس";
}

function enrichScheduleFields(lesson: Omit<KuwaitLessonRecord, "sortKey" | "nextOccurrenceMs"> & {
  sortKey?: number;
  nextOccurrenceMs?: number;
}): KuwaitLessonRecord {
  const recurring = lesson.recurring !== false;
  const nextMs =
    lesson.nextOccurrenceMs ??
    computeNextOccurrenceMs(lesson.day, lesson.time);
  const nextDate = new Date(nextMs);

  return {
    ...lesson,
    time: cleanTimeText(lesson.time),
    sheikhName: formatSheikhName(lesson.sheikhName) || lesson.sheikhName,
    sortKey: lesson.sortKey ?? nextMs,
    nextOccurrenceMs: nextMs,
    gregorianDate: lesson.gregorianDate || (lesson.day ? formatGregorianDate(nextDate) : undefined),
    hijriDate: lesson.hijriDate || (lesson.day ? formatHijriDate(nextDate) : undefined),
    recurring,
  };
}

function mapStaticLesson(lesson: (typeof KUWAIT_LESSONS)[number]): KuwaitLessonRecord {
  const region = resolveRegion(lesson.region);
  const governorate = resolveGovernorate(lesson.region, lesson.governorate || "العاصمة");

  return enrichScheduleFields({
    id: lesson.id,
    title: lesson.title,
    sheikhName: lesson.sheikhName,
    sheikhImage: lesson.sheikhImage,
    governorate,
    region,
    mosque: lesson.mosque,
    day: lesson.day,
    time: lesson.time,
    category: lesson.category || "أخرى",
    note: lesson.note,
    description: lesson.note,
    endDate: lesson.status === "منتهٍ" ? "2000-01-01" : null,
    activityType: "درس",
    recurring: true,
  });
}

function mapDbLesson(row: any): KuwaitLessonRecord {
  const day = row.day_of_week || parseDayFromSchedule(row.schedule);
  const rawSheikh = row.sheikhs?.name || row.speaker_name || "";
  const region = resolveRegion(row.region || "");
  const governorate = resolveGovernorate(row.region || row.city || "", row.city || "العاصمة");

  const tags = Array.isArray(row.tags) ? row.tags : [];
  const delivery = String(row.delivery || "");
  const hasLiveStream =
    tags.some((t: string) => /بث|مباشر|live/i.test(t)) ||
    /بث|مباشر|live/i.test(delivery);

  return enrichScheduleFields({
    id: row.id,
    title: row.title,
    sheikhName: rawSheikh,
    sheikhImage: resolveLessonSheikhImage(row),
    governorate,
    region,
    mosque: row.mosque || "",
    day,
    time: row.lesson_time || row.schedule || "",
    category: row.category || "أخرى",
    note: row.description || undefined,
    description: row.description || undefined,
    keywords: tags,
    endDate: row.end_date || null,
    startDate: row.start_date || null,
    activityType: activityFromTags(tags),
    hasLiveStream,
    hasRecording: Boolean(row.recording_url),
    mapsUrl: row.maps_url || undefined,
    streamUrl: row.stream_url || undefined,
    siteUrl: row.website_url || undefined,
    recurring: !row.end_date,
  });
}

function mapCourseToRecord(course: Course): KuwaitLessonRecord {
  const primary = course.lessons[0];
  const region = resolveRegion(course.region);
  const governorate = resolveGovernorate(course.region);

  return enrichScheduleFields({
    id: course.id,
    title: course.title,
    sheikhName: course.sheikhName,
    sheikhImage: course.sheikh_image_url || course.sheikhImage,
    governorate,
    region,
    mosque: course.mosque,
    day: primary?.day || course.weeklySchedule[0]?.day || "",
    time: primary?.time || course.weeklySchedule[0]?.time || "",
    category: primary?.category || "تأصيل",
    description: course.description,
    note: course.description,
    endDate: course.endDate || null,
    startDate: course.startDate || null,
    activityType: "دورة",
    sessionCount: course.lectures.length || course.weeklySchedule.length,
    linkedLessons: course.lectures.map((l) => l.title),
    mapsUrl: course.mapsUrl,
    streamUrl: course.streamUrl,
    siteUrl: course.bookUrl,
    isCourse: true,
    courseId: course.id,
    hasLiveStream: Boolean(course.streamUrl),
    recurring: !course.endDate,
  });
}

function categoryFromAdTags(tags: string[]): string {
  const map: Record<string, string> = {
    تفسير: "تفسير",
    فقه: "فقه",
    حديث: "حديث",
    عقيدة: "عقيدة",
    سنة: "حديث",
  };
  for (const tag of tags) {
    if (map[tag]) return map[tag];
  }
  return "أخرى";
}

function mapAdSession(ad: LessonAd, sessionIndex: number): KuwaitLessonRecord {
  const session = ad.sessions[sessionIndex];
  const region = resolveRegion(session.district);
  const governorate = resolveGovernorate(session.district);
  const genericLabel =
    session.label === "المجلس الأسبوعي" || session.label === "البرنامج الأسبوعي";
  const title = genericLabel ? ad.title : `${ad.title} — ${session.label}`;
  const activityType = activityFromTags(ad.tags, ad.category);

  return enrichScheduleFields({
    id: `kw-${ad.id}-${sessionIndex}`,
    title,
    sheikhName: ad.teacher,
    sheikhImage: ad.teacherImage,
    lessonImage: ad.posterImage,
    governorate,
    region,
    mosque: session.venue,
    day: session.day,
    time: session.time,
    category: categoryFromAdTags(ad.tags),
    note: session.note || ad.shortDescription,
    description: ad.detailIntro || ad.shortDescription,
    keywords: ad.tags,
    startDate: ad.startDate || null,
    activityType,
    sessionCount: ad.sessions.length > 1 ? ad.sessions.length : undefined,
    linkedLessons:
      ad.sessions.length > 1 ? ad.sessions.map((s) => s.label).filter(Boolean) : undefined,
    hasLiveStream: ad.tags.some((t) => /بث|مباشر/i.test(t)) || Boolean(session.liveUrl),
    hasRecording: Boolean(session.referenceUrl),
    mapsUrl: session.mapUrl,
    streamUrl: session.liveUrl,
    siteUrl: session.referenceUrl,
    isCourse: ad.category === "course",
    courseId: ad.category === "course" ? ad.id : undefined,
    recurring: true,
  });
}

function isExpired(lesson: KuwaitLessonRecord): boolean {
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

async function fetchAllKuwaitLessons(): Promise<KuwaitLessonRecord[]> {
  const staticFromAds = lessonAds.flatMap((ad, _idx) =>
    ad.sessions.map((_session, sessionIndex) => mapAdSession(ad, sessionIndex)),
  );

  try {
    const { data } = await getKuwaitLessonsFromDb();
    const mapped = (data || []).map(mapDbLesson);
    const courses = DEMO_COURSES.map(mapCourseToRecord);
    const staticMapped = KUWAIT_LESSONS.map(mapStaticLesson);
    return dedupeKuwaitLessons([...mapped, ...staticFromAds, ...courses, ...staticMapped]);
  } catch {
    const courses = DEMO_COURSES.map(mapCourseToRecord);
    return dedupeKuwaitLessons([
      ...staticFromAds,
      ...courses,
      ...KUWAIT_LESSONS.map(mapStaticLesson),
    ]);
  }
}

export async function loadKuwaitLessons(): Promise<KuwaitLessonRecord[]> {
  const all = await fetchAllKuwaitLessons();
  return splitKuwaitLessons(all).active;
}

export async function loadKuwaitLessonsArchive(): Promise<KuwaitLessonRecord[]> {
  const all = await fetchAllKuwaitLessons();
  return splitKuwaitLessons(all).archived;
}

export async function loadAllKuwaitLessonsSplit() {
  const all = await fetchAllKuwaitLessons();
  return splitKuwaitLessons(all);
}

export function getKuwaitLessonById(id: string): KuwaitLessonRecord | null {
  const staticFromAds = lessonAds.flatMap((ad) =>
    ad.sessions.map((_session, sessionIndex) => mapAdSession(ad, sessionIndex)),
  );
  const courses = DEMO_COURSES.map(mapCourseToRecord);
  const all = dedupeKuwaitLessons([
    ...staticFromAds,
    ...courses,
    ...KUWAIT_LESSONS.map(mapStaticLesson),
  ]);
  return all.find((l) => l.id === id) || null;
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
    if (a.nextOccurrenceMs !== b.nextOccurrenceMs) {
      return a.nextOccurrenceMs - b.nextOccurrenceMs;
    }
    const gov = a.governorate.localeCompare(b.governorate, "ar");
    if (gov !== 0) return gov;
    const sheikh = a.sheikhName.localeCompare(b.sheikhName, "ar");
    if (sheikh !== 0) return sheikh;
    return a.title.localeCompare(b.title, "ar");
  });
}

function matchesTimeSlot(time: string, slot: string): boolean {
  if (slot === "الكل") return true;
  const minutes = parseTimeToMinutesSafe(time);
  if (minutes == null) return true;
  if (slot === "صباحاً") return minutes < 12 * 60;
  if (slot === "ظهراً") return minutes >= 12 * 60 && minutes < 15 * 60;
  if (slot === "عصراً") return minutes >= 15 * 60 && minutes < 18 * 60;
  if (slot === "مساءً") return minutes >= 18 * 60;
  return true;
}

function parseTimeToMinutesSafe(time: string): number | null {
  const match = time.match(/(\d{1,2})/);
  if (/صباح|فجر|الصباح|ص\b/u.test(time)) return 8 * 60;
  if (/ظهر/u.test(time)) return 12 * 60;
  if (/عصر/u.test(time)) return 16 * 60;
  if (/مغرب|مساء|العشاء|م\b/u.test(time)) return 19 * 60;
  if (match) return Number(match[1]) * 60;
  return null;
}

export function filterKuwaitLessons(
  lessons: KuwaitLessonRecord[],
  filters: KuwaitLessonFilters,
): KuwaitLessonRecord[] {
  const search = normalizeText(filters.search);

  return lessons.filter((lesson) => {
    if (filters.governorate !== "كل المحافظات" && lesson.governorate !== filters.governorate) {
      return false;
    }
    if (filters.region !== "كل المناطق" && lesson.region !== filters.region) {
      return false;
    }
    if (filters.mosque !== "كل المساجد" && !normalizeText(lesson.mosque).includes(normalizeText(filters.mosque))) {
      return false;
    }
    if (
      filters.sheikh !== "كل المشايخ" &&
      sheikhNameKey(lesson.sheikhName) !== sheikhNameKey(filters.sheikh)
    ) {
      return false;
    }
    if (filters.day !== "الكل" && lesson.day !== filters.day) {
      return false;
    }
    if (filters.category !== "الكل" && lesson.category !== filters.category) {
      return false;
    }
    if (filters.activityType !== "الكل" && lesson.activityType !== filters.activityType) {
      return false;
    }
    if (filters.contentKind !== "الكل") {
      if (filters.contentKind === "دورة" && !lesson.isCourse && lesson.activityType !== "دورة") {
        return false;
      }
      if (filters.contentKind === "محاضرة" && lesson.activityType !== "محاضرة") {
        return false;
      }
      if (filters.contentKind === "درس" && (lesson.isCourse || lesson.activityType === "دورة")) {
        return false;
      }
    }
    if (filters.hasLiveStream === true && !lesson.hasLiveStream) return false;
    if (filters.hasLiveStream === false && lesson.hasLiveStream) return false;
    if (!matchesTimeSlot(lesson.time, filters.timeSlot)) return false;

    if (search) {
      const haystack = [
        lesson.title,
        lesson.sheikhName,
        lesson.mosque,
        lesson.region,
        lesson.governorate,
        lesson.day,
        lesson.time,
        lesson.category,
        lesson.note,
        lesson.description,
        ...(lesson.keywords || []),
        ...(lesson.linkedLessons || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
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
