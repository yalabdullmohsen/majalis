/**
 * جرد دون اتصال — قراءة حالة المخازن دون تنزيل تلقائي.
 */

import { OFFLINE_STORES, engineKeys, type OfflineStoreName } from "@/lib/offline-engine";

export type OfflinePackStatus = {
  store: OfflineStoreName;
  label: string;
  recordCount: number;
  available: boolean;
};

const STORE_LABELS: Record<OfflineStoreName, string> = {
  meta: "بيانات تعريفية",
  quran: "حزم قرآن (بيانات محلية)",
  adhkar: "أذكار",
  articles: "مقالات/بيانات",
  flashcards: "بطاقات مراجعة",
  bookmarks: "محفوظات محلية",
};

export async function listOfflinePackStatus(): Promise<{
  online: boolean;
  packs: OfflinePackStatus[];
  engineAvailable: boolean;
}> {
  const online = typeof navigator === "undefined" ? true : navigator.onLine !== false;
  try {
    const packs: OfflinePackStatus[] = [];
    for (const store of Object.values(OFFLINE_STORES)) {
      let keys: string[] = [];
      try {
        keys = await engineKeys(store);
      } catch {
        keys = [];
      }
      packs.push({
        store,
        label: STORE_LABELS[store],
        recordCount: keys.length,
        available: keys.length > 0,
      });
    }
    return { online, packs, engineAvailable: true };
  } catch {
    return {
      online,
      packs: Object.values(OFFLINE_STORES).map((store) => ({
        store,
        label: STORE_LABELS[store],
        recordCount: 0,
        available: false,
      })),
      engineAvailable: false,
    };
  }
}

export async function estimateOfflineFootprintHint(): Promise<string> {
  const { packs, engineAvailable } = await listOfflinePackStatus();
  if (!engineAvailable) return "محرك التخزين المحلي غير متاح على هذا الجهاز.";
  const total = packs.reduce((n, p) => n + p.recordCount, 0);
  if (total === 0) {
    return "لا توجد حزم محلية بعد. يمكنك تنزيل التلاوات والحزم من الإعدادات أو المصحف.";
  }
  return `${total} سجلًا محليًا عبر ${packs.filter((p) => p.available).length} مخزنًا.`;
}
