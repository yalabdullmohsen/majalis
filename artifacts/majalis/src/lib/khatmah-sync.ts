/**
 * مزامنة ختمة متعددة الملفات + تقدّم القراءة عبر LS وIndexedDB وواجهة مزامنة اختيارية.
 */
import {
  getKhatmahPlans,
  createKhatmahPlan,
  updateKhatmahPages,
  getBookmarks,
  type KhatmahPlan,
} from "@/lib/quran-personal";
import { loadLastReadDetail, loadPagePosition } from "@/lib/quran-api";

const DB_NAME = "majalis-khatmah-sync";
const DB_VERSION = 1;
const STORE = "bundle";
const ACTIVE_KEY = "mj-khatmah-active-v1";
const META_KEY = "mj-khatmah-meta-v1";
const BUNDLE_KEY = "local-bundle";

export type KhatmahProfileKind = "ramadan" | "study" | "memorization" | "custom";

export type KhatmahProfileMeta = {
  planId: string;
  kind: KhatmahProfileKind;
  color: string;
};

export type ProgressSyncBundle = {
  updatedAt: number;
  activePlanId: string | null;
  plans: KhatmahPlan[];
  profileMeta: KhatmahProfileMeta[];
  lastPage: number | null;
  lastSurah?: number;
  lastAyah?: number;
  bookmarkCount: number;
};

function readMeta(): KhatmahProfileMeta[] {
  try { return JSON.parse(localStorage.getItem(META_KEY) || "[]"); } catch { return []; }
}
function writeMeta(list: KhatmahProfileMeta[]) {
  try { localStorage.setItem(META_KEY, JSON.stringify(list)); } catch { /* quota */ }
}

export function getActiveKhatmahPlanId(): string | null {
  try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
}

export function setActiveKhatmahPlanId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch { /* ignore */ }
}

export function createNamedKhatmah(
  name: string,
  targetDays: number,
  kind: KhatmahProfileKind = "custom",
): KhatmahPlan {
  const plan = createKhatmahPlan(name, targetDays);
  const colors: Record<KhatmahProfileKind, string> = {
    ramadan: "#B08D2E",
    study: "#0E6E52",
    memorization: "#1D6A9A",
    custom: "#9A4A2E",
  };
  writeMeta([{ planId: plan.id, kind, color: colors[kind] }, ...readMeta()]);
  setActiveKhatmahPlanId(plan.id);
  void persistProgressBundle();
  return plan;
}

export function listKhatmahWithMeta(): Array<KhatmahPlan & { meta?: KhatmahProfileMeta }> {
  const meta = readMeta();
  return getKhatmahPlans().map((p) => ({
    ...p,
    meta: meta.find((m) => m.planId === p.id),
  }));
}

export function bumpActiveKhatmahPages(deltaPages: number) {
  const id = getActiveKhatmahPlanId();
  if (!id) return;
  const plan = getKhatmahPlans().find((p) => p.id === id);
  if (!plan) return;
  updateKhatmahPages(id, Math.min(604, plan.totalPagesRead + Math.max(0, deltaPages)));
  void persistProgressBundle();
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function buildProgressBundle(): ProgressSyncBundle {
  const detail = loadLastReadDetail();
  return {
    updatedAt: Date.now(),
    activePlanId: getActiveKhatmahPlanId(),
    plans: getKhatmahPlans(),
    profileMeta: readMeta(),
    lastPage: detail?.page ?? loadPagePosition(),
    lastSurah: detail?.surah,
    lastAyah: detail?.ayah,
    bookmarkCount: getBookmarks().length,
  };
}

export async function persistProgressBundle(): Promise<ProgressSyncBundle> {
  const bundle = buildProgressBundle();
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(bundle, BUNDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
  return bundle;
}

export async function loadProgressBundle(): Promise<ProgressSyncBundle | null> {
  try {
    const db = await openDb();
    const row = await new Promise<ProgressSyncBundle | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(BUNDLE_KEY);
      req.onsuccess = () => resolve((req.result as ProgressSyncBundle | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return row;
  } catch {
    return null;
  }
}

/**
 * مزامنة صامتة عند توفر الشبكة — يحاول `/api/reading-sync` ثم يُبقي النسخة المحلية.
 */
export async function syncProgressAcrossDevices(): Promise<"synced" | "local-only" | "offline"> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  const bundle = await persistProgressBundle();
  try {
    const res = await fetch("/api/reading-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "khatmah-progress", bundle }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "local-only";
    try {
      const remote = await res.json() as { bundle?: ProgressSyncBundle };
      if (remote?.bundle && remote.bundle.updatedAt > bundle.updatedAt) {
        applyRemoteBundle(remote.bundle);
      }
    } catch {
      /* body optional */
    }
    return "synced";
  } catch {
    return "local-only";
  }
}

function applyRemoteBundle(bundle: ProgressSyncBundle) {
  try {
    localStorage.setItem("mj-quran-khatmah-v1", JSON.stringify(bundle.plans ?? []));
    writeMeta(bundle.profileMeta ?? []);
    if (bundle.activePlanId) setActiveKhatmahPlanId(bundle.activePlanId);
  } catch {
    /* ignore */
  }
  void persistProgressBundle();
}

export function ensureDefaultKhatmahProfiles(): void {
  if (getKhatmahPlans().length > 0) return;
  createNamedKhatmah("ختمة رمضان السريعة", 30, "ramadan");
  createNamedKhatmah("دراسة وتدبّر", 120, "study");
  createNamedKhatmah("مراجعة الحفظ", 90, "memorization");
}
