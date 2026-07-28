/**
 * Shared Group Khatmah & Family Streaks — allocate 30 Juz among participants,
 * track completion, export/import JSON, optional lightweight sync API.
 * Offline-first via localStorage + IndexedDB (meta store).
 */

import { idbGetValue, idbPut, OFFLINE_STORES, isOnline } from "@/lib/offline-db";
import { getUserStreak, recordUserActivity } from "@/lib/user-streak";

export const TOTAL_JUZ = 30;

export type GroupMember = {
  id: string;
  name: string;
  /** Juz numbers assigned (1–30) */
  juzAssigned: number[];
  /** Juz numbers marked complete */
  juzCompleted: number[];
  /** Personal activity days contributing to family streak */
  activeDays: string[];
};

export type GroupKhatmahState = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  members: GroupMember[];
  /** Optional remote sync endpoint (POST/GET JSON) */
  syncUrl?: string | null;
  /** Share token for import */
  shareCode: string;
};

export type FamilyStreakSnapshot = {
  groupId: string;
  /** Days where ≥1 member was active */
  familyActiveDays: string[];
  currentFamilyStreak: number;
  longestFamilyStreak: number;
  memberStreaks: Array<{ memberId: string; name: string; personalDays: number }>;
};

const LS_KEY = "majalis-group-khatmah-v1";
const IDB_KEY = "group-khatmah-active";

function todayKey(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuwait",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyState(): GroupKhatmahState | null {
  return null;
}

export function loadGroupKhatmah(): GroupKhatmahState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return emptyState();
    return JSON.parse(raw) as GroupKhatmahState;
  } catch {
    return null;
  }
}

export function saveGroupKhatmah(state: GroupKhatmahState): GroupKhatmahState {
  const next = { ...state, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_KEY, next).catch(() => undefined);
  return next;
}

export async function loadGroupKhatmahAsync(): Promise<GroupKhatmahState | null> {
  try {
    const fromIdb = await idbGetValue<GroupKhatmahState>(OFFLINE_STORES.meta, IDB_KEY);
    if (fromIdb?.id) return fromIdb;
  } catch {
    /* ignore */
  }
  return loadGroupKhatmah();
}

/**
 * Divide juz 1–30 as evenly as possible among named participants.
 */
export function allocateJuzAmongMembers(memberNames: string[]): GroupMember[] {
  const names = memberNames.map((n) => n.trim()).filter(Boolean);
  if (!names.length) return [];
  const members: GroupMember[] = names.map((name) => ({
    id: uid("m"),
    name,
    juzAssigned: [],
    juzCompleted: [],
    activeDays: [],
  }));
  for (let juz = 1; juz <= TOTAL_JUZ; juz++) {
    members[(juz - 1) % members.length].juzAssigned.push(juz);
  }
  return members;
}

export function createGroupKhatmah(opts: {
  title?: string;
  memberNames: string[];
  syncUrl?: string | null;
}): GroupKhatmahState {
  const members = allocateJuzAmongMembers(opts.memberNames);
  const state: GroupKhatmahState = {
    id: uid("gk"),
    title: opts.title?.trim() || "ختمة جماعية",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members,
    syncUrl: opts.syncUrl ?? null,
    shareCode: uid("share").slice(0, 16),
  };
  return saveGroupKhatmah(state);
}

export function reallocateGroupJuz(state: GroupKhatmahState): GroupKhatmahState {
  const names = state.members.map((m) => m.name);
  const fresh = allocateJuzAmongMembers(names);
  // Preserve completion & activity by name match
  const byName = new Map(state.members.map((m) => [m.name, m]));
  const members = fresh.map((m) => {
    const prev = byName.get(m.name);
    if (!prev) return m;
    return {
      ...m,
      id: prev.id,
      juzCompleted: prev.juzCompleted.filter((j) => m.juzAssigned.includes(j)),
      activeDays: prev.activeDays,
    };
  });
  return saveGroupKhatmah({ ...state, members });
}

