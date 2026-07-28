/**
 * Retention, Khatmah & Engagement Engines (Module 4).
 * Adaptive quota, streaks, local notifications bridge, group khatmah + JSON backup.
 */

import {
  loadKhatmahGoal,
  saveKhatmahGoal,
  predictKhatmahCompletion,
  setKhatmahPagesPerDay,
  QURAN_TOTAL_PAGES,
  type KhatmahGoal,
  type KhatmahPrediction,
} from "@/lib/quran-khatmah-tracker";
import {
  getUserStreak,
  recordUserActivity,
  type UserStreakActivity,
  type UserStreakState,
} from "@/lib/user-streak";
import { syncSmartLocalNotifications } from "@/lib/smart-local-notifications";
import { exportKnowledgeVaultJson, importKnowledgeVaultJson } from "@/lib/personal-knowledge-vault";
import { listLocalReviews } from "@/lib/flashcard-local-store";
import { loadAutoFlashcards } from "@/services/sm2-learning-tracks";
import { getPriorityRecallItems } from "@/services/sm2-learning-tracks";
import { idbPut, OFFLINE_STORES } from "@/lib/offline-db";

export type AdaptiveQuotaResult = {
  goal: KhatmahGoal;
  prediction: KhatmahPrediction;
  previousPagesPerDay: number;
  redistributed: boolean;
};

export type GroupKhatmahMember = {
  id: string;
  displayName: string;
  pagesCompleted: number;
  updatedAt: string;
};

export type GroupKhatmahPlan = {
  id: string;
  title: string;
  targetPages: number;
  members: GroupKhatmahMember[];
  createdAt: string;
  updatedAt: string;
};

export type UnifiedBackupPayload = {
  v: 1;
  exportedAt: string;
  khatmah: KhatmahGoal;
  streak: UserStreakState;
  vaultJson: string;
  flashcardReviews: unknown[];
  autoFlashcards: unknown[];
  weakness: unknown[];
  groupKhatmah: GroupKhatmahPlan[];
};

const GROUP_LS = "majalis-group-khatmah-v1";

