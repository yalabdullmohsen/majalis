const FAV_KEY = "majalis-radio-favorites-v1";

export function getRadioFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleRadioFavorite(id: string): string[] {
  const list = getRadioFavorites();
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  localStorage.setItem(FAV_KEY, JSON.stringify(next));
  return next;
}

export function isRadioFavorite(id: string): boolean {
  return getRadioFavorites().includes(id);
}
