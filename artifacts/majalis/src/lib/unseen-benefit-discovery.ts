/**
 * Unseen Benefit Randomization Engine — prioritizes content the user has not
 * seen yet (verses, hadiths, fiqh/fawaid). Tracks viewed IDs in LocalStorage.
 */

import {
  DAILY_AYAH_POOL,
  DAILY_FAIDA_POOL,
  DAILY_HADITH_POOL,
  type DailyAyahEntry,
  type DailyFaidaEntry,
  type DailyHadithEntry,
} from "@/lib/daily-content";
import { normalizeArabic } from "@/shared/arabic-normalize";

export type DiscoveryKind = "ayah" | "hadith" | "faida";

export type DiscoveryItem = {
  kind: DiscoveryKind;
  id: string;
  title: string;
  body: string;
  meta?: string;
};

const SEEN_KEY = "majalis-unseen-discovery-seen-v1";
const LAST_SERVED_KEY = "majalis-unseen-discovery-last-v1";
const MAX_SEEN = 800;

function readSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeSeen(set: Set<string>): void {
  try {
    const arr = [...set];
    const trimmed = arr.length > MAX_SEEN ? arr.slice(arr.length - MAX_SEEN) : arr;
    localStorage.setItem(SEEN_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

function scopedId(kind: DiscoveryKind, id: string): string {
  return `${kind}:${id}`;
}

export function getSeenDiscoveryIds(): string[] {
  return [...readSeen()];
}

export function markDiscoverySeen(kind: DiscoveryKind, id: string): void {
  const set = readSeen();
  set.add(scopedId(kind, id));
  writeSeen(set);
}

export function clearDiscoverySeen(): void {
  try {
    localStorage.removeItem(SEEN_KEY);
    localStorage.removeItem(LAST_SERVED_KEY);
  } catch {
    /* ignore */
  }
}

function toDiscoveryFromPools(): DiscoveryItem[] {
  const ayahs: DiscoveryItem[] = DAILY_AYAH_POOL.map((a: DailyAyahEntry) => ({
    kind: "ayah" as const,
    id: a.id,
    title: a.reference || a.surah,
    body: a.text,
    meta: a.meaning,
  }));
  const hadiths: DiscoveryItem[] = DAILY_HADITH_POOL.map((h: DailyHadithEntry) => ({
    kind: "hadith" as const,
    id: h.id,
    title: h.source,
    body: h.text,
    meta: h.meaning,
  }));
  const faidas: DiscoveryItem[] = DAILY_FAIDA_POOL.map((f: DailyFaidaEntry) => ({
    kind: "faida" as const,
    id: f.id,
    title: f.category || "فائدة",
    body: f.text,
    meta: f.source || f.author_name,
  }));
  return [...ayahs, ...hadiths, ...faidas];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick unseen items first; if pool exhausted, reset soft-cycle (exclude last served).
 */
export function pickUnseenBenefits(opts?: {
  kinds?: DiscoveryKind[];
  limit?: number;
  pool?: DiscoveryItem[];
  rng?: () => number;
  markSeen?: boolean;
}): DiscoveryItem[] {
  try {
    const kinds = new Set(opts?.kinds || (["ayah", "hadith", "faida"] as DiscoveryKind[]));
    const limit = Math.max(1, opts?.limit ?? 3);
    const rng = opts?.rng ?? Math.random;
    const pool = (opts?.pool || toDiscoveryFromPools()).filter((i) => kinds.has(i.kind));
    if (!pool.length) return [];

    const seen = readSeen();
    let unseen = pool.filter((i) => !seen.has(scopedId(i.kind, i.id)));

    if (!unseen.length) {
      // Soft reset: clear seen except optionally keep recent batch
      writeSeen(new Set());
      unseen = [...pool];
    }

    const picked = shuffle(unseen, rng).slice(0, limit);

    if (opts?.markSeen !== false) {
      for (const item of picked) markDiscoverySeen(item.kind, item.id);
      try {
        localStorage.setItem(
          LAST_SERVED_KEY,
          JSON.stringify(picked.map((p) => scopedId(p.kind, p.id))),
        );
      } catch {
        /* ignore */
      }
    }

    return picked;
  } catch {
    return [];
  }
}

/** Fresh launch pack — always prefers unseen; marks as seen. */
export function serveLaunchDiscovery(limit = 3): DiscoveryItem[] {
  return pickUnseenBenefits({ limit, markSeen: true });
}

export function filterDiscoveryByText(items: DiscoveryItem[], query: string): DiscoveryItem[] {
  const n = normalizeArabic(query);
  if (!n) return items;
  return items.filter((i) => normalizeArabic(`${i.title} ${i.body} ${i.meta || ""}`).includes(n));
}

export function countUnseenRemaining(kinds?: DiscoveryKind[]): number {
  const kindSet = new Set(kinds || (["ayah", "hadith", "faida"] as DiscoveryKind[]));
  const seen = readSeen();
  return toDiscoveryFromPools().filter(
    (i) => kindSet.has(i.kind) && !seen.has(scopedId(i.kind, i.id)),
  ).length;
}
