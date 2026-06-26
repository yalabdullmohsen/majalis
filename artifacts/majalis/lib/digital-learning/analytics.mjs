/**
 * Admin analytics for digital learning platform.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { LEARNING_PATHS, DEMO_QUIZZES } from "./paths-seed.mjs";

export async function getAdminLearningStats(admin) {
  const fallback = {
    users_count: 0,
    paths_count: LEARNING_PATHS.length,
    modules_count: LEARNING_PATHS.length * 6,
    quizzes_count: DEMO_QUIZZES.length,
    certificates_count: 0,
    enrollments_count: 0,
    completion_rate: 0,
    top_lessons: [],
    hardest_quizzes: [],
    engaging_content: [],
    stale_content: [],
  };

  if (!admin) return fallback;

  try {
    const { data: stats } = await admin.rpc("learning_platform_stats");
    if (stats) {
      return {
        ...fallback,
        ...stats,
        completion_rate: stats.enrollments_count
          ? Math.round((stats.completed_paths / stats.enrollments_count) * 100)
          : 0,
      };
    }
  } catch {
    /* fallback */
  }

  try {
    const { count: usersCount } = await admin.from("profiles").select("*", { count: "exact", head: true });
    fallback.users_count = usersCount || 0;
  } catch {
    /* ignore */
  }

  return fallback;
}
