/**
 * Adaptive Auto-Scroll & Reading Pace Engine.
 * Calculates individual reading speed per verse/page and adjusts scroll
 * acceleration smoothly with active recitation or stored velocity (IndexedDB).
 */

import { scrollActiveAyahIntoView } from "@/lib/quran-audio-resume";
import { loadRecitationPaceStats } from "@/lib/recitation-pace-tracker";
import { idbGetValue, idbPut, OFFLINE_STORES } from "@/lib/offline-db";

export type ReadingVelocityProfile = {
  /** Preferred ms to dwell per ayah before advancing scroll */
  msPerAyah: number;
  /** Preferred ms per mushaf page */
  msPerPage: number;
  /** Derived words-per-minute estimate */
  wordsPerMinute: number;
  /** Smooth scroll acceleration factor 0.5–2 */
  acceleration: number;
  updatedAt: string;
};

export type AutoScrollCommand = {
  ayah?: number;
  page?: number;
  behavior: ScrollBehavior;
  /** Delay before scroll (ms) — pace sync */
  delayMs: number;
};

export type AutoScrollPrefs = {
  enabled: boolean;
  /** Follow audio ayah changes automatically */
  followAudio: boolean;
  /** Manual velocity override (ms/ayah); null = adaptive */
  overrideMsPerAyah: number | null;
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

const DEFAULT_PREFS: AutoScrollPrefs = {
  enabled: true,
  followAudio: true,
  overrideMsPerAyah: null,
};

function readPrefs(): AutoScrollPrefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<AutoScrollPrefs> & { profile?: ReadingVelocityProfile };
    return {
      enabled: parsed.enabled ?? DEFAULT_PREFS.enabled,
      followAudio: parsed.followAudio ?? DEFAULT_PREFS.followAudio,
      overrideMsPerAyah: parsed.overrideMsPerAyah ?? null,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function readStoredProfile(): ReadingVelocityProfile | null {
  try {
    const raw = localStorage.getItem(`${LS_KEY}:profile`);
    return raw ? (JSON.parse(raw) as ReadingVelocityProfile) : null;
  } catch {
    return null;
  }
}

function writeAll(prefs: AutoScrollPrefs, profile: ReadingVelocityProfile): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
    localStorage.setItem(`${LS_KEY}:profile`, JSON.stringify(profile));
  } catch {
    /* quota */
  }
  void idbPut(OFFLINE_STORES.meta, IDB_KEY, { prefs, profile }).catch(() => undefined);
}

/**
 * Derive velocity from recitation-pace samples + optional WPM from chunking.
 */
export function computeReadingVelocityProfile(
  opts?: { wordsPerMinute?: number },
): ReadingVelocityProfile {
  const pace = loadRecitationPaceStats();
  const stored = readStoredProfile();
  const msPerAyah =
    pace.avgAyahMs > 0
      ? pace.avgAyahMs
      : stored?.msPerAyah || DEFAULT_PROFILE.msPerAyah;
  const msPerPage =
    pace.avgPageMs > 0
      ? pace.avgPageMs
      : stored?.msPerPage || DEFAULT_PROFILE.msPerPage;
  const wpm = opts?.wordsPerMinute ?? stored?.wordsPerMinute ?? DEFAULT_PROFILE.wordsPerMinute;

  // Acceleration: faster readers get slightly snappier scroll (capped)
  const baseline = DEFAULT_PROFILE.msPerAyah;
  const acceleration = Math.max(0.5, Math.min(2, baseline / Math.max(1_500, msPerAyah)));

  return {
    msPerAyah: Math.round(msPerAyah),
    msPerPage: Math.round(msPerPage),
    wordsPerMinute: Math.round(wpm),
    acceleration: Math.round(acceleration * 100) / 100,
    updatedAt: new Date().toISOString(),
  };
}

export function loadAutoScrollPrefs(): AutoScrollPrefs {
  return readPrefs();
}

export function loadReadingVelocityProfile(): ReadingVelocityProfile {
  return readStoredProfile() || computeReadingVelocityProfile();
}

export function saveReadingVelocityProfile(profile: ReadingVelocityProfile): ReadingVelocityProfile {
  writeAll(readPrefs(), profile);
  return profile;
}

