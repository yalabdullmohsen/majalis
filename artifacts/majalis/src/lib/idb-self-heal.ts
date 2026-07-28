/**
 * Self-healing IndexedDB layer — quota / corruption recovery.
 * Backs up bookmarks + khatmah to volatile memory, purges, reindexes, restores.
 * Logic-only — no UI.
 */

export type CriticalUserBackup = {
  bookmarksJson: string | null;
  khatmahJson: string | null;
  quranPersonalJson: string | null;
  capturedAt: number;
};

let volatileBackup: CriticalUserBackup | null = null;
let healing = false;
let healCount = 0;

const BOOKMARK_KEYS = ["majalis-local-bookmarks-v1", "mj-quran-bookmarks-v1"];
const KHATMAH_KEYS = ["mj-quran-khatmah-v1", "majalis-quran-khatmah-v1"];
const PERSONAL_KEYS = ["mj-quran-personal-v1"];

function readLs(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLs(key: string, value: string | null): void {
  if (value == null) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota on LS too */
  }
}

/** Snapshot critical user records into volatile memory (and LS mirrors if possible). */
export function backupCriticalUserState(): CriticalUserBackup {
  let bookmarksJson: string | null = null;
  for (const k of BOOKMARK_KEYS) {
    const v = readLs(k);
    if (v) {
      bookmarksJson = v;
      break;
    }
  }
  let khatmahJson: string | null = null;
  for (const k of KHATMAH_KEYS) {
    const v = readLs(k);
    if (v) {
      khatmahJson = v;
      break;
    }
  }
  let quranPersonalJson: string | null = null;
  for (const k of PERSONAL_KEYS) {
    const v = readLs(k);
    if (v) {
      quranPersonalJson = v;
      break;
    }
  }
  volatileBackup = {
    bookmarksJson,
    khatmahJson,
    quranPersonalJson,
    capturedAt: Date.now(),
  };
  return volatileBackup;
}

export function restoreCriticalUserState(backup = volatileBackup): void {
  if (!backup) return;
  if (backup.bookmarksJson) {
    for (const k of BOOKMARK_KEYS) writeLs(k, backup.bookmarksJson);
  }
  if (backup.khatmahJson) {
    for (const k of KHATMAH_KEYS) writeLs(k, backup.khatmahJson);
  }
  if (backup.quranPersonalJson) {
    for (const k of PERSONAL_KEYS) writeLs(k, backup.quranPersonalJson);
  }
}

export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;
  const e = err as { name?: string; message?: string; code?: number };
  if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") return true;
  if (e.code === 22 || e.code === 1014) return true;
  const msg = String(e.message || err);
  return /quota/i.test(msg);
}

export function isIdbCorruptionError(err: unknown): boolean {
  if (!err) return false;
  const e = err as { name?: string; message?: string };
  const name = e.name || "";
  if (
    name === "InvalidStateError" ||
    name === "UnknownError" ||
    name === "VersionError" ||
    name === "AbortError"
  ) {
    const msg = String(e.message || "");
    if (/corrupt|malformed|internal error|database/i.test(msg) || name === "UnknownError") {
      return true;
    }
  }
  return /corrupt|IndexedDB.*fail|database that does not exist/i.test(String(e.message || err));
}

async function deleteDatabase(name: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });
}

const KNOWN_DBS = [
  "majalis-offline-engine-v2",
  "majalis-quran-audio",
  "majalis-quran-audio-resume",
  "majalis-lifecycle-v1",
];

/**
 * Full heal protocol: backup → purge known DBs → restore LS critical state.
 * Idempotent; concurrent calls coalesce.
 */
export async function healIndexedDb(reason = "unknown"): Promise<{ healed: boolean; reason: string }> {
  if (healing) return { healed: false, reason: "in-progress" };
  healing = true;
  try {
    backupCriticalUserState();
    for (const name of KNOWN_DBS) {
      await deleteDatabase(name);
    }
    // Soft-evict large LS caches (not user bookmarks)
    try {
      const drop: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith("mj-quran-v3-") || k.startsWith("hadith_cdn_")) drop.push(k);
      }
      for (const k of drop) localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
    restoreCriticalUserState();
    healCount += 1;
    return { healed: true, reason };
  } finally {
    healing = false;
  }
}

/**
 * Wrap an IDB/Dexie write — on quota/corruption, heal once and retry once.
 */
export async function withIdbRecovery<T>(
  fn: () => Promise<T>,
  opts?: { onHeal?: (reason: string) => void },
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (err) {
    if (isQuotaExceededError(err) || isIdbCorruptionError(err)) {
      const reason = isQuotaExceededError(err) ? "quota" : "corruption";
      opts?.onHeal?.(reason);
      await healIndexedDb(reason);
      try {
        // Dynamic import keeps this module free of React / UI coupling
        void import("./diagnostics").then(({ logDiagnostic }) => {
          logDiagnostic("idb-retry", reason);
        });
        return await fn();
      } catch {
        return undefined;
      }
    }
    throw err;
  }
}

export function getIdbHealCount(): number {
  return healCount;
}

export function getVolatileBackup(): CriticalUserBackup | null {
  return volatileBackup;
}

export function resetIdbHealForTests(): void {
  volatileBackup = null;
  healing = false;
  healCount = 0;
}
