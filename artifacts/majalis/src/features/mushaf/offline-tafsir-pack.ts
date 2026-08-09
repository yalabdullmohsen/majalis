/**
 * حزمة التفسير المختصر دون اتصال — تخزين في IndexedDB (tafseer_cache)
 * وجلب مسبق لصفحة المصحف الحالية والمجاورتين.
 * النص منقول حرفياً من المصدر المعتمد (لا توليد ولا اختصار آلي).
 */
import { MUSHAF_FEATURES } from "@/features/mushaf/config";
import {
  DEFAULT_MUSHAF_TAFSIR_EDITION,
  getMushafTafsirEdition,
} from "@/features/mushaf/tafsir-editions";
import { fetchMushafAyahTafsir } from "@/features/mushaf/fetch-ayah-content";
import { loadMushafPage } from "@/lib/mushaf-v2-data";

const PACK_META_KEY = "majalis-offline-tafsir-pack-v1";
const BRIEF_EDITION = DEFAULT_MUSHAF_TAFSIR_EDITION;

export type OfflineTafsirPackMeta = {
  editionId: string;
  downloadedAt: number;
  ayahCount: number;
};

function ayahId(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}

export function isOfflineTafsirPacksEnabled(): boolean {
  return MUSHAF_FEATURES.offlineTafsirPacks === true;
}

export function readOfflineTafsirPackMeta(): OfflineTafsirPackMeta | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(PACK_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OfflineTafsirPackMeta;
  } catch {
    return null;
  }
}

function writePackMeta(meta: OfflineTafsirPackMeta): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PACK_META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore quota */
  }
}

/** قراءة تفسير محفوظ محلياً لنفس طبعة المصدر. */
export async function readOfflineTafsirAyah(
  surah: number,
  ayah: number,
  editionId: string,
): Promise<string | null> {
  if (!isOfflineTafsirPacksEnabled()) return null;
  try {
    const { databaseManager } = await import("@/core/quran/DatabaseManager");
    const row = await databaseManager.getCachedTafseer(ayahId(surah, ayah), editionId);
    const text = row?.content?.trim();
    return text || null;
  } catch {
    return null;
  }
}

/** كتابة تفسير آية في الحزمة المحلية. */
export async function writeOfflineTafsirAyah(
  surah: number,
  ayah: number,
  editionId: string,
  content: string,
): Promise<void> {
  if (!isOfflineTafsirPacksEnabled() || !content.trim()) return;
  try {
    const { databaseManager } = await import("@/core/quran/DatabaseManager");
    await databaseManager.cacheTafseer({
      ayahId: ayahId(surah, ayah),
      source: editionId,
      content: content.trim(),
    });
  } catch {
    /* ignore */
  }
}

type PageAyahRef = { surah: number; ayah: number };

async function ayahsOnPage(page: number): Promise<PageAyahRef[]> {
  try {
    const layout = await loadMushafPage(page);
    const out: PageAyahRef[] = [];
    const seen = new Set<string>();
    for (const row of layout.rows ?? []) {
      if (row.kind !== "line") continue;
      for (const w of row.words ?? []) {
        const key = w.verseKey;
        if (!key || seen.has(key)) continue;
        const [s, a] = key.split(":").map(Number);
        if (!s || !a) continue;
        seen.add(key);
        out.push({ surah: s, ayah: a });
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * يحمّل تفسير الميسّر لآيات الصفحة (والمجاورتين) ويخزّنها محلياً.
 * آمن للاستدعاء المتكرر — يتخطى ما هو موجود في الكاش.
 */
export async function prefetchOfflineTafsirForPage(
  page: number,
  opts: { neighbors?: boolean; signal?: AbortSignal } = {},
): Promise<{ fetched: number }> {
  if (!isOfflineTafsirPacksEnabled()) return { fetched: 0 };
  const edition = getMushafTafsirEdition(BRIEF_EDITION);
  if (!edition) return { fetched: 0 };

  const pages = opts.neighbors
    ? [page - 1, page, page + 1].filter((p) => p >= 1 && p <= 604)
    : [page];

  let fetched = 0;
  const refs: PageAyahRef[] = [];
  for (const p of pages) {
    refs.push(...(await ayahsOnPage(p)));
  }

  const uniq = new Map<string, PageAyahRef>();
  for (const r of refs) uniq.set(`${r.surah}:${r.ayah}`, r);

  for (const r of uniq.values()) {
    if (opts.signal?.aborted) break;
    const cached = await readOfflineTafsirAyah(r.surah, r.ayah, BRIEF_EDITION);
    if (cached) continue;
    try {
      const row = await fetchMushafAyahTafsir(
        r.surah,
        r.ayah,
        BRIEF_EDITION,
        opts.signal,
      );
      if (row?.text) fetched += 1;
    } catch {
      /* شبكة/إلغاء — نكمل بقية الآيات */
    }
    await new Promise<void>((res) => setTimeout(res, 0));
  }

  const prev = readOfflineTafsirPackMeta();
  writePackMeta({
    editionId: BRIEF_EDITION,
    downloadedAt: Date.now(),
    ayahCount: (prev?.ayahCount ?? 0) + fetched,
  });
  return { fetched };
}

/** مسح بيانات تعريف الحزمة عند حذف الحساب (محتوى IDB يُدار مع بقية الكاش المحلي). */
export function clearOfflineTafsirPackMeta(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(PACK_META_KEY);
  } catch {
    /* ignore */
  }
}
