import { loadLessonDetail, type LoadLessonDetailDeps } from "./application/load-lesson-detail";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import type { LoadLessonDetailResult } from "./domain/ports";
import { createLessonCatalogAdapter } from "./infrastructure/lesson-catalog-adapter";
import { createLessonEngagementAdapter } from "./infrastructure/lesson-engagement-adapter";
import { createSupabaseLessonsRepository } from "./infrastructure/supabase-lessons-repository";
import { createSheikhsLookupAdapter } from "./infrastructure/sheikhs-lookup-adapter";

export type LessonsModule = {
  loadLessonDetail: (
    id: string | undefined,
    initialLesson?: KuwaitLessonRecord | null,
  ) => Promise<LoadLessonDetailResult>;
};

export type LessonsModuleOverrides = Partial<LoadLessonDetailDeps>;

export function createLessonsModule(overrides: LessonsModuleOverrides = {}): LessonsModule {
  const deps: LoadLessonDetailDeps = {
    catalog: overrides.catalog ?? createLessonCatalogAdapter(),
    lessonsRepo: overrides.lessonsRepo ?? createSupabaseLessonsRepository(),
    engagement: overrides.engagement ?? createLessonEngagementAdapter(),
    sheikhs: overrides.sheikhs ?? createSheikhsLookupAdapter(),
  };

  return {
    loadLessonDetail: (id, initialLesson) => loadLessonDetail(deps, id, initialLesson),
  };
}

let singleton: LessonsModule | null = null;

export function getLessonsModule(): LessonsModule {
  if (!singleton) singleton = createLessonsModule();
  return singleton;
}

/** Test helper — reset singleton between suites. */
export function resetLessonsModuleForTests(): void {
  singleton = null;
}
