/**
 * بحث موحّد P0 — يغلف runAppSearch ويثري النتائج عبر Content Resolver.
 */

import {
  runAppSearch,
  type AppSearchResponse,
  type AppSearchResult,
} from "@/features/search/app-search";
import { resolveSearchHit } from "./content-resolver";
import { pushLocalSearchQuery } from "./privacy";
import { recordActivity } from "./activity-model";
import type { ContentEntityCard } from "./content-entity";

export type KnowledgeSearchHit = AppSearchResult & {
  entity: ContentEntityCard | null;
};

export type KnowledgeSearchResponse = Omit<AppSearchResponse, "results" | "groups"> & {
  results: KnowledgeSearchHit[];
  groups: Record<string, KnowledgeSearchHit[]>;
};

export async function runKnowledgeSearch(
  query: string,
  opts: { scope?: string; signal?: AbortSignal } = {},
): Promise<KnowledgeSearchResponse> {
  const q = query.trim();
  if (q.length >= 2) {
    pushLocalSearchQuery(q);
    recordActivity({
      type: "search",
      entityKind: "app_route",
      entityId: "search",
      title: q.slice(0, 80),
      href: `/search?q=${encodeURIComponent(q)}`,
    });
  }

  const base = await runAppSearch(q, opts);
  const enrich = (item: AppSearchResult): KnowledgeSearchHit => ({
    ...item,
    entity: resolveSearchHit({
      id: item.id,
      kind: item.kind,
      title: item.title,
      href: item.href,
      summary: item.summary,
    }),
  });

  const results = base.results.map(enrich);
  const groups: Record<string, KnowledgeSearchHit[]> = {};
  for (const [k, items] of Object.entries(base.groups)) {
    groups[k] = items.map(enrich);
  }

  return { ...base, results, groups };
}
