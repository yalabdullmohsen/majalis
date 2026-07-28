/**
 * Local Data Backup & Peer Migration Utility.
 * Packages IndexedDB/LS state (bookmarks, flashcards, streaks, Khatmah…)
 * into a compressed JSON blob with optional passphrase encryption.
 */

import { idbGetAll, idbPut, OFFLINE_STORES, type OfflineStoreName } from "@/lib/offline-db";
import { exportKnowledgeVaultJson, importKnowledgeVaultJson } from "@/lib/personal-knowledge-vault";
import { getUserStreak } from "@/lib/user-streak";
import { getDailyWirdState } from "@/lib/quran-api";
import {
  getBookmarks,
  getAllNotes,
  getHifzProgress,
  getDailyReading,
  getStreak,
} from "@/lib/quran-personal";

export const BACKUP_SCHEMA_VERSION = 1;
export const BACKUP_MAGIC = "majalis-backup-v1" as const;

export type MajalisBackupPayload = {
  magic: typeof BACKUP_MAGIC;
  schemaVersion: number;
  exportedAt: string;
  app: "majalis";
  sections: {
    vaultJson?: string;
    userStreak?: unknown;
    quranStreak?: unknown;
    wird?: unknown;
    bookmarks?: unknown;
    notes?: unknown;
    hifz?: unknown;
    dailyReading?: unknown;
    flashcardReviewsLs?: unknown;
    builtFlashcards?: unknown;
    mistakes?: unknown;
    learningTracks?: unknown;
    typedBookmarks?: unknown;
    readingAnalytics?: unknown;
    knowledgeVaultBody?: unknown;
    knowledgeVaultIndex?: unknown;
    offlineStores?: Partial<
      Record<OfflineStoreName, Array<{ key: string; value: unknown; revision?: string }>>
    >;
  };
};

export type BackupEnvelope = {
  magic: typeof BACKUP_MAGIC;
  schemaVersion: number;
  exportedAt: string;
  encrypted: boolean;
  data: string;
  salt?: string;
  iv?: string;
};

