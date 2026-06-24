import { supabase, isSupabaseConfigured, getKuwaitLessonsFromDb } from "./supabase";
import type { Book, DailyContent, LessonSeries, Mosque, PlatformLesson } from "./platform-types";
import {
  ADHKAR_SECTIONS,
  QURAN_SURAHS,
  SEED_BOOKS,
  SEED_DAILY,
  SEED_MOSQUES,
  SEED_SERIES,
  seedLessonsFromKuwait,
} from "./platform-seed";
import { loadKuwaitLessons } from "./kuwait-lessons";

const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function kuwaitTodayName(): string {
  return new Intl.DateTimeFormat("ar-KW", { timeZone: "Asia/Kuwait", weekday: "long" }).format(new Date());
}

export function isLessonToday(lesson: PlatformLesson): boolean {
  if (!lesson.day) return false;
  return lesson.day === kuwaitTodayName();
}

export function isLessonExpired(lesson: PlatformLesson): boolean {
  if (!lesson.end_date) return false;
  return new Date(`${lesson.end_date}T23:59:59+03:00`).getTime() < Date.now();
}

function mapDbLesson(row: any): PlatformLesson {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    sheikh_id: row.sheikh_id,
    sheikh_name: row.sheikhs?.name || row.speaker_name,
    mosque_id: row.mosque_id,
    mosque_name: row.mosque || row.mosques?.name,
    governorate: row.city,
    area: row.region,
    day: row.day || row.day_of_week,
    start_time: row.start_time || row.lesson_time,
    end_time: row.end_time,
    start_date: row.start_date,
    end_date: row.end_date,
    is_recurring: row.is_recurring ?? true,
    recurrence_text: row.recurrence_text || row.schedule,
    has_women_place: row.has_women_place,
    live_url: row.live_url,
    book_url: row.book_url,
    audio_url: row.audio_url,
    video_url: row.video_url,
    transcript: row.transcript,
    google_maps_url: row.mosques?.google_maps_url,
    status: row.status,
  };
}

export async function getPlatformLessons(): Promise<PlatformLesson[]> {
  const seed = seedLessonsFromKuwait();
  if (!isSupabaseConfigured()) return seed.filter((l) => !isLessonExpired(l));

  const { data } = await getKuwaitLessonsFromDb();
  const mapped = (data || []).map(mapDbLesson);
  const merged = [...mapped, ...seed];
  const seen = new Set<string>();
  const unique: PlatformLesson[] = [];
  for (const l of merged) {
    const key = `${l.title}|${l.sheikh_name}|${l.mosque_name}|${l.day}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!isLessonExpired(l)) unique.push(l);
  }
  return unique;
}

export async function getMosques(): Promise<Mosque[]> {
  if (!isSupabaseConfigured()) return SEED_MOSQUES;
  const { data } = await supabase.from("mosques").select("*").order("name");
  return data?.length ? data : SEED_MOSQUES;
}

export async function getMosqueById(id: string): Promise<{ mosque: Mosque | null; lessons: PlatformLesson[] }> {
  const mosques = await getMosques();
  const mosque = mosques.find((m) => m.id === id) || null;
  const lessons = (await getPlatformLessons()).filter((l) => l.mosque_id === id || l.mosque_name === mosque?.name);
  return { mosque, lessons };
}

export async function getBooks(): Promise<Book[]> {
  if (!isSupabaseConfigured()) return SEED_BOOKS;
  const { data } = await supabase.from("books").select("*").eq("status", "published").order("title");
  return data?.length ? data : SEED_BOOKS;
}

export async function getBookById(id: string): Promise<Book | null> {
  const books = await getBooks();
  return books.find((b) => b.id === id) || null;
}

export async function getLessonSeries(): Promise<LessonSeries[]> {
  if (!isSupabaseConfigured()) return SEED_SERIES;
  const { data } = await supabase
    .from("lesson_series")
    .select("*, sheikhs(name)")
    .eq("status", "published")
    .order("title");
  if (!data?.length) return SEED_SERIES;
  return data.map((s: any) => ({
    ...s,
    sheikh_name: s.sheikhs?.name,
  }));
}

export async function getDailyContent(): Promise<{ hadith: DailyContent; ayah: DailyContent }> {
  if (isSupabaseConfigured()) {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuwait" }).format(new Date());
    const { data } = await supabase
      .from("daily_content")
      .select("*")
      .eq("publish_date", today)
      .eq("is_published", true);
    const hadith = data?.find((d) => d.type === "hadith");
    const ayah = data?.find((d) => d.type === "ayah");
    if (hadith && ayah) {
      return { hadith, ayah };
    }
  }
  return {
    hadith: SEED_DAILY.find((d) => d.type === "hadith")!,
    ayah: SEED_DAILY.find((d) => d.type === "ayah")!,
  };
}

export async function getLessonOfDay(): Promise<PlatformLesson | null> {
  const lessons = await getPlatformLessons();
  const today = kuwaitTodayName();
  return lessons.find((l) => l.day === today) || lessons[0] || null;
}

export async function getUpcomingLessonsCount(): Promise<number> {
  const lessons = await loadKuwaitLessons();
  return lessons.length;
}

export async function getMosquesWithLessons(): Promise<
  Array<Mosque & { lessons: PlatformLesson[]; hasToday: boolean }>
> {
  const [mosques, lessons] = await Promise.all([getMosques(), getPlatformLessons()]);
  return mosques.map((m) => {
    const mosqueLessons = lessons.filter((l) => l.mosque_id === m.id || l.mosque_name === m.name);
    return {
      ...m,
      lessons: mosqueLessons,
      hasToday: mosqueLessons.some(isLessonToday),
    };
  });
}

export function getQuranSurahs() {
  return QURAN_SURAHS;
}

export function getAdhkarSections() {
  return ADHKAR_SECTIONS;
}

export function seriesProgress(series: LessonSeries): number {
  if (!series.total_lessons) return 0;
  return Math.round((series.completed_lessons / series.total_lessons) * 100);
}

export function filterLessonsByPeriod(
  lessons: PlatformLesson[],
  period: "today" | "week" | "month" | "archive",
): PlatformLesson[] {
  const today = kuwaitTodayName();
  const dayIndex = DAY_NAMES.indexOf(today);

  if (period === "today") {
    return lessons.filter(isLessonToday);
  }

  if (period === "archive") {
    return lessons.filter(isLessonExpired);
  }

  if (period === "week") {
    const weekDays = Array.from({ length: 7 }, (_, i) => DAY_NAMES[(dayIndex + i) % 7]);
    return lessons.filter((l) => l.day && weekDays.includes(l.day) && !isLessonExpired(l));
  }

  return lessons.filter((l) => !isLessonExpired(l));
}
