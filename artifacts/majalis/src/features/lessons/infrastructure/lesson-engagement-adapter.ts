import { fetchLessonEngagementStats } from "@/lib/lesson-stats";
import type { LessonEngagementPort } from "../domain/ports";

export function createLessonEngagementAdapter(): LessonEngagementPort {
  return {
    fetchStats: fetchLessonEngagementStats,
  };
}