export function markJuzComplete(
  state: GroupKhatmahState,
  memberId: string,
  juz: number,
  completed = true,
): GroupKhatmahState {
  const day = todayKey();
  const members = state.members.map((m) => {
    if (m.id !== memberId) return m;
    if (!m.juzAssigned.includes(juz)) return m;
    let juzCompleted = m.juzCompleted.filter((j) => j !== juz);
    if (completed) juzCompleted = [...juzCompleted, juz].sort((a, b) => a - b);
    const activeDays = m.activeDays.includes(day) ? m.activeDays : [...m.activeDays, day];
    return { ...m, juzCompleted, activeDays };
  });
  try {
    recordUserActivity("wird", { completedGoal: true });
  } catch {
    /* ignore */
  }
  return saveGroupKhatmah({ ...state, members });
}

export function groupCompletionRatio(state: GroupKhatmahState): number {
  const done = state.members.reduce((n, m) => n + m.juzCompleted.length, 0);
  return done / TOTAL_JUZ;
}

export function exportGroupKhatmahJson(state: GroupKhatmahState = loadGroupKhatmah()!): string {
  if (!state) return "{}";
  return JSON.stringify(state, null, 2);
}

export function importGroupKhatmahJson(json: string): GroupKhatmahState | null {
  try {
    const parsed = JSON.parse(json) as GroupKhatmahState;
    if (!parsed?.id || !Array.isArray(parsed.members)) return null;
    return saveGroupKhatmah(parsed);
  } catch {
    return null;
  }
}

/** Compute family streak from union of member active days + local user streak. */
export function computeFamilyStreak(state: GroupKhatmahState): FamilyStreakSnapshot {
  const daySet = new Set<string>();
  for (const m of state.members) {
    for (const d of m.activeDays) daySet.add(d);
  }
  // Include local user streak day if present
  try {
    const us = getUserStreak();
    if (us.lastActiveDate) daySet.add(us.lastActiveDate);
  } catch {
    /* ignore */
  }

  const days = [...daySet].sort();
  let current = 0;
  let longest = 0;
  let run = 0;
  const today = todayKey();

  // Walk chronologically
  for (let i = 0; i < days.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      const prev = Date.parse(`${days[i - 1]}T12:00:00`);
      const cur = Date.parse(`${days[i]}T12:00:00`);
      const gap = Math.round((cur - prev) / 86_400_000);
      run = gap === 1 ? run + 1 : 1;
    }
    longest = Math.max(longest, run);
    if (days[i] === today || days[i] === days[days.length - 1]) {
      current = run;
    }
  }

  // If last activity isn't today/yesterday, current streak breaks
  if (days.length) {
    const last = days[days.length - 1];
    const gapFromToday = Math.round(
      (Date.parse(`${today}T12:00:00`) - Date.parse(`${last}T12:00:00`)) / 86_400_000,
    );
    if (gapFromToday > 1) current = 0;
  }

  return {
    groupId: state.id,
    familyActiveDays: days,
    currentFamilyStreak: current,
    longestFamilyStreak: longest,
    memberStreaks: state.members.map((m) => ({
      memberId: m.id,
      name: m.name,
      personalDays: m.activeDays.length,
    })),
  };
}

/**
 * Lightweight sync: POST full JSON state to syncUrl when online.
 * Returns false on failure (silent).
 */
export async function pushGroupKhatmahRemote(
  state: GroupKhatmahState,
): Promise<boolean> {
  if (!state.syncUrl || !isOnline()) return false;
  try {
    const res = await fetch(state.syncUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
      signal: AbortSignal.timeout(12_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Pull remote JSON and merge by updatedAt (newer wins). */
export async function pullGroupKhatmahRemote(
  state: GroupKhatmahState,
): Promise<GroupKhatmahState | null> {
  if (!state.syncUrl || !isOnline()) return null;
  try {
    const res = await fetch(state.syncUrl, {
      method: "GET",
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const remote = (await res.json()) as GroupKhatmahState;
    if (!remote?.id || !Array.isArray(remote.members)) return null;
    const localTs = Date.parse(state.updatedAt || "") || 0;
    const remoteTs = Date.parse(remote.updatedAt || "") || 0;
    if (remoteTs >= localTs) return saveGroupKhatmah(remote);
    return state;
  } catch {
    return null;
  }
}
