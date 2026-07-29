import { mapLessonRow, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { sheikhNameKey } from "@/lib/sheikh-name";
import type {
  LessonCatalogPort,
  LessonEngagementPort,
  LessonsRepository,
  LoadLessonDetailResult,
  SheikhsLookupPort,
} from "../domain/ports";

export type LoadLessonDetailDeps = {
  catalog: LessonCatalogPort;
  lessonsRepo: LessonsRepository;
  engagement: LessonEngagementPort;
  sheikhs: SheikhsLookupPort;
};

async function enrich(
  lesson: KuwaitLessonRecord,
  deps: LoadLessonDetailDeps,
): Promise<Pick<LoadLessonDetailResult, "similar" | "sameSheikh" | "seriesLessons" | "stats">> {
  const [similar, sameSheikh, seriesLessons, stats] = await Promise.all([
    deps.catalog.fetchRelated(lesson),
    deps.catalog.fetchSameSheikh(lesson),
    deps.catalog.fetchSeries(lesson),
    deps.engagement.fetchStats(lesson.id),
  ]);
  return { similar, sameSheikh, seriesLessons, stats };
}

async function resolveSheikhBio(
  name: string | undefined,
  sheikhs: SheikhsLookupPort,
): Promise<string> {
  if (!name) return "";
  try {
    const { data } = await sheikhs.list();
    const key = sheikhNameKey(name);
    const match = (data || []).find((s) => sheikhNameKey(s.name || "") === key);
    return match?.bio || "";
  } catch {
    return "";
  }
}

/**
 * Application use case: load a lesson detail page model.
 * Keeps orchestration out of React views.
 */
export async function loadLessonDetail(
  deps: LoadLessonDetailDeps,
  id: string | undefined,
  initialLesson?: KuwaitLessonRecord | null,
): Promise<LoadLessonDetailResult> {
  const emptyStats = { views: 0, saves: 0, shares: 0 };

  if (initialLesson) {
    const extras = await enrich(initialLesson, deps).catch(() => ({
      similar: [] as KuwaitLessonRecord[],
      sameSheikh: [] as KuwaitLessonRecord[],
      seriesLessons: [] as KuwaitLessonRecord[],
      stats: emptyStats,
    }));
    const sheikhBio = await resolveSheikhBio(initialLesson.sheikhName, deps.sheikhs);
    return {
      kuwaitLesson: initialLesson,
      dbLesson: null,
      ...extras,
      sheikhBio,
    };
  }

  if (!id) {
    return {
      kuwaitLesson: null,
      dbLesson: null,
      similar: [],
      sameSheikh: [],
      seriesLessons: [],
      stats: emptyStats,
      sheikhBio: "",
    };
  }

  const { lesson: staticLesson } = await deps.catalog.getById(id);
  if (staticLesson) {
    const extras = await enrich(staticLesson, deps).catch(() => ({
      similar: [] as KuwaitLessonRecord[],
      sameSheikh: [] as KuwaitLessonRecord[],
      seriesLessons: [] as KuwaitLessonRecord[],
      stats: emptyStats,
    }));
    const sheikhBio = await resolveSheikhBio(staticLesson.sheikhName, deps.sheikhs);
    return {
      kuwaitLesson: staticLesson,
      dbLesson: null,
      ...extras,
      sheikhBio,
    };
  }

  const { lesson: dbLesson } = await deps.lessonsRepo.getById(id);
  if (!dbLesson) {
    return {
      kuwaitLesson: null,
      dbLesson: null,
      similar: [],
      sameSheikh: [],
      seriesLessons: [],
      stats: emptyStats,
      sheikhBio: "",
    };
  }

  const mapped = mapLessonRow(dbLesson);
  const extras = await enrich(mapped, deps).catch(() => ({
    similar: [] as KuwaitLessonRecord[],
    sameSheikh: [] as KuwaitLessonRecord[],
    seriesLessons: [] as KuwaitLessonRecord[],
    stats: emptyStats,
  }));
  const speaker =
    (typeof dbLesson.speaker_name === "string" && dbLesson.speaker_name) ||
    (typeof dbLesson.sheikhs?.name === "string" && dbLesson.sheikhs.name) ||
    mapped.sheikhName;
  const sheikhBio = await resolveSheikhBio(speaker, deps.sheikhs);

  return {
    kuwaitLesson: null,
    dbLesson,
    ...extras,
    sheikhBio,
  };
}
