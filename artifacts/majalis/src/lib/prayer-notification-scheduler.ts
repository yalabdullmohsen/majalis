/**
 * PrayerNotificationScheduler — مصدر واحد لبناء الجدول المطلوب ومصالحته مع معلّقات النظام.
 * الشاشات لا تنشئ طلبات إشعار مباشرة.
 */
import {
  hashPrayerNotificationId,
  isPrayerNotificationNamespace,
  logicalPrayerNotificationId,
  type PrayerNotifIdKind,
} from "./prayer-notification-ids";

export type DesiredPrayerNotification = {
  id: number;
  logicalId: string;
  prayerId: string;
  localDate: string;
  kind: PrayerNotifIdKind;
  fireAtMs: number;
  timeZone: string;
  title: string;
  body: string;
  soundId: string;
  preMinutes?: number;
  scheduleVersion: string;
  settingsVersion: string;
};

export type PendingPrayerNotification = {
  id: number;
  logicalId: string | null;
  fireAtMs: number | null;
  soundId: string | null;
  kind: string | null;
  prayerId: string | null;
};

export type ReconcilePlan = {
  correct: DesiredPrayerNotification[];
  missing: DesiredPrayerNotification[];
  stale: PendingPrayerNotification[];
  changed: Array<{ desired: DesiredPrayerNotification; pending: PendingPrayerNotification }>;
  duplicate: PendingPrayerNotification[];
  expired: PendingPrayerNotification[];
  foreign: PendingPrayerNotification[];
  desiredCount: number;
  cancelIds: number[];
  scheduleItems: DesiredPrayerNotification[];
};

export type PrayerScheduleHealthCode =
  | "healthy"
  | "permissionRequired"
  | "permissionDenied"
  | "staleSchedule"
  | "incompleteSchedule"
  | "timezoneChanged"
  | "noUpcomingPrayer"
  | "schedulingFailed"
  | "verificationFailed"
  | "locationUnavailable";

const FIRE_TOLERANCE_MS = 60_000;

let _inFlight: Promise<unknown> | null = null;
let _generation = 0;

export function getPrayerScheduleGeneration(): number {
  return _generation;
}

/** قفل single-flight لمنع سباقات الجدولة. */
export async function withPrayerScheduleLock<T>(fn: () => Promise<T>): Promise<T> {
  if (_inFlight) {
    await _inFlight.catch(() => undefined);
  }
  const gen = ++_generation;
  const run = (async () => {
    try {
      return await fn();
    } finally {
      if (gen === _generation) _inFlight = null;
    }
  })();
  _inFlight = run;
  return run;
}

export function buildDesiredPrayerNotification(opts: {
  prayerId: string;
  localDate: string;
  kind: PrayerNotifIdKind;
  fireAtMs: number;
  timeZone: string;
  title: string;
  body: string;
  soundId: string;
  preMinutes?: number;
  scheduleVersion: string;
  settingsVersion: string;
  nowMs?: number;
}): DesiredPrayerNotification | null {
  const now = opts.nowMs ?? Date.now();
  if (!(opts.fireAtMs > now)) return null;
  if (!opts.timeZone) return null;
  const prayerId = opts.prayerId.toLowerCase();
  return {
    id: hashPrayerNotificationId(prayerId, opts.localDate, opts.kind),
    logicalId: logicalPrayerNotificationId(
      prayerId,
      opts.localDate,
      opts.kind,
      opts.preMinutes,
    ),
    prayerId,
    localDate: opts.localDate,
    kind: opts.kind,
    fireAtMs: opts.fireAtMs,
    timeZone: opts.timeZone,
    title: opts.title,
    body: opts.body,
    soundId: opts.soundId || "default",
    preMinutes: opts.preMinutes,
    scheduleVersion: opts.scheduleVersion,
    settingsVersion: opts.settingsVersion,
  };
}

function isPrayerPending(p: PendingPrayerNotification): boolean {
  return (
    isPrayerNotificationNamespace(p.logicalId) ||
    Boolean(p.prayerId) ||
    String(p.kind || "").startsWith("prayer")
  );
}

/** مصالحة خالصة Desired ↔ Pending — لا تلمس foreign. */
export function planPrayerNotificationReconcile(
  desired: DesiredPrayerNotification[],
  pending: PendingPrayerNotification[],
  nowMs = Date.now(),
): ReconcilePlan {
  const byLogical = new Map<string, DesiredPrayerNotification>();
  const byId = new Map<number, DesiredPrayerNotification>();
  for (const d of desired) {
    byLogical.set(d.logicalId, d);
    byId.set(d.id, d);
  }

  const correct: DesiredPrayerNotification[] = [];
  const missing: DesiredPrayerNotification[] = [];
  const stale: PendingPrayerNotification[] = [];
  const changed: Array<{ desired: DesiredPrayerNotification; pending: PendingPrayerNotification }> =
    [];
  const duplicate: PendingPrayerNotification[] = [];
  const expired: PendingPrayerNotification[] = [];
  const foreign: PendingPrayerNotification[] = [];
  const seenLogical = new Set<string>();
  const matchedDesired = new Set<string>();

  for (const p of pending) {
    if (!isPrayerPending(p)) {
      foreign.push(p);
      continue;
    }
    if (p.fireAtMs != null && p.fireAtMs <= nowMs) {
      expired.push(p);
      continue;
    }
    if (p.logicalId && seenLogical.has(p.logicalId)) {
      duplicate.push(p);
      continue;
    }
    if (p.logicalId) seenLogical.add(p.logicalId);

    const d = (p.logicalId && byLogical.get(p.logicalId)) || byId.get(p.id) || null;
    if (!d) {
      stale.push(p);
      continue;
    }
    matchedDesired.add(d.logicalId);
    const fireOk =
      p.fireAtMs != null && Math.abs(p.fireAtMs - d.fireAtMs) <= FIRE_TOLERANCE_MS;
    const soundOk = !p.soundId || !d.soundId || p.soundId === d.soundId || p.soundId === "default";
    if (fireOk && soundOk && p.id === d.id) {
      correct.push(d);
    } else {
      changed.push({ desired: d, pending: p });
    }
  }

  for (const d of desired) {
    if (!matchedDesired.has(d.logicalId)) missing.push(d);
  }

  const cancelIds = Array.from(
    new Set([
      ...stale.map((p) => p.id),
      ...expired.map((p) => p.id),
      ...duplicate.map((p) => p.id),
      ...changed.map((c) => c.pending.id),
    ]),
  );
  const scheduleItems = [...missing, ...changed.map((c) => c.desired)];

  return {
    correct,
    missing,
    stale,
    changed,
    duplicate,
    expired,
    foreign,
    desiredCount: desired.length,
    cancelIds,
    scheduleItems,
  };
}

