/**
 * تخزين تقدم وحدات مسار الحفظ — محلي أولًا (مزامنة سحابية لاحقًا PR-10).
 * لا شهادة حفظ · الحالات التقنية لا تُعرض للمستخدم.
 */
import { storageGetSync, storageSetSync } from "@/lib/native-storage";
import { writeLocalJsonAtomic } from "@/lib/safe-json";
import { addUtcDays, toUtcDayKey } from "@/lib/spaced-repetition";
import {
  HIFZ_PROGRESS_STATES,
  type HifzProgressState,
} from "./progress-states";

export const HIFZ_PROGRESS_STORE_KEY = "ssunnah-hifz-path-progress-v1";
export const HIFZ_PROGRESS_SCHEMA_VERSION = 1 as const;

/** فترات مراجعة افتراضية بالأيام إن لم تُحدد الوحدة. */
export const HIFZ_DEFAULT_REVISION_INTERVALS = [1, 3, 7, 14] as const;

export type HifzUnitProgressRecord = {
  pathSlug: string;
  pathTitle: string;
  unitId: string;
  unitTitle: string;
  state: HifzProgressState;
  startedAt?: string;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  selfReportedAt?: string;
  repetitionCount: number;
  reviewCycle: number;
  updatedAt: string;
};

export type HifzProgressStore = {
  schemaVersion: typeof HIFZ_PROGRESS_SCHEMA_VERSION;
  units: HifzUnitProgressRecord[];
  updatedAt: string;
};

let memStore: HifzProgressStore | null = null;

function emptyStore(): HifzProgressStore {
  return {
    schemaVersion: HIFZ_PROGRESS_SCHEMA_VERSION,
    units: [],
    updatedAt: new Date().toISOString(),
  };
}

function isProgressState(v: unknown): v is HifzProgressState {
  return (
    typeof v === "string" &&
    (HIFZ_PROGRESS_STATES as readonly string[]).includes(v)
  );
}

function normalizeRecord(
  raw: Partial<HifzUnitProgressRecord>,
): HifzUnitProgressRecord | null {
  if (
    typeof raw.pathSlug !== "string" ||
    typeof raw.unitId !== "string" ||
    typeof raw.pathTitle !== "string" ||
    typeof raw.unitTitle !== "string"
  ) {
    return null;
  }
  const state = isProgressState(raw.state) ? raw.state : "NOT_STARTED";
  return {
    pathSlug: raw.pathSlug,
    pathTitle: raw.pathTitle,
    unitId: raw.unitId,
    unitTitle: raw.unitTitle,
    state,
    startedAt: typeof raw.startedAt === "string" ? raw.startedAt : undefined,
    lastReviewedAt:
      typeof raw.lastReviewedAt === "string" ? raw.lastReviewedAt : undefined,
    nextReviewAt:
      typeof raw.nextReviewAt === "string" ? raw.nextReviewAt : undefined,
    selfReportedAt:
      typeof raw.selfReportedAt === "string" ? raw.selfReportedAt : undefined,
    repetitionCount: Math.max(0, Number(raw.repetitionCount) || 0),
    reviewCycle: Math.max(0, Number(raw.reviewCycle) || 0),
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : new Date().toISOString(),
  };
}

