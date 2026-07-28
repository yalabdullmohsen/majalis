import { useMemo } from "react";
import {
  buildSmartRecommendations,
  type SmartRecContext,
  type SmartRecommendation,
} from "@/lib/smart-content-recommendations";

/** Lightweight hook — no layout; consumers may ignore the list. */
export function useSmartRecommendations(ctx: SmartRecContext): SmartRecommendation[] {
  return useMemo(
    () => buildSmartRecommendations(ctx),
    [ctx.text, ctx.title, ctx.contentType, JSON.stringify(ctx.keywords ?? null)],
  );
}