function todayKey(): string {
  try {
    return new Intl.DateTimeFormat("en-CA").format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function dayDiff(fromIso: string, toIso: string): number {
  const a = new Date(fromIso.slice(0, 10) + "T12:00:00");
  const b = new Date(toIso.slice(0, 10) + "T12:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * If behind schedule / missed target, redistribute remaining pages
 * across remaining days (protects streak continuity by keeping a reachable quota).
 */
export function redistributeKhatmahQuota(now = new Date()): AdaptiveQuotaResult {
  const goal = loadKhatmahGoal();
  const prediction = predictKhatmahCompletion(goal, now);
  const previousPagesPerDay = goal.pagesPerDay;
  let redistributed = false;
  let next = goal;

  if (prediction.behindSchedule || (goal.targetDate && prediction.deficitPages > 0)) {
    const today = todayKey();
    let daysLeft = 30;
    if (goal.targetDate) {
      daysLeft = Math.max(1, dayDiff(today, goal.targetDate));
    } else if (prediction.estimatedDaysRemaining != null) {
      daysLeft = Math.max(1, prediction.estimatedDaysRemaining);
    }
    const needed = Math.ceil(prediction.pagesRemaining / daysLeft);
    const adapted = Math.max(1, Math.min(40, Math.max(needed, goal.pagesPerDay)));
    if (adapted !== goal.pagesPerDay) {
      next = setKhatmahPagesPerDay(adapted);
      redistributed = true;
    }
  }

  return {
    goal: next,
    prediction: predictKhatmahCompletion(next, now),
    previousPagesPerDay,
    redistributed,
  };
}

export function trackLearningDay(activity: UserStreakActivity = "other"): UserStreakState {
  return recordUserActivity(activity);
}

export function getEngagementStreak(): UserStreakState {
  return getUserStreak();
}

export async function syncEngagementNotifications(): Promise<void> {
  try {
    const prediction = predictKhatmahCompletion();
    await syncSmartLocalNotifications({ khatmahBehind: prediction.behindSchedule });
  } catch {
    /* silent */
  }
}

function readGroups(): GroupKhatmahPlan[] {
  try {
    return JSON.parse(localStorage.getItem(GROUP_LS) || "[]") as GroupKhatmahPlan[];
  } catch {
    return [];
  }
}

function writeGroups(groups: GroupKhatmahPlan[]): void {
  try {
    localStorage.setItem(GROUP_LS, JSON.stringify(groups));
  } catch {
    /* ignore */
  }
  void idbPut(OFFLINE_STORES.meta, "group-khatmah-v1", groups).catch(() => undefined);
}

export function createLocalGroupKhatmah(opts: {
  title: string;
  members: Array<{ id: string; displayName: string }>;
  targetPages?: number;
}): GroupKhatmahPlan {
  const now = new Date().toISOString();
  const plan: GroupKhatmahPlan = {
    id: `gk-${Date.now().toString(36)}`,
    title: opts.title,
    targetPages: opts.targetPages ?? QURAN_TOTAL_PAGES,
    members: opts.members.map((m) => ({
      ...m,
      pagesCompleted: 0,
      updatedAt: now,
    })),
    createdAt: now,
    updatedAt: now,
  };
  const groups = readGroups();
  groups.unshift(plan);
  writeGroups(groups.slice(0, 20));
  return plan;
}

export function updateGroupMemberPages(
  groupId: string,
  memberId: string,
  pagesCompleted: number,
): GroupKhatmahPlan | null {
  const groups = readGroups();
  const g = groups.find((x) => x.id === groupId);
  if (!g) return null;
  g.members = g.members.map((m) =>
    m.id === memberId
      ? { ...m, pagesCompleted: Math.max(0, Math.min(g.targetPages, pagesCompleted)), updatedAt: new Date().toISOString() }
      : m,
  );
  g.updatedAt = new Date().toISOString();
  writeGroups(groups);
  return g;
}

export function listGroupKhatmah(): GroupKhatmahPlan[] {
  return readGroups();
}

/** Full local JSON backup for peer migration (no server). */
export async function exportUnifiedStateJson(userId = "local"): Promise<string> {
  const payload: UnifiedBackupPayload = {
    v: 1,
    exportedAt: new Date().toISOString(),
    khatmah: loadKhatmahGoal(),
    streak: getUserStreak(),
    vaultJson: await exportKnowledgeVaultJson(),
    flashcardReviews: await listLocalReviews(userId),
    autoFlashcards: loadAutoFlashcards(),
    weakness: getPriorityRecallItems(200),
    groupKhatmah: listGroupKhatmah(),
  };
  return JSON.stringify(payload, null, 2);
}

export async function importUnifiedStateJson(json: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const payload = JSON.parse(json) as UnifiedBackupPayload;
    if (payload.v !== 1) return { ok: false, error: "unsupported_version" };
    if (payload.khatmah) saveKhatmahGoal(payload.khatmah);
    if (payload.vaultJson) await importKnowledgeVaultJson(payload.vaultJson);
    if (Array.isArray(payload.groupKhatmah)) writeGroups(payload.groupKhatmah);
    try {
      if (payload.streak) localStorage.setItem("majalis-user-streak-v1", JSON.stringify(payload.streak));
    } catch {
      /* ignore */
    }
    try {
      if (payload.autoFlashcards) {
        localStorage.setItem("majalis-auto-flashcards-v1", JSON.stringify(payload.autoFlashcards));
      }
      if (payload.weakness) {
        localStorage.setItem(
          "majalis-weakness-tracker-v1",
          JSON.stringify({ updatedAt: new Date().toISOString(), items: payload.weakness }),
        );
      }
      if (payload.flashcardReviews) {
        localStorage.setItem("majalis-flashcard-reviews-v1", JSON.stringify(payload.flashcardReviews));
      }
    } catch {
      /* ignore */
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "parse_failed" };
  }
}

export { loadKhatmahGoal, predictKhatmahCompletion, QURAN_TOTAL_PAGES };
export type { KhatmahGoal, KhatmahPrediction, UserStreakState };
