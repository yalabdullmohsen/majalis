import { mapLessonRow, type KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import type {
  LessonCatalogPort,
  LessonEngagementPort,
  LessonsRepository,
  LoadLessonDetailResult,
  LoadLessonExtrasResult,
  LoadLessonPrimaryResult,
  SheikhsLookupPort,
} from "../domain/ports";

export type LoadLessonDetailDeps = {
  catalog: LessonCatalogPort;
  lessonsRepo: LessonsRepository;
  engagement: LessonEngagementPort;
  sheikhs: SheikhsLookupPort;
};

const EMPTY_STATS = { views: 0, saves: 0, shares: 0 };

export async function enrichLessonDetail(
  lesson: KuwaitLessonRecord,
  deps: LoadLessonDetailDeps,
): Promise<LoadLessonExtrasResult> {
  const [similar, sameSheikh, seriesLessons, stats] = await Promise.all([
    deps.catalog.fetchRelated(lesson),
    deps.catalog.fetchSameSheikh(lesson),
    deps.catalog.fetchSeries(lesson),
    deps.engagement.fetchStats(lesson.id),
  ]);
  return { similar, sameSheikh, seriesLessons, stats };
}

export async function resolveSheikhBio(
  name: string | undefined,
  sheikhs: SheikhsLookupPort,
  embeddedBio?: string,
): Promise<string> {
  if (embeddedBio?.trim()) return embeddedBio.trim();
  if (!name) return "";
  try {
    const match = await sheikhs.findByName(name);
    return match?.bio || "";
  } catch {
    return "";
  }
}

function emptyPrimary(): LoadLessonPrimaryResult {
  return { kuwaitLesson: null, dbLesson: null, sheikhBio: "" };
}

/**
 * Primary lesson only — title/metadata for instant shell.
 * Does not await sheikhs.findByName/list or related/stats.
 */
export async function loadLessonPrimary(
  deps: LoadLessonDetailDeps,
  id: string | undefined,
  initialLesson?: KuwaitLessonRecord | null,
): Promise<LoadLessonPrimaryResult> {
  if (initialLesson) {
    return { kuwaitLesson: initialLesson, dbLesson: null, sheikhBio: "" };
  }

  if (!id) return emptyPrimary();

  const { lesson: staticLesson } = await deps.catalog.getById(id);
  if (staticLesson) {
    return { kuwaitLesson: staticLesson, dbLesson: null, sheikhBio: "" };
  }

  const { lesson: dbLesson } = await deps.lessonsRepo.getById(id);
  if (!dbLesson) return emptyPrimary();

  return {
    kuwaitLesson: null,
    dbLesson,
    sheikhBio: dbLesson.sheikhs?.bio?.trim() || "",
  };
}

function speakerForBio(primary: LoadLessonPrimaryResult): string | undefined {
  if (primary.kuwaitLesson?.sheikhName) return primary.kuwaitLesson.sheikhName;
  const db = primary.dbLesson;
  if (!db) return undefined;
  if (typeof db.speaker_name === "string" && db.speaker_name) return db.speaker_name;
  if (typeof db.sheikhs?.name === "string" && db.sheikhs.name) return db.sheikhs.name;
  return mapLessonRow(db).sheikhName;
}

/**
 * Full detail (primary + extras + bio). Prefer progressive primary→secondary in the UI.
 */
export async function loadLessonDetail(
  deps: LoadLessonDetailDeps,
  id: string | undefined,
  initialLesson?: KuwaitLessonRecord | null,
): Promise<LoadLessonDetailResult> {
  const primary = await loadLessonPrimary(deps, id, initialLesson);
  const forEnrich =
    primary.kuwaitLesson ||
    (primary.dbLesson ? mapLessonRow(primary.dbLesson) : null);

  if (!forEnrich) {
    return {
      ...primary,
      similar: [],
      sameSheikh: [],
      seriesLessons: [],
      stats: EMPTY_STATS,
    };
  }

  const [extras, sheikhBio] = await Promise.all([
    enrichLessonDetail(forEnrich, deps).catch(() => ({
      similar: [] as KuwaitLessonRecord[],
      sameSheikh: [] as KuwaitLessonRecord[],
      seriesLessons: [] as KuwaitLessonRecord[],
      stats: EMPTY_STATS,
    })),
    primary.sheikhBio
      ? Promise.resolve(primary.sheikhBio)
      : resolveSheikhBio(speakerForBio(primary), deps.sheikhs, primary.dbLesson?.sheikhs?.bio),
  ]);

  return { ...primary, ...extras, sheikhBio };
}
