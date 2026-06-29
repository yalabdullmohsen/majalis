import { requestFetch } from "@/lib/request-manager";
import type { AchievementEntry, PlayerProfile } from "./types";

export type PlayerProgressSnapshot = {
  profile: PlayerProfile | null;
  achievements: AchievementEntry[];
  loading: boolean;
};

export async function fetchPlayerProgress(userId: string): Promise<{
  profile: PlayerProfile | null;
  achievements: AchievementEntry[];
}> {
  try {
    const res = await requestFetch(`/api/question-answer?action=get_progress&user_id=${encodeURIComponent(userId)}`, {
      credentials: "same-origin",
    });
    if (!res.ok) return { profile: null, achievements: [] };
    const data = await res.json();
    if (!data.ok) return { profile: null, achievements: [] };
    return {
      profile: data.profile || null,
      achievements: data.achievements || [],
    };
  } catch {
    return { profile: null, achievements: [] };
  }
}
