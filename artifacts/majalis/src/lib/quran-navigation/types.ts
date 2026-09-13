/**
 * مرجع آية منظَّم — مصدر حقيقة للتنقّل السياقي إلى المصحف.
 * لا يُستخرج رقم السورة/الآية من النص الظاهر وقت الضغط.
 */

export type QuranHighlightMode = "navigation" | "none";

export type QuranNavigationSource =
  | "prophets-stories"
  | "asbab-nuzul"
  | "tafsir"
  | "search"
  | "bookmarks"
  | "deep-link"
  | "quran-people"
  | "other";

export type QuranAyahReference = {
  surahId: number;
  ayahId: number;
  /** من Page Mapping المعتمدة فقط — لا تخمين */
  pageNumber: number;
  sourceSectionId?: string;
  sourceContentId?: string;
  sourceRoute?: string;
  navigationSource: QuranNavigationSource;
  highlightMode: QuranHighlightMode;
  requestedAt: number;
};

export type QuranReturnContext = {
  sourceRoute: string;
  sourceSectionId?: string;
  sourceContentId?: string;
  scrollY?: number;
  activeFilter?: string;
  expandedCardId?: string;
};

export type ValidatedQuranAyahReference =
  | { ok: true; ref: QuranAyahReference }
  | { ok: false; error: string };

export const QURAN_NAV_HIGHLIGHT_HOLD_MS = 4000;
export const QURAN_NAV_HIGHLIGHT_FADE_MS = 600;
