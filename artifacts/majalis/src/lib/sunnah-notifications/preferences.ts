/**
 * تفضيلات قنوات سُنّة + ساعات الهدوء (opt-in للمحتوى).
 */

import {
  CHANNEL_POLICIES,
  type ChannelCadence,
  type SunnahNotificationChannel,
  SUNNAH_NOTIFICATION_CHANNELS,
} from "./channels";

export const SUNNAH_NOTIF_PREFS_KEY = "sunnah.notifications.prefs.v1";
export const SUNNAH_NOTIF_MIGRATION_FLAG = "sunnah.notifications.migrated.v1";

export type QuietHoursPrefs = {
  enabled: boolean;
  startHour: number;
  endHour: number;
};

export type ChannelPrefs = {
  enabled: boolean;
  cadence: ChannelCadence;
};

export type SunnahNotificationPrefs = {
  version: 1;
  nonEssentialMasterEnabled: boolean;
  channels: Record<SunnahNotificationChannel, ChannelPrefs>;
  quietHours: QuietHoursPrefs;
  learningReminderHour: number;
  learningReminderMinute: number;
  updatedAt: string;
};

const DEFAULT_QUIET: QuietHoursPrefs = {
  enabled: true,
  startHour: 22,
  endHour: 8,
};

function defaultChannelPrefs(channel: SunnahNotificationChannel): ChannelPrefs {
  const policy = CHANNEL_POLICIES[channel];
  return {
    enabled: policy.defaultEnabled,
    cadence: policy.supportedCadences[0] ?? "immediate",
  };
}

export function defaultSunnahNotificationPrefs(): SunnahNotificationPrefs {
  const channels = {} as Record<SunnahNotificationChannel, ChannelPrefs>;
  for (const id of SUNNAH_NOTIFICATION_CHANNELS) {
    channels[id] = defaultChannelPrefs(id);
  }
  return {
    version: 1,
    nonEssentialMasterEnabled: false,
    channels,
    quietHours: { ...DEFAULT_QUIET },
    learningReminderHour: 18,
    learningReminderMinute: 0,
    updatedAt: new Date(0).toISOString(),
  };
}

function clampHour(n: unknown, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(23, Math.max(0, Math.trunc(v)));
}

function clampMinute(n: unknown, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(59, Math.max(0, Math.trunc(v)));
}

export function normalizeSunnahNotificationPrefs(
  raw: Partial<SunnahNotificationPrefs> | null | undefined,
): SunnahNotificationPrefs {
  const base = defaultSunnahNotificationPrefs();
  if (!raw || typeof raw !== "object") return base;

  const channels = { ...base.channels };
  for (const id of SUNNAH_NOTIFICATION_CHANNELS) {
    const incoming = raw.channels?.[id];
    const policy = CHANNEL_POLICIES[id];
    const cadence =
      incoming?.cadence && policy.supportedCadences.includes(incoming.cadence)
        ? incoming.cadence
        : policy.supportedCadences[0];
    channels[id] = {
      enabled: Boolean(incoming?.enabled ?? policy.defaultEnabled),
      cadence,
    };
  }

  const qh = raw.quietHours ?? base.quietHours;
  return {
    version: 1,
    nonEssentialMasterEnabled: Boolean(raw.nonEssentialMasterEnabled),
    channels,
    quietHours: {
      enabled: qh.enabled !== false,
      startHour: clampHour(qh.startHour, DEFAULT_QUIET.startHour),
      endHour: clampHour(qh.endHour, DEFAULT_QUIET.endHour),
    },
    learningReminderHour: clampHour(raw.learningReminderHour, 18),
    learningReminderMinute: clampMinute(raw.learningReminderMinute, 0),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}

export function loadSunnahNotificationPrefs(): SunnahNotificationPrefs {
  try {
    const raw = localStorage.getItem(SUNNAH_NOTIF_PREFS_KEY);
    if (!raw) return defaultSunnahNotificationPrefs();
    return normalizeSunnahNotificationPrefs(JSON.parse(raw) as Partial<SunnahNotificationPrefs>);
  } catch {
    return defaultSunnahNotificationPrefs();
  }
}

export function saveSunnahNotificationPrefs(prefs: SunnahNotificationPrefs): void {
  const next = normalizeSunnahNotificationPrefs({
    ...prefs,
    updatedAt: new Date().toISOString(),
  });
  try {
    localStorage.setItem(SUNNAH_NOTIF_PREFS_KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
}

export function updateSunnahChannel(
  channel: SunnahNotificationChannel,
  patch: Partial<ChannelPrefs>,
): SunnahNotificationPrefs {
  const current = loadSunnahNotificationPrefs();
  const policy = CHANNEL_POLICIES[channel];
  const cadence =
    patch.cadence && policy.supportedCadences.includes(patch.cadence)
      ? patch.cadence
      : current.channels[channel].cadence;
  const enabling = patch.enabled === true;
  const next: SunnahNotificationPrefs = {
    ...current,
    nonEssentialMasterEnabled:
      enabling && policy.subjectToNonEssentialCaps
        ? true
        : current.nonEssentialMasterEnabled,
    channels: {
      ...current.channels,
      [channel]: {
        enabled: patch.enabled ?? current.channels[channel].enabled,
        cadence,
      },
    },
  };
  saveSunnahNotificationPrefs(next);
  return loadSunnahNotificationPrefs();
}

export function disableAllNonEssentialChannels(): SunnahNotificationPrefs {
  const current = loadSunnahNotificationPrefs();
  const channels = { ...current.channels };
  for (const id of SUNNAH_NOTIFICATION_CHANNELS) {
    if (CHANNEL_POLICIES[id].subjectToNonEssentialCaps) {
      channels[id] = { ...channels[id], enabled: false };
    }
  }
  saveSunnahNotificationPrefs({
    ...current,
    nonEssentialMasterEnabled: false,
    channels,
  });
  return loadSunnahNotificationPrefs();
}

export function isChannelEffectivelyEnabled(
  prefs: SunnahNotificationPrefs,
  channel: SunnahNotificationChannel,
): boolean {
  const policy = CHANNEL_POLICIES[channel];
  if (!prefs.channels[channel]?.enabled) return false;
  if (policy.subjectToNonEssentialCaps && !prefs.nonEssentialMasterEnabled) return false;
  return true;
}

export function migrateLegacyNotificationConsent(opts?: {
  hadAmbiguousLegacyConsent?: boolean;
}): SunnahNotificationPrefs {
  try {
    if (localStorage.getItem(SUNNAH_NOTIF_MIGRATION_FLAG) === "1") {
      return loadSunnahNotificationPrefs();
    }
  } catch {
    /* ignore */
  }

  const prefs = defaultSunnahNotificationPrefs();
  if (opts?.hadAmbiguousLegacyConsent !== false) {
    prefs.nonEssentialMasterEnabled = false;
    for (const id of SUNNAH_NOTIFICATION_CHANNELS) {
      if (CHANNEL_POLICIES[id].requiresExplicitOptIn) {
        prefs.channels[id] = { ...prefs.channels[id], enabled: false };
      }
    }
  }
  saveSunnahNotificationPrefs(prefs);
  try {
    localStorage.setItem(SUNNAH_NOTIF_MIGRATION_FLAG, "1");
  } catch {
    /* ignore */
  }
  return prefs;
}
