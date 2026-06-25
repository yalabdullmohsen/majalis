/** QA helpers — view counts and sorting for seed + DB items */

export type QaSortMode = "default" | "latest" | "popular" | "random";

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

export function sortQaItems<T extends { id: string; created_at?: string; view_count?: number | null }>(
  items: T[],
  mode: QaSortMode,
): T[] {
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
    return [...items].sort(
      (a, b) => getQaViewCount(b) - getQaViewCount(a),
    );
  }
  return items;
}

export function pickRandomQaItem<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

export const QA_SORT_LABELS: Record<QaSortMode, string> = {
  default: "الكل",
  latest: "أحدث الأسئلة",
  popular: "الأكثر مشاهدة",
  random: "سؤال عشوائي",
};
