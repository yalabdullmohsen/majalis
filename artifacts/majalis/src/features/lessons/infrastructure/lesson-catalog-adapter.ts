import {
  fetchRelatedLessons,
  fetchSameSheikhLessons,
  fetchSeriesLessons,
  getUnifiedLessonById,
} from "@/lib/lessons-service";
import type { LessonCatalogPort } from "../domain/ports";

export function createLessonCatalogAdapter(): LessonCatalogPort {
  return {
    getById: getUnifiedLessonById,
    fetchRelated: fetchRelatedLessons,
    fetchSameSheikh: fetchSameSheikhLessons,
    fetchSeries: fetchSeriesLessons,
  };
}
