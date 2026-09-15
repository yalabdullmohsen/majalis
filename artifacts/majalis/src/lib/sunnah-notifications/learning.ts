/**
 * تذكيرات التعلم — مرتبطة بتقدّم حقيقي وopt-in.
 */

import { dispatchSunnahNotification } from "./dispatcher";
import { markDedupeStatus, buildDedupeKey, localDayPeriod } from "./deduplicator";
import {
  isChannelEffectivelyEnabled,
  loadSunnahNotificationPrefs,
} from "./preferences";
import { isSunnahNotificationsKillSwitchOn } from "./kill-switch";

export type LearningProgressSnapshot = {
  lessonId: string;
  lessonTitle: string;
  seriesId?: string;
  completed: boolean;
  lastPosition?: string;
  deepLink?: string;
  userId?: string | null;
};

const ACTIVE_LEARNING_KEY = "sunnah.notifications.learning.active.v1";

type ActiveReminder = {
  lessonId: string;
  dedupeKey: string;
  scheduledFor: string;
};

function readActive(): ActiveReminder[] {
  try {
    const raw = localStorage.getItem(ACTIVE_LEARNING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActiveReminder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeActive(list: ActiveReminder[]): void {
  try {
    localStorage.setItem(ACTIVE_LEARNING_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

/** إلغاء تذكير درس عند اكتماله أو عودة المستخدم قبل الموعد */
export function cancelLearningReminder(lessonId: string): void {
  const prev = readActive();
  const next = prev.filter((r) => r.lessonId !== lessonId);
  for (const r of prev) {
    if (r.lessonId === lessonId) markDedupeStatus(r.dedupeKey, "cancelled");
  }
  writeActive(next);
}

export async function scheduleLearningResumeReminder(
  progress: LearningProgressSnapshot,
): Promise<{ ok: boolean; reason?: string }> {
  if (isSunnahNotificationsKillSwitchOn()) {
    return { ok: false, reason: "kill_switch" };
  }

  if (progress.completed) {
    cancelLearningReminder(progress.lessonId);
    return { ok: false, reason: "completed" };
  }

  const prefs = loadSunnahNotificationPrefs();
  if (!isChannelEffectivelyEnabled(prefs, "learning")) {
    return { ok: false, reason: "channel_disabled" };
  }

  // منع أكثر من تذكير نشط لنفس الدرس
  if (readActive().some((r) => r.lessonId === progress.lessonId)) {
    return { ok: false, reason: "already_scheduled" };
  }

  const deepLink =
    progress.deepLink || `/lesson/${encodeURIComponent(progress.lessonId)}`;

  const live = await dispatchSunnahNotification({
    channel: "learning",
    userId: progress.userId,
    entityId: progress.lessonId,
    eventType: "lesson_resume",
    stillRelevant: true,
    expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    compose: {
      kind: "lesson_resume",
      entityTitle: progress.lessonTitle,
      deepLink,
    },
  });

  if (!live.ok) return { ok: false, reason: live.reason };

  writeActive([
    ...readActive().filter((r) => r.lessonId !== progress.lessonId),
    {
      lessonId: progress.lessonId,
      dedupeKey: live.dedupeKey,
      scheduledFor: live.deliverAt,
    },
  ]);

  return { ok: true };
}

export function learningDedupePreview(lessonId: string, userId?: string | null): string {
  return buildDedupeKey({
    userId,
    channel: "learning",
    entityId: lessonId,
    eventType: "lesson_resume",
    scheduledPeriod: localDayPeriod(),
  });
}
