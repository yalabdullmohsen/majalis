import { GOVERNORATES } from "@/lib/theme";
import { resolveLessonPosterUrl } from "@/lib/lesson-image";
import { normalizeActivityType } from "@/lib/activity-label";
import { arabicIncludes, arabicMatchAny, normalizeArabic } from "@/lib/arabic-search";
import { resolveLessonSheikhImage } from "@/lib/sheikh-image";
import { resolveGovernorateForUi, resolveRegion, displayGovernorate } from "@/lib/kuwait-regions";
import { formatSheikhName, sheikhNameKey } from "@/lib/sheikh-name";
import {
  cleanTimeText,
  computeNextOccurrenceMs,
  DAY_INDEX,
  formatGregorianDate,
  formatHijriDate,
  formatRelativeTimeDetailed,
  isLessonInProgress,
  getKuwaitClock,
  isOccurrencePast,
  parseTimeToMinutes,
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
  hasWomenSection?: boolean;
  /** true فقط إذا كان الدرس للنساء فقط (audience = نساء) */
  isWomenOnly?: boolean;
  source?: "supabase" | "seed";
  archivedAt?: string | null;
  completeness?: number;
  missingFields?: string[];
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
  return normalizeArabic(String(value || "").trim());
}

// Strips diacritics + normalizes Arabic letter variants so that spelling
// differences (تشكيل, أ/ا/إ, ة/ه, ى/ي) don't defeat deduplication.
function normDedup(value: string) {
  return normalizeArabic(String(value || "")).replace(/\s+/g, "");
}

// Primary key: normalized title + mosque + day.
// Sheikh name is a secondary tiebreaker — included when mosque is empty to
// avoid collapsing different lessons at different (unknown) locations.
function lessonDedupeKey(lesson: KuwaitLessonRecord) {
  const title  = normDedup(lesson.title);
  const mosque = normDedup(lesson.mosque);
  const day    = normDedup(lesson.day);
  const sheikh = normDedup(lesson.sheikhName);
  // When mosque is known, (title+mosque+day) uniquely identifies the lesson.
  // When mosque is absent, add sheikh to avoid false merges.
  const secondary = mosque || sheikh;
  return [title, secondary, day].join("|");
}

function computeCompleteness(lesson: KuwaitLessonRecord): { score: number; missing: string[] } {
  const missing: string[] = [];
  let score = 0;
  const checks: Array<[keyof KuwaitLessonRecord, number]> = [
    ["sheikhName", 0.20],
    ["mosque",     0.20],
    ["day",        0.20],
    ["time",       0.15],
    ["category",   0.10],
    ["governorate",0.15],
  ];
  for (const [field, weight] of checks) {
    const val = lesson[field];
    if (val && String(val).trim()) {
      score += weight;
    } else {
      missing.push(field as string);
    }
  }
  return { score: Math.round(score * 100) / 100, missing };
}

/** Is the lesson ready for public display (has all three essential fields)? */
export function isLessonPublicReady(lesson: KuwaitLessonRecord): boolean {
  return Boolean(lesson.sheikhName?.trim()) &&
         Boolean(lesson.mosque?.trim()) &&
         Boolean(lesson.day?.trim() || lesson.time?.trim());
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
    sheikhName: formatSheikhName(lesson.sheikhName.replace(/^الشيخ(?:ة)?:\s*/u, "")) || lesson.sheikhName,
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

  // Colons in URL path segments break Vercel routing; replace with dashes
  const id = String(row.external_key || row.id || "").replace(/:/g, "-");

  const partialLesson = enrichScheduleFields({
    id,
    title: row.title,
    sheikhName: rawSheikh,
    sheikhImage: row.sheikh_image_url || resolveLessonSheikhImage(row),
    lessonImage: resolveLessonPosterUrl(row.poster_image_url),
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
    activityType: activityFromRow(row),
    sessionCount: row.session_count,
    linkedLessons: row.linked_titles,
    hasLiveStream,
    hasRecording: Boolean(row.video_url || row.audio_url),
    mapsUrl: row.maps_url,
    streamUrl: row.live_url,
    siteUrl: row.book_url,
    isCourse: Boolean(row.is_course),
    // isWomenOnly = true فقط عند وجود نص صريح (audience = نساء)
    // hasWomenSection = true عند وجود مكان مخصص للنساء — بمعزل عن audience
    isWomenOnly: row.audience === "نساء",
    hasWomenSection: Boolean(row.has_women_section) || row.audience === "نساء",
    courseId: row.course_id,
    recurring: row.is_recurring !== false && !row.end_date,
    archivedAt: row.archived_at || null,
  });
  const { score, missing } = computeCompleteness(partialLesson);
  partialLesson.completeness = row.completeness_score != null ? Number(row.completeness_score) : score;
  partialLesson.missingFields = missing;
  return partialLesson;
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
  // Keep the most-complete record when duplicates exist.
  // "supabase" source beats "seed" when scores are equal.
  const best = new Map<string, KuwaitLessonRecord>();
  for (const lesson of lessons) {
    const key = lessonDedupeKey(lesson);
    const existing = best.get(key);
    if (!existing) {
      best.set(key, lesson);
      continue;
    }
    const existingScore = existing.completeness ?? 0;
    const newScore = lesson.completeness ?? 0;
    const newIsDb = lesson.source === "supabase";
    const existingIsDb = existing.source === "supabase";
    if (newScore > existingScore || (newScore === existingScore && newIsDb && !existingIsDb)) {
      best.set(key, lesson);
    }
  }
  return Array.from(best.values());
}

