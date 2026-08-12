/**
 * User progress tracking — enrollments, module completion, achievements.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { localGet, localSet, getLocalUserId } from "./storage.mjs";
import { getModulesForPath } from "./paths-seed.mjs";

function progressKey(userId) {
  return `progress_${userId}`;
}

function enrollmentsKey(userId) {
  return `enrollments_${userId}`;
}

export function getLocalProgress(userId) {
  return localGet(progressKey(userId), { modules: {}, enrollments: {} });
}

export function saveLocalProgress(userId, data) {
  localSet(progressKey(userId), data);
}

export async function enrollInPath(admin, userId, pathSlug, pathId) {
  if (admin && userId && !userId.startsWith("guest-")) {
    try {
      const { data, error } = await admin
        .from("user_path_enrollments")
        .upsert({ user_id: userId, path_id: pathId }, { onConflict: "user_id,path_id" })
        .select()
        .single();
      if (!error) return { ok: true, enrollment: data, source: "supabase" };
    } catch {
      /* fallback */
    }
  }

  const uid = userId || getLocalUserId();
  const progress = getLocalProgress(uid);
  progress.enrollments[pathSlug] = { enrolled_at: new Date().toISOString(), progress_pct: 0 };
  saveLocalProgress(uid, progress);
  return { ok: true, enrollment: progress.enrollments[pathSlug], source: "local" };
}

export async function updateModuleProgress(admin, userId, { pathSlug, moduleId, status, notes }) {
  const modules = getModulesForPath(pathSlug);
  const total = modules.length;
  const uid = userId || getLocalUserId();

  if (admin && userId && !userId.startsWith("guest-")) {
    try {
      await admin.from("user_module_progress").upsert(
        {
          user_id: userId,
          module_id: moduleId,
          path_id: pathSlug,
          status: status || "in_progress",
          progress_pct: status === "completed" ? 100 : 50,
          last_seen_at: new Date().toISOString(),
          completed_at: status === "completed" ? new Date().toISOString() : null,
          notes: notes || null,
        },
        { onConflict: "user_id,module_id" },
      );
    } catch {
      /* fallback */
    }
  }

  const progress = getLocalProgress(uid);
  if (!progress.modules[pathSlug]) progress.modules[pathSlug] = {};
  progress.modules[pathSlug][moduleId] = {
    status: status || "in_progress",
    last_seen_at: new Date().toISOString(),
    completed_at: status === "completed" ? new Date().toISOString() : null,
    notes,
  };

  const completed = Object.values(progress.modules[pathSlug]).filter((m) => m.status === "completed").length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  if (progress.enrollments[pathSlug]) {
    progress.enrollments[pathSlug].progress_pct = pct;
    if (pct >= 100) progress.enrollments[pathSlug].completed_at = new Date().toISOString();
  }
  saveLocalProgress(uid, progress);

  return { ok: true, progress_pct: pct, completed_modules: completed, total_modules: total };
}

export async function getUserProgress(admin, userId) {
  const uid = userId || getLocalUserId();
  const local = getLocalProgress(uid);

  if (admin && userId && !userId.startsWith("guest-")) {
    try {
      const { data: enrollments } = await admin
        .from("user_path_enrollments")
        .select("*, learning_paths(slug, title, level)")
        .eq("user_id", userId);

      const { data: moduleProgress } = await admin
        .from("user_module_progress")
        .select("*")
        .eq("user_id", userId);

      if (enrollments?.length) {
        return {
          enrollments: enrollments || [],
          modules: moduleProgress || [],
          source: "supabase",
        };
      }
    } catch {
      /* fallback */
    }
  }

  return { enrollments: local.enrollments, modules: local.modules, source: "local" };
}

export function suggestNextModule(pathSlug, progress) {
  const modules = getModulesForPath(pathSlug);
  const pathProgress = progress?.modules?.[pathSlug] || {};

  for (const mod of modules) {
    const st = pathProgress[mod.id]?.status;
    if (st !== "completed") return mod;
  }
  return modules[0] || null;
}

export async function recordAchievement(admin, userId, { key, title, description }) {
  if (admin && userId && !userId.startsWith("guest-")) {
    try {
      await admin.from("user_learning_achievements").upsert(
        { user_id: userId, achievement_key: key, title, description },
        { onConflict: "user_id,achievement_key" },
      );
    } catch {
      /* fallback */
    }
  }

  const uid = userId || getLocalUserId();
  const achievements = localGet(`achievements_${uid}`, []);
  if (!achievements.find((a) => a.key === key)) {
    achievements.push({ key, title, description, earned_at: new Date().toISOString() });
    localSet(`achievements_${uid}`, achievements);
  }
}

export async function getUserStats(admin, userId) {
  const progress = await getUserProgress(admin, userId);
  const uid = userId || getLocalUserId();
  const achievements = localGet(`achievements_${uid}`, []);
  const library = localGet(`library_${uid}`, []);
  const quizAttempts = localGet(`quiz_attempts_${uid}`, []);
  let completedLessons = 0;
  let completedPaths = 0;
  const fieldCounts = {};

  if (progress.source === "local") {
    for (const [slug, mods] of Object.entries(progress.modules || {})) {
      const done = Object.values(mods).filter((m) => m.status === "completed").length;
      completedLessons += done;
      if (progress.enrollments?.[slug]?.progress_pct >= 100) completedPaths++;
      fieldCounts[slug] = done;
    }
  } else {
    completedLessons = (progress.modules || []).filter((m) => m.status === "completed").length;
    completedPaths = (progress.enrollments || []).filter((e) => e.completed_at).length;
  }

  const booksRead = library.filter((i) => i.item_type === "book").length;
  const hadithSaved = library.filter((i) => i.item_type === "hadith").length;

  return {
    completed_lessons: completedLessons,
    completed_paths: completedPaths,
    books_read: booksRead,
    hadith_saved: hadithSaved,
    quiz_attempts: quizAttempts.length,
    achievements_count: achievements.length,
    completion_pct: progress.enrollments
      ? Math.round(
          Object.values(typeof progress.enrollments === "object" && !Array.isArray(progress.enrollments)
            ? progress.enrollments
            : {}
          ).reduce((s, e) => s + (e.progress_pct || 0), 0) /
            Math.max(Object.keys(progress.enrollments || {}).length, 1)
        )
      : 0,
    top_fields: Object.entries(fieldCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ slug: k, count: v })),
    achievements,
  };
}
