/**
 * مصدر Seed الوحيد للدروس — يُشتق من lesson-ads.ts ولا يُكرَّر في ملفات أخرى.
 * يُستخدم فقط عندما يكون جدول public.lessons فارغًا أو Supabase غير مهيأ.
 */
import { lessonAds, type LessonAd } from "@/lib/lesson-ads";
import { buildCatalogLessonRows } from "@/lib/lessons-catalog";
import { resolveGovernorateForUi, resolveRegion } from "@/lib/kuwait-regions";
import { cleanTimeText } from "@/lib/lesson-time";

export type LessonSeedRow = {
  id: string;
  external_key: string;
  title: string;
  speaker_name: string;
  sheikh_image_url?: string;
  poster_image_url?: string;
  category: string;
  city: string;
  region: string;
  mosque: string;
  day_of_week: string;
  lesson_time: string;
  schedule: string;
  description?: string;
  audience: string;
  delivery: string;
  status: "approved";
  keywords: string[];
  live_url?: string;
  book_url?: string;
  maps_url?: string;
  start_date?: string;
  end_date?: string | null;
  is_recurring: boolean;
  activity_type: "درس" | "محاضرة" | "دورة";
  is_course: boolean;
  course_id?: string;
  session_count?: number;
  linked_titles?: string[];
  sheikhs?: { name: string };
};

const CATEGORY_FROM_TAGS: Record<string, string> = {
  تفسير: "تفسير",
  فقه: "فقه",
  حديث: "حديث",
  عقيدة: "عقيدة",
  سنة: "حديث",
  "دورة علمية": "تأصيل",
  "برنامج تعليمي": "فقه",
};

function categoryForAd(ad: LessonAd): string {
  for (const tag of ad.tags) {
    if (CATEGORY_FROM_TAGS[tag]) return CATEGORY_FROM_TAGS[tag];
  }
  return "أخرى";
}

function activityTypeForAd(ad: LessonAd): LessonSeedRow["activity_type"] {
  if (ad.category === "course" || ad.tags.some((t) => t.includes("دورة"))) return "دورة";
  if (ad.tags.some((t) => t.includes("محاضرة"))) return "محاضرة";
  return "درس";
}

function rowFromAdSession(ad: LessonAd, sessionIndex: number): LessonSeedRow {
  const session = ad.sessions[sessionIndex];
  const region = resolveRegion(session.district);
  const governorate = resolveGovernorateForUi("", session.district);
  const genericLabel =
    session.label === "المجلس الأسبوعي" || session.label === "البرنامج الأسبوعي";
  const title = genericLabel ? ad.title : `${ad.title} — ${session.label}`;
  const externalKey = `kw-${ad.id}-${sessionIndex}`;
  const isCourse = ad.category === "course";

  return {
    id: externalKey,
    external_key: externalKey,
    title,
    speaker_name: ad.teacher,
    sheikh_image_url: ad.teacherImage,
    poster_image_url: ad.posterImage,
    category: categoryForAd(ad),
    city: governorate,
    region,
    mosque: session.venue,
    day_of_week: session.day,
    lesson_time: cleanTimeText(session.time),
    schedule: `${session.day} — ${cleanTimeText(session.time)}`,
    description: session.note || ad.shortDescription,
    audience: ad.hasWomenSection ? "الكل" : "رجال",
    delivery: ad.tags.some((t) => /بث|مباشر/i.test(t)) ? "كلاهما" : "حضور فقط",
    status: "approved",
    keywords: ad.tags,
    live_url: session.liveUrl,
    book_url: session.referenceUrl,
    maps_url: session.mapUrl,
    start_date: ad.startDate,
    end_date: null,
    is_recurring: true,
    activity_type: activityTypeForAd(ad),
    is_course: isCourse,
    course_id: isCourse ? ad.id : undefined,
    session_count: ad.sessions.length > 1 ? ad.sessions.length : undefined,
    linked_titles:
      ad.sessions.length > 1 ? ad.sessions.map((s) => s.label).filter(Boolean) : undefined,
    sheikhs: { name: ad.teacher },
  };
}

/** صفوف Seed بشكل جدول Supabase lessons — المصدر الوحيد للبيانات الاحتياطية. */
export function buildLessonsSeed(): LessonSeedRow[] {
  const fromAds = lessonAds.flatMap((ad) => ad.sessions.map((_session, idx) => rowFromAdSession(ad, idx)));
  const fromCatalog = buildCatalogLessonRows();
  return [...fromAds, ...fromCatalog];
}

export const LESSONS_SEED: LessonSeedRow[] = buildLessonsSeed();

export function findSeedLessonById(id: string): LessonSeedRow | undefined {
  return LESSONS_SEED.find((row) => row.id === id || row.external_key === id);
}
