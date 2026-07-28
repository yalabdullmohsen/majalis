/**
 * Part 21 — Critical Web Vitals CLS shield (logic-only).
 * Holds previous content during async remounts / fetches so React state
 * updates do not collapse layout height (zero-height flashes).
 * No CSS, Tailwind, or DOM structure changes — pure state reservation.
 */

export type ClsReserveSlot<T> = {
  /** Last successfully resolved value (never cleared on load start). */
  committed: T | null;
  /** In-flight candidate (may be null while loading). */
  pending: T | null;
  loading: boolean;
  error: boolean;
  /** Generation counter — ignore stale async completions. */
  generation: number;
};

export function createClsReserveSlot<T>(initial: T | null = null): ClsReserveSlot<T> {
  return {
    committed: initial,
    pending: null,
    loading: false,
    error: false,
    generation: 0,
  };
}

/**
 * Begin a load without clearing `committed` — prevents CLS from nulling content.
 */
export function clsBeginLoad<T>(slot: ClsReserveSlot<T>): ClsReserveSlot<T> {
  return {
    ...slot,
    loading: true,
    error: false,
    pending: null,
    generation: slot.generation + 1,
  };
}

/** Commit successful payload; becomes the stable layout anchor. */
export function clsCommit<T>(
  slot: ClsReserveSlot<T>,
  value: T,
  generation?: number,
): ClsReserveSlot<T> {
  if (generation != null && generation !== slot.generation) return slot;
  return {
    ...slot,
    committed: value,
    pending: null,
    loading: false,
    error: false,
  };
}

/** Mark error but keep committed content mounted for layout stability. */
export function clsFail<T>(
  slot: ClsReserveSlot<T>,
  generation?: number,
): ClsReserveSlot<T> {
  if (generation != null && generation !== slot.generation) return slot;
  return {
    ...slot,
    loading: false,
    error: true,
    pending: null,
  };
}

/**
 * Display value for render: prefer committed during load; never return null
 * if a previous value exists (zero-height shield).
 */
export function clsDisplayValue<T>(slot: ClsReserveSlot<T>): T | null {
  if (slot.loading && slot.committed != null) return slot.committed;
  if (slot.pending != null) return slot.pending;
  return slot.committed;
}

/**
 * Placeholder strategy: when content is truly empty, return a zero-height
 * sentinel flag so callers can avoid mounting expanding chrome until ready.
 * Does not inject DOM — callers decide; default is "hold".
 */
export type ClsPlaceholderStrategy = "hold" | "defer-mount";

export function clsShouldMountContent<T>(
  slot: ClsReserveSlot<T>,
  strategy: ClsPlaceholderStrategy = "hold",
): boolean {
  if (strategy === "defer-mount") {
    return slot.committed != null || (!slot.loading && slot.pending != null);
  }
  // hold: always mount if we have any committed/pending value
  return clsDisplayValue(slot) != null || !slot.loading;
}

/**
 * Pure helper for ayah / tafsir / floating-player style state:
 * keep previous text while the next edition loads.
 * When not loading, always prefer `next` (including null clears).
 */
export function holdPreviousWhileLoading<T>(
  previous: T | null,
  next: T | null,
  loading: boolean,
): T | null {
  if (loading && previous != null) return previous;
  return next;
}

/**
 * Aspect-ratio reservation as numeric metadata only (no CSS write).
 * Callers may pass these numbers into existing style props without changing
 * classNames — useful for audio waveform / poster slots already sized in JSX.
 */
export type AspectReserve = {
  width: number;
  height: number;
  ratio: number;
};

export function reserveAspect(width: number, height: number): AspectReserve {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  return { width: w, height: h, ratio: w / h };
}

/** Stable empty-string sentinel length for text slots (avoids null → "" → text thrash). */
export function clsStableText(previous: string | null | undefined, next: string | null | undefined, loading: boolean): string {
  if (loading && previous) return previous;
  if (next != null && next !== "") return next;
  return previous ?? "";
}
