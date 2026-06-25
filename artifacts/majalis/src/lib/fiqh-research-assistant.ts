import { advancedSearchFiqhCouncil } from "./fiqh-council-service";
import {
  FIQH_RESEARCH_DISCLAIMER,
  FIQH_NO_VERIFIED_MATERIAL_MSG,
  toResearchCitation,
  type FiqhResearchCitation,
} from "./fiqh-citation";
import { isVerifiedPublicItem } from "./fiqh-council-trust";
import type { FiqhAdvancedSearchOptions, FiqhCouncilItem } from "./fiqh-council-types";

export type FiqhResearchAnswer = {
  summary: string;
  citations: FiqhResearchCitation[];
  disclaimer: string;
  noResults: boolean;
  personalFatwaRedirect?: boolean;
};

const PERSONAL_FATWA_PATTERNS = [
  /أفتني/,
  /ما حكم/,
  /هل يجوز لي/,
  /يجوز لي/,
  /حالتي/,
  /واقعتي/,
  /زوجي/,
  /زوجتي/,
  /طلاقي/,
  /ميراثي/,
  /هل علي/,
  /فرض علي/,
  /وجوب علي/,
];

export function looksLikePersonalFatwaRequest(query: string): boolean {
  const q = query.trim();
  if (q.length < 4) return false;
  return PERSONAL_FATWA_PATTERNS.some((p) => p.test(q));
}

export function buildResearchSummary(items: FiqhCouncilItem[], query: string): string {
  if (!items.length) {
    return FIQH_NO_VERIFIED_MATERIAL_MSG;
  }

  const intro = `وفق المواد المنشورة والموثقة في المجمع الفقهي، إليك ما يرتبط بسؤالك «${query}»:`;
  const bullets = items.slice(0, 5).map((item, i) => {
    const snippet = item.summary || item.ruling_text || item.title;
    return `${i + 1}. ${item.title}: ${snippet?.slice(0, 160)}${snippet && snippet.length > 160 ? "…" : ""}`;
  });

  return [intro, ...bullets].join("\n");
}

export function buildResearchAnswer(items: FiqhCouncilItem[], query: string): FiqhResearchAnswer {
  const citations = items.slice(0, 8).map((item) => toResearchCitation(item));
  return {
    summary: buildResearchSummary(items, query),
    citations,
    disclaimer: FIQH_RESEARCH_DISCLAIMER,
    noResults: items.length === 0,
  };
}

export async function searchForResearchAssistant(
  query: string,
  filters: Omit<FiqhAdvancedSearchOptions, "query"> = {},
) {
  if (looksLikePersonalFatwaRequest(query)) {
    return {
      answer: {
        summary:
          "هذا السؤال يتعلق بمسألة شخصية أو نوازل خاصة. مساعد الباحث الفقهي لا يُصدر فتاوى، " +
          "بل يساعدك في البحث عن مواد منشورة. يُرجى عرض واقعتك على عالم مختص.",
        citations: [] as FiqhResearchCitation[],
        disclaimer: FIQH_RESEARCH_DISCLAIMER,
        noResults: true,
        personalFatwaRedirect: true,
      },
      items: [] as FiqhCouncilItem[],
      usingSeed: true,
    };
  }

  const { data, usingSeed } = await advancedSearchFiqhCouncil({
    query,
    ...filters,
    limit: filters.limit || 10,
  });

  const verified = data.filter(isVerifiedPublicItem);

  return {
    answer: buildResearchAnswer(verified, query),
    items: verified,
    usingSeed,
  };
}
