/**
 * Adaptive auto-scroll paced to reading velocity (IndexedDB + pace tracker).
 */

import { scrollActiveAyahIntoView } from "@/lib/quran-audio-resume";
import { loadRecitationPaceStats } from "@/lib/recitation-pace-tracker";
import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";

export type ReadingVelocityProfile = {
  msPerAyah: number;
  msPerPage: number;
  wordsPerMinute: number;
  acceleration: number;
  updatedAt: string;
};

export type AutoScrollPrefs = {
  enabled: boolean;
  followAudio: boolean;
  overrideMsPerAyah: number | null;
};

export type AutoScrollCommand = {
  ayah?: number;
  behavior: ScrollBehavior;
  delayMs: number;
};

const LS_KEY = "majalis-auto-scroll-pace-v1";
const IDB_KEY = "auto-scroll-pace-v1";

const DEFAULT_PROFILE: ReadingVelocityProfile = {
  msPerAyah: 4_500,
  msPerPage: 45_000,
  wordsPerMinute: 120,
  acceleration: 1,
  updatedAt: new Date(0).toISOString(),
};

export function loadAutoScrollPrefs(): AutoScrollPrefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { enabled: true, followAudio: true, overrideMsPerAyah: null };
    return { enabled: true, followAudio: true, overrideMsPerAyah: null, ...(JSON.parse(raw) as Partial<AutoScrollPrefs>) };
  } catch {
    return { enabled: true, followAudio: true, overrideMsPerAyah: null };
  }
}

export function saveAutoScrollPrefs(prefs: AutoScrollPrefs): AutoScrollPrefs {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_KEY, { prefs, profile: loadReadingVelocityProfile() }).catch(() => undefined);
  return prefs;
}

export function computeReadingVelocityProfile(wpm?: number): ReadingVelocityProfile {
  const pace = loadRecitationPaceStats();
  let stored: ReadingVelocityProfile | null = null;
  try {
    const raw = localStorage.getItem(`${LS_KEY}:profile`);
    stored = raw ? (JSON.parse(raw) as ReadingVelocityProfile) : null;
  } catch {
    stored = null;
  }
  const msPerAyah = pace.avgAyahMs > 0 ? pace.avgAyahMs : stored?.msPerAyah || DEFAULT_PROFILE.msPerAyah;
  const msPerPage = pace.avgPageMs > 0 ? pace.avgPageMs : stored?.msPerPage || DEFAULT_PROFILE.msPerPage;
  const wordsPerMinute = wpm ?? stored?.wordsPerMinute ?? DEFAULT_PROFILE.wordsPerMinute;
  const acceleration = Math.max(0.5, Math.min(2, DEFAULT_PROFILE.msPerAyah / Math.max(1_500, msPerAyah)));
  return {
    msPerAyah: Math.round(msPerAyah),
    msPerPage: Math.round(msPerPage),
    wordsPerMinute: Math.round(wordsPerMinute),
    acceleration: Math.round(acceleration * 100) / 100,
    updatedAt: new Date().toISOString(),
  };
}

export function loadReadingVelocityProfile(): ReadingVelocityProfile {
  try {
    const raw = localStorage.getItem(`${LS_KEY}:profile`);
    if (raw) return JSON.parse(raw) as ReadingVelocityProfile;
  } catch {
    /* ignore */
  }
  return computeReadingVelocityProfile();
}

export function saveReadingVelocityProfile(profile: ReadingVelocityProfile): ReadingVelocityProfile {
  try {
    localStorage.setItem(`${LS_KEY}:profile`, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_KEY, { prefs: loadAutoScrollPrefs(), profile }).catch(() => undefined);
  return profile;
}

export function recordVerseDwell(durationMs: number, wordCount = 12): ReadingVelocityProfile {
  const prev = loadReadingVelocityProfile();
  const dwell = Math.max(800, Math.min(60_000, durationMs));
  const msPerAyah = Math.round(prev.msPerAyah * 0.7 + dwell * 0.3);
  const instantWpm = wordCount / (dwell / 60_000);
  const wordsPerMinute = Math.round(prev.wordsPerMinute * 0.7 + instantWpm * 0.3);
  return saveReadingVelocityProfile({
    ...computeReadingVelocityProfile(wordsPerMinute),
    msPerAyah,
    wordsPerMinute,
    acceleration: Math.max(0.5, Math.min(2, DEFAULT_PROFILE.msPerAyah / msPerAyah)),
    updatedAt: new Date().toISOString(),
  });
}

export async function hydrateAutoScrollFromIdb(): Promise<void> {
  try {
    const row = await idbGetValue<{ prefs: AutoScrollPrefs; profile: ReadingVelocityProfile }>(
      OFFLINE_STORES.meta,
      IDB_KEY,
    );
    if (row?.prefs) saveAutoScrollPrefs(row.prefs);
    if (row?.profile) saveReadingVelocityProfile(row.profile);
  } catch {
    /* ignore */
  }
}

export function planAutoScroll(opts: {
  ayah: number;
  syncWithAudio?: boolean;
  prefs?: AutoScrollPrefs;
  profile?: ReadingVelocityProfile;
}): AutoScrollCommand | null {
  const prefs = opts.prefs ?? loadAutoScrollPrefs();
  if (!prefs.enabled) return null;
  if (opts.syncWithAudio && !prefs.followAudio) return null;
  const profile = opts.profile ?? loadReadingVelocityProfile();
  const baseMs = prefs.overrideMsPerAyah ?? profile.msPerAyah;
  const delayMs = opts.syncWithAudio
    ? Math.round(Math.min(400, baseMs * 0.05) / profile.acceleration)
    : Math.round(Math.min(2_000, baseMs * 0.12) / profile.acceleration);
  return {
    ayah: opts.ayah,
    behavior: profile.acceleration >= 1.4 ? "auto" : "smooth",
    delayMs: Math.max(0, delayMs),
  };
}

export function executeAutoScroll(
  command: AutoScrollCommand,
  container?: HTMLElement | null,
): boolean {
  if (command.ayah == null) return false;
  return scrollActiveAyahIntoView(command.ayah, { container, behavior: command.behavior });
}

export function scheduleAutoScroll(ayah: number, syncWithAudio = false, container?: HTMLElement | null): () => void {
  const cmd = planAutoScroll({ ayah, syncWithAudio });
  if (!cmd) return () => undefined;
  const t = setTimeout(() => executeAutoScroll(cmd, container), cmd.delayMs);
  return () => clearTimeout(t);
}
