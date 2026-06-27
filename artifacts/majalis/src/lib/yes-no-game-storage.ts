const FAV_KEY = "majalis-sin-jeem-favorites-v1";
const POS_KEY = "majalis-sin-jeem-position-v1";

export function getSinJeemFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch {
    return [];
  }
}

export function toggleSinJeemFavorite(id: string): string[] {
  const current = getSinJeemFavorites();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  localStorage.setItem(FAV_KEY, JSON.stringify(next));
  return next;
}

export function saveSinJeemPosition(index: number, questionId: string) {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify({ index, questionId, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function getSinJeemPosition(): { index: number; questionId: string } | null {
  try {
    return JSON.parse(localStorage.getItem(POS_KEY) || "null");
  } catch {
    return null;
  }
}
