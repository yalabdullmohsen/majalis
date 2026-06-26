import { ADHKAR_ITEMS, getAllAdhkarItems, type AdhkarItem } from "./adhkar-seed";

const STORAGE_KEY = "majalis-adhkar-admin";

export type AdhkarAdminState = {
  hiddenIds: string[];
  overrides: Record<string, Partial<AdhkarItem>>;
  customItems: AdhkarItem[];
};

const EMPTY: AdhkarAdminState = { hiddenIds: [], overrides: {}, customItems: [] };

function loadState(): AdhkarAdminState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as AdhkarAdminState;
    return {
      hiddenIds: Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds : [],
      overrides: parsed.overrides && typeof parsed.overrides === "object" ? parsed.overrides : {},
      customItems: Array.isArray(parsed.customItems) ? parsed.customItems : [],
    };
  } catch {
    return EMPTY;
  }
}

function saveState(state: AdhkarAdminState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getAdhkarAdminState(): AdhkarAdminState {
  return loadState();
}

export function getAllAdhkarForAdmin(): AdhkarItem[] {
  const state = loadState();
  const base = getAllAdhkarItems();
  const merged = base.map((item) => ({
    ...item,
    ...(state.overrides[item.id] ?? {}),
  }));
  const seedIds = new Set(getAllAdhkarItems().map((i) => i.id));
  const customs = state.customItems.filter((i) => !seedIds.has(i.id));
  return [...merged, ...customs];
}

export function getPublishedAdhkarItems(): AdhkarItem[] {
  const state = loadState();
  return getAllAdhkarForAdmin().filter((item) => !state.hiddenIds.includes(item.id));
}

export function isAdhkarHidden(id: string): boolean {
  return loadState().hiddenIds.includes(id);
}

export function setAdhkarHidden(id: string, hidden: boolean) {
  const state = loadState();
  const hiddenIds = hidden
    ? [...new Set([...state.hiddenIds, id])]
    : state.hiddenIds.filter((x) => x !== id);
  saveState({ ...state, hiddenIds });
}

export function upsertAdhkarItem(item: AdhkarItem) {
  const state = loadState();
  const isSeed = ADHKAR_ITEMS.some((i) => i.id === item.id);
  if (isSeed) {
    saveState({
      ...state,
      overrides: { ...state.overrides, [item.id]: item },
    });
    return;
  }
  const existing = state.customItems.findIndex((i) => i.id === item.id);
  const customItems =
    existing >= 0
      ? state.customItems.map((i, idx) => (idx === existing ? item : i))
      : [...state.customItems, item];
  saveState({ ...state, customItems });
}

export function deleteAdhkarItem(id: string) {
  const state = loadState();
  const isSeed = ADHKAR_ITEMS.some((i) => i.id === id);
  if (isSeed) {
    saveState({
      ...state,
      hiddenIds: [...new Set([...state.hiddenIds, id])],
      overrides: Object.fromEntries(Object.entries(state.overrides).filter(([k]) => k !== id)),
    });
    return;
  }
  saveState({
    ...state,
    customItems: state.customItems.filter((i) => i.id !== id),
    hiddenIds: state.hiddenIds.filter((x) => x !== id),
  });
}

export function newAdhkarId(): string {
  return `adh-custom-${Date.now()}`;
}
