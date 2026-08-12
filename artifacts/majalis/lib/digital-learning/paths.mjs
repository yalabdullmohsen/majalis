/**
 * Learning paths — fetch paths and modules.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { LEARNING_PATHS, getPathBySlug, getModulesForPath, LEVEL_LABELS } from "./paths-seed.mjs";

export { LEVEL_LABELS, getPathBySlug, getModulesForPath };

export async function getAllPaths(admin) {
  if (admin) {
    try {
      const { data } = await admin
        .from("learning_paths")
        .select("*")
        .eq("status", "published")
        .order("sort_order");
      if (data?.length) return data;
    } catch {
      /* fallback */
    }
  }
  return LEARNING_PATHS;
}

export async function getPathWithModules(admin, slug) {
  const seedPath = getPathBySlug(slug);
  if (!seedPath) return null;

  if (admin) {
    try {
      const { data: path } = await admin.from("learning_paths").select("*").eq("slug", slug).maybeSingle();
      const { data: modules } = await admin
        .from("learning_modules")
        .select("*")
        .eq("path_id", path?.id)
        .order("sort_order");
      if (path) {
        return { path, modules: modules || getModulesForPath(slug) };
      }
    } catch {
      /* fallback */
    }
  }

  return {
    path: seedPath,
    modules: getModulesForPath(slug),
  };
}

export async function getPathStats(admin, slug) {
  const data = await getPathWithModules(admin, slug);
  if (!data) return null;

  const moduleCounts = {};
  for (const m of data.modules) {
    moduleCounts[m.module_type] = (moduleCounts[m.module_type] || 0) + 1;
  }

  return {
    slug,
    title: data.path.title,
    level: data.path.level,
    level_label: LEVEL_LABELS[data.path.level] || data.path.level,
    module_count: data.modules.length,
    module_counts: moduleCounts,
    estimated_hours: data.path.estimated_hours,
  };
}
