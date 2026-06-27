export type FavoriteType =
  | "ayah"
  | "qa"
  | "lesson"
  | "book"
  | "surah-story"
  | "faida";

export type LocalFavorite = {
  id: string;
  type: FavoriteType;
  title: string;
  href: string;
  meta?: string;
  note?: string;
  savedAt: number;
};

const STORAGE_KEY = "majalis-local-favorites-v1";

export function readFavorites(): LocalFavorite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeFavorites(items: LocalFavorite[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("majalis-favorites-updated"));
}

export function isFavorite(type: FavoriteType, id: string): boolean {
  return readFavorites().some((f) => f.type === type && f.id === id);
}

export function toggleFavorite(item: Omit<LocalFavorite, "savedAt">): boolean {
  const list = readFavorites();
  const idx = list.findIndex((f) => f.type === item.type && f.id === item.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    writeFavorites(list);
    return false;
  }
  list.unshift({ ...item, savedAt: Date.now() });
  writeFavorites(list.slice(0, 200));
  return true;
}

export function updateFavoriteNote(type: FavoriteType, id: string, note: string) {
  const list = readFavorites();
  const item = list.find((f) => f.type === type && f.id === id);
  if (!item) return;
  item.note = note.trim() || undefined;
  writeFavorites(list);
}

export function getFavoritesByType(type: FavoriteType): LocalFavorite[] {
  return readFavorites().filter((f) => f.type === type);
}

export const FAVORITE_TYPE_LABELS: Record<FavoriteType, string> = {
  ayah: "آيات",
  qa: "أسئلة",
  lesson: "دروس",
  book: "كتب",
  "surah-story": "قصص السور",
  faida: "فوائد",
};
