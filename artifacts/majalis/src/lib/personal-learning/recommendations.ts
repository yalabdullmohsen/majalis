/**
 * Smart recommendations from user activity + search engine.
 */
import { supabase } from "@/lib/supabase";
import { fetchContentRelations, type IntelligentSearchResult } from "@/lib/scholarly-intelligence-service";
import { fetchLibraryItems, logUserActivity } from "./service";

export type RecommendationSection = {
  id: string;
  title: string;
  reason: string;
  items: IntelligentSearchResult[];
};

async function recentViewQueries(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("content_views")
    .select("content_type, metadata")
    .eq("user_id", user.id)
    .order("viewed_at", { ascending: false })
    .limit(12);

  const queries: string[] = [];
  for (const row of data || []) {
    const q = (row.metadata as Record<string, string>)?.title || (row.metadata as Record<string, string>)?.subject;
    if (q) queries.push(q);
  }
  return [...new Set(queries)].slice(0, 3);
}

async function interestTerms(): Promise<string[]> {
  const items = await fetchLibraryItems();
  const terms: string[] = [];
  for (const item of items.slice(0, 20)) {
    if (item.metadata?.subject) terms.push(String(item.metadata.subject));
    if (item.metadata?.sheikh) terms.push(String(item.metadata.sheikh));
    if (item.title) terms.push(item.title.split(/\s+/).slice(0, 3).join(" "));
  }
  return [...new Set(terms)].slice(0, 5);
}

export async function logContentView(contentType: string, contentId: string, metadata: Record<string, unknown> = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  try {
    await supabase.from("content_views").insert({
      user_id: user.id,
      content_type: contentType,
      content_id: String(contentId),
      metadata,
    });
    await logUserActivity("view", contentType, contentId, metadata);
  } catch {
    /* table may not exist yet */
  }
}

export async function fetchPersonalRecommendations(limit = 6): Promise<RecommendationSection[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const sections: RecommendationSection[] = [];

  const [views, interests, library] = await Promise.all([
    recentViewQueries(),
    interestTerms(),
    fetchLibraryItems(),
  ]);

  const primaryQuery = views[0] || interests[0] || "فقه";

  if (views.length > 0) {
    const res = await fetchContentRelations({ query: views[0], limit }).catch(() => ({ items: [], algorithm: "none" }));
    if (res.items?.length) {
      sections.push({
        id: "because_you_watched",
        title: "لأنك شاهدت هذا…",
        reason: views[0],
        items: res.items.slice(0, limit),
      });
    }
  }

  const alsoLike = await fetchContentRelations({ query: primaryQuery, limit }).catch(() => ({ items: [] as IntelligentSearchResult[], algorithm: "none" }));
  if (alsoLike.items?.length) {
    const seen = new Set(sections.flatMap((s) => s.items.map((x) => x.href)));
    sections.push({
      id: "you_may_like",
      title: "قد يعجبك أيضاً…",
      reason: primaryQuery,
      items: alsoLike.items.filter((i) => !seen.has(i.href)).slice(0, limit),
    });
  }

  const lastLesson = library.find((i) => i.content_type === "lesson");
  if (lastLesson?.metadata?.sheikh) {
    const sheikh = String(lastLesson.metadata.sheikh);
    const sameSheikh = await fetchContentRelations({ query: sheikh, kind: "lesson", limit }).catch(() => ({ items: [], algorithm: "none" }));
    if (sameSheikh.items?.length) {
      sections.push({
        id: "same_sheikh",
        title: "من نفس الشيخ…",
        reason: sheikh,
        items: sameSheikh.items.slice(0, limit),
      });
    }
  }

  if (interests.length > 1) {
    const path = await fetchContentRelations({ topicSlug: interests[0], limit }).catch(() => ({ items: [], algorithm: "none" }));
    if (path.items?.length) {
      sections.push({
        id: "continue_path",
        title: "أكمل هذا المسار…",
        reason: interests[0],
        items: path.items.slice(0, limit),
      });
    }
  }

  if (!user && sections.length === 0) {
    const fallback = await fetchContentRelations({ query: "صلاة", limit }).catch(() => ({ items: [], algorithm: "none" }));
    if (fallback.items?.length) {
      sections.push({
        id: "featured",
        title: "محتوى موصى به",
        reason: "من محرك المعرفة",
        items: fallback.items.slice(0, limit),
      });
    }
  }

  return sections.slice(0, 4);
}

export async function fetchContentPageRecommendations(opts: {
  kind?: string;
  recordId?: string;
  query?: string;
  title?: string;
}): Promise<RecommendationSection[]> {
  const sections: RecommendationSection[] = [];
  const base = await fetchContentRelations({
    kind: opts.kind,
    recordId: opts.recordId,
    query: opts.query,
    limit: 6,
  }).catch(() => ({ items: [], algorithm: "none" }));

  if (base.items?.length) {
    sections.push({
      id: "related",
      title: opts.title || "مواد ذات صلة",
      reason: "مرتبط بهذا المحتوى",
      items: base.items,
    });
  }

  const personal = await fetchPersonalRecommendations(4);
  for (const p of personal.slice(0, 2)) {
    if (!sections.some((s) => s.id === p.id)) sections.push(p);
  }

  return sections;
}
