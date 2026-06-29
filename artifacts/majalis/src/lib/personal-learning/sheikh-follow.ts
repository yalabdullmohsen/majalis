/**
 * Sheikh follow — uses notifications table for new lesson alerts.
 */
import { supabase } from "@/lib/supabase";
import { fetchLessons } from "@/lib/lessons-service";
import { sheikhNameKey } from "@/lib/sheikh-name";
import { logUserActivity } from "./service";

export type SheikhFollow = {
  id: string;
  sheikh_id: string;
  sheikh_name?: string;
  last_notified_at?: string;
  created_at: string;
};

export async function fetchFollowedSheikhs(): Promise<SheikhFollow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("user_sheikh_follows")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data || []) as SheikhFollow[];
}

export async function isFollowingSheikh(sheikhId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("user_sheikh_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("sheikh_id", sheikhId)
    .maybeSingle();
  return Boolean(data);
}

export async function followSheikh(sheikhId: string, sheikhName?: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase.from("user_sheikh_follows").upsert({
    user_id: user.id,
    sheikh_id: sheikhId,
    sheikh_name: sheikhName ?? null,
  }, { onConflict: "user_id,sheikh_id" });
  if (!error) await logUserActivity("sheikh_follow", "scholar", sheikhId, { sheikh_name: sheikhName });
  return !error;
}

export async function unfollowSheikh(sheikhId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("user_sheikh_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("sheikh_id", sheikhId);
  return !error;
}

export async function syncFollowedSheikhNotifications(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const follows = await fetchFollowedSheikhs();
  if (!follows.length) return 0;

  const { lessons } = await fetchLessons();
  let created = 0;

  for (const follow of follows) {
    const name = follow.sheikh_name || follow.sheikh_id;
    const cutoff = follow.last_notified_at ? new Date(follow.last_notified_at).getTime() : 0;
    const newLessons = lessons.filter((l) => {
      const match =
        l.id === follow.sheikh_id ||
        sheikhNameKey(l.sheikhName) === sheikhNameKey(name) ||
        l.sheikhName.includes(name);
      if (!match) return false;
      const ts = l.sortKey || Date.now();
      return ts > cutoff;
    });

    for (const lesson of newLessons.slice(0, 5)) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: `درس جديد — ${name}`,
        body: lesson.title || lesson.category || "درس جديد",
        type: "sheikh_update",
        link: `/lessons/${lesson.id}`,
      });
      created++;
    }

    if (newLessons.length) {
      await supabase
        .from("user_sheikh_follows")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("id", follow.id);
    }
  }

  return created;
}

export async function fetchFollowedSheikhUpdates(limit = 20) {
  await syncFollowedSheikhNotifications();
  const follows = await fetchFollowedSheikhs();
  if (!follows.length) return [];

  const { lessons } = await fetchLessons();
  const names = new Set(follows.map((f) => f.sheikh_name || f.sheikh_id));
  const ids = new Set(follows.map((f) => f.sheikh_id));

  return lessons
    .filter((l) =>
      ids.has(l.id) ||
      [...names].some((n) => sheikhNameKey(l.sheikhName) === sheikhNameKey(n) || l.sheikhName.includes(n)),
    )
    .slice(0, limit);
}