export function saveAutoScrollPrefs(prefs: AutoScrollPrefs): AutoScrollPrefs {
  writeAll(prefs, loadReadingVelocityProfile());
  return prefs;
}

export async function hydrateAutoScrollFromIdb(): Promise<{
  prefs: AutoScrollPrefs;
  profile: ReadingVelocityProfile;
}> {
  try {
    const row = await idbGetValue<{ prefs: AutoScrollPrefs; profile: ReadingVelocityProfile }>(
      OFFLINE_STORES.meta,
      IDB_KEY,
    );
    if (row?.prefs && row?.profile) {
      writeAll(row.prefs, row.profile);
      return row;
    }
  } catch {
    /* fall through */
  }
  const profile = computeReadingVelocityProfile();
  const prefs = readPrefs();
  writeAll(prefs, profile);
  return { prefs, profile };
}

/** Record a verse dwell sample into the adaptive profile (EMA). */
export function recordVerseDwell(durationMs: number, wordCount = 12): ReadingVelocityProfile {
  const prev = loadReadingVelocityProfile();
  const dwell = Math.max(800, Math.min(60_000, durationMs));
  const msPerAyah = Math.round(prev.msPerAyah * 0.7 + dwell * 0.3);
  const instantWpm = wordCount / (dwell / 60_000);
  const wordsPerMinute = Math.round(prev.wordsPerMinute * 0.7 + instantWpm * 0.3);
  const next = computeReadingVelocityProfile({ wordsPerMinute });
  const merged: ReadingVelocityProfile = {
    ...next,
    msPerAyah,
    wordsPerMinute,
    acceleration: Math.max(0.5, Math.min(2, DEFAULT_PROFILE.msPerAyah / msPerAyah)),
    updatedAt: new Date().toISOString(),
  };
  return saveReadingVelocityProfile(merged);
}

/**
 * Build a scroll command paced to the reader's velocity.
 * `syncWithAudio` shortens delay so scroll stays near the recited ayah.
 */
export function planAutoScroll(opts: {
  ayah?: number;
  page?: number;
  syncWithAudio?: boolean;
  profile?: ReadingVelocityProfile;
  prefs?: AutoScrollPrefs;
}): AutoScrollCommand | null {
  const prefs = opts.prefs ?? readPrefs();
  if (!prefs.enabled) return null;
  if (opts.syncWithAudio && !prefs.followAudio) return null;

  const profile = opts.profile ?? loadReadingVelocityProfile();
  const baseMs = prefs.overrideMsPerAyah ?? profile.msPerAyah;
  const delayMs = opts.syncWithAudio
    ? Math.round(Math.min(400, baseMs * 0.05) / profile.acceleration)
    : Math.round(Math.min(2_000, baseMs * 0.12) / profile.acceleration);

  return {
    ayah: opts.ayah,
    page: opts.page,
    behavior: profile.acceleration >= 1.4 ? "auto" : "smooth",
    delayMs: Math.max(0, delayMs),
  };
}

/**
 * Execute a planned scroll (ayah preferred). Returns whether scroll ran.
 */
export function executeAutoScroll(
  command: AutoScrollCommand,
  opts?: { container?: HTMLElement | null },
): boolean {
  try {
    if (command.ayah != null) {
      return scrollActiveAyahIntoView(command.ayah, {
        container: opts?.container,
        behavior: command.behavior,
      });
    }
    if (command.page != null && typeof document !== "undefined") {
      const el =
        document.querySelector(`[data-page="${command.page}"]`) ||
        document.getElementById(`page-${command.page}`);
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ block: "start", behavior: command.behavior });
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/** Smooth helper: plan + delayed execute. Returns cancel fn. */
export function scheduleAutoScroll(
  opts: {
    ayah?: number;
    page?: number;
    syncWithAudio?: boolean;
    container?: HTMLElement | null;
  },
): () => void {
  const command = planAutoScroll(opts);
  if (!command) return () => undefined;
  const timer = setTimeout(() => {
    executeAutoScroll(command, { container: opts.container });
  }, command.delayMs);
  return () => clearTimeout(timer);
}