function readStore(): HifzProgressStore {
  if (memStore) return memStore;
  try {
    const raw = storageGetSync(HIFZ_PROGRESS_STORE_KEY);
    if (!raw) {
      memStore = emptyStore();
      return memStore;
    }
    const parsed = JSON.parse(raw) as Partial<HifzProgressStore>;
    const units = Array.isArray(parsed.units)
      ? parsed.units
          .map((u) => normalizeRecord(u as Partial<HifzUnitProgressRecord>))
          .filter((u): u is HifzUnitProgressRecord => u != null)
      : [];
    memStore = {
      schemaVersion: HIFZ_PROGRESS_SCHEMA_VERSION,
      units,
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
    return memStore;
  } catch {
    memStore = emptyStore();
    return memStore;
  }
}

function persist(store: HifzProgressStore): void {
  store.updatedAt = new Date().toISOString();
  store.schemaVersion = HIFZ_PROGRESS_SCHEMA_VERSION;
  memStore = store;
  writeLocalJsonAtomic(HIFZ_PROGRESS_STORE_KEY, store);
  try {
    storageSetSync(HIFZ_PROGRESS_STORE_KEY, JSON.stringify(store));
  } catch {
    /* private mode */
  }
}

export function resetHifzProgressStoreForTests(): void {
  memStore = null;
}

export function unitProgressKey(pathSlug: string, unitId: string): string {
  return `${pathSlug}::${unitId}`;
}

export function getUnitProgress(
  pathSlug: string,
  unitId: string,
): HifzUnitProgressRecord | null {
  const store = readStore();
  return (
    store.units.find((u) => u.pathSlug === pathSlug && u.unitId === unitId) ??
    null
  );
}

export function listAllUnitProgress(): readonly HifzUnitProgressRecord[] {
  return readStore().units.slice();
}

/** محفوظاتي: وحدات لها تقدّم فعلي (ليست NOT_STARTED فقط). */
export function listMyHifzUnits(): HifzUnitProgressRecord[] {
  return readStore()
    .units.filter((u) => u.state !== "NOT_STARTED")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function upsert(
  input: {
    pathSlug: string;
    pathTitle: string;
    unitId: string;
    unitTitle: string;
  },
  patch: Partial<HifzUnitProgressRecord>,
): HifzUnitProgressRecord {
  const store = readStore();
  const idx = store.units.findIndex(
    (u) => u.pathSlug === input.pathSlug && u.unitId === input.unitId,
  );
  const now = new Date().toISOString();
  const base: HifzUnitProgressRecord =
    idx >= 0
      ? store.units[idx]!
      : {
          pathSlug: input.pathSlug,
          pathTitle: input.pathTitle,
          unitId: input.unitId,
          unitTitle: input.unitTitle,
          state: "NOT_STARTED",
          repetitionCount: 0,
          reviewCycle: 0,
          updatedAt: now,
        };
  const next: HifzUnitProgressRecord = {
    ...base,
    ...patch,
    pathSlug: input.pathSlug,
    pathTitle: input.pathTitle || base.pathTitle,
    unitId: input.unitId,
    unitTitle: input.unitTitle || base.unitTitle,
    updatedAt: now,
  };
  if (idx >= 0) store.units[idx] = next;
  else store.units.push(next);
  persist(store);
  return next;
}

export function startHifzUnit(input: {
  pathSlug: string;
  pathTitle: string;
  unitId: string;
  unitTitle: string;
}): HifzUnitProgressRecord {
  const existing = getUnitProgress(input.pathSlug, input.unitId);
  if (
    existing &&
    existing.state !== "NOT_STARTED" &&
    existing.state !== "IN_PROGRESS"
  ) {
    return existing;
  }
  return upsert(input, {
    state: "IN_PROGRESS",
    startedAt: existing?.startedAt ?? new Date().toISOString(),
  });
}

export function recordHifzRepetition(input: {
  pathSlug: string;
  pathTitle: string;
  unitId: string;
  unitTitle: string;
}): HifzUnitProgressRecord {
  const existing = getUnitProgress(input.pathSlug, input.unitId);
  const count = (existing?.repetitionCount ?? 0) + 1;
  return upsert(input, {
    state:
      existing?.state === "MEMORIZED_SELF_REPORTED" ||
      existing?.state === "DUE_FOR_REVIEW" ||
      existing?.state === "REVIEWED" ||
      existing?.state === "NEEDS_REINFORCEMENT"
        ? existing.state
        : "IN_PROGRESS",
    startedAt: existing?.startedAt ?? new Date().toISOString(),
    repetitionCount: count,
  });
}

function scheduleNextReview(
  reviewCycle: number,
  intervals: readonly number[] = HIFZ_DEFAULT_REVISION_INTERVALS,
): string {
  const days =
    intervals[Math.min(reviewCycle, intervals.length - 1)] ??
    intervals[intervals.length - 1] ??
    1;
  return addUtcDays(new Date(), days).toISOString();
}

/** تسجيل ذاتي — بلا ادعاء تحقق آلي. */
export function markHifzUnitSelfReported(
  input: {
    pathSlug: string;
    pathTitle: string;
    unitId: string;
    unitTitle: string;
  },
  opts?: { revisionIntervals?: number[] },
): HifzUnitProgressRecord {
  const existing = getUnitProgress(input.pathSlug, input.unitId);
  const cycle = existing?.reviewCycle ?? 0;
  const now = new Date().toISOString();
  return upsert(input, {
    state: "MEMORIZED_SELF_REPORTED",
    selfReportedAt: now,
    startedAt: existing?.startedAt ?? now,
    nextReviewAt: scheduleNextReview(cycle, opts?.revisionIntervals),
    repetitionCount: existing?.repetitionCount ?? 0,
  });
}

export function markHifzUnitReviewed(
  input: {
    pathSlug: string;
    pathTitle: string;
    unitId: string;
    unitTitle: string;
  },
  outcome: "ok" | "needs_reinforcement",
  opts?: { revisionIntervals?: number[] },
): HifzUnitProgressRecord {
  const existing = getUnitProgress(input.pathSlug, input.unitId);
  const now = new Date().toISOString();
  if (outcome === "needs_reinforcement") {
    return upsert(input, {
      state: "NEEDS_REINFORCEMENT",
      lastReviewedAt: now,
      nextReviewAt: scheduleNextReview(0, opts?.revisionIntervals),
      reviewCycle: 0,
      startedAt: existing?.startedAt ?? now,
    });
  }
  const nextCycle = (existing?.reviewCycle ?? 0) + 1;
  return upsert(input, {
    state: "REVIEWED",
    lastReviewedAt: now,
    reviewCycle: nextCycle,
    nextReviewAt: scheduleNextReview(nextCycle, opts?.revisionIntervals),
    startedAt: existing?.startedAt ?? now,
  });
}

/** يحدّث الوحدات المستحقة إلى DUE_FOR_REVIEW حسب nextReviewAt. */
export function refreshDueHifzReviews(now: Date = new Date()): number {
  const store = readStore();
  const todayKey = toUtcDayKey(now);
  let changed = 0;
  for (let i = 0; i < store.units.length; i++) {
    const u = store.units[i]!;
    if (!u.nextReviewAt) continue;
    if (
      u.state !== "MEMORIZED_SELF_REPORTED" &&
      u.state !== "REVIEWED" &&
      u.state !== "DUE_FOR_REVIEW"
    ) {
      continue;
    }
    const dueKey = toUtcDayKey(new Date(u.nextReviewAt));
    if (dueKey <= todayKey && u.state !== "DUE_FOR_REVIEW") {
      store.units[i] = {
        ...u,
        state: "DUE_FOR_REVIEW",
        updatedAt: now.toISOString(),
      };
      changed += 1;
    }
  }
  if (changed > 0) persist(store);
  return changed;
}

export function listDueHifzReviews(now: Date = new Date()): HifzUnitProgressRecord[] {
  refreshDueHifzReviews(now);
  const todayKey = toUtcDayKey(now);
  return readStore()
    .units.filter((u) => {
      if (u.state === "DUE_FOR_REVIEW" || u.state === "NEEDS_REINFORCEMENT") {
        return true;
      }
      if (!u.nextReviewAt) return false;
      if (
        u.state === "MEMORIZED_SELF_REPORTED" ||
        u.state === "REVIEWED"
      ) {
        return toUtcDayKey(new Date(u.nextReviewAt)) <= todayKey;
      }
      return false;
    })
    .sort((a, b) => (a.nextReviewAt ?? "").localeCompare(b.nextReviewAt ?? ""));
}

/** أحدث وحدة قيد الحفظ أو آخر تحديث. */
export function resolveContinueTarget(): HifzUnitProgressRecord | null {
  const units = readStore().units;
  const inProgress = units
    .filter((u) => u.state === "IN_PROGRESS")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (inProgress[0]) return inProgress[0];
  const active = units
    .filter((u) => u.state !== "NOT_STARTED")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return active[0] ?? null;
}

export function pathProgressPercent(
  pathSlug: string,
  publishedUnitIds: readonly string[],
): number | null {
  if (publishedUnitIds.length === 0) return null;
  const done = new Set(
    ["MEMORIZED_SELF_REPORTED", "DUE_FOR_REVIEW", "REVIEWED"] as HifzProgressState[],
  );
  const store = readStore();
  let completed = 0;
  for (const id of publishedUnitIds) {
    const rec = store.units.find(
      (u) => u.pathSlug === pathSlug && u.unitId === id,
    );
    if (rec && done.has(rec.state)) completed += 1;
  }
  return Math.round((completed / publishedUnitIds.length) * 100);
}
