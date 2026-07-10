import { supabase } from "./supabase";

export type ContentType = "lesson" | "course" | "quran" | "lesson_detail";

export interface ProgressRow {
  id: string;
  user_id: string;
  content_type: ContentType;
  content_id: string;
  content_title: string | null;
  content_url: string | null;
  progress_pct: number;
  last_position: Record<string, unknown>;
  updated_at: string;
}

export async function fetchRecentProgress(userId: string, limit = 6): Promise<ProgressRow[]> {
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as ProgressRow[];
}

export async function upsertProgress(params: {
  userId: string;
  contentType: ContentType;
  contentId: string;
  title: string;
  url: string;
  progressPct: number;
  lastPosition?: Record<string, unknown>;
}): Promise<void> {
  await supabase.rpc("upsert_user_progress", {
    p_user_id: params.userId,
    p_content_type: params.contentType,
    p_content_id: params.contentId,
    p_title: params.title,
    p_url: params.url,
    p_progress: params.progressPct,
    p_position: params.lastPosition ?? {},
  });
}