export function validateDesiredAgainstPending(
  desired: DesiredPrayerNotification[],
  pending: PendingPrayerNotification[],
  nowMs = Date.now(),
): {
  ok: boolean;
  expectedCount: number;
  verifiedCount: number;
  missingLogicalIds: string[];
  extraPrayerIds: number[];
  pastIds: number[];
  duplicateLogicalIds: string[];
} {
  const prayerPending = pending.filter(isPrayerPending);
  const byLogical = new Map<string, PendingPrayerNotification[]>();
  for (const p of prayerPending) {
    const k = p.logicalId || `id:${p.id}`;
    const arr = byLogical.get(k) || [];
    arr.push(p);
    byLogical.set(k, arr);
  }

  const missingLogicalIds: string[] = [];
  let verifiedCount = 0;
  for (const d of desired) {
    const hits = byLogical.get(d.logicalId) || [];
    const okHit = hits.find(
      (p) =>
        p.id === d.id &&
        p.fireAtMs != null &&
        Math.abs(p.fireAtMs - d.fireAtMs) <= FIRE_TOLERANCE_MS,
    );
    if (okHit) verifiedCount += 1;
    else missingLogicalIds.push(d.logicalId);
  }

  const desiredIds = new Set(desired.map((d) => d.id));
  const extraPrayerIds = prayerPending.filter((p) => !desiredIds.has(p.id)).map((p) => p.id);
  const pastIds = prayerPending
    .filter((p) => p.fireAtMs != null && p.fireAtMs <= nowMs)
    .map((p) => p.id);
  const duplicateLogicalIds = [...byLogical.entries()]
    .filter(([, arr]) => arr.length > 1)
    .map(([k]) => k);

  return {
    ok:
      missingLogicalIds.length === 0 &&
      pastIds.length === 0 &&
      duplicateLogicalIds.length === 0 &&
      verifiedCount === desired.length,
    expectedCount: desired.length,
    verifiedCount,
    missingLogicalIds,
    extraPrayerIds,
    pastIds,
    duplicateLogicalIds,
  };
}

export function computeSafeScheduleDayWindow(opts: {
  enabledPrayers: number;
  kindsPerPrayer: number;
  reservedOther: number;
  platformCap?: number;
}): { days: number; expectedRequests: number } {
  const cap = opts.platformCap ?? 64;
  const usable = Math.max(8, cap - opts.reservedOther - 8);
  const perDay = Math.max(1, opts.enabledPrayers * Math.max(1, opts.kindsPerPrayer));
  const days = Math.max(2, Math.min(14, Math.floor(usable / perDay)));
  return { days, expectedRequests: days * perDay };
}

export function classifyPrayerScheduleHealth(input: {
  permission: "granted" | "denied" | "prompt" | "unsupported";
  hasLocation: boolean;
  timezoneChanged?: boolean;
  lastOk?: boolean | null;
  validationOk?: boolean | null;
  desiredCount?: number;
  verifiedCount?: number;
  nextAtMs?: number | null;
  nowMs?: number;
}): { code: PrayerScheduleHealthCode; repairAction: string } {
  if (input.permission === "prompt" || input.permission === "unsupported") {
    return { code: "permissionRequired", repairAction: "request_permission" };
  }
  if (input.permission === "denied") {
    return { code: "permissionDenied", repairAction: "open_system_settings" };
  }
  if (!input.hasLocation) {
    return { code: "locationUnavailable", repairAction: "choose_city" };
  }
  if (input.timezoneChanged) {
    return { code: "timezoneChanged", repairAction: "reconcile" };
  }
  if (input.lastOk === false) {
    return { code: "schedulingFailed", repairAction: "reconcile" };
  }
  if (input.validationOk === false) {
    return { code: "verificationFailed", repairAction: "reconcile" };
  }
  if ((input.desiredCount ?? 0) > 0 && (input.verifiedCount ?? 0) < (input.desiredCount ?? 0)) {
    return { code: "incompleteSchedule", repairAction: "reconcile" };
  }
  const now = input.nowMs ?? Date.now();
  if (input.nextAtMs == null || input.nextAtMs <= now) {
    return { code: "noUpcomingPrayer", repairAction: "reconcile" };
  }
  return { code: "healthy", repairAction: "none" };
}
