import { supabase } from "./supabase";

export type FavoriteType = "lesson" | "book" | "sheikh" | "series" | "mosque";

const BOOKMARK_MAP: Record<FavoriteType, string> = {
  lesson: "lesson",
  book: "book",
  sheikh: "scholar",
  series: "series",
  mosque: "mosque",
};

export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function toggleFavorite(itemType: FavoriteType, itemId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("LOGIN_REQUIRED");
  }

  const mapped = BOOKMARK_MAP[itemType] || itemType;

  const { data: existing } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("user_favorites").delete().eq("id", existing.id);
    return false;
  }

  const { error } = await supabase.from("user_favorites").insert({
    user_id: userId,
    item_type: itemType,
    item_id: itemId,
  });

  if (error) {
    const { data: bookmark } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("content_type", mapped)
      .eq("content_id", itemId)
      .maybeSingle();

    if (bookmark?.id) {
      await supabase.from("bookmarks").delete().eq("id", bookmark.id);
      return false;
    }
    await supabase.from("bookmarks").insert({
      user_id: userId,
      content_type: mapped,
      content_id: itemId,
    });
    return true;
  }

  return true;
}

export async function isFavorite(itemType: FavoriteType, itemId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { data } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("item_type", itemType)
    .eq("item_id", itemId)
    .maybeSingle();

  if (data) return true;

  const mapped = BOOKMARK_MAP[itemType] || itemType;
  const { data: bookmark } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("content_type", mapped)
    .eq("content_id", itemId)
    .maybeSingle();

  return Boolean(bookmark);
}

export async function getUserFavorites() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data: favs } = await supabase
    .from("user_favorites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (favs?.length) return favs;

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (bookmarks || []).map((b) => ({
    id: b.id,
    item_type: b.content_type === "scholar" ? "sheikh" : b.content_type,
    item_id: b.content_id,
    created_at: b.created_at,
  }));
}

export async function toggleFollowSheikh(sheikhId: string): Promise<boolean> {
  return toggleFavorite("sheikh", sheikhId);
}

export async function isFollowingSheikh(sheikhId: string): Promise<boolean> {
  return isFavorite("sheikh", sheikhId);
}
