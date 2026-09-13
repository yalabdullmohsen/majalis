/**
 * بوابة فتح التفسير — لا يُفتح إلا بطلب صريح من المستخدم.
 * لا يربط TafsirSheet بـ page / audio / highlight.
 */

export type TafsirOpenSource =
  | "userTappedTafsirAction"
  | "userOpenedTafsirFromSearch"
  | "userOpenedTafsirDeepLink"
  | "userRequestedTafsirFromAyahMenu";

export type TafsirOpenIntent = {
  requestId: string;
  source: TafsirOpenSource;
  surahId: number;
  ayahId: number;
  verseKey: string;
  pageNumber: number;
  requestedAt: number;
  explicitUserIntent: true;
};

let generation = 0;

export function nextTafsirRequestId(): string {
  generation += 1;
  return `tafsir-${generation}-${Date.now().toString(36)}`;
}

export function currentTafsirGeneration(): number {
  return generation;
}

/** إبطال كل طلبات التفسير المعلّقة (إغلاق / تقليب). */
export function bumpTafsirGeneration(): number {
  generation += 1;
  return generation;
}

export function parseVerseKeyParts(verseKey: string): { surahId: number; ayahId: number } | null {
  const m = /^(\d{1,3}):(\d{1,3})$/.exec(verseKey.trim());
  if (!m) return null;
  const surahId = Number(m[1]);
  const ayahId = Number(m[2]);
  if (!(surahId >= 1 && surahId <= 114 && ayahId >= 1 && ayahId <= 286)) return null;
  return { surahId, ayahId };
}

export function createTafsirOpenIntent(args: {
  source: TafsirOpenSource;
  verseKey: string;
  pageNumber: number;
}): TafsirOpenIntent | null {
  const parts = parseVerseKeyParts(args.verseKey);
  if (!parts) return null;
  return {
    requestId: nextTafsirRequestId(),
    source: args.source,
    surahId: parts.surahId,
    ayahId: parts.ayahId,
    verseKey: args.verseKey,
    pageNumber: args.pageNumber,
    requestedAt: Date.now(),
    explicitUserIntent: true,
  };
}

export function isValidTafsirOpenIntent(
  intent: TafsirOpenIntent | null | undefined,
): intent is TafsirOpenIntent {
  if (!intent) return false;
  if (intent.explicitUserIntent !== true) return false;
  if (!intent.requestId || !intent.verseKey) return false;
  if (!parseVerseKeyParts(intent.verseKey)) return false;
  return true;
}
