/**
 * Lessons feature — Clean Architecture façade.
 * Presentation should depend on this module (or DI), not on raw Supabase calls.
 */
export { createLessonsModule, getLessonsModule, resetLessonsModuleForTests } from "./di";
export type { LessonsModule, LessonsModuleOverrides } from "./di";
export type {
  LoadLessonDetailResult,
  LessonDbRow,
  LessonsRepository,
  LessonCatalogPort,
  LessonEngagementPort,
  SheikhsLookupPort,
} from "./domain/ports";
export { loadLessonDetail } from "./application/load-lesson-detail";
