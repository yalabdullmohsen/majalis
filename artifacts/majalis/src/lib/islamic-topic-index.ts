/**
 * Categorized Islamic Topic Indexing Engine.
 * Unified taxonomy linking Quran verses, Azkar, and Fiqh/Matn by topic
 * (Purification, Prayer, Travel Azkar, …).
 */

import { normalizeArabic } from "@/shared/arabic-normalize";
import { QURAN_TOPICS, searchQuranTopics, type QuranTopicSearchHit } from "@/lib/quran-topics-index";
import { ADHKAR_CATEGORIES, getAdhkarByCategory, type AdhkarItem } from "@/lib/adhkar-seed";
import { FIQH_HUB_TOPICS, type FiqhHubTopic } from "@/lib/fiqh-hub-topics";

export type TopicCategoryId =
  | "purification"
  | "prayer"
  | "zakat"
  | "fasting"
  | "hajj"
  | "travel"
  | "morning_adhkar"
  | "evening_adhkar"
  | "sleep"
  | "family"
  | "patience"
  | "tawhid"
  | "general";

export type TopicEvidenceKind = "quran" | "adhkar" | "fiqh" | "matn";

export type TopicEvidenceItem = {
  kind: TopicEvidenceKind;
  id: string;
  title: string;
  href: string;
  snippet?: string;
  meta?: string;
};

export type IslamicTopicNode = {
  id: TopicCategoryId;
  labelAr: string;
  aliases: string[];
  /** Linked adhkar category slugs */
  adhkarSlugs: string[];
  /** Linked fiqh hub topic ids */
  fiqhTopicIds: string[];
  /** Linked quran topic ids from QURAN_TOPICS */
  quranTopicIds: string[];
};

export type TopicQueryResult = {
  topic: IslamicTopicNode;
  quran: TopicEvidenceItem[];
  adhkar: TopicEvidenceItem[];
  fiqh: TopicEvidenceItem[];
  all: TopicEvidenceItem[];
};

/** Canonical categorical taxonomy. */
export const ISLAMIC_TOPIC_TAXONOMY: IslamicTopicNode[] = [
  {
    id: "purification",
    labelAr: "الطهارة",
    aliases: ["طهارة", "وضوء", "غسل", "نجاسة"],
    adhkarSlugs: ["wudu"],
    fiqhTopicIds: ["tahara"],
    quranTopicIds: ["salah"],
  },
  {
    id: "prayer",
    labelAr: "الصلاة",
    aliases: ["صلاة", "صلوات", "فريضة"],
    adhkarSlugs: ["salah", "after-salah", "mosque"],
    fiqhTopicIds: ["salah"],
    quranTopicIds: ["salah", "qiyam-layl"],
  },
  {
    id: "zakat",
    labelAr: "الزكاة",
    aliases: ["زكاة", "صدقة"],
    adhkarSlugs: [],
    fiqhTopicIds: ["zakat"],
    quranTopicIds: ["zakat", "rizq"],
  },
  {
    id: "fasting",
    labelAr: "الصيام",
    aliases: ["صوم", "رمضان"],
    adhkarSlugs: [],
    fiqhTopicIds: ["sawm"],
    quranTopicIds: [],
  },
  {
    id: "hajj",
    labelAr: "الحج والعمرة",
    aliases: ["حج", "عمرة"],
    adhkarSlugs: ["travel"],
    fiqhTopicIds: ["hajj"],
    quranTopicIds: [],
  },
  {
    id: "travel",
    labelAr: "أذكار السفر",
    aliases: ["سفر", "ركوب", "مسافر"],
    adhkarSlugs: ["travel"],
    fiqhTopicIds: [],
    quranTopicIds: [],
  },
  {
    id: "morning_adhkar",
    labelAr: "أذكار الصباح",
    aliases: ["صباح", "أذكار الصباح"],
    adhkarSlugs: ["morning"],
    fiqhTopicIds: [],
    quranTopicIds: [],
  },
  {
    id: "evening_adhkar",
    labelAr: "أذكار المساء",
    aliases: ["مساء", "أذكار المساء"],
    adhkarSlugs: ["evening"],
    fiqhTopicIds: [],
    quranTopicIds: [],
  },
  {
    id: "sleep",
    labelAr: "أذكار النوم",
    aliases: ["نوم", "أذكار النوم"],
    adhkarSlugs: ["sleep", "wakeup"],
    fiqhTopicIds: [],
    quranTopicIds: [],
  },
  {
    id: "family",
    labelAr: "البر والأسرة",
    aliases: ["والدين", "أسرة", "بر"],
    adhkarSlugs: ["home-in", "home-out"],
    fiqhTopicIds: [],
    quranTopicIds: ["birr-walidayn"],
  },
  {
    id: "patience",
    labelAr: "الصبر والابتلاء",
    aliases: ["صبر", "ابتلاء"],
    adhkarSlugs: ["distress", "istighfar"],
    fiqhTopicIds: [],
    quranTopicIds: ["sabr", "ibtila"],
  },
  {
    id: "tawhid",
    labelAr: "التوحيد",
    aliases: ["توحيد", "عقيدة", "إخلاص"],
    adhkarSlugs: [],
    fiqhTopicIds: [],
    quranTopicIds: ["tawhid", "shukr"],
  },
];

