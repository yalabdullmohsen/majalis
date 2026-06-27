/** QA helpers — view counts, sorting, favorites, and category correction */

import {
  applyCategoryCorrection,
  classifyQuestion,
  type QaClassificationResult,
} from "./qa-category-validator";
import { resolveCategorySlug, getCategoryBySlug } from "./qa-categories";

export type QaSortMode =
  | "default"
  | "latest"
  | "popular"
  | "answered"
  | "random"
  | "favorites"
  | "unseen";

const FAVORITES_KEY = "majalis-qa-favorites-v1";
const SEEN_KEY = "majalis-qa-seen-v1";
const CORRECTION_LOG_KEY = "majalis-qa-category-corrections-v1";

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getQaViewCount(item: { id: string; view_count?: number | null }): number {
  if (typeof item.view_count === "number" && item.view_count > 0) {
    return item.view_count;
  }
  return 120 + (hashId(item.id) % 880);
}

export function getAnswerScore(item: { answer?: string | null }): number {
  const len = (item.answer || "").trim().length;
  return len > 0 ? len : 0;
}

function readJsonSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writeJsonSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

export function getQaFavorites(): Set<string> {
  return readJsonSet(FAVORITES_KEY);
}

export function toggleQaFavorite(id: string): boolean {
  const set = getQaFavorites();
  if (set.has(id)) set.delete(id);
  else set.add(id);
  writeJsonSet(FAVORITES_KEY, set);
  return set.has(id);
}

export function markQaSeen(id: string) {
  const set = readJsonSet(SEEN_KEY);
  set.add(id);
  writeJsonSet(SEEN_KEY, set);
}

export function getQaSeen(): Set<string> {
  return readJsonSet(SEEN_KEY);
}

export function logCategoryCorrection(id: string, result: QaClassificationResult) {
  if (!result.corrected) return;
  try {
    const raw = localStorage.getItem(CORRECTION_LOG_KEY);
    const log = raw ? JSON.parse(raw) : [];
    log.unshift({
      id,
      at: new Date().toISOString(),
      from: result.currentSlug,
      to: result.suggestedSlug,
      reason: result.reason,
    });
    localStorage.setItem(CORRECTION_LOG_KEY, JSON.stringify(log.slice(0, 200)));
  } catch {
    /* ignore */
  }
}

export type QaItem = {
  id: string;
  question: string;
  answer?: string | null;
  category_id?: string;
  category_slug?: string;
  qa_categories?: { name?: string; slug?: string };
  created_at?: string;
  view_count?: number | null;
  _categoryCorrected?: boolean;
  _correctionReason?: string;
};

export function normalizeQaItem(item: QaItem): QaItem {
  const slug =
    item.qa_categories?.slug ||
    item.category_slug ||
    resolveCategorySlug(item.category_id?.replace("seed-cat-", "") || "misc");

  const classification = classifyQuestion({
    question: item.question,
    answer: item.answer || undefined,
    category_slug: slug,
    category_name: item.qa_categories?.name,
  });

  if (classification.corrected) {
    logCategoryCorrection(item.id, classification);
  }

  const corrected = applyCategoryCorrection(
    { ...item, category_slug: slug },
    classification,
  );

  const cat = getCategoryBySlug(corrected.category_slug);
  return {
    ...corrected,
    qa_categories: {
      slug: corrected.category_slug,
      name: cat?.name || corrected.qa_categories?.name,
    },
  };
}

export function normalizeQaItems(items: QaItem[]): QaItem[] {
  return items.map(normalizeQaItem);
}

export function sortQaItems<T extends QaItem>(
  items: T[],
  mode: QaSortMode,
): T[] {
  const favorites = getQaFavorites();
  const seen = getQaSeen();

  if (mode === "favorites") {
    return items.filter((i) => favorites.has(i.id));
  }

  if (mode === "unseen") {
    return items.filter((i) => !seen.has(i.id));
  }

  if (mode === "random") {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  if (mode === "latest") {
    return [...items].sort((a, b) => {
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return tb - ta;
    });
  }

  if (mode === "popular") {
    return [...items].sort((a, b) => getQaViewCount(b) - getQaViewCount(a));
  }

  if (mode === "answered") {
    return [...items].sort((a, b) => getAnswerScore(b) - getAnswerScore(a));
  }

  return items;
}

export function pickRandomQaItem<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

export function countByCategorySlug(items: QaItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const slug = resolveCategorySlug(item.qa_categories?.slug || item.category_slug || "misc");
    counts[slug] = (counts[slug] || 0) + 1;
  }
  return counts;
}

export const QA_SORT_LABELS: Record<QaSortMode, string> = {
  default: "الكل",
  latest: "الجديد",
  popular: "الأكثر مشاهدة",
  answered: "الأكثر إجابة",
  random: "عشوائي",
  favorites: "المفضلة",
  unseen: "لم أشاهدها",
};
