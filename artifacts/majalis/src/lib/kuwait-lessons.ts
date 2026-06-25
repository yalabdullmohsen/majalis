import { GOVERNORATES } from "@/lib/theme";
import { KUWAIT_LESSONS } from "@/lib/home-content";
import { getKuwaitLessonsFromDb } from "@/lib/supabase";
import { resolveLessonSheikhImage } from "@/lib/sheikh-image";

export type KuwaitLessonRecord = {
  id: string;
  title: string;
  sheikhName: string;
  sheikhImage?: string;
  governorate: string;
  region: string;
  mosque: string;
  day: string;
  time: string;
  category: string;
  note?: string;
  endDate?: string | null;
  sortKey: number;
};

export type KuwaitLessonFilters = {
  search: string;
  governorate: string;
  region: string;
  mosque: string;
  sheikh: string;
  day: string;
  category: string;
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

const DAY_INDEX: Record<string, number> = {
  السبت: 6,
  الأحد: 0,
  الاثنين: 1,
  الثلاثاء: 2,
  الأربعاء: 3,
  الخميس: 4,
  الجمعة: 5,
};

function normalizeText(value: string) {
  return String(value || "").trim().toLowerCase();
}

function lessonDedupeKey(lesson: KuwaitLessonRecord) {
  return [
    normalizeText(lesson.title),
    normalizeText(lesson.sheikhName),
    normalizeText(lesson.mosque),
    normalizeText(lesson.day),
    normalizeText(lesson.governorate),
  ].join("|");
}

function parseDayFromSchedule(schedule?: string): string {
  if (!schedule?.trim()) return "";
  const day = KUWAIT_DAYS.find((d) => d !== "الكل" && schedule.includes(d));
  return day || schedule.trim();
}

function computeNextDaySortKey(day: string): number {
  const target = DAY_INDEX[day];
  if (target == null) return 99;
  const kuwaitWeekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuwait",
    weekday: "long",
  }).format(new Date());

  const todayMap: Record<string, number> = {
    Saturday: 6,
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
  };

  const today = todayMap[kuwaitWeekday] ?? 0;
  const delta = (target - today + 7) % 7;
  return delta === 0 ? 0 : delta;
}

function mapStaticLesson(lesson: (typeof KUWAIT_LESSONS)[number]): KuwaitLessonRecord {
  return {
    id: lesson.id,
    title: lesson.title,
    sheikhName: lesson.sheikhName,
    sheikhImage: lesson.sheikhImage,
    governorate: "العاصمة",
    region: lesson.region,
    mosque: lesson.mosque,
    day: lesson.day,
    time: lesson.time,
    category: "تفسير",
    note: lesson.note,
    endDate: null,
    sortKey: computeNextDaySortKey(lesson.day),
  };
}

function mapDbLesson(row: any): KuwaitLessonRecord {
  const day = row.day_of_week || parseDayFromSchedule(row.schedule);
  const sheikhName = row.sheikhs?.name || row.speaker_name || "شيخ معتمد";
  return {
    id: row.id,
    title: row.title,
    sheikhName,
    sheikhImage: resolveLessonSheikhImage(row),
    governorate: row.city || "العاصمة",
    region: row.region || "",
    mosque: row.mosque || "",
    day,
    time: row.lesson_time || row.schedule || "",
    category: row.category || "أخرى",
    note: row.description || undefined,
    endDate: row.end_date || null,
    sortKey: computeNextDaySortKey(day),
  };
}

function isExpired(lesson: KuwaitLessonRecord): boolean {
  if (!lesson.endDate) return false;
  const end = new Date(`${lesson.endDate}T23:59:59+03:00`);
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() < Date.now();
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
  try {
    const { data } = await getKuwaitLessonsFromDb();
    const mapped = (data || []).map(mapDbLesson);
    const staticMapped = KUWAIT_LESSONS.map(mapStaticLesson);
    return dedupeKuwaitLessons([...mapped, ...staticMapped]);
  } catch {
    return dedupeKuwaitLessons(KUWAIT_LESSONS.map(mapStaticLesson));
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
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
    const gov = a.governorate.localeCompare(b.governorate, "ar");
    if (gov !== 0) return gov;
    const sheikh = a.sheikhName.localeCompare(b.sheikhName, "ar");
    if (sheikh !== 0) return sheikh;
    return a.title.localeCompare(b.title, "ar");
  });
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
    if (filters.region !== "كل المناطق" && !normalizeText(lesson.region).includes(normalizeText(filters.region))) {
      return false;
    }
    if (filters.mosque !== "كل المساجد" && !normalizeText(lesson.mosque).includes(normalizeText(filters.mosque))) {
      return false;
    }
    if (filters.sheikh !== "كل المشايخ" && lesson.sheikhName !== filters.sheikh) {
      return false;
    }
    if (filters.day !== "الكل" && lesson.day !== filters.day) {
      return false;
    }
    if (filters.category !== "الكل" && lesson.category !== filters.category) {
      return false;
    }
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
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function extractFilterOptions(lessons: KuwaitLessonRecord[]) {
  const regions = new Set<string>();
  const mosques = new Set<string>();
  const sheikhs = new Set<string>();

  for (const lesson of lessons) {
    if (lesson.region) regions.add(lesson.region);
    if (lesson.mosque) mosques.add(lesson.mosque);
    if (lesson.sheikhName) sheikhs.add(lesson.sheikhName);
  }

  return {
    governorates: ["كل المحافظات", ...GOVERNORATES],
    regions: ["كل المناطق", ...Array.from(regions).sort((a, b) => a.localeCompare(b, "ar"))],
    mosques: ["كل المساجد", ...Array.from(mosques).sort((a, b) => a.localeCompare(b, "ar"))],
    sheikhs: ["كل المشايخ", ...Array.from(sheikhs).sort((a, b) => a.localeCompare(b, "ar"))],
    days: KUWAIT_DAYS,
    categories: KUWAIT_CATEGORIES,
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
};
