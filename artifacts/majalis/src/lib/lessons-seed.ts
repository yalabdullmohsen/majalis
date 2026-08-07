/**
 * كتالوج Seed للدروس — البيانات في /public/data/lessons (JSON).
 * البناء من lesson-ads يبقى متاحًا عبر buildLessonsSeed() لأدوات التوليد فقط.
 */
import { loadAllSeedChunks, peekSeedCache } from "./json-seed-loader";
import type { LessonSeedRow } from "@/lib/lessons-types";

export type { LessonSeedRow } from "@/lib/lessons-types";

const LESSONS_DATA_BASE = "/data/lessons";

export async function loadLessonsSeed(): Promise<LessonSeedRow[]> {
  return loadAllSeedChunks<LessonSeedRow>(LESSONS_DATA_BASE);
}

export function getLessonsSeedCached(): LessonSeedRow[] {
  return peekSeedCache<LessonSeedRow>(LESSONS_DATA_BASE) ?? [];
}

/** @deprecated استخدم loadLessonsSeed */
export const LESSONS_SEED: LessonSeedRow[] = new Proxy([] as LessonSeedRow[], {
  get(_target, prop, receiver) {
    const data = getLessonsSeedCached();
    const value = Reflect.get(data, prop, receiver);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(data) : value;
  },
  has(_target, prop) {
    return prop in getLessonsSeedCached();
  },
  ownKeys() {
    return Reflect.ownKeys(getLessonsSeedCached());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(getLessonsSeedCached(), prop);
  },
});

export function findSeedLessonById(id: string): LessonSeedRow | undefined {
  const rows = getLessonsSeedCached();
  return rows.find((row) => row.id === id || row.external_key === id);
}

export async function findSeedLessonByIdAsync(id: string): Promise<LessonSeedRow | undefined> {
  const rows = await loadLessonsSeed();
  return rows.find((row) => row.id === id || row.external_key === id);
}

/**
 * إعادة بناء الصفوف من lesson-ads + الكتالوج — لأدوات التوليد فقط (لا يُستورد من صفحات العميل).
 */
export async function buildLessonsSeed(): Promise<LessonSeedRow[]> {
  const [{ lessonAds }, { buildCatalogLessonRows }, regions, lessonTime, sheikhName] = await Promise.all([
    import("@/lib/lesson-ads"),
    import("@/lib/lessons-catalog"),
    import("@/lib/kuwait-regions"),
    import("@/lib/lesson-time"),
    import("@/lib/sheikh-name"),
  ]);

  const CATEGORY_FROM_TAGS: Record<string, string> = {
    تفسير: "تفسير",
    فقه: "فقه",
    حديث: "حديث",
    عقيدة: "عقيدة",
    سنة: "حديث",
    "دورة علمية": "تأصيل",
    "برنامج تعليمي": "فقه",
  };

  type LessonAd = (typeof lessonAds)[number];

  function categoryForAd(ad: LessonAd): string {
    for (const tag of ad.tags) {
      if (CATEGORY_FROM_TAGS[tag]) return CATEGORY_FROM_TAGS[tag];
    }
    return "أخرى";
  }

  function activityTypeForAd(ad: LessonAd): LessonSeedRow["activity_type"] {
    if (ad.category === "course" || ad.tags.some((t) => t.includes("دورة"))) return "دورة";
    return "درس";
  }

  function lecturerFromSessionLabel(label: string, fallback: string): string {
    const m = label.match(/—\s*([^—(]+?)(?:\s*\(|$)/u);
    if (m?.[1]) return sheikhName.stripSheikhHonorifics(m[1]);
    return sheikhName.stripSheikhHonorifics(fallback);
  }

  function rowFromAdSession(ad: LessonAd, sessionIndex: number): LessonSeedRow {
    const session = ad.sessions[sessionIndex];
    if (!session) throw new Error(`Missing session ${sessionIndex} for lesson ad ${ad.id}`);
    const region = regions.resolveRegion(session.district);
    const governorate = regions.resolveGovernorateForUi("", session.district);
    const genericLabel =
      session.label === "المجلس الأسبوعي" || session.label === "البرنامج الأسبوعي";
    // العنوان المعروض = عنوان الإعلان النظيف فقط؛ الموعد/الجلسة في schedule وlinked_titles
    const title = ad.title;
    const externalKey = `kw-${ad.id}-${sessionIndex}`;
    const isCourse = ad.category === "course";
    const lecturer = lecturerFromSessionLabel(session.label, ad.teacher);
    const organizer = ad.organizer ? sheikhName.stripSheikhHonorifics(ad.organizer) : undefined;
    const sessionLabels = ad.sessions.map((s) => s.label).filter(Boolean);
    const linkedTitles =
      ad.sessions.length > 1
        ? sessionLabels
        : !genericLabel && session.label
          ? [session.label]
          : undefined;

    return {
      id: externalKey,
      external_key: externalKey,
      title,
      speaker_name: lecturer,
      organizer_name: organizer,
      sheikh_image_url: ad.teacherImage,
      poster_image_url: ad.posterImage,
      category: categoryForAd(ad),
      city: governorate,
      region,
      mosque: session.venue,
      day_of_week: session.day,
      lesson_time: lessonTime.cleanTimeText(session.time),
      schedule: `${session.day} — ${lessonTime.cleanTimeText(session.time)}`,
      description: session.note || ad.shortDescription,
      audience: ad.hasWomenSection ? "الكل" : "رجال",
      delivery: ad.tags.some((t) => /بث|مباشر/i.test(t)) ? "كلاهما" : "حضور فقط",
      status: "approved",
      keywords: ad.tags,
      live_url: session.liveUrl,
      book_url: session.referenceUrl,
      maps_url: session.mapUrl,
      start_date: ad.startDate,
      end_date: ad.endDate ?? null,
      // دورة/برنامج بنهاية صريحة = غير متكرر؛ يُؤرشف عبر end_date في kuwait-lessons
      is_recurring: !ad.endDate,
      activity_type: activityTypeForAd(ad),
      is_course: isCourse,
      course_id: isCourse ? ad.id : undefined,
      session_count: ad.sessions.length > 1 ? ad.sessions.length : undefined,
      linked_titles: linkedTitles,
      sheikhs: { name: lecturer },
    };
  }

  const fromAds = lessonAds.flatMap((ad) =>
    ad.sessions.map((_session, idx) => rowFromAdSession(ad, idx)),
  );
  const fromCatalog = buildCatalogLessonRows();
  return [...fromAds, ...fromCatalog];
}
