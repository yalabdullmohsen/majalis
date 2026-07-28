/**
 * تصدير/استيراد مشفّر لبيانات المستخدم القرآنية (إشارات، تدبّر، ختمة، ورد، تفضيلات).
 * AES-GCM + PBKDF2 — يعمل خارج الخيط الرئيسي قدر الإمكان عبر yieldToMain.
 */
import { yieldToMain } from "@/lib/yield-to-main";
import {
  getBookmarks,
  getAllNotes,
  getHifzProgress,
  getKhatmahPlans,
  getDailyReading,
  getStreak,
  type QuranBookmark,
  type QuranNote,
  type HifzSurahProgress,
  type KhatmahPlan,
  type DailyReadingEntry,
} from "@/lib/quran-personal";
import { getDailyWirdState, type DailyWirdState } from "@/lib/quran-api";
import { getWirdGoal, type WirdGoalConfig } from "@/lib/wird-engine";
import { listTadabburEntries, type TadabburEntry } from "@/lib/quran-tadabbur";
import {
  getActiveKhatmahPlanId,
  listKhatmahWithMeta,
  type KhatmahProfileMeta,
} from "@/lib/khatmah-sync";

export const BACKUP_FORMAT = "majalis-quran-backup-v1";

export type QuranBackupPayload = {
  format: typeof BACKUP_FORMAT;
  exportedAt: number;
  bookmarks: QuranBookmark[];
  notes: QuranNote[];
  tadabbur: TadabburEntry[];
  khatmah: KhatmahPlan[];
  khatmahMeta: KhatmahProfileMeta[];
  activeKhatmahId: string | null;
  hifz: HifzSurahProgress[];
  dailyReading: DailyReadingEntry[];
  streak: { current: number; longest: number; lastDate: string };
  wird: DailyWirdState;
  wirdGoal: WirdGoalConfig;
  prefsRaw: string | null;
};

type EncryptedFile = {
  v: 1;
  format: typeof BACKUP_FORMAT;
  salt: string;
  iv: string;
  ciphertext: string;
};

function b64encode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 120_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function collectQuranBackupPayload(): Promise<QuranBackupPayload> {
  await yieldToMain();
  const tadabbur = await listTadabburEntries();
  await yieldToMain();
  const meta = listKhatmahWithMeta().map((p) => p.meta).filter(Boolean) as KhatmahProfileMeta[];
  let prefsRaw: string | null = null;
  try {
    prefsRaw = localStorage.getItem("mj-quran-prefs-v4") ?? localStorage.getItem("mj-quran-prefs-v3");
  } catch { /* ignore */ }

  return {
    format: BACKUP_FORMAT,
    exportedAt: Date.now(),
    bookmarks: getBookmarks(),
    notes: getAllNotes(),
    tadabbur,
    khatmah: getKhatmahPlans(),
    khatmahMeta: meta,
    activeKhatmahId: getActiveKhatmahPlanId(),
    hifz: getHifzProgress(),
    dailyReading: getDailyReading(),
    streak: getStreak(),
    wird: getDailyWirdState(),
    wirdGoal: getWirdGoal(),
    prefsRaw,
  };
}

export async function encryptBackup(payload: QuranBackupPayload, passphrase: string): Promise<string> {
  await yieldToMain();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const plain = new TextEncoder().encode(JSON.stringify(payload));
  await yieldToMain();
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  const file: EncryptedFile = {
    v: 1,
    format: BACKUP_FORMAT,
    salt: b64encode(salt),
    iv: b64encode(iv),
    ciphertext: b64encode(cipher),
  };
  return JSON.stringify(file);
}

export async function decryptBackup(raw: string, passphrase: string): Promise<QuranBackupPayload> {
  await yieldToMain();
  const file = JSON.parse(raw) as EncryptedFile;
  if (file.v !== 1 || file.format !== BACKUP_FORMAT) {
    throw new Error("صيغة النسخة الاحتياطية غير مدعومة");
  }
  const salt = b64decode(file.salt);
  const iv = b64decode(file.iv);
  const key = await deriveKey(passphrase, salt);
  await yieldToMain();
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    b64decode(file.ciphertext),
  );
  const payload = JSON.parse(new TextDecoder().decode(plainBuf)) as QuranBackupPayload;
  if (payload.format !== BACKUP_FORMAT) throw new Error("محتوى النسخة غير صالح");
  return payload;
}

/** استعادة كاملة — تكتب إلى localStorage / مخازن معروفة دون مسح غير المقصود إن فشل جزء. */
export async function restoreQuranBackup(payload: QuranBackupPayload): Promise<void> {
  await yieldToMain();
  const set = (k: string, v: unknown) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ }
  };

  set("mj-quran-bookmarks-v1", payload.bookmarks ?? []);
  set("mj-quran-notes-v1", payload.notes ?? []);
  set("mj-quran-hifz-v1", payload.hifz ?? []);
  set("mj-quran-khatmah-v1", payload.khatmah ?? []);
  set("mj-quran-reading-v1", payload.dailyReading ?? []);
  set("mj-quran-streak-v1", payload.streak ?? { current: 0, longest: 0, lastDate: "" });
  set("mj-quran-wird-v3", payload.wird);
  set("mj-wird-goal-v1", payload.wirdGoal);
  set("mj-khatmah-meta-v1", payload.khatmahMeta ?? []);
  try {
    if (payload.activeKhatmahId) localStorage.setItem("mj-khatmah-active-v1", payload.activeKhatmahId);
  } catch { /* ignore */ }
  if (payload.prefsRaw) {
    try { localStorage.setItem("mj-quran-prefs-v4", payload.prefsRaw); } catch { /* ignore */ }
  }

  // تدبّر → IndexedDB
  if (payload.tadabbur?.length) {
    const { upsertTadabbur } = await import("@/lib/quran-tadabbur");
    for (let i = 0; i < payload.tadabbur.length; i++) {
      if (i % 8 === 0) await yieldToMain();
      const e = payload.tadabbur[i]!;
      await upsertTadabbur({
        surahNum: e.surahNum,
        ayahNum: e.ayahNum,
        text: e.text,
        tafsirClip: e.tafsirClip,
        tafsirEdition: e.tafsirEdition,
      });
    }
  }
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
