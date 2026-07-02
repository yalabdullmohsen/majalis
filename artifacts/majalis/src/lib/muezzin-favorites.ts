/** Muezzin favorites & ratings — stored in localStorage. */

const FAV_KEY  = "majalis-muezzin-favorites-v1";
const RATE_KEY = "majalis-muezzin-ratings-v1";

// ─── Favorites ────────────────────────────────────────────────────────────────

export function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveFavorites(ids: Set<string>) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...ids]));
}

export function toggleFavorite(id: string): boolean {
  const favs = loadFavorites();
  if (favs.has(id)) {
    favs.delete(id);
    saveFavorites(favs);
    return false;
  }
  favs.add(id);
  saveFavorites(favs);
  return true;
}

export function isFavorite(id: string): boolean {
  return loadFavorites().has(id);
}

// ─── User Ratings (1–5 stars) ─────────────────────────────────────────────────

type RatingsMap = Record<string, number>;

export function loadRatings(): RatingsMap {
  try {
    const raw = localStorage.getItem(RATE_KEY);
    return raw ? (JSON.parse(raw) as RatingsMap) : {};
  } catch {
    return {};
  }
}

export function saveRating(muezzinId: string, stars: number) {
  const ratings = loadRatings();
  ratings[muezzinId] = Math.max(1, Math.min(5, stars));
  localStorage.setItem(RATE_KEY, JSON.stringify(ratings));
}

export function getUserRating(muezzinId: string): number {
  return loadRatings()[muezzinId] ?? 0;
}