function b64Encode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64Decode(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function compressBytes(input: Uint8Array): Promise<Uint8Array> {
  try {
    if (typeof CompressionStream !== "undefined") {
      const cs = new CompressionStream("gzip");
      const stream = new Blob([input as BlobPart]).stream().pipeThrough(cs);
      const ab = await new Response(stream).arrayBuffer();
      return new Uint8Array(ab);
    }
  } catch {
    /* fall through */
  }
  return input;
}

async function decompressBytes(input: Uint8Array): Promise<Uint8Array> {
  try {
    if (typeof DecompressionStream !== "undefined") {
      const ds = new DecompressionStream("gzip");
      const stream = new Blob([input as BlobPart]).stream().pipeThrough(ds);
      const ab = await new Response(stream).arrayBuffer();
      return new Uint8Array(ab);
    }
  } catch {
    /* maybe uncompressed */
  }
  return input;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 100_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function readLs(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLs(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

/** Collect full local application state (best-effort). */
export async function collectBackupPayload(): Promise<MajalisBackupPayload> {
  const sections: MajalisBackupPayload["sections"] = {};

  try {
    sections.vaultJson = await exportKnowledgeVaultJson();
  } catch {
    /* ignore */
  }
  try {
    sections.userStreak = getUserStreak();
  } catch {
    /* ignore */
  }
  try {
    sections.quranStreak = getStreak();
  } catch {
    /* ignore */
  }
  try {
    sections.wird = getDailyWirdState();
  } catch {
    /* ignore */
  }
  try {
    sections.bookmarks = getBookmarks();
  } catch {
    /* ignore */
  }
  try {
    sections.notes = getAllNotes();
  } catch {
    /* ignore */
  }
  try {
    sections.hifz = getHifzProgress();
  } catch {
    /* ignore */
  }
  try {
    sections.dailyReading = getDailyReading();
  } catch {
    /* ignore */
  }

  sections.flashcardReviewsLs = readLs("majalis-flashcard-reviews-v1");
  sections.builtFlashcards = readLs("majalis-built-flashcards-v1");
  sections.mistakes = readLs("majalis-mistake-log-v1");
  sections.learningTracks = readLs("majalis-learning-track-progress-v1");
  sections.typedBookmarks = readLs("majalis-typed-bookmarks-v1");
  sections.readingAnalytics = readLs("majalis-reading-analytics-v1");
  sections.knowledgeVaultBody = readLs("majalis-knowledge-vault-body-v1");
  sections.knowledgeVaultIndex = readLs("majalis-knowledge-vault-index-v1");

  const offlineStores: NonNullable<MajalisBackupPayload["sections"]["offlineStores"]> = {};
  for (const store of Object.values(OFFLINE_STORES)) {
    try {
      const rows = await idbGetAll(store);
      offlineStores[store] = rows.map((r) => ({
        key: r.key,
        value: r.value,
        revision: r.revision,
      }));
    } catch {
      /* ignore store */
    }
  }
  sections.offlineStores = offlineStores;

  return {
    magic: BACKUP_MAGIC,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    app: "majalis",
    sections,
  };
}

export async function createLocalBackup(opts?: { passphrase?: string }): Promise<BackupEnvelope> {
  const payload = await collectBackupPayload();
  const json = new TextEncoder().encode(JSON.stringify(payload));
  let bytes = await compressBytes(json);
  let encrypted = false;
  let salt: string | undefined;
  let iv: string | undefined;

  if (opts?.passphrase && typeof crypto !== "undefined" && crypto.subtle) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const ivBytes = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(opts.passphrase, saltBytes);
    const cipher = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: ivBytes },
      key,
      bytes as BufferSource,
    );
    bytes = new Uint8Array(cipher);
    encrypted = true;
    salt = b64Encode(saltBytes);
    iv = b64Encode(ivBytes);
  }

  return {
    magic: BACKUP_MAGIC,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: payload.exportedAt,
    encrypted,
    data: b64Encode(bytes),
    salt,
    iv,
  };
}

export function serializeBackupEnvelope(env: BackupEnvelope): string {
  return JSON.stringify(env, null, 2);
}

export function parseBackupEnvelope(raw: string): BackupEnvelope | null {
  try {
    const parsed = JSON.parse(raw) as BackupEnvelope;
    if (parsed.magic !== BACKUP_MAGIC) return null;
    if (!parsed.data || typeof parsed.data !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export type BackupValidationResult = {
  ok: boolean;
  errors: string[];
  payload?: MajalisBackupPayload;
};

export async function validateAndDecodeBackup(
  envelopeOrJson: string | BackupEnvelope,
  passphrase?: string,
): Promise<BackupValidationResult> {
  const errors: string[] = [];
  const env =
    typeof envelopeOrJson === "string" ? parseBackupEnvelope(envelopeOrJson) : envelopeOrJson;
  if (!env) return { ok: false, errors: ["ملف النسخة الاحتياطية غير صالح"] };

  try {
    let bytes = b64Decode(env.data);
    if (env.encrypted) {
      if (!passphrase) return { ok: false, errors: ["هذه النسخة مشفّرة — يلزم كلمة المرور"] };
      if (!env.salt || !env.iv) return { ok: false, errors: ["بيانات التشفير ناقصة"] };
      const key = await deriveKey(passphrase, b64Decode(env.salt));
      const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: b64Decode(env.iv) as BufferSource },
        key,
        bytes as BufferSource,
      );
      bytes = new Uint8Array(plain);
    }
    bytes = await decompressBytes(bytes);
    const text = new TextDecoder().decode(bytes);
    const payload = JSON.parse(text) as MajalisBackupPayload;
    if (payload.magic !== BACKUP_MAGIC) errors.push("تعارض معرّف النسخة");
    if (!payload.sections || typeof payload.sections !== "object") {
      errors.push("قسم البيانات مفقود");
    }
    return { ok: errors.length === 0, errors, payload };
  } catch (e) {
    return {
      ok: false,
      errors: [e instanceof Error ? e.message : "تعذّر فك النسخة الاحتياطية"],
    };
  }
}

export async function importBackupPayload(
  payload: MajalisBackupPayload,
): Promise<{ restored: string[] }> {
  const restored: string[] = [];

  if (payload.sections.vaultJson) {
    try {
      await importKnowledgeVaultJson(payload.sections.vaultJson);
      restored.push("vault");
    } catch {
      /* ignore */
    }
  }
  if (payload.sections.knowledgeVaultBody != null) {
    writeLs("majalis-knowledge-vault-body-v1", payload.sections.knowledgeVaultBody);
    restored.push("vaultBody");
  }
  if (payload.sections.knowledgeVaultIndex != null) {
    writeLs("majalis-knowledge-vault-index-v1", payload.sections.knowledgeVaultIndex);
    restored.push("vaultIndex");
  }
  if (payload.sections.userStreak) {
    writeLs("majalis-user-streak-v1", payload.sections.userStreak);
    restored.push("userStreak");
  }
  if (payload.sections.quranStreak) {
    writeLs("mj-quran-streak-v1", payload.sections.quranStreak);
    restored.push("quranStreak");
  }
  if (payload.sections.wird) {
    writeLs("mj-quran-wird-v3", payload.sections.wird);
    restored.push("wird");
  }
  if (payload.sections.bookmarks) {
    writeLs("mj-quran-bookmarks-v1", payload.sections.bookmarks);
    restored.push("bookmarks");
  }
  if (payload.sections.notes) {
    writeLs("mj-quran-notes-v1", payload.sections.notes);
    restored.push("notes");
  }
  if (payload.sections.hifz) {
    writeLs("mj-quran-hifz-v1", payload.sections.hifz);
    restored.push("hifz");
  }
  if (payload.sections.dailyReading) {
    writeLs("mj-quran-reading-v1", payload.sections.dailyReading);
    restored.push("dailyReading");
  }
  if (payload.sections.flashcardReviewsLs) {
    writeLs("majalis-flashcard-reviews-v1", payload.sections.flashcardReviewsLs);
    restored.push("flashcards");
  }
  if (payload.sections.builtFlashcards) {
    writeLs("majalis-built-flashcards-v1", payload.sections.builtFlashcards);
    restored.push("builtFlashcards");
  }
  if (payload.sections.mistakes) {
    writeLs("majalis-mistake-log-v1", payload.sections.mistakes);
    restored.push("mistakes");
  }
  if (payload.sections.learningTracks) {
    writeLs("majalis-learning-track-progress-v1", payload.sections.learningTracks);
    restored.push("learningTracks");
  }
  if (payload.sections.typedBookmarks) {
    writeLs("majalis-typed-bookmarks-v1", payload.sections.typedBookmarks);
    restored.push("typedBookmarks");
  }
  if (payload.sections.readingAnalytics) {
    writeLs("majalis-reading-analytics-v1", payload.sections.readingAnalytics);
    restored.push("readingAnalytics");
  }

  if (payload.sections.offlineStores) {
    try {
      for (const [store, rows] of Object.entries(payload.sections.offlineStores)) {
        for (const row of rows || []) {
          await idbPut(store as OfflineStoreName, row.key, row.value, row.revision);
        }
      }
      restored.push("offlineStores");
    } catch {
      /* ignore */
    }
  }

  return { restored };
}

export async function restoreFromBackupFile(
  raw: string,
  passphrase?: string,
): Promise<{ ok: boolean; restored: string[]; errors: string[] }> {
  const validated = await validateAndDecodeBackup(raw, passphrase);
  if (!validated.ok || !validated.payload) {
    return { ok: false, restored: [], errors: validated.errors };
  }
  const { restored } = await importBackupPayload(validated.payload);
  return { ok: true, restored, errors: [] };
}
