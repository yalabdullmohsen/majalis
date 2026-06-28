import { supabase } from "./supabase";
import { isSupabaseConfigured } from "./supabase-config";
import { logSupabaseError } from "./supabase-config";
import type { UserMutoonProgress, UserQuranCircleEnrollment } from "./platform-types";

const isConfigured = isSupabaseConfigured();

export async function getUserMutoonProgress(mutoonId: string) {
  if (!isConfigured) return { data: null, error: null };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase
      .from("user_mutoon_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("mutoon_id", mutoonId)
      .maybeSingle();
    if (error) throw error;
    return { data: data as UserMutoonProgress | null, error: null };
  } catch (err) {
    logSupabaseError("getUserMutoonProgress", err);
    return { data: null, error: err };
  }
}

export async function upsertMutoonProgress(progress: Partial<UserMutoonProgress> & { mutoon_id: string }) {
  if (!isConfigured) return { data: null, error: new Error("not_configured") };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("auth_required") };

    const payload = {
      user_id: user.id,
      mutoon_id: progress.mutoon_id,
      progress_pct: progress.progress_pct ?? 0,
      last_lesson_id: progress.last_lesson_id || null,
      last_page: progress.last_page || null,
      last_explanation: progress.last_explanation || null,
      quiz_scores: progress.quiz_scores || [],
      last_seen_at: new Date().toISOString(),
      completed_at: progress.progress_pct && progress.progress_pct >= 100 ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from("user_mutoon_progress")
      .upsert(payload, { onConflict: "user_id,mutoon_id" })
      .select("*")
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    logSupabaseError("upsertMutoonProgress", err);
    return { data: null, error: err };
  }
}

export async function enrollInQuranCircle(circleId: string) {
  if (!isConfigured) return { data: null, error: new Error("not_configured") };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("auth_required") };

    const { data, error } = await supabase
      .from("user_quran_circle_enrollments")
      .upsert({ user_id: user.id, circle_id: circleId, status: "registered" }, { onConflict: "user_id,circle_id" })
      .select("*")
      .single();
    if (error) throw error;
    return { data: data as UserQuranCircleEnrollment, error: null };
  } catch (err) {
    logSupabaseError("enrollInQuranCircle", err);
    return { data: null, error: err };
  }
}

export async function getUserQuranCircleEnrollment(circleId: string) {
  if (!isConfigured) return { data: null, error: null };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase
      .from("user_quran_circle_enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("circle_id", circleId)
      .maybeSingle();
    if (error) throw error;
    return { data: data as UserQuranCircleEnrollment | null, error: null };
  } catch (err) {
    logSupabaseError("getUserQuranCircleEnrollment", err);
    return { data: null, error: err };
  }
}

export async function rateQuranCircle(circleId: string, rating: number, comment?: string) {
  if (!isConfigured) return { error: new Error("not_configured") };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("auth_required") };

    const { error } = await supabase
      .from("user_quran_circle_enrollments")
      .update({ rating, rating_comment: comment || null })
      .eq("user_id", user.id)
      .eq("circle_id", circleId);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    logSupabaseError("rateQuranCircle", err);
    return { error: err };
  }
}
