export type ContentRotationKind =
  | "hadith"
  | "ayah"
  | "dhikr"
  | "dua"
  | "faida"
  | "question"
  | "wisdom"
  | "book-week"
  | "scholar-week"
  | "lesson-week";

export type RotationState = {
  kind: ContentRotationKind;
  order: string[];
  cursor: number;
  cycleStartedAt: string;
  lastDayKey: string;
};

export function getKuwaitDayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuwait",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getDayIndex(date = new Date()): number {
  const [y, m, d] = getKuwaitDayKey(date).split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

const STORAGE_PREFIX = "majalis-rotation-";

function loadState(kind: ContentRotationKind): RotationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${kind}`);
    return raw ? (JSON.parse(raw) as RotationState) : null;
  } catch {
    return null;
  }
}

function saveState(state: RotationState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${state.kind}`, JSON.stringify(state));
}

function shuffleDeterministic<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed ^ 0x9e3779b9;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    s = Math.imul(s ^ (s >>> 16), 0x7feb352d);
    s = Math.imul(s ^ (s >>> 15), 0x846ca68b);
    s ^= s >>> 16;
    const j = Math.abs(s) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Pick daily item with full-cycle rotation — no repeat until pool exhausted */
export function pickRotatedItem<T extends { id: string }>(
  kind: ContentRotationKind,
  items: T[],
  date = new Date(),
): T {
  if (items.length === 0) throw new Error(`empty pool: ${kind}`);
  if (items.length === 1) return items[0];

  const dayKey = getKuwaitDayKey(date);
  const ids = items.map((i) => i.id);
  let state = loadState(kind);

  const poolChanged =
    !state ||
    state.order.length !== ids.length ||
    state.order.some((id, idx) => ids.includes(id) === false);

  if (poolChanged) {
    state = {
      kind,
      order: shuffleDeterministic(ids, getDayIndex()),
      cursor: 0,
      cycleStartedAt: dayKey,
      lastDayKey: "",
    };
  }

  if (state!.lastDayKey !== dayKey) {
    if (state!.lastDayKey && state!.cursor >= state!.order.length - 1) {
      state!.order = shuffleDeterministic(ids, getDayIndex() + state!.cursor + 1);
      state!.cursor = 0;
      state!.cycleStartedAt = dayKey;
    } else if (state!.lastDayKey) {
      state!.cursor += 1;
      if (state!.cursor >= state!.order.length) {
        state!.order = shuffleDeterministic(ids, getDayIndex() + 1);
        state!.cursor = 0;
        state!.cycleStartedAt = dayKey;
      }
    }
    state!.lastDayKey = dayKey;
    saveState(state!);
  }

  const pickedId = state!.order[state!.cursor] ?? state!.order[0];
  const item = items.find((i) => i.id === pickedId) ?? items[state!.cursor % items.length];
  return item;
}

/** Simple modulo pick when rotation state unavailable (SSR) */
export function pickDailyItem<T>(items: T[], date = new Date()): T {
  if (items.length === 0) throw new Error("empty daily pool");
  return items[getDayIndex(date) % items.length];
}