function matchTopic(query: string): IslamicTopicNode | undefined {
  const nq = normalizeArabic(query);
  if (!nq) return undefined;
  return ISLAMIC_TOPIC_TAXONOMY.find((t) => {
    if (normalizeArabic(t.labelAr).includes(nq) || nq.includes(normalizeArabic(t.labelAr))) return true;
    if (t.id === query || normalizeArabic(t.id.replace(/_/g, " ")).includes(nq)) return true;
    return t.aliases.some((a) => {
      const na = normalizeArabic(a);
      return na.includes(nq) || nq.includes(na);
    });
  });
}

function quranHitsToEvidence(hits: QuranTopicSearchHit[]): TopicEvidenceItem[] {
  return hits.flatMap((h) =>
    h.verses.slice(0, 4).map((v) => ({
      kind: "quran" as const,
      id: `${h.topicId}:${v.surah}:${v.ayah}`,
      title: h.title,
      href: `/mushaf/${v.surah}?ayah=${v.ayah}`,
      snippet: `${v.surah}:${v.ayah}`,
      meta: h.topicId,
    })),
  );
}

function adhkarToEvidence(items: AdhkarItem[], limit: number): TopicEvidenceItem[] {
  return items.slice(0, limit).map((a) => ({
    kind: "adhkar" as const,
    id: a.id,
    title: a.text.slice(0, 60) + (a.text.length > 60 ? "…" : ""),
    href: `/adhkar/${ADHKAR_CATEGORIES.find((c) => c.id === a.categoryId)?.slug || "misc"}?id=${a.id}`,
    snippet: a.source,
    meta: a.categoryId,
  }));
}

function fiqhToEvidence(topics: FiqhHubTopic[]): TopicEvidenceItem[] {
  return topics.map((t) => ({
    kind: "fiqh" as const,
    id: t.id,
    title: t.title,
    href: t.href,
    snippet: t.desc?.slice(0, 100),
    meta: t.kind,
  }));
}

/** Resolve a taxonomy node by id or free-text query. */
export function resolveIslamicTopic(queryOrId: string): IslamicTopicNode | undefined {
  const byId = ISLAMIC_TOPIC_TAXONOMY.find((t) => t.id === queryOrId);
  if (byId) return byId;
  return matchTopic(queryOrId);
}

/**
 * Unified cross-category evidence query for a topic.
 */
export function queryTopicEvidence(
  queryOrId: string,
  opts?: { adhkarLimit?: number; quranLimit?: number },
): TopicQueryResult | null {
  try {
    const topic = resolveIslamicTopic(queryOrId);
    if (!topic) return null;

    const quranHits = topic.quranTopicIds
      .map((id) => QURAN_TOPICS.find((t) => t.id === id))
      .filter(Boolean)
      .flatMap((t) =>
        searchQuranTopics(t!.label, opts?.quranLimit ?? 3).filter((h) => h.topicId === t!.id),
      );
    // Fallback: search by topic label
    const extraQuran =
      quranHits.length === 0 ? searchQuranTopics(topic.labelAr, opts?.quranLimit ?? 5) : [];

    const adhkarItems: AdhkarItem[] = [];
    for (const slug of topic.adhkarSlugs) {
      const cat = ADHKAR_CATEGORIES.find((c) => c.slug === slug);
      if (!cat) continue;
      adhkarItems.push(...getAdhkarByCategory(cat.id));
    }

    const fiqhTopics = FIQH_HUB_TOPICS.filter((t) => topic.fiqhTopicIds.includes(t.id));

    const quran = quranHitsToEvidence([...quranHits, ...extraQuran].slice(0, opts?.quranLimit ?? 8));
    const adhkar = adhkarToEvidence(adhkarItems, opts?.adhkarLimit ?? 8);
    const fiqh = fiqhToEvidence(fiqhTopics);
    const all = [...quran, ...adhkar, ...fiqh];

    return { topic, quran, adhkar, fiqh, all };
  } catch {
    return null;
  }
}

export function listTopicCategories(): IslamicTopicNode[] {
  return [...ISLAMIC_TOPIC_TAXONOMY];
}

export function searchTopicsByLabel(query: string): IslamicTopicNode[] {
  const nq = normalizeArabic(query);
  if (!nq) return [];
  return ISLAMIC_TOPIC_TAXONOMY.filter((t) => {
    if (normalizeArabic(t.labelAr).includes(nq)) return true;
    return t.aliases.some((a) => normalizeArabic(a).includes(nq));
  });
}
