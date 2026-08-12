import { supabase } from "@/lib/supabase";

export async function followSheikh(userId: string, sheikhId: string): Promise<void> {
  await supabase
    .from("scholar_follows")
    .upsert({ user_id: userId, sheikh_id: sheikhId }, { onConflict: "user_id,sheikh_id" });
}

export async function unfollowSheikh(userId: string, sheikhId: string): Promise<void> {
  await supabase
    .from("scholar_follows")
    .delete()
    .eq("user_id", userId)
    .eq("sheikh_id", sheikhId);
}

export async function isFollowingSheikh(userId: string, sheikhId: string): Promise<boolean> {
  const { data } = await supabase
    .from("scholar_follows")
    .select("sheikh_id")
    .eq("user_id", userId)
    .eq("sheikh_id", sheikhId)
    .maybeSingle();
  return !!data;
}

export type FollowedSheikh = {
  sheikh_id: string;
  followed_at: string;
  sheikhs?: { id: string; name: string; photo_url?: string; city?: string }[];
};

export async function getFollowedSheikhs(userId: string): Promise<FollowedSheikh[]> {
  const { data } = await supabase
    .from("scholar_follows")
    .select("sheikh_id, followed_at, sheikhs(id, name, photo_url, city)")
    .eq("user_id", userId)
    .order("followed_at", { ascending: false });
  return (data ?? []) as FollowedSheikh[];
}

export async function getFollowerCount(sheikhId: string): Promise<number> {
  const { count } = await supabase
    .from("scholar_follows")
    .select("sheikh_id", { count: "exact", head: true })
    .eq("sheikh_id", sheikhId);
  return count ?? 0;
}
