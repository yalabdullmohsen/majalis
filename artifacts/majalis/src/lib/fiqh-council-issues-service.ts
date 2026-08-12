import {
  FIQH_ISSUES_PUBLISHED_SEED,
  FIQH_ISSUE_ITEM_LINKS,
  FIQH_ISSUE_TIMELINE_SEED,
  findFiqhIssueBySlug,
} from "./fiqh-issues-seed";
import { findFiqhCouncilItemBySlug } from "./fiqh-council-seed";
import { isPublicIssue } from "./fiqh-council-trust";
import type {
  FiqhCouncilIssue,
  FiqhCouncilItem,
  FiqhTimelineEvent,
} from "./fiqh-council-types";
import { supabase, isSupabaseConfigured } from "./supabase";

const isConfigured = isSupabaseConfigured();

function isMissingTableError(err: unknown) {
  const msg = String((err as { message?: string })?.message || err || "");
  return msg.includes("does not exist") || msg.includes("42P01");
}

function enrichIssueFromSeed(issue: FiqhCouncilIssue): FiqhCouncilIssue {
  const itemSlugs = FIQH_ISSUE_ITEM_LINKS[issue.slug] || [];
  const items = itemSlugs
    .map((slug) => findFiqhCouncilItemBySlug(slug))
    .filter(Boolean) as FiqhCouncilItem[];

  const timelineRaw = FIQH_ISSUE_TIMELINE_SEED[issue.slug] || [];
  const timeline: FiqhTimelineEvent[] = timelineRaw.map((ev, i) => {
    const linkedItem = items[i] || items[0];
    return {
      id: `seed-tl-${issue.slug}-${i}`,
      issue_id: issue.id,
      ...ev,
      item_id: linkedItem?.id,
      item: linkedItem,
    };
  });

  return { ...issue, items, timeline };
}

export async function getFiqhIssues(opts?: { category?: string; limit?: number }) {
  let issues = FIQH_ISSUES_PUBLISHED_SEED.filter(isPublicIssue);

  if (opts?.category && opts.category !== "الكل") {
    issues = issues.filter((i) => i.category === opts.category);
  }

  issues.sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""));

  if (opts?.limit) issues = issues.slice(0, opts.limit);

  if (!isConfigured) {
    return { data: issues, usingSeed: true, error: null };
  }

  try {
    let query = supabase
      .from("fiqh_council_issues")
      .select("*")
      .eq("status", "published")
      .eq("documentation_level", "official_verified")
      .order("published_at", { ascending: false });

    if (opts?.category && opts.category !== "الكل") {
      query = query.eq("category", opts.category);
    }
    if (opts?.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error)) return { data: issues, usingSeed: true, error: null };
      return { data: issues, usingSeed: true, error };
    }

    if (!data?.length) return { data: issues, usingSeed: true, error: null };
    return { data: data as FiqhCouncilIssue[], usingSeed: false, error: null };
  } catch {
    return { data: issues, usingSeed: true, error: null };
  }
}

export async function getFiqhIssueBySlug(slug: string) {
  const seedIssue = findFiqhIssueBySlug(slug);
  const seedEnriched = seedIssue && isPublicIssue(seedIssue) ? enrichIssueFromSeed(seedIssue) : null;

  if (!isConfigured) {
    return { data: seedEnriched, usingSeed: true, error: null };
  }

  try {
    const { data: issue, error } = await supabase
      .from("fiqh_council_issues")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .eq("documentation_level", "official_verified")
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) return { data: seedEnriched, usingSeed: true, error: null };
      return { data: seedEnriched, usingSeed: true, error };
    }

    if (!issue) return { data: seedEnriched, usingSeed: !seedEnriched, error: null };

    const { data: links } = await supabase
      .from("fiqh_issue_items")
      .select("item_id, link_type, sort_order, fiqh_council_items(*)")
      .eq("issue_id", issue.id)
      .order("sort_order");

    const { data: timeline } = await supabase
      .from("fiqh_issue_timeline_events")
      .select("*, fiqh_council_items(*)")
      .eq("issue_id", issue.id)
      .order("event_date", { ascending: true });

    const items = (links || [])
      .map((l: any) => l.fiqh_council_items)
      .filter(Boolean) as FiqhCouncilItem[];

    const timelineEvents: FiqhTimelineEvent[] = (timeline || []).map((ev: any) => ({
      ...ev,
      item: ev.fiqh_council_items,
    }));

    return {
      data: { ...issue, items, timeline: timelineEvents } as FiqhCouncilIssue,
      usingSeed: false,
      error: null,
    };
  } catch {
    return { data: seedEnriched, usingSeed: true, error: null };
  }
}

export async function getIssuesForTopicSection(categories: string[], nawazilTopics?: string[]) {
  const { data: issues } = await getFiqhIssues();
  const { data: items } = await import("./fiqh-council-service").then((m) =>
    m.getFiqhCouncilItems({ limit: 200 }),
  );

  const filteredIssues = issues.filter((i) => categories.includes(i.category));
  const filteredItems = items.filter((item) => {
    if (categories.includes(item.category)) return true;
    if (nawazilTopics?.length && item.nawazil_topic && nawazilTopics.includes(item.nawazil_topic)) {
      return true;
    }
    return false;
  });

  return { issues: filteredIssues, items: filteredItems };
}
