/**
 * Contextual & Semantic Search Engine (client-side, logic-only).
 * Builds on arabic-normalize + synonym expansion + edit-distance fuzzy —
 * no Fuse.js dependency required.
 */
import { normalizeArabic } from "@/shared/arabic-normalize";
import { arabicIncludes, arabicMatchAny } from "@/lib/arabic-search";
import { expandSearchTerms } from "@/lib/search-synonyms";
import { searchQuranTopics } from "@/lib/quran-topics-index";

export type SearchIntent =
  | "quran"
  | "adhkar"
  | "fiqh"
  | "hadith"
  | "lesson"
  | "general";

export type SemanticSearchHit = {
  id: string;
  title: string;
  href: string;
  snippet?: string;
  score: number;
  source: "topic" | "intent" | "text";
};

const INTENT_PATTERNS: Array<{ intent: SearchIntent; keys: string[]; href: string; title: string }> = [
  { intent: "quran", keys: ["قرآن", "مصحف", "سورة", "آية", "تلاوة"], href: "/quran-hub", title: "القرآن الكريم" },
  { intent: "adhkar", keys: ["أذكار", "ذكر", "تسبيح", "دعاء"], href: "/adhkar", title: "الأذكار" },
  { intent: "fiqh", keys: ["فقه", "حكم", "حلال", "حرام", "فتوى"], href: "/fiqh", title: "الفقه" },
  { intent: "hadith", keys: ["حديث", "سنة", "بخاري", "مسلم"], href: "/hadith", title: "الأحاديث" },
  { intent: "lesson", keys: ["درس", "دورة", "محاضرة", "شيخ"], href: "/lessons", title: "الدروس" },
];

export type SearchableDocument = {
  id: string;
  title: string;
  href: string;
  body?: string;
  keywords?: string[];
};

/** Detect coarse query intent for routing / boosting. */
export function detectSearchIntent(query: string): SearchIntent {
  const n = normalizeArabic(query);
  if (!n) return "general";
  for (const row of INTENT_PATTERNS) {
    if (row.keys.some((k) => n.includes(normalizeArabic(k)))) return row.intent;
  }
  return "general";
}

/** Expand query with synonyms + intent seeds (e.g. قيام الليل → صلاة الليل). */
export function expandSemanticQuery(query: string): string[] {
  const base = expandSearchTerms(query);
  const intent = detectSearchIntent(query);
  const intentRow = INTENT_PATTERNS.find((r) => r.intent === intent);
  if (intentRow) {
    for (const k of intentRow.keys) base.push(k);
  }
  return [...new Set(base.map((t) => t.trim()).filter(Boolean))];
}

/**
 * Rank a document list against a query using Arabic-aware matching.
 * Returns empty array on failure (silent).
 */
export function semanticSearchDocuments(
  query: string,
  docs: SearchableDocument[],
  limit = 20,
): SemanticSearchHit[] {
  try {
    const q = query.trim();
    if (!q) return [];
    const terms = expandSemanticQuery(q);
    const hits: SemanticSearchHit[] = [];

    for (const doc of docs) {
      const fields = [doc.title, doc.body, ...(doc.keywords || [])];
      let score = 0;
      if (arabicMatchAny(fields, q)) score += 5;
      for (const t of terms) {
        if (arabicIncludes(doc.title, t)) score += 3;
        else if (arabicMatchAny(fields, t)) score += 1;
      }
      if (score > 0) {
        hits.push({
          id: doc.id,
          title: doc.title,
          href: doc.href,
          snippet: doc.body?.slice(0, 160),
          score,
          source: "text",
        });
      }
    }

    // Inject Quran thematic hits
    for (const topicHit of searchQuranTopics(q, 5)) {
      hits.push({
        id: `topic-${topicHit.topicId}`,
        title: topicHit.title,
        href: topicHit.href,
        snippet: topicHit.verseRefs.slice(0, 3).join(" · "),
        score: topicHit.score + 4,
        source: "topic",
      });
    }

    // Intent hub shortcut
    const intent = detectSearchIntent(q);
    const intentRow = INTENT_PATTERNS.find((r) => r.intent === intent);
    if (intentRow && intent !== "general") {
      hits.push({
        id: `intent-${intent}`,
        title: intentRow.title,
        href: intentRow.href,
        score: 2,
        source: "intent",
      });
    }

    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Async semantic search — offloads large doc filters to a Web Worker when available.
 * Same ranking semantics as `semanticSearchDocuments`.
 */
export async function semanticSearchDocumentsAsync(
  query: string,
  docs: SearchableDocument[],
  limit = 20,
): Promise<SemanticSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  if (docs.length < 40) return semanticSearchDocuments(query, docs, limit);

  try {
    const { filterDocsOffthread } = await import("@/lib/offthread-compute");
    const { expandSearchTerms } = await import("@/lib/search-synonyms");
    const needles = [...new Set([q, ...expandSearchTerms(q)])];
    const matchDocs = docs.map((d) => ({
      id: d.id,
      fields: [d.title, d.body || "", ...(d.keywords || [])].filter(Boolean) as string[],
    }));
    const ids = await filterDocsOffthread(matchDocs, needles);
    const idSet = new Set(ids);
    const narrowed = docs.filter((d) => idSet.has(d.id));
    // Rank on the narrowed set (main thread — typically much smaller)
    return semanticSearchDocuments(query, narrowed, limit);
  } catch {
    return semanticSearchDocuments(query, docs, limit);
  }
}
