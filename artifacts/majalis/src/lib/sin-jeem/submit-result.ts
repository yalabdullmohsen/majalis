import type { MatchResult } from "./types";
import { submitVerifiedMatchResult } from "./leaderboard-service";

/** Persist match outcome to Supabase via server API — browser is never source of truth. */
export async function persistMatchResult(
  result: MatchResult,
  mode: string,
  sessionId: string,
): Promise<void> {
  await submitVerifiedMatchResult(result, mode, sessionId);
}
