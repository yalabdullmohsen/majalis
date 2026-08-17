/**
 * حارس تسليم إشعارات الصلاة — يمنع العرض الكاذب حتى لو أخطأت الجدولة.
 * يُستدعى عند الاستلام (أو قبل العرض على الويب).
 */

const LOG_KEY = "majalis-prayer-guard-log-v1";
const MAX_LOG = 40;

export type PrayerGuardKind = "pre" | "enter" | "post";

export type PrayerGuardDecision = {
  allow: boolean;
  reason?: string;
};

export type PrayerGuardLogEntry = {
  atIso: string;
  kind: PrayerGuardKind;
  prayerKey: string;
  prayerAtIso: string;
  reason: string;
};

const ENTER_STALE_MS = 5 * 60_000;

export function shouldDeliverPreAlert(
  nowMs: number,
  prayerAtMs: number,
): PrayerGuardDecision {
  if (nowMs >= prayerAtMs) {
    return { allow: false, reason: "pre_after_prayer" };
  }
  return { allow: true };
}

export function shouldDeliverEnterAlert(
  nowMs: number,
  prayerAtMs: number,
  staleMs = ENTER_STALE_MS,
): PrayerGuardDecision {
  if (nowMs < prayerAtMs - 30_000) {
    // قبل الوقت بأكثر من 30ث — نادر؛ اسمح (خطأ ساعة بسيط)
    return { allow: true };
  }
  if (nowMs - prayerAtMs > staleMs) {
    return { allow: false, reason: "enter_stale_gt_5m" };
  }
  return { allow: true };
}

export function shouldDeliverPrayerNotification(opts: {
  kind: PrayerGuardKind;
  nowMs?: number;
  prayerAtMs: number;
}): PrayerGuardDecision {
  const now = opts.nowMs ?? Date.now();
  if (opts.kind === "pre") return shouldDeliverPreAlert(now, opts.prayerAtMs);
  if (opts.kind === "enter") return shouldDeliverEnterAlert(now, opts.prayerAtMs);
  // post: لا يُعرض إن كان قبل دخول الوقت
  if (now < opts.prayerAtMs) return { allow: false, reason: "post_before_prayer" };
  return { allow: true };
}

export function logPrayerGuardBlock(entry: Omit<PrayerGuardLogEntry, "atIso"> & { atIso?: string }): void {
  try {
    if (typeof localStorage === "undefined") return;
    const row: PrayerGuardLogEntry = {
      atIso: entry.atIso ?? new Date().toISOString(),
      kind: entry.kind,
      prayerKey: entry.prayerKey,
      prayerAtIso: entry.prayerAtIso,
      reason: entry.reason,
    };
    const raw = localStorage.getItem(LOG_KEY);
    const prev = raw ? (JSON.parse(raw) as PrayerGuardLogEntry[]) : [];
    const next = Array.isArray(prev) ? [...prev, row] : [row];
    while (next.length > MAX_LOG) next.shift();
    localStorage.setItem(LOG_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function loadPrayerGuardLog(): PrayerGuardLogEntry[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PrayerGuardLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
