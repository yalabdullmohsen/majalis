/**
 * Mutashabihat detector — merges curated pedagogical pairs with the
 * computed textual similarity index for the active ayah.
 */

import { MUTASHABIHAT, type MutashabihatPair } from "@/lib/mutashabihat-data";
import {
  loadMutashabihatIndex,
  getSimilarAyahs,
  type MutashabihMatch,
} from "@/lib/recitation-ai/mutashabihat";

export type DetectedMutashabih = {
  surah: number;
  ayah: number;
  /** 0–1 similarity / relevance */
  score: number;
  source: "computed" | "curated";
  pairId?: string;
  title?: string;
  hint?: string;
  href: string;
};

export type MutashabihatDetectionResult = {
  surah: number;
  ayah: number;
  items: DetectedMutashabih[];
  curatedPairs: MutashabihatPair[];
};

function ayahHref(surah: number, ayah: number): string {
  return `/mushaf?surah=${surah}&ayah=${ayah}`;
}

/** Curated pairs that include this ayah. */
export function findCuratedPairsForAyah(surah: number, ayah: number): MutashabihatPair[] {
  return MUTASHABIHAT.filter((p) =>
    p.refs.some((r) => r.surah === surah && r.ayah === ayah),
  );
}

/**
 * Build a ranked list of similar verses for the active ayah.
 * Silent fallback: curated-only if the computed index fails to load.
 */
export async function detectMutashabihatForAyah(
  surah: number,
  ayah: number,
  limit = 12,
): Promise<MutashabihatDetectionResult> {
  const curatedPairs = findCuratedPairsForAyah(surah, ayah);
  const byKey = new Map<string, DetectedMutashabih>();

  for (const pair of curatedPairs) {
    for (const ref of pair.refs) {
      if (ref.surah === surah && ref.ayah === ayah) continue;
      const key = `${ref.surah}:${ref.ayah}`;
      const prev = byKey.get(key);
      const next: DetectedMutashabih = {
        surah: ref.surah,
        ayah: ref.ayah,
        score: Math.max(prev?.score ?? 0, 0.85),
        source: "curated",
        pairId: pair.id,
        title: pair.title,
        hint: pair.hint,
        href: ayahHref(ref.surah, ref.ayah),
      };
      byKey.set(key, next);
    }
  }

  try {
    const index = await loadMutashabihatIndex();
    const computed: MutashabihMatch[] = getSimilarAyahs(index, surah, ayah);
    for (const m of computed) {
      const key = `${m.surah}:${m.ayah}`;
      const prev = byKey.get(key);
      const score = Math.max(0, Math.min(1, Number(m.overlapRatio) || 0));
      if (prev) {
        byKey.set(key, {
          ...prev,
          score: Math.max(prev.score, score),
          source: prev.source === "curated" ? "curated" : "computed",
        });
      } else {
        byKey.set(key, {
          surah: m.surah,
          ayah: m.ayah,
          score,
          source: "computed",
          href: ayahHref(m.surah, m.ayah),
        });
      }
    }
  } catch {
    /* index unavailable — curated list still valid */
  }

  const items = [...byKey.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));

  return { surah, ayah, items, curatedPairs };
}

/** Sync curated-only path (no network) for offline-first UIs. */
export function detectMutashabihatCuratedOnly(
  surah: number,
  ayah: number,
  limit = 12,
): MutashabihatDetectionResult {
  const curatedPairs = findCuratedPairsForAyah(surah, ayah);
  const items: DetectedMutashabih[] = [];
  for (const pair of curatedPairs) {
    for (const ref of pair.refs) {
      if (ref.surah === surah && ref.ayah === ayah) continue;
      items.push({
        surah: ref.surah,
        ayah: ref.ayah,
        score: 0.85,
        source: "curated",
        pairId: pair.id,
        title: pair.title,
        hint: pair.hint,
        href: ayahHref(ref.surah, ref.ayah),
      });
    }
  }
  return {
    surah,
    ayah,
    items: items.slice(0, limit),
    curatedPairs,
  };
}
