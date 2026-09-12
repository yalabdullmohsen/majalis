/**
 * Prayer snapshots — MUST use prayer-times / prayer-time-engine (no parallel formula).
 */
import {
  computePrayerCountdown,
  getCachedPrayerTimes,
  type PrayerTimesPayload,
} from "@/lib/prayer-times";
import { computePrayerEngineDay } from "@/lib/prayer-time-engine";
import { snapshotChecksum } from "./checksum";
import { deepLinkForWidgetType } from "./deep-links";
import { defaultPrivacyForType, resolveAccountScope } from "./privacy";
import {
  WIDGET_READER_VERSION,
  WIDGET_SCHEMA_VERSION,
  type NextPrayerPayload,
  type PrayerTimesDayPayload,
  type WidgetFallbackState,
  type WidgetSnapshotEnvelope,
} from "./types";

function shortRemaining(ms: number): string {
  if (ms <= 0) return "الآن";
  const mins = Math.max(0, Math.round(ms / 60_000));
  if (mins < 60) return `بعد ${mins} د`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `بعد ${h} س ${m} د` : `بعد ${h} س`;
}

async function loadDay(injected?: PrayerTimesPayload | null): Promise<PrayerTimesPayload | null> {
  if (injected) return injected;
  const cached = getCachedPrayerTimes();
  if (cached?.ok && cached.prayers?.length) return cached;
  try {
    return (await computePrayerEngineDay()).payload;
  } catch {
    return null;
  }
}

function emptySnap<T>(
  widgetType: "next_prayer" | "prayer_times",
  accountScope: string,
  generatedAt: string,
  timezone: string,
  fallbackState: WidgetFallbackState,
  payload: T,
): WidgetSnapshotEnvelope<T> {
  return {
    widgetId: widgetType,
    widgetType,
    schemaVersion: WIDGET_SCHEMA_VERSION,
    readerVersion: WIDGET_READER_VERSION,
    generatedAt,
    validUntil: new Date(Date.parse(generatedAt) + 15 * 60_000).toISOString(),
    locale: "ar",
    timezone,
    theme: "system",
    privacyLevel: defaultPrivacyForType(widgetType),
    accountScope,
    dataSourceVersion: "prayer-time-engine/v1",
    deepLink: deepLinkForWidgetType(widgetType),
    fallbackState,
    payload,
    checksum: snapshotChecksum({
      widgetId: widgetType,
      widgetType,
      accountScope,
      generatedAt,
      payload,
    }),
  };
}

export async function buildNextPrayerSnapshot(opts?: {
  userId?: string | null;
  now?: Date;
  payload?: PrayerTimesPayload | null;
}): Promise<WidgetSnapshotEnvelope<NextPrayerPayload | Record<string, never>>> {
  const now = opts?.now ?? new Date();
  const accountScope = resolveAccountScope(opts?.userId);
  const generatedAt = now.toISOString();
  const day = await loadDay(opts?.payload);
  if (!day?.prayers?.length) {
    return emptySnap("next_prayer", accountScope, generatedAt, "Asia/Kuwait", "needs_location", {});
  }

  const cd = computePrayerCountdown(day.prayers, day.timezone || "Asia/Kuwait");
  const next = cd.next;
  if (!next) {
    return emptySnap(
      "next_prayer",
      accountScope,
      generatedAt,
      day.timezone || "Asia/Kuwait",
      "unavailable",
      {},
    );
  }

  const remainingMs = Math.max(0, cd.remainingMs);
  const obligatory = day.prayers.filter((p) => p.obligatory);
  const idx = obligatory.findIndex((p) => p.key === next.key);
  const following = obligatory.slice(idx + 1, idx + 3).map((p) => ({
    prayerKey: p.key,
    prayerNameAr: p.name,
    timeDisplay: p.time,
  }));

  const payload: NextPrayerPayload = {
    prayerKey: next.key,
    prayerNameAr: next.name,
    timeDisplay: next.time,
    remainingLabel: shortRemaining(remainingMs),
    remainingMs,
    locationLabel: day.city || "—",
    methodLabel: day.method,
    following,
  };

  return {
    widgetId: "next_prayer",
    widgetType: "next_prayer",
    schemaVersion: WIDGET_SCHEMA_VERSION,
    readerVersion: WIDGET_READER_VERSION,
    generatedAt,
    validUntil: new Date(now.getTime() + Math.min(remainingMs || 900_000, 1_800_000)).toISOString(),
    locale: "ar",
    timezone: day.timezone || "Asia/Kuwait",
    theme: "system",
    privacyLevel: defaultPrivacyForType("next_prayer"),
    accountScope,
    dataSourceVersion: "prayer-time-engine/v1",
    deepLink: deepLinkForWidgetType("next_prayer"),
    fallbackState: "ok",
    payload,
    checksum: snapshotChecksum({
      widgetId: "next_prayer",
      widgetType: "next_prayer",
      accountScope,
      generatedAt,
      payload,
    }),
  };
}

export async function buildPrayerTimesDaySnapshot(opts?: {
  userId?: string | null;
  now?: Date;
  payload?: PrayerTimesPayload | null;
}): Promise<WidgetSnapshotEnvelope<PrayerTimesDayPayload | Record<string, never>>> {
  const now = opts?.now ?? new Date();
  const accountScope = resolveAccountScope(opts?.userId);
  const generatedAt = now.toISOString();
  const day = await loadDay(opts?.payload);
  const nextSnap = await buildNextPrayerSnapshot({ ...opts, payload: day });

  if (!day?.prayers?.length) {
    return emptySnap("prayer_times", accountScope, generatedAt, "Asia/Kuwait", "needs_location", {});
  }

  const nextKey =
    nextSnap.fallbackState === "ok" && nextSnap.payload && "prayerKey" in nextSnap.payload
      ? (nextSnap.payload as NextPrayerPayload).prayerKey
      : null;

  const payload: PrayerTimesDayPayload = {
    locationLabel: day.city || "—",
    dateGregorian: day.date.gregorian,
    dateHijri: day.date.hijri,
    methodLabel: day.method,
    nextPrayerKey: nextKey,
    slots: day.prayers.map((p) => ({
      prayerKey: p.key,
      prayerNameAr: p.name,
      timeDisplay: p.time,
      obligatory: p.obligatory,
    })),
  };

  return {
    widgetId: "prayer_times",
    widgetType: "prayer_times",
    schemaVersion: WIDGET_SCHEMA_VERSION,
    readerVersion: WIDGET_READER_VERSION,
    generatedAt,
    validUntil: new Date(now.getTime() + 6 * 60 * 60_000).toISOString(),
    locale: "ar",
    timezone: day.timezone || "Asia/Kuwait",
    theme: "system",
    privacyLevel: defaultPrivacyForType("prayer_times"),
    accountScope,
    dataSourceVersion: "prayer-time-engine/v1",
    deepLink: deepLinkForWidgetType("prayer_times"),
    fallbackState: "ok",
    payload,
    checksum: snapshotChecksum({
      widgetId: "prayer_times",
      widgetType: "prayer_times",
      accountScope,
      generatedAt,
      payload,
    }),
  };
}