export function sortKuwaitLessons(lessons: KuwaitLessonRecord[]): KuwaitLessonRecord[] {
  const now = new Date();
  const enriched = lessons.map((l) => {
    const inProgress = isLessonInProgress(l.day, l.time, now);
    // الدرس الجاري: nextOccurrenceMs = 0 → يظهر في أعلى القائمة
    const nextMs = inProgress ? 0 : computeNextOccurrenceMs(l.day, l.time, now);
    return { ...l, nextOccurrenceMs: nextMs };
  });
  return enriched.sort((a, b) => {
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
  const minutes = parseTimeToMinutesSafe(time);
  if (minutes == null) return true;
  if (slot === "صباحاً") return minutes < 12 * 60;
  if (slot === "ظهراً") return minutes >= 12 * 60 && minutes < 15 * 60;
  if (slot === "عصراً") return minutes >= 15 * 60 && minutes < 18 * 60;
  if (slot === "مساءً") return minutes >= 18 * 60;
  return true;
}

function parseTimeToMinutesSafe(time: string): number | null {
  // ملاحظة: \b لا يعمل مع الحروف العربية (ASCII word boundary) — نستخدم نمط المسافة بدلاً منه
  const match = time.match(/(\d{1,2})/);
  if (/صباح|فجر|الصباح/u.test(time) || /(?:^|\s)ص(?:\s|$)/u.test(time)) return 8 * 60;
  if (/ظهر/u.test(time)) return 12 * 60;
  if (/عصر/u.test(time)) return 16 * 60;
  if (/مغرب|مساء|العشاء/u.test(time) || /(?:^|\s)م(?:\s|$)/u.test(time)) return 19 * 60;
  if (match) {
    const hour = Number(match[1]);
    // صيغة 24 ساعة: إذا الساعة >= 12 فهي بعد الظهر
    if (hour >= 12) return hour * 60;
    // صيغة HH:MM مع دقائق — نتحقق إن كان الرقم الأول مفصولاً بـ :
    const hhmm = time.match(/^(\d{1,2}):(\d{2})$/);
    if (hhmm) return Number(hhmm[1]) * 60 + Number(hhmm[2]);
    return hour * 60;
  }
  return null;
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
    if (filters.day !== "الكل" && !lesson.day.split("،").map(d => d.trim()).includes(filters.day)) return false;
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
    .filter((item) => arabicMatchAny([item], q))
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

  const now = Date.now();
  const diffMs = lesson.nextOccurrenceMs - now;

  // الدرس جارٍ الآن (بدأ قبل ≤٩٠ دقيقة ولم ينتهِ بعد)
  if (diffMs <= 0 && diffMs > -90 * 60_000) return "جارٍ الآن";

  // تحقّق من انتهاء حصة اليوم فعليًا (nextOccurrenceMs قفز للأسبوع القادم)
  if (lesson.day) {
    const clock = getKuwaitClock();
    const targetDay = DAY_INDEX[lesson.day];
    if (targetDay !== undefined && targetDay === clock.weekday) {
      const timeMin = parseTimeToMinutes(lesson.time);
      if (timeMin !== null) {
        const nowMin = clock.hour * 60 + clock.minute;
        if (nowMin > timeMin + 90) return "انتهى اليوم";
      }
    }
  }

  return formatRelativeTimeDetailed(lesson.nextOccurrenceMs, lesson.time);
}
